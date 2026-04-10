import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { TimetableEntry, TimetableGrid, TimetableGridSlot } from '../models/models';
import { AttendanceCoverRow } from '../models/operations.models';
import { ApiService } from './api.service';
import { OperationsService } from './operations.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  private entries: TimetableEntry[] = [
    { id: 'tt1', classId: 'c8', sectionId: 'sec8a', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 201', tenantId: 't1' },
    { id: 'tt2', classId: 'c8', sectionId: 'sec8a', day: 'Monday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 201', tenantId: 't1' },
    { id: 'tt3', classId: 'c8', sectionId: 'sec8a', day: 'Monday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt4', classId: 'c8', sectionId: 'sec8a', day: 'Monday', period: 4, startTime: '10:30', endTime: '11:15', subjectName: 'History', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 201', tenantId: 't1' },
    { id: 'tt5', classId: 'c8', sectionId: 'sec8a', day: 'Monday', period: 5, startTime: '11:30', endTime: '12:15', subjectName: 'Computer Science', teacherId: 't5', teacherName: 'Maria Torres', room: 'Comp Lab', tenantId: 't1' },
    { id: 'tt6', classId: 'c8', sectionId: 'sec8a', day: 'Monday', period: 6, startTime: '12:15', endTime: '13:00', subjectName: 'Physical Education', teacherId: 't6', teacherName: 'David Anderson', room: 'Ground', tenantId: 't1' },
    { id: 'tt7', classId: 'c8', sectionId: 'sec8a', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 201', tenantId: 't1' },
    { id: 'tt8', classId: 'c8', sectionId: 'sec8a', day: 'Tuesday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 201', tenantId: 't1' },
    { id: 'tt9', classId: 'c8', sectionId: 'sec8a', day: 'Tuesday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Art', teacherId: 't7', teacherName: 'Aisha Khan', room: 'Art Room', tenantId: 't1' },
    { id: 'tt10', classId: 'c8', sectionId: 'sec8a', day: 'Tuesday', period: 4, startTime: '10:30', endTime: '11:15', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt11', classId: 'c8', sectionId: 'sec8a', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt12', classId: 'c8', sectionId: 'sec8a', day: 'Wednesday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'History', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 201', tenantId: 't1' },
    { id: 'tt13', classId: 'c8', sectionId: 'sec8a', day: 'Wednesday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 201', tenantId: 't1' },
    { id: 'tt14', classId: 'c8', sectionId: 'sec8a', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Computer Science', teacherId: 't5', teacherName: 'Maria Torres', room: 'Comp Lab', tenantId: 't1' },
    { id: 'tt15', classId: 'c8', sectionId: 'sec8a', day: 'Thursday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 201', tenantId: 't1' },
    { id: 'tt16', classId: 'c8', sectionId: 'sec8a', day: 'Friday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physical Education', teacherId: 't6', teacherName: 'David Anderson', room: 'Ground', tenantId: 't1' },
    { id: 'tt17', classId: 'c8', sectionId: 'sec8a', day: 'Friday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 201', tenantId: 't1' },
    { id: 'tt18', classId: 'c8', sectionId: 'sec8a', day: 'Friday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 201', tenantId: 't1' },
    { id: 'tt19', classId: 'c8', sectionId: 'sec8a', day: 'Friday', period: 4, startTime: '10:30', endTime: '11:15', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt20', classId: 'c5', sectionId: 'sec5a', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 101', tenantId: 't1' },
    { id: 'tt21', classId: 'c5', sectionId: 'sec5a', day: 'Monday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 101', tenantId: 't1' },
    { id: 'tt22', classId: 'c5', sectionId: 'sec5a', day: 'Monday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Art', teacherId: 't7', teacherName: 'Aisha Khan', room: 'Art Room', tenantId: 't1' },
    { id: 'tt23', classId: 'c5', sectionId: 'sec5a', day: 'Monday', period: 4, startTime: '10:30', endTime: '11:15', subjectName: 'Physical Education', teacherId: 't6', teacherName: 'David Anderson', room: 'Ground', tenantId: 't1' },
    { id: 'tt24', classId: 'c5', sectionId: 'sec5a', day: 'Monday', period: 5, startTime: '11:30', endTime: '12:15', subjectName: 'History', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 101', tenantId: 't1' },
    { id: 'tt25', classId: 'c5', sectionId: 'sec5a', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 101', tenantId: 't1' },
    { id: 'tt26', classId: 'c5', sectionId: 'sec5a', day: 'Tuesday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 101', tenantId: 't1' },
    { id: 'tt27', classId: 'c5', sectionId: 'sec5a', day: 'Tuesday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt28', classId: 'c5', sectionId: 'sec5a', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 101', tenantId: 't1' },
    { id: 'tt29', classId: 'c5', sectionId: 'sec5a', day: 'Wednesday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'History', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 101', tenantId: 't1' },
    { id: 'tt30', classId: 'c5', sectionId: 'sec5a', day: 'Wednesday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 101', tenantId: 't1' },
    { id: 'tt31', classId: 'c5', sectionId: 'sec5a', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt32', classId: 'c5', sectionId: 'sec5a', day: 'Thursday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Art', teacherId: 't7', teacherName: 'Aisha Khan', room: 'Art Room', tenantId: 't1' },
    { id: 'tt33', classId: 'c5', sectionId: 'sec5a', day: 'Friday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physical Education', teacherId: 't6', teacherName: 'David Anderson', room: 'Ground', tenantId: 't1' },
    { id: 'tt34', classId: 'c5', sectionId: 'sec5a', day: 'Friday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 101', tenantId: 't1' },
    { id: 'tt35', classId: 'c9', sectionId: 'sec9a', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physics', teacherId: 't8', teacherName: 'Thomas Lee', room: 'Lab 2', tenantId: 't1' },
    { id: 'tt36', classId: 'c9', sectionId: 'sec9a', day: 'Monday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 301', tenantId: 't1' },
    { id: 'tt37', classId: 'c9', sectionId: 'sec9a', day: 'Monday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'Chemistry', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt38', classId: 'c9', sectionId: 'sec9a', day: 'Monday', period: 4, startTime: '10:30', endTime: '11:15', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 301', tenantId: 't1' },
    { id: 'tt39', classId: 'c9', sectionId: 'sec9a', day: 'Monday', period: 5, startTime: '11:30', endTime: '12:15', subjectName: 'Computer Science', teacherId: 't5', teacherName: 'Maria Torres', room: 'Comp Lab', tenantId: 't1' },
    { id: 'tt40', classId: 'c9', sectionId: 'sec9a', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 301', tenantId: 't1' },
    { id: 'tt41', classId: 'c9', sectionId: 'sec9a', day: 'Tuesday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Physics', teacherId: 't8', teacherName: 'Thomas Lee', room: 'Lab 2', tenantId: 't1' },
    { id: 'tt42', classId: 'c9', sectionId: 'sec9a', day: 'Tuesday', period: 3, startTime: '09:45', endTime: '10:30', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 301', tenantId: 't1' },
    { id: 'tt43', classId: 'c9', sectionId: 'sec9a', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Chemistry', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt44', classId: 'c9', sectionId: 'sec9a', day: 'Wednesday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Computer Science', teacherId: 't5', teacherName: 'Maria Torres', room: 'Comp Lab', tenantId: 't1' },
    { id: 'tt45', classId: 'c9', sectionId: 'sec9a', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 301', tenantId: 't1' },
    { id: 'tt46', classId: 'c9', sectionId: 'sec9a', day: 'Thursday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Physics', teacherId: 't8', teacherName: 'Thomas Lee', room: 'Lab 2', tenantId: 't1' },
    { id: 'tt47', classId: 'c9', sectionId: 'sec9a', day: 'Friday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 301', tenantId: 't1' },
    { id: 'tt48', classId: 'c9', sectionId: 'sec9a', day: 'Friday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Chemistry', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt49', classId: 'c9', sectionId: 'sec9b', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 302', tenantId: 't1' },
    { id: 'tt50', classId: 'c9', sectionId: 'sec9b', day: 'Monday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 302', tenantId: 't1' },
    { id: 'tt51', classId: 'c9', sectionId: 'sec9b', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt52', classId: 'c9', sectionId: 'sec9b', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'History', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 302', tenantId: 't1' },
    { id: 'tt53', classId: 'c9', sectionId: 'sec9b', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physics', teacherId: 't8', teacherName: 'Thomas Lee', room: 'Lab 2', tenantId: 't1' },
    { id: 'tt54', classId: 'c10', sectionId: 'sec10a', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Chemistry', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt55', classId: 'c10', sectionId: 'sec10a', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 401', tenantId: 't1' },
    { id: 'tt56', classId: 'c10', sectionId: 'sec10b', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 402', tenantId: 't1' },
    { id: 'tt57', classId: 'c10', sectionId: 'sec10b', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Biology', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt58', classId: 'c10', sectionId: 'sec10b', day: 'Friday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physical Education', teacherId: 't6', teacherName: 'David Anderson', room: 'Ground', tenantId: 't1' },
    { id: 'tt59', classId: 'c11', sectionId: 'sec11a', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physics', teacherId: 't8', teacherName: 'Thomas Lee', room: 'Lab 2', tenantId: 't1' },
    { id: 'tt60', classId: 'c11', sectionId: 'sec11a', day: 'Monday', period: 2, startTime: '08:45', endTime: '09:30', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 501', tenantId: 't1' },
    { id: 'tt61', classId: 'c11', sectionId: 'sec11a', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Chemistry', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt62', classId: 'c11', sectionId: 'sec11a', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Computer Science', teacherId: 't5', teacherName: 'Maria Torres', room: 'Comp Lab', tenantId: 't1' },
    { id: 'tt63', classId: 'c11', sectionId: 'sec11b', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 502', tenantId: 't1' },
    { id: 'tt64', classId: 'c11', sectionId: 'sec11b', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 502', tenantId: 't1' },
    { id: 'tt65', classId: 'c11', sectionId: 'sec11b', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Economics', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 502', tenantId: 't1' },
    { id: 'tt66', classId: 'c12', sectionId: 'sec12a', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Chemistry', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt67', classId: 'c12', sectionId: 'sec12a', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Biology', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt68', classId: 'c12', sectionId: 'sec12a', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 601', tenantId: 't1' },
    { id: 'tt69', classId: 'c12', sectionId: 'sec12b', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't1', teacherName: 'Sarah Mitchell', room: 'Room 602', tenantId: 't1' },
    { id: 'tt70', classId: 'c12', sectionId: 'sec12b', day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Physics', teacherId: 't8', teacherName: 'Thomas Lee', room: 'Lab 2', tenantId: 't1' },
    { id: 'tt71', classId: 'c6', sectionId: 'sec6b', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Mathematics', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 106', tenantId: 't1' },
    { id: 'tt72', classId: 'c6', sectionId: 'sec6b', day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Science', teacherId: 't3', teacherName: 'Priya Sharma', room: 'Lab 1', tenantId: 't1' },
    { id: 'tt73', classId: 'c7', sectionId: 'sec7c', day: 'Monday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'English', teacherId: 't2', teacherName: "James O'Brien", room: 'Room 207', tenantId: 't1' },
    { id: 'tt74', classId: 'c7', sectionId: 'sec7c', day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:45', subjectName: 'Geography', teacherId: 't4', teacherName: 'Robert Kim', room: 'Room 207', tenantId: 't1' },
  ];

  getByClassAndSection(classId: string, sectionId: string): Observable<TimetableEntry[]> {
    if (!runtimeConfig.useMocks) {
      let q = `classId=${encodeURIComponent(classId)}`;
      if (sectionId) {
        q += `&sectionId=${encodeURIComponent(sectionId)}`;
      }
      return this.api.get<any[]>(`/timetable?${q}`).pipe(
        map(entries => entries.map(entry => this.normalizeEntry(entry)))
      );
    }
    return of(this.entries.filter(e => e.classId === classId && (!sectionId || e.sectionId === sectionId))).pipe(delay(400));
  }

  getGrid(classId: string, sectionId: string): Observable<TimetableGrid> {
    if (!runtimeConfig.useMocks) {
      let q = `classId=${encodeURIComponent(classId)}`;
      if (sectionId) {
        q += `&sectionId=${encodeURIComponent(sectionId)}`;
      }
      return this.api.get<any>(`/timetable/grid?${q}`).pipe(
        map(grid => ({
          classId: String(grid.classId),
          sectionId: grid.sectionId != null ? String(grid.sectionId) : '',
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

  private buildGridFromEntries(classId: string, sectionId: string, entries: TimetableEntry[]): TimetableGrid {
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
    return { classId, sectionId, days: useDays, periods: usePeriods, grid };
  }

  /**
   * @param forDate Optional ISO date: merges active attendance covers for that day into the teacher view (same API as backend).
   */
  getByTeacher(teacherId: string, forDate?: string): Observable<TimetableEntry[]> {
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
    teacherId: string,
    forDate: string,
    covers: AttendanceCoverRow[],
    base: TimetableEntry[]
  ): TimetableEntry[] {
    const dow = this.isoDateToDayName(forDate);
    const mine = (covers || []).filter(
      c => c.status === 'ACTIVE' && String(c.coveringTeacherId) === String(teacherId)
    );
    const coverRows: TimetableEntry[] = [];
    const keys = new Set<string>();
    for (const c of mine) {
      const template = this.findMockTemplateForCover(c, dow);
      const period = template?.period ?? c.periodNumber ?? 1;
      const t = this.teachersNameById(teacherId);
      coverRows.push({
        id: `cover-${c.id}`,
        classId: String(c.classId),
        sectionId: c.sectionId ? String(c.sectionId) : '',
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
        coverForDate: forDate,
      });
      keys.add(`${dow}|${period}`);
    }
    const recurring = base.map(e => ({ ...e, scheduleSource: 'RECURRING' as const }));
    const filtered = recurring.filter(e => !keys.has(`${e.day}|${e.period}`));
    return [...coverRows, ...filtered];
  }

  private teachersNameById(teacherId: string): string {
    const hit = this.entries.find(e => e.teacherId === teacherId);
    return hit?.teacherName ?? '';
  }

  private findMockTemplateForCover(c: AttendanceCoverRow, dow: string): TimetableEntry | undefined {
    const classSlots = this.entries.filter(
      e =>
        e.classId === String(c.classId) &&
        (!c.sectionId || e.sectionId === String(c.sectionId)) &&
        e.day === dow
    );
    if (c.periodNumber != null) {
      return classSlots.find(e => e.period === c.periodNumber);
    }
    if (c.regularTeacherId) {
      return classSlots.find(e => e.teacherId === String(c.regularTeacherId));
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
    const classId = entries[0]?.classId ?? '0';
    const sectionId = entries[0]?.sectionId ?? '';
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
    const id = entry.id && entry.id.length ? entry.id : 'tt' + Date.now();
    const row: TimetableEntry = { ...entry, id, tenantId: entry.tenantId || 't1' };
    this.entries = [...this.entries, row];
    return of(row).pipe(delay(400));
  }

  updateEntry(id: string, entry: Partial<TimetableEntry>): Observable<TimetableEntry> {
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

  deleteEntry(id: string): Observable<void> {
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
    const dayNorm = dayRaw
      ? dayRaw.charAt(0) + dayRaw.slice(1).toLowerCase()
      : '';
    return {
      ...entry,
      id: String(entry.id),
      classId: String(entry.classId ?? ''),
      sectionId: entry.sectionId != null && entry.sectionId !== '' ? String(entry.sectionId) : '',
      teacherId: entry.teacherId != null ? String(entry.teacherId) : '',
      day: dayNorm,
      period: Number(entry.period ?? 0),
      tenantId: entry.tenantId ?? '',
      scheduleSource: entry.scheduleSource === 'COVER' ? 'COVER' : entry.scheduleSource === 'RECURRING' ? 'RECURRING' : undefined,
      coverForDate: entry.coverForDate ?? undefined,
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
