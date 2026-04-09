import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Teacher } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private teachers: Teacher[] = [
    { id: 't1', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.m@school.com', phone: '+1-555-0301', qualification: 'M.Sc Mathematics', specialization: 'Mathematics', joinDate: '2020-08-15', subjects: ['Mathematics', 'Physics'], classIds: ['c7', 'c8', 'c9', 'c10'], salary: 55000, status: 'active', tenantId: 't1' },
    { id: 't2', firstName: 'James', lastName: 'O\'Brien', email: 'james.o@school.com', phone: '+1-555-0302', qualification: 'M.A English Literature', specialization: 'English', joinDate: '2019-06-20', subjects: ['English', 'Literature'], classIds: ['c5', 'c6', 'c7', 'c8'], salary: 52000, status: 'active', tenantId: 't1' },
    { id: 't3', firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@school.com', phone: '+1-555-0303', qualification: 'M.Sc Chemistry', specialization: 'Science', joinDate: '2021-01-10', subjects: ['Chemistry', 'Biology'], classIds: ['c9', 'c10', 'c11'], salary: 54000, status: 'active', tenantId: 't1' },
    { id: 't4', firstName: 'Robert', lastName: 'Kim', email: 'robert.k@school.com', phone: '+1-555-0304', qualification: 'M.A History', specialization: 'Social Studies', joinDate: '2018-08-01', subjects: ['History', 'Geography', 'Civics'], classIds: ['c6', 'c7', 'c8'], salary: 50000, status: 'active', tenantId: 't1' },
    { id: 't5', firstName: 'Maria', lastName: 'Torres', email: 'maria.t@school.com', phone: '+1-555-0305', qualification: 'M.Sc Computer Science', specialization: 'Computer Science', joinDate: '2022-03-15', subjects: ['Computer Science', 'IT'], classIds: ['c8', 'c9', 'c10', 'c11', 'c12'], salary: 58000, status: 'active', tenantId: 't1' },
    { id: 't6', firstName: 'David', lastName: 'Anderson', email: 'david.a@school.com', phone: '+1-555-0306', qualification: 'B.Ed Physical Education', specialization: 'Physical Education', joinDate: '2017-06-01', subjects: ['Physical Education'], classIds: ['c5', 'c6', 'c7', 'c8', 'c9', 'c10'], salary: 45000, status: 'active', tenantId: 't1' },
    { id: 't7', firstName: 'Aisha', lastName: 'Khan', email: 'aisha.k@school.com', phone: '+1-555-0307', qualification: 'M.A Fine Arts', specialization: 'Art & Design', joinDate: '2023-08-01', subjects: ['Art', 'Design'], classIds: ['c5', 'c6', 'c7'], salary: 42000, status: 'active', tenantId: 't1' },
    { id: 't8', firstName: 'Thomas', lastName: 'Lee', email: 'thomas.l@school.com', phone: '+1-555-0308', qualification: 'Ph.D Physics', specialization: 'Physics', joinDate: '2016-01-15', subjects: ['Physics', 'Mathematics'], classIds: ['c11', 'c12'], salary: 62000, status: 'active', tenantId: 't1' },
  ];

  private teachersSubject = new BehaviorSubject<Teacher[]>(this.teachers);

  constructor(private api: ApiService) {}

  getTeachers(): Observable<Teacher[]> {
    if (!environment.useMocks) {
      return this.api.getPage<any>('/teachers').pipe(map(p => p.content.map((teacher: any) => this.normalizeTeacher(teacher))));
    }
    return of([...this.teachers]).pipe(delay(400));
  }

  getTeacherById(id: string): Observable<Teacher | undefined> {
    if (!environment.useMocks) {
      return this.api.get<any>('/teachers/' + id).pipe(map(teacher => this.normalizeTeacher(teacher)));
    }
    return of(this.teachers.find(t => t.id === id)).pipe(delay(300));
  }

  addTeacher(teacher: Omit<Teacher, 'id'>): Observable<Teacher> {
    if (!environment.useMocks) {
      return this.api.post<Teacher>('/teachers', {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        phone: teacher.phone,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        joinDate: teacher.joinDate,
        salary: teacher.salary,
        subjects: teacher.subjects
      }).pipe(map(created => this.normalizeTeacher(created)));
    }
    const newTeacher: Teacher = { ...teacher, id: 'tu' + Date.now() } as Teacher;
    this.teachers = [newTeacher, ...this.teachers];
    this.teachersSubject.next(this.teachers);
    return of(newTeacher).pipe(delay(500));
  }

  updateTeacher(id: string, data: Partial<Teacher>): Observable<Teacher> {
    if (!environment.useMocks) {
      return this.api.put<Teacher>('/teachers/' + id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        qualification: data.qualification,
        specialization: data.specialization,
        joinDate: data.joinDate,
        salary: data.salary,
        subjects: data.subjects
      }).pipe(map(updated => this.normalizeTeacher(updated)));
    }
    const idx = this.teachers.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.teachers[idx] = { ...this.teachers[idx], ...data };
      this.teachersSubject.next(this.teachers);
      return of(this.teachers[idx]).pipe(delay(400));
    }
    return of(this.teachers[0]).pipe(delay(400));
  }

  deleteTeacher(id: string): Observable<boolean> {
    if (!environment.useMocks) { return this.api.delete<any>('/teachers/' + id).pipe(map(() => true)); }
    this.teachers = this.teachers.filter(t => t.id !== id);
    this.teachersSubject.next(this.teachers);
    return of(true).pipe(delay(300));
  }

  importTeachersZip(file: File): Observable<Teacher[]> {
    if (!environment.useMocks) {
      const formData = new FormData();
      formData.append('file', file);
      return this.api.postFormData<any[]>('/teachers/import', formData).pipe(
        map(teachers => teachers.map(teacher => this.normalizeTeacher(teacher)))
      );
    }
    return of([]).pipe(delay(300));
  }

  private normalizeTeacher(teacher: any): Teacher {
    return {
      ...teacher,
      id: String(teacher.id),
      tenantId: teacher.tenantId ?? '',
      phone: teacher.phone ?? '',
      qualification: teacher.qualification ?? '',
      specialization: teacher.specialization ?? '',
      joinDate: teacher.joinDate ?? '',
      subjects: teacher.subjects ?? [],
      classIds: teacher.classIds ?? [],
      salary: Number(teacher.salary ?? 0),
      status: (teacher.status ?? 'active') as Teacher['status']
    };
  }
}
