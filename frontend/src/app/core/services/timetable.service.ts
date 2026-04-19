import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, delay, map, switchMap } from 'rxjs/operators';
import { TimetableConflictPayload, TimetableEntry, TimetableGrid, TimetableGridSlot } from '../models/models';
import { AttendanceCoverRow } from '../models/operations.models';
import { ApiResp, ApiService } from './api.service';
import { OperationsService } from './operations.service';
import { runtimeConfig } from '../config/runtime-config';
import { MOCK_TIMETABLE_ENTRIES } from '../mocks/timetable.mock-data';
import { TimetableConflictError } from '../errors/timetable-conflict.error';
import { UserFacingHttpError } from '../http/user-facing-http-error';

/** Mon–Sat working week (typical Indian school). Sunday is not a teaching day in this product model. */
export const INDIAN_SCHOOL_WEEK_DAYS: readonly string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

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

  /** Title-case English weekday for stable grid keys (API may send MONDAY / Monday). */
  normalizeWeekdayTitle(day: string): string {
    const t = (day ?? '').trim();
    if (!t) {
      return '';
    }
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }

  /** True when {@code day} is Mon–Sat (Indian school week); excludes Sunday. */
  isIndianSchoolTeachingDayName(day: string): boolean {
    const d = this.normalizeWeekdayTitle(day);
    return INDIAN_SCHOOL_WEEK_DAYS.includes(d);
  }

  /**
   * Teacher “week matrix”: columns are always Monday → Saturday in order, even if the first populated
   * slot is mid-week (fixes Tuesday-first columns when Monday has no row for that teacher).
   */
  toSchoolWeekMatrixGrid(entries: TimetableEntry[]): TimetableGrid {
    const monSatOnly = entries.filter(e => this.isIndianSchoolTeachingDayName(e.day));
    const classId = monSatOnly[0]?.classId ?? entries[0]?.classId ?? 0;
    const sectionId = monSatOnly[0]?.sectionId ?? entries[0]?.sectionId ?? 0;
    const periodNums = monSatOnly.map(e => e.period).filter(p => p > 0);
    const hi = periodNums.length ? Math.min(8, Math.max(6, Math.max(...periodNums))) : 6;
    const usePeriods = Array.from({ length: hi }, (_, i) => i + 1);
    const useDays = [...INDIAN_SCHOOL_WEEK_DAYS];
    const grid: Record<string, Record<number, TimetableGridSlot>> = {};
    for (const d of useDays) {
      grid[d] = {};
      for (const p of usePeriods) {
        const en = monSatOnly.find(
          x => this.normalizeWeekdayTitle(x.day) === d && x.period === p
        );
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

  private buildGridFromEntries(classId: number, sectionId: number | undefined, entries: TimetableEntry[]): TimetableGrid {
    const dayOrder = [...INDIAN_SCHOOL_WEEK_DAYS];
    const defaultPeriods = [1, 2, 3, 4, 5, 6, 7, 8];
    const days = [...new Set(entries.map(e => this.normalizeWeekdayTitle(e.day)))].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );
    const periods = [...new Set(entries.map(e => e.period))].sort((a, b) => a - b);
    const useDays = days.length ? days : dayOrder;
    const usePeriods = periods.length ? periods : defaultPeriods;
    const grid: Record<string, Record<number, TimetableGridSlot>> = {};
    for (const d of useDays) {
      grid[d] = {};
      for (const p of usePeriods) {
        const en = entries.find(
          x => this.normalizeWeekdayTitle(x.day) === this.normalizeWeekdayTitle(d) && x.period === p
        );
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

  /**
   * Creates a recurring slot. Optional {@code replaceTimetableEntryId} matches the blocking row from a prior {@link TimetableConflictError}.
   */
  addEntry(entry: TimetableEntry, replaceTimetableEntryId?: number): Observable<TimetableEntry> {
    if (!runtimeConfig.useMocks) {
      let params = new HttpParams();
      if (replaceTimetableEntryId != null) {
        params = params.set('replaceTimetableEntryId', String(replaceTimetableEntryId));
      }
      return this.pipeTimetableConflict(
        this.http.post<ApiResp<TimetableEntry>>(`${this.api.getBaseUrl()}/timetable`, this.toPayload(entry), { params }).pipe(
          map(res => {
            if (!res.success || res.data == null) {
              throw new Error(res.message || 'Failed to create timetable slot');
            }
            return this.normalizeEntry(res.data);
          })
        )
      );
    }
    return timer(300).pipe(switchMap(() => this.mockMutateSlot(entry, null, replaceTimetableEntryId)));
  }

  updateEntry(id: number, entry: Partial<TimetableEntry>, replaceTimetableEntryId?: number): Observable<TimetableEntry> {
    if (!runtimeConfig.useMocks) {
      let params = new HttpParams();
      if (replaceTimetableEntryId != null) {
        params = params.set('replaceTimetableEntryId', String(replaceTimetableEntryId));
      }
      return this.pipeTimetableConflict(
        this.http.put<ApiResp<TimetableEntry>>(`${this.api.getBaseUrl()}/timetable/${id}`, this.toPayload(entry), { params }).pipe(
          map(res => {
            if (!res.success || res.data == null) {
              throw new Error(res.message || 'Failed to update timetable slot');
            }
            return this.normalizeEntry(res.data);
          })
        )
      );
    }
    return timer(300).pipe(
      switchMap(() => {
        const idx = this.entries.findIndex(e => e.id === id);
        if (idx === -1) {
          return throwError(() => new Error('Timetable entry not found'));
        }
        const merged = { ...this.entries[idx], ...entry, id } as TimetableEntry;
        return this.mockMutateSlot(merged, id, replaceTimetableEntryId);
      })
    );
  }

  private pipeTimetableConflict<T>(source: Observable<T>): Observable<T> {
    return source.pipe(
      catchError((err: unknown) => {
        if (
          err instanceof UserFacingHttpError &&
          err.httpStatus === 409 &&
          err.apiErrorCode === 'TIMETABLE_SLOT_CONFLICT' &&
          err.apiData &&
          typeof err.apiData === 'object'
        ) {
          return throwError(
            () => new TimetableConflictError(err.message || 'Timetable conflict', err.apiData as TimetableConflictPayload)
          );
        }
        return throwError(() => err);
      })
    );
  }

  private mockMutateSlot(
    candidate: TimetableEntry,
    excludeId: number | null,
    replaceTimetableEntryId?: number
  ): Observable<TimetableEntry> {
    const block = this.mockFindBlocking(candidate, excludeId);
    if (replaceTimetableEntryId != null) {
      if (!block) {
        return throwError(() => new Error('No timetable conflict to replace.'));
      }
      if (block.existingEntryId !== replaceTimetableEntryId) {
        return throwError(() => new Error('Replace id does not match the conflicting timetable row.'));
      }
      this.entries = this.entries.filter(e => e.id !== replaceTimetableEntryId);
      const again = this.mockFindBlocking(candidate, excludeId);
      if (again) {
        return throwError(() => new Error('After removing the selected slot, another conflict still exists.'));
      }
    } else if (block) {
      return throwError(() => new TimetableConflictError(this.mockHumanMessage(String(block.conflictType)), block));
    }
    if (excludeId == null) {
      const nextId = this.entries.reduce((m, e) => Math.max(m, e.id), 0) + 1;
      const row: TimetableEntry = {
        ...candidate,
        id: candidate.id > 0 ? candidate.id : nextId,
        tenantId: candidate.tenantId || 't1',
      };
      this.entries = [...this.entries, row];
      return of(row);
    }
    const idx = this.entries.findIndex(e => e.id === excludeId);
    const merged = { ...this.entries[idx], ...candidate, id: excludeId } as TimetableEntry;
    this.entries = [...this.entries.slice(0, idx), merged, ...this.entries.slice(idx + 1)];
    return of(merged);
  }

  private mockHumanMessage(kind: string): string {
    if (kind === 'CLASS_PERIOD_OCCUPIED') {
      return 'This class already has a subject scheduled for that weekday and period.';
    }
    return 'This teacher is already scheduled in another class for that weekday and period.';
  }

  private mockFindBlocking(candidate: TimetableEntry, excludeId: number | null): TimetableConflictPayload | null {
    const sec = (x: number) => (x == null || x === 0 ? 0 : x);
    const classRows = this.entries.filter(
      e => e.classId === candidate.classId && sec(e.sectionId) === sec(candidate.sectionId) && !this.isSyntheticCoverRow(e)
    );
    const classHit = classRows.find(
      e => e.day === candidate.day && e.period === candidate.period && e.id !== excludeId
    );
    if (classHit) {
      return this.toConflictPayload('CLASS_PERIOD_OCCUPIED', classHit);
    }
    if (candidate.teacherId > 0) {
      const tHit = this.entries.find(
        e =>
          !this.isSyntheticCoverRow(e) &&
          e.teacherId === candidate.teacherId &&
          e.day === candidate.day &&
          e.period === candidate.period &&
          e.id !== excludeId
      );
      if (tHit) {
        return this.toConflictPayload('TEACHER_DOUBLE_BOOKED', tHit);
      }
    }
    return null;
  }

  /** Cover-derived mock rows use high ids — do not treat them as recurring master-timetable conflicts. */
  private isSyntheticCoverRow(e: TimetableEntry): boolean {
    return (e.id ?? 0) >= 880_000_000 || e.scheduleSource === 'COVER';
  }

  private toConflictPayload(kind: string, b: TimetableEntry): TimetableConflictPayload {
    const p: TimetableConflictPayload = {
      conflictType: kind,
      existingEntryId: b.id,
      day: b.day,
      period: b.period,
      subjectName: b.subjectName,
      teacherName: b.teacherName,
      classId: b.classId,
      sectionId: b.sectionId,
    };
    if (kind === 'TEACHER_DOUBLE_BOOKED') {
      p.conflictingClassId = b.classId;
      p.conflictingSectionId = b.sectionId;
    }
    return p;
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
    private http: HttpClient,
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
