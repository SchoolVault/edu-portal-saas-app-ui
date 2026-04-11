import type { Teacher } from '../models/models';

export const MOCK_TEACHERS: Teacher[] = [
{
  id: 1,
  firstName: 'Sarah',
  lastName: 'Mitchell',
  email: 'sarah.m@school.com',
  phone: '+1-555-0301',
  qualification: 'M.Sc Mathematics',
  specialization: 'Mathematics',
  joinDate: '2020-08-15',
  subjects: ['Mathematics', 'Physics'],
  classIds: [7, 8, 9, 10],
  salary: 55000,
  status: 'active',
  tenantId: 't1',
  userId: 2,
  libraryStaffRole: undefined
},
{
  id: 2,
  firstName: 'James',
  lastName: 'O\'Brien',
  email: 'james.o@school.com',
  phone: '+1-555-0302',
  qualification: 'M.A English Literature',
  specialization: 'English',
  joinDate: '2019-06-20',
  subjects: ['English', 'Literature'],
  classIds: [5, 6, 7, 8],
  salary: 52000,
  status: 'active',
  tenantId: 't1',
  libraryStaffRole: 'librarian'
},
{ id: 3, firstName: 'Priya', lastName: 'Sharma', email: 'priya.s@school.com', phone: '+1-555-0303', qualification: 'M.Sc Chemistry', specialization: 'Science', joinDate: '2021-01-10', subjects: ['Chemistry', 'Biology'], classIds: [9, 10, 11], salary: 54000, status: 'active', tenantId: 't1' },
{ id: 4, firstName: 'Robert', lastName: 'Kim', email: 'robert.k@school.com', phone: '+1-555-0304', qualification: 'M.A History', specialization: 'Social Studies', joinDate: '2018-08-01', subjects: ['History', 'Geography', 'Civics'], classIds: [6, 7, 8], salary: 50000, status: 'active', tenantId: 't1' },
{ id: 5, firstName: 'Maria', lastName: 'Torres', email: 'maria.t@school.com', phone: '+1-555-0305', qualification: 'M.Sc Computer Science', specialization: 'Computer Science', joinDate: '2022-03-15', subjects: ['Computer Science', 'IT'], classIds: [8, 9, 10, 11, 12], salary: 58000, status: 'active', tenantId: 't1' },
{ id: 6, firstName: 'David', lastName: 'Anderson', email: 'david.a@school.com', phone: '+1-555-0306', qualification: 'B.Ed Physical Education', specialization: 'Physical Education', joinDate: '2017-06-01', subjects: ['Physical Education'], classIds: [5, 6, 7, 8, 9, 10], salary: 45000, status: 'active', tenantId: 't1' },
{ id: 7, firstName: 'Aisha', lastName: 'Khan', email: 'aisha.k@school.com', phone: '+1-555-0307', qualification: 'M.A Fine Arts', specialization: 'Art & Design', joinDate: '2023-08-01', subjects: ['Art', 'Design'], classIds: [5, 6, 7], salary: 42000, status: 'active', tenantId: 't1' },
{ id: 8, firstName: 'Thomas', lastName: 'Lee', email: 'thomas.l@school.com', phone: '+1-555-0308', qualification: 'Ph.D Physics', specialization: 'Physics', joinDate: '2016-01-15', subjects: ['Physics', 'Mathematics'], classIds: [11, 12], salary: 62000, status: 'active', tenantId: 't1' },
];
