import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AttendanceRecord } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private records: AttendanceRecord[] = [];

  constructor() {
    const students = [
      { id: 's1', name: 'Arjun Patel' }, { id: 's2', name: 'Emily Watson' },
      { id: 's3', name: 'Liam Chen' }, { id: 's4', name: 'Sofia Martinez' },
      { id: 's5', name: 'Noah Williams' }, { id: 's6', name: 'Ava Johnson' },
      { id: 's7', name: 'Ethan Brown' }, { id: 's8', name: 'Isabella Garcia' },
    ];
    const statuses: ('present' | 'absent' | 'late')[] = ['present', 'present', 'present', 'present', 'present', 'absent', 'late', 'present'];
    const today = new Date().toISOString().split('T')[0];
    students.forEach((s, i) => {
      this.records.push({
        id: 'att' + i,
        studentId: s.id,
        studentName: s.name,
        classId: 'c5',
        sectionId: 'sec5a',
        date: today,
        status: statuses[i % statuses.length],
        markedBy: 'u2',
        tenantId: 't1'
      });
    });
  }

  getAttendanceByClassAndDate(classId: string, sectionId: string, date: string): Observable<AttendanceRecord[]> {
    const filtered = this.records.filter(r => r.classId === classId && r.sectionId === sectionId && r.date === date);
    return of(filtered).pipe(delay(400));
  }

  saveAttendance(records: AttendanceRecord[]): Observable<boolean> {
    records.forEach(r => {
      const idx = this.records.findIndex(x => x.studentId === r.studentId && x.date === r.date);
      if (idx !== -1) { this.records[idx] = r; }
      else { this.records.push(r); }
    });
    return of(true).pipe(delay(500));
  }

  getAttendanceStats(classId: string): Observable<{ present: number; absent: number; late: number; total: number }> {
    const classRecs = this.records.filter(r => r.classId === classId);
    return of({
      present: classRecs.filter(r => r.status === 'present').length,
      absent: classRecs.filter(r => r.status === 'absent').length,
      late: classRecs.filter(r => r.status === 'late').length,
      total: classRecs.length
    }).pipe(delay(300));
  }
}
