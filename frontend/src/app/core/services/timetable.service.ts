import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TimetableEntry } from '../models/models';

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
  ];

  getByClassAndSection(classId: string, sectionId: string): Observable<TimetableEntry[]> {
    return of(this.entries.filter(e => e.classId === classId && e.sectionId === sectionId)).pipe(delay(400));
  }

  getByTeacher(teacherId: string): Observable<TimetableEntry[]> {
    return of(this.entries.filter(e => e.teacherId === teacherId)).pipe(delay(300));
  }

  getAll(): Observable<TimetableEntry[]> {
    return of([...this.entries]).pipe(delay(400));
  }

  addEntry(entry: TimetableEntry): Observable<TimetableEntry> {
    this.entries.push(entry);
    return of(entry).pipe(delay(400));
  }
}
