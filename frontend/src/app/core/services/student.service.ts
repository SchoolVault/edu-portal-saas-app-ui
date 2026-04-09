import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Student } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private students: Student[] = [
    { id: 's1', firstName: 'Arjun', lastName: 'Patel', email: 'arjun.p@school.com', phone: '+1-555-0201', dateOfBirth: '2012-03-15', gender: 'male', classId: 'c5', className: 'Class 5', sectionId: 'sec5a', sectionName: 'A', rollNumber: '501', admissionNumber: 'ADM2025001', admissionDate: '2025-06-15', parentId: 'p1', parentName: 'Rajesh Patel', address: '123 Oak Street', bloodGroup: 'A+', status: 'active', tenantId: 't1' },
    { id: 's2', firstName: 'Emily', lastName: 'Watson', email: 'emily.w@school.com', phone: '+1-555-0202', dateOfBirth: '2011-07-22', gender: 'female', classId: 'c6', className: 'Class 6', sectionId: 'sec6a', sectionName: 'A', rollNumber: '601', admissionNumber: 'ADM2024012', admissionDate: '2024-06-10', parentId: 'p2', parentName: 'James Watson', address: '456 Elm Avenue', bloodGroup: 'B+', status: 'active', tenantId: 't1' },
    { id: 's3', firstName: 'Liam', lastName: 'Chen', email: 'liam.c@school.com', phone: '+1-555-0203', dateOfBirth: '2010-11-08', gender: 'male', classId: 'c7', className: 'Class 7', sectionId: 'sec7b', sectionName: 'B', rollNumber: '712', admissionNumber: 'ADM2023045', admissionDate: '2023-06-12', parentId: 'p3', parentName: 'Wei Chen', address: '789 Pine Road', bloodGroup: 'O+', status: 'active', tenantId: 't1' },
    { id: 's4', firstName: 'Sofia', lastName: 'Martinez', email: 'sofia.m@school.com', phone: '+1-555-0204', dateOfBirth: '2009-05-30', gender: 'female', classId: 'c8', className: 'Class 8', sectionId: 'sec8a', sectionName: 'A', rollNumber: '803', admissionNumber: 'ADM2022078', admissionDate: '2022-06-08', parentId: 'p4', parentName: 'Carlos Martinez', address: '321 Maple Lane', bloodGroup: 'AB+', status: 'active', tenantId: 't1' },
    { id: 's5', firstName: 'Noah', lastName: 'Williams', email: 'noah.w@school.com', phone: '+1-555-0205', dateOfBirth: '2012-01-14', gender: 'male', classId: 'c5', className: 'Class 5', sectionId: 'sec5b', sectionName: 'B', rollNumber: '515', admissionNumber: 'ADM2025002', admissionDate: '2025-06-15', parentId: 'p5', parentName: 'David Williams', address: '654 Cedar Blvd', bloodGroup: 'A-', status: 'active', tenantId: 't1' },
    { id: 's6', firstName: 'Ava', lastName: 'Johnson', email: 'ava.j@school.com', phone: '+1-555-0206', dateOfBirth: '2010-09-03', gender: 'female', classId: 'c7', className: 'Class 7', sectionId: 'sec7a', sectionName: 'A', rollNumber: '705', admissionNumber: 'ADM2023046', admissionDate: '2023-06-12', parentId: 'p6', parentName: 'Robert Johnson', address: '987 Birch Court', bloodGroup: 'B-', status: 'active', tenantId: 't1' },
    { id: 's7', firstName: 'Ethan', lastName: 'Brown', email: 'ethan.b@school.com', phone: '+1-555-0207', dateOfBirth: '2011-12-25', gender: 'male', classId: 'c6', className: 'Class 6', sectionId: 'sec6b', sectionName: 'B', rollNumber: '618', admissionNumber: 'ADM2024013', admissionDate: '2024-06-10', parentId: 'p7', parentName: 'Michael Brown', address: '147 Walnut Street', bloodGroup: 'O-', status: 'active', tenantId: 't1' },
    { id: 's8', firstName: 'Isabella', lastName: 'Garcia', email: 'isabella.g@school.com', phone: '+1-555-0208', dateOfBirth: '2009-08-17', gender: 'female', classId: 'c8', className: 'Class 8', sectionId: 'sec8b', sectionName: 'B', rollNumber: '820', admissionNumber: 'ADM2022079', admissionDate: '2022-06-08', parentId: 'p8', parentName: 'Luis Garcia', address: '258 Spruce Way', bloodGroup: 'A+', status: 'active', tenantId: 't1' },
    { id: 's9', firstName: 'Mason', lastName: 'Davis', email: 'mason.d@school.com', phone: '+1-555-0209', dateOfBirth: '2008-04-11', gender: 'male', classId: 'c9', className: 'Class 9', sectionId: 'sec9a', sectionName: 'A', rollNumber: '902', admissionNumber: 'ADM2021032', admissionDate: '2021-06-10', parentId: 'p9', parentName: 'Kevin Davis', address: '369 Ash Drive', bloodGroup: 'B+', status: 'active', tenantId: 't1' },
    { id: 's10', firstName: 'Charlotte', lastName: 'Wilson', email: 'charlotte.w@school.com', phone: '+1-555-0210', dateOfBirth: '2008-10-29', gender: 'female', classId: 'c9', className: 'Class 9', sectionId: 'sec9b', sectionName: 'B', rollNumber: '916', admissionNumber: 'ADM2021033', admissionDate: '2021-06-10', parentId: 'p10', parentName: 'Thomas Wilson', address: '741 Poplar Road', bloodGroup: 'AB-', status: 'active', tenantId: 't1' },
    { id: 's11', firstName: 'Oliver', lastName: 'Taylor', email: 'oliver.t@school.com', phone: '+1-555-0211', dateOfBirth: '2007-06-20', gender: 'male', classId: 'c10', className: 'Class 10', sectionId: 'sec10a', sectionName: 'A', rollNumber: '1001', admissionNumber: 'ADM2020015', admissionDate: '2020-06-08', parentId: 'p11', parentName: 'Andrew Taylor', address: '852 Hickory Lane', bloodGroup: 'O+', status: 'active', tenantId: 't1' },
    { id: 's12', firstName: 'Emma', lastName: 'Chen', email: 'emma.c@school.com', phone: '+1-555-0212', dateOfBirth: '2009-02-14', gender: 'female', classId: 'c8', className: 'Class 8', sectionId: 'sec8a', sectionName: 'A', rollNumber: '805', admissionNumber: 'ADM2022080', admissionDate: '2022-06-08', parentId: 'u3', parentName: 'Michael Chen', address: '963 Willow Street', bloodGroup: 'A+', status: 'active', tenantId: 't1' },
    { id: 's13', firstName: 'Aiden', lastName: 'Murphy', email: 'aiden.m@school.com', phone: '+1-555-0213', dateOfBirth: '2009-06-18', gender: 'male', classId: 'c8', className: 'Class 8', sectionId: 'sec8a', sectionName: 'A', rollNumber: '806', admissionNumber: 'ADM2022081', admissionDate: '2022-06-08', parentId: 'p13', parentName: 'Sean Murphy', address: '111 Ivy Lane', bloodGroup: 'B+', status: 'active', tenantId: 't1' },
    { id: 's14', firstName: 'Mia', lastName: 'Rodriguez', email: 'mia.r@school.com', phone: '+1-555-0214', dateOfBirth: '2009-09-25', gender: 'female', classId: 'c8', className: 'Class 8', sectionId: 'sec8a', sectionName: 'A', rollNumber: '807', admissionNumber: 'ADM2022082', admissionDate: '2022-06-08', parentId: 'p14', parentName: 'Pedro Rodriguez', address: '222 Fern Court', bloodGroup: 'O+', status: 'active', tenantId: 't1' },
    { id: 's15', firstName: 'Lucas', lastName: 'Kim', email: 'lucas.k@school.com', phone: '+1-555-0215', dateOfBirth: '2009-04-10', gender: 'male', classId: 'c8', className: 'Class 8', sectionId: 'sec8a', sectionName: 'A', rollNumber: '808', admissionNumber: 'ADM2022083', admissionDate: '2022-06-08', parentId: 'p15', parentName: 'Jun Kim', address: '333 Rosewood Dr', bloodGroup: 'A-', status: 'active', tenantId: 't1' },
    { id: 's16', firstName: 'Harper', lastName: 'Lewis', email: 'harper.l@school.com', phone: '+1-555-0216', dateOfBirth: '2009-12-03', gender: 'female', classId: 'c8', className: 'Class 8', sectionId: 'sec8a', sectionName: 'A', rollNumber: '809', admissionNumber: 'ADM2022084', admissionDate: '2022-06-08', parentId: 'p16', parentName: 'Grant Lewis', address: '444 Magnolia Ave', bloodGroup: 'AB+', status: 'active', tenantId: 't1' },
    { id: 's17', firstName: 'James', lastName: 'Walker', email: 'james.w@school.com', phone: '+1-555-0217', dateOfBirth: '2012-08-20', gender: 'male', classId: 'c5', className: 'Class 5', sectionId: 'sec5a', sectionName: 'A', rollNumber: '502', admissionNumber: 'ADM2025003', admissionDate: '2025-06-15', parentId: 'p17', parentName: 'Tom Walker', address: '555 Jasmine Blvd', bloodGroup: 'B-', status: 'active', tenantId: 't1' },
    { id: 's18', firstName: 'Lily', lastName: 'Hall', email: 'lily.h@school.com', phone: '+1-555-0218', dateOfBirth: '2012-05-12', gender: 'female', classId: 'c5', className: 'Class 5', sectionId: 'sec5a', sectionName: 'A', rollNumber: '503', admissionNumber: 'ADM2025004', admissionDate: '2025-06-15', parentId: 'p18', parentName: 'Chris Hall', address: '666 Orchid Street', bloodGroup: 'O-', status: 'active', tenantId: 't1' },
    { id: 's19', firstName: 'Daniel', lastName: 'Young', email: 'daniel.y@school.com', phone: '+1-555-0219', dateOfBirth: '2012-10-01', gender: 'male', classId: 'c5', className: 'Class 5', sectionId: 'sec5a', sectionName: 'A', rollNumber: '504', admissionNumber: 'ADM2025005', admissionDate: '2025-06-15', parentId: 'p19', parentName: 'Eric Young', address: '777 Lotus Way', bloodGroup: 'A+', status: 'active', tenantId: 't1' },
    { id: 's20', firstName: 'Zoe', lastName: 'King', email: 'zoe.k@school.com', phone: '+1-555-0220', dateOfBirth: '2012-02-28', gender: 'female', classId: 'c5', className: 'Class 5', sectionId: 'sec5a', sectionName: 'A', rollNumber: '505', admissionNumber: 'ADM2025006', admissionDate: '2025-06-15', parentId: 'p20', parentName: 'Mark King', address: '888 Daisy Road', bloodGroup: 'B+', status: 'active', tenantId: 't1' },
    { id: 's21', firstName: 'Alexander', lastName: 'Scott', email: 'alex.s@school.com', phone: '+1-555-0221', dateOfBirth: '2008-07-15', gender: 'male', classId: 'c9', className: 'Class 9', sectionId: 'sec9a', sectionName: 'A', rollNumber: '903', admissionNumber: 'ADM2021034', admissionDate: '2021-06-10', parentId: 'p21', parentName: 'Bruce Scott', address: '999 Tulip Lane', bloodGroup: 'O+', status: 'active', tenantId: 't1' },
    { id: 's22', firstName: 'Grace', lastName: 'Adams', email: 'grace.a@school.com', phone: '+1-555-0222', dateOfBirth: '2008-03-22', gender: 'female', classId: 'c9', className: 'Class 9', sectionId: 'sec9a', sectionName: 'A', rollNumber: '904', admissionNumber: 'ADM2021035', admissionDate: '2021-06-10', parentId: 'p22', parentName: 'Alan Adams', address: '100 Sunflower Dr', bloodGroup: 'A+', status: 'active', tenantId: 't1' },
  ];

  private studentsSubject = new BehaviorSubject<Student[]>(this.students);

  constructor(private api: ApiService) {}

  getStudents(): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPage<any>('/students').pipe(map(p => p.content.map((student: any) => this.normalizeStudent(student))));
    }
    return of([...this.students]).pipe(delay(400));
  }

  getStudentById(id: string): Observable<Student | undefined> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>('/students/' + id).pipe(map(student => this.normalizeStudent(student)));
    }
    return of(this.students.find(s => s.id === id)).pipe(delay(300));
  }

  addStudent(student: Omit<Student, 'id'>): Observable<Student> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>('/students', this.toCreatePayload(student)).pipe(map(created => this.normalizeStudent(created)));
    }
    const newStudent: Student = { ...student, id: 'su' + Date.now() } as Student;
    this.students = [newStudent, ...this.students];
    this.studentsSubject.next(this.students);
    return of(newStudent).pipe(delay(500));
  }

  updateStudent(id: string, data: Partial<Student>): Observable<Student> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<any>('/students/' + id, this.toUpdatePayload(data)).pipe(map(student => this.normalizeStudent(student)));
    }
    const idx = this.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.students[idx] = { ...this.students[idx], ...data };
      this.studentsSubject.next(this.students);
      return of(this.students[idx]).pipe(delay(400));
    }
    return of(this.students[0]).pipe(delay(400));
  }

  deleteStudent(id: string): Observable<boolean> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<any>('/students/' + id).pipe(map(() => true));
    }
    this.students = this.students.filter(s => s.id !== id);
    this.studentsSubject.next(this.students);
    return of(true).pipe(delay(300));
  }

  getStudentsByClass(classId: string): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/students/class/' + classId).pipe(map(students => students.map(student => this.normalizeStudent(student))));
    }
    return of(this.students.filter(s => s.classId === classId)).pipe(delay(300));
  }

  getStudentsByClassAndSection(classId: string, sectionId: string): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/students/class/${classId}/section/${sectionId}`).pipe(
        map(students => students.map(student => this.normalizeStudent(student)))
      );
    }
    return of(this.students.filter(s => s.classId === classId && s.sectionId === sectionId)).pipe(delay(300));
  }

  importStudentsZip(file: File): Observable<Student[]> {
    if (!runtimeConfig.useMocks) {
      const formData = new FormData();
      formData.append('file', file);
      return this.api.postFormData<any[]>('/students/import', formData).pipe(
        map(students => students.map(student => this.normalizeStudent(student)))
      );
    }
    return of([]).pipe(delay(300));
  }

  private normalizeStudent(student: any): Student {
    return {
      ...student,
      id: String(student.id),
      classId: student.classId != null ? String(student.classId) : '',
      sectionId: student.sectionId != null ? String(student.sectionId) : '',
      parentId: student.parentId != null ? String(student.parentId) : '',
      tenantId: student.tenantId ?? '',
      status: (student.status ?? 'active') as Student['status'],
      dateOfBirth: student.dateOfBirth ?? '',
      admissionDate: student.admissionDate ?? '',
      email: student.email ?? '',
      phone: student.phone ?? '',
      bloodGroup: student.bloodGroup ?? '',
      address: student.address ?? '',
      className: student.className ?? '',
      sectionName: student.sectionName ?? '',
      rollNumber: student.rollNumber ?? '',
      admissionNumber: student.admissionNumber ?? '',
      parentName: student.parentName ?? '',
      gender: student.gender ?? ''
    };
  }

  private toCreatePayload(student: Partial<Student>): any {
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || null,
      phone: student.phone || null,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender ? student.gender.toUpperCase() : null,
      classId: student.classId ? Number(student.classId) : null,
      sectionId: student.sectionId ? Number(student.sectionId) : null,
      rollNumber: student.rollNumber || null,
      admissionNumber: student.admissionNumber || null,
      admissionDate: student.admissionDate || null,
      parentId: student.parentId ? Number(student.parentId) : null,
      parentName: student.parentName || null,
      address: student.address || null,
      bloodGroup: student.bloodGroup || null
    };
  }

  private toUpdatePayload(student: Partial<Student>): any {
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender ? student.gender.toUpperCase() : null,
      classId: student.classId ? Number(student.classId) : null,
      sectionId: student.sectionId ? Number(student.sectionId) : null,
      rollNumber: student.rollNumber,
      parentId: student.parentId ? Number(student.parentId) : null,
      parentName: student.parentName,
      address: student.address,
      bloodGroup: student.bloodGroup,
      status: student.status ? student.status.toUpperCase() : null
    };
  }
}
