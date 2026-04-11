import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { TimetableEntry, TimetableGrid, TimetableGridSlot } from '../models/models';
import { AttendanceCoverRow } from '../models/operations.models';
import { ApiService } from './api.service';
import { OperationsService } from './operations.service';
import { runtimeConfig } from '../config/runtime-config';
import { MOCK_TIMETABLE_ENTRIES } from '../mocks/timetable.mock-data';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private entries: TimetableEntry[] = MOCK_TIMETABLE_ENTRIES.map(e => ({ ...e }));

  getByClassAndSection(classId: number, sectionId?: number): Observable<TimetableEntry[]> {
    if (!runtimeConfig.useMocks) {
      let q = `classId=${encodeURIComponent(String(classId))}`;
      if (sectionId != null) {
        q += `&sectionId=${encodeURIComponent(String(sectionId))}`;
      }
      return this.api.get<any[]>(`/timetable?${q}`).pipe(map(entries => entries.map(entry => this.normalizeEntry(entry))));
    }
    return of(
      this.entries.filter(e => e.classId === classId && (sectionId == null || e.sectionId === sectionId))
    ).pipe(delay(400));
  }

  getGrid(classId: number, sectionId?: number): Observable<TimetableGrid> {
    if (!runtimeConfig.useMocks) {
      let q = `classId=${encodeURIComponent(String(classId))}`;
      if (sectionId != null) {
        q += `&sectionId=${encodeURIComponent(String(sectionId))}`;
      }
      return this.api.get<any>(`/timetable/grid?${q}`).pipe(
        map(grid => ({
          classId: Number(grid.classId ?? 0),
          sectionId: grid.sectionId != null ? Number(grid.sectionId) : 0,
          days: (grid.days ?? []).map((day: string) => day.charAt(0) + day.slice(1).toLowerCase()),
          periods: grid.periods ?? [],
          grid: grid.grid ?? {}
        }))
      );
    }
    return this.getByClassAndSection(classId, sectionId).pipe(
      map(entries => this.buildGridFromEntries(classId, sectionId, entries)),
      delay(300)
    );
  }

  private buildGridFromEntries(classId: number, sectionId: number | undefined, entries: TimetableEntry[]): TimetableGrid {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaultPeriods = [1, 2, 3, 4, 5, 6, 7, 8];
    const days = [...new Set(entries.map(e => e.day))].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    const periods = [...new Set(entries.map(e => e.period))].sort((a, b) => a - b);
    const useDays = days.length ? days : dayOrder;
    const usePeriods = periods.length ? periods : defaultPeriods;
    const grid: Record<string, Record<number, TimetableGridSlot>> = {};
    for (const d of useDays) {
      grid[d] = {};
      for (const p of usePeriods) {
        const en = entries.find(x => x.day === d && x.period === p);
        if (en) {
          grid[d][p] = {
            subject: en.subjectName,
            teacher: en.teacherName,
            room: en.room,
            startTime: en.startTime,
            endTime: en.endTime
          };
        }
      }
    }
    return { classId, sectionId: sectionId ?? 0, days: useDays, periods: usePeriods, grid };
  }

  /**
   * @param forDate Optional ISO date: merges active attendance covers for that day into the teacher view (same API as backend).
   */
  getByTeacher(teacherId: number, forDate?: string): Observable<TimetableEntry[]> {
    if (!runtimeConfig.useMocks) {
      const q = forDate ? `?forDate=${encodeURIComponent(forDate)}` : '';
      return this.api.get<any[]>(`/timetable/teacher/${teacherId}${q}`).pipe(
        map(entries => entries.map(entry => this.normalizeEntry(entry)))
      );
    }
    const base = this.entries.filter(e => e.teacherId === teacherId);
    if (!forDate) {
      return of(base.map(e => ({ ...e, scheduleSource: 'RECURRING' as const }))).pipe(delay(300));
    }
    return this.operations.listAttendanceCoversAdmin(forDate).pipe(
      switchMap(covers => of(this.mergeMockCoversIntoTeacherSchedule(teacherId, forDate, covers, base))),
      delay(300)
    );
  }

  private mergeMockCoversIntoTeacherSchedule(
    teacherId: number,
    forDate: string,
    covers: AttendanceCoverRow[],
    base: TimetableEntry[]
  ): TimetableEntry[] {
    const dow = this.isoDateToDayName(forDate);
    const mine = (covers || []).filter(
      c => c.status === 'ACTIVE' && Number(c.coveringTeacherId) === teacherId
    );
    const coverRows: TimetableEntry[] = [];
    const keys = new Set<string>();
    mine.forEach((c, idx) => {
      const template = this.findMockTemplateForCover(c, dow);
      const period = template?.period ?? c.periodNumber ?? 1;
      const t = this.teachersNameById(teacherId);
      const rawCoverId = Number(c.id);
      const coverNumericId =
        Number.isFinite(rawCoverId) && rawCoverId > 0 && rawCoverId < 1_000_000_000
          ? 880_000_000 + rawCoverId
          : 880_000_000 + idx + 1;
      coverRows.push({
        id: coverNumericId,
        classId: Number(c.classId),
        sectionId: c.sectionId != null ? Number(c.sectionId) : 0,
        day: dow,
        period,
        startTime: template?.startTime ?? '09:00',
        endTime: template?.endTime ?? '09:45',
        subjectName: `${template?.subjectName ?? 'Cover session'} · Cover`,
        teacherId,
        teacherName: t,
        room: template?.room ?? '',
        tenantId: base[0]?.tenantId ?? 't1',
        scheduleSource: 'COVER',
        coverForDate: forDate
      });
      keys.add(`${dow}|${period}`);
    });
    const recurring = base.map(e => ({ ...e, scheduleSource: 'RECURRING' as const }));
    const filtered = recurring.filter(e => !keys.has(`${e.day}|${e.period}`));
    return [...coverRows, ...filtered];
  }

  private teachersNameById(teacherId: number): string {
    const hit = this.entries.find(e => e.teacherId === teacherId);
    return hit?.teacherName ?? '';
  }

  private findMockTemplateForCover(c: AttendanceCoverRow, dow: string): TimetableEntry | undefined {
    const classSlots = this.entries.filter(
      e =>
        e.classId === Number(c.classId) &&
        (!c.sectionId || e.sectionId === Number(c.sectionId)) &&
        e.day === dow
    );
    if (c.periodNumber != null) {
      return classSlots.find(e => e.period === c.periodNumber);
    }
    if (c.regularTeacherId != null) {
      return classSlots.find(e => e.teacherId === Number(c.regularTeacherId));
    }
    return classSlots[0];
  }

  private isoDateToDayName(iso: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(iso + 'T12:00:00').getDay();
    return days[d];
  }

  /** Build a day×period grid from an arbitrary entry list (e.g. teacher schedule). */
  toGridFromEntries(entries: TimetableEntry[]): TimetableGrid {
    const classId = entries[0]?.classId ?? 0;
    const sectionId = entries[0]?.sectionId ?? 0;
    return this.buildGridFromEntries(classId, sectionId, entries);
  }

  getAll(): Observable<TimetableEntry[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<TimetableEntry[]>('/timetable?classId=0&sectionId=0');
    }
    return of([...this.entries]).pipe(delay(400));
  }

  addEntry(entry: TimetableEntry): Observable<TimetableEntry> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>('/timetable', this.toPayload(entry)).pipe(map(created => this.normalizeEntry(created)));
    }
    const nextId = this.entries.reduce((m, e) => Math.max(m, e.id), 0) + 1;
    const id = entry.id > 0 ? entry.id : nextId;
    const row: TimetableEntry = { ...entry, id, tenantId: entry.tenantId || 't1' };
    this.entries = [...this.entries, row];
    return of(row).pipe(delay(400));
  }

  updateEntry(id: number, entry: Partial<TimetableEntry>): Observable<TimetableEntry> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>(`/timetable/${id}`, this.toPayload(entry)).pipe(map(updated => this.normalizeEntry(updated)));
    }
    const idx = this.entries.findIndex(e => e.id === id);
    if (idx === -1) {
      return of({} as TimetableEntry).pipe(delay(200));
    }
    const merged = { ...this.entries[idx], ...entry, id };
    this.entries = [...this.entries.slice(0, idx), merged, ...this.entries.slice(idx + 1)];
    return of(merged).pipe(delay(300));
  }

  deleteEntry(id: number): Observable<void> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<void>(`/timetable/${id}`);
    }
    this.entries = this.entries.filter(entry => entry.id !== id);
    return of(void 0).pipe(delay(200));
  }

  constructor(
    private api: ApiService,
    private operations: OperationsService
  ) {}

  private normalizeEntry(entry: any): TimetableEntry {
    const dayRaw = entry.day ?? '';
    const dayNorm = dayRaw ? dayRaw.charAt(0) + dayRaw.slice(1).toLowerCase() : '';
    return {
      ...entry,
      id: Number(entry.id),
      classId: Number(entry.classId ?? 0),
      sectionId: entry.sectionId != null && entry.sectionId !== '' ? Number(entry.sectionId) : 0,
      teacherId: entry.teacherId != null && entry.teacherId !== '' ? Number(entry.teacherId) : 0,
      day: dayNorm,
      period: Number(entry.period ?? 0),
      tenantId: entry.tenantId ?? '',
      scheduleSource:
        entry.scheduleSource === 'COVER' ? 'COVER' : entry.scheduleSource === 'RECURRING' ? 'RECURRING' : undefined,
      coverForDate: entry.coverForDate ?? undefined
    };
  }

  private toPayload(entry: Partial<TimetableEntry>): any {
    return {
      classId: entry.classId ? Number(entry.classId) : null,
      sectionId: entry.sectionId ? Number(entry.sectionId) : undefined,
      day: entry.day ? entry.day.toUpperCase() : null,
      period: entry.period ?? null,
      startTime: entry.startTime || null,
      endTime: entry.endTime || null,
      subjectName: entry.subjectName || null,
      teacherId: entry.teacherId ? Number(entry.teacherId) : null,
      teacherName: entry.teacherName || null,
      room: entry.room || null
    };
  }
}
