import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { buildMockAttendanceRecordsForClassDate } from '../mocks/attendance.mock-data';
import { AttendanceRecord, AttendanceStats } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private records: AttendanceRecord[];

  constructor(private api: ApiService) {
    const today = new Date().toISOString().split('T')[0];
    this.records = buildMockAttendanceRecordsForClassDate(today).map(r => ({ ...r }));
  }

  getAttendanceByClassAndDate(classId: number, sectionId: number, date: string): Observable<AttendanceRecord[]> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .get<any[]>(`/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`)
        .pipe(map(records => records.map(record => this.normalizeRecord(record))));
    }
    const filtered = this.records.filter(r => r.classId === classId && r.sectionId === sectionId && r.date === date);
    return of(filtered).pipe(delay(400));
  }

  saveAttendance(records: AttendanceRecord[]): Observable<boolean> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any>('/attendance', {
          classId: Number(records[0]?.classId),
          sectionId: Number(records[0]?.sectionId),
          date: records[0]?.date,
          records: records.map(r => ({
            studentId: Number(r.studentId),
            studentName: r.studentName,
            status: r.status,
            remarks: ''
          }))
        })
        .pipe(map(() => true));
    }
    records.forEach(r => {
      const idx = this.records.findIndex(x => x.studentId === r.studentId && x.date === r.date);
      if (idx !== -1) {
        this.records[idx] = r;
      } else {
        this.records.push(r);
      }
    });
    return of(true).pipe(delay(500));
  }

  getStudentAttendanceStats(studentId: number, from: string, to: string): Observable<AttendanceStats> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>(`/attendance/student/${studentId}/stats?from=${from}&to=${to}`).pipe(
        map(stats => ({
          studentId: stats.studentId != null ? Number(stats.studentId) : undefined,
          totalDays: stats.totalDays,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          excused: stats.excused,
          attendancePercentage: stats.attendancePercentage
        }))
      );
    }
    const records = this.records.filter(r => r.studentId === studentId);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    return of({
      studentId,
      totalDays: total,
      present,
      absent,
      late,
      excused: 0,
      attendancePercentage: total ? Math.round(((present + late) / total) * 1000) / 10 : 0
    }).pipe(delay(300));
  }

  getAttendanceStats(classId: number): Observable<{ present: number; absent: number; late: number; total: number }> {
    if (!runtimeConfig.useMocks) {
      const today = new Date().toISOString().split('T')[0];
      return this.api.get<any>(`/attendance/class-stats?classId=${classId}&sectionId=1&date=${today}`).pipe(
        map(res => ({
          present: res.present,
          absent: res.absent,
          late: res.late,
          total: res.totalStudents
        }))
      );
    }
    const classRecs = this.records.filter(r => r.classId === classId);
    return of({
      present: classRecs.filter(r => r.status === 'present').length,
      absent: classRecs.filter(r => r.status === 'absent').length,
      late: classRecs.filter(r => r.status === 'late').length,
      total: classRecs.length
    }).pipe(delay(300));
  }

  private normalizeRecord(record: any): AttendanceRecord {
    return {
      ...record,
      id: Number(record.id),
      studentId: Number(record.studentId),
      classId: Number(record.classId),
      sectionId: Number(record.sectionId),
      markedBy: record.markedBy != null ? Number(record.markedBy) : 0,
      tenantId: record.tenantId ?? '',
      status: record.status
    };
  }
}
