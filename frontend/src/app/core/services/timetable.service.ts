import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { TimetableEntry } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

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
  ];

  getByClassAndSection(classId: string, sectionId: string): Observable<TimetableEntry[]> {
    if (!environment.useMocks) {
      return this.api.get<TimetableEntry[]>(`/timetable?classId=${classId}&sectionId=${sectionId}`);
    }
    return of(this.entries.filter(e => e.classId === classId && e.sectionId === sectionId)).pipe(delay(400));
  }

  getByTeacher(teacherId: string): Observable<TimetableEntry[]> {
    if (!environment.useMocks) {
      return this.api.get<TimetableEntry[]>(`/timetable/teacher/${teacherId}`);
    }
    return of(this.entries.filter(e => e.teacherId === teacherId)).pipe(delay(300));
  }

  getAll(): Observable<TimetableEntry[]> {
    if (!environment.useMocks) {
      return this.api.get<TimetableEntry[]>('/timetable?classId=0&sectionId=0');
    }
    return of([...this.entries]).pipe(delay(400));
  }

  addEntry(entry: TimetableEntry): Observable<TimetableEntry> {
    if (!environment.useMocks) {
      return this.api.post<TimetableEntry>('/timetable', entry);
    }
    this.entries.push(entry);
    return of(entry).pipe(delay(400));
  }

  constructor(private api: ApiService) {}
}
