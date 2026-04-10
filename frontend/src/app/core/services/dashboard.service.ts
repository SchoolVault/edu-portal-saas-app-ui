import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import {
  AdminDashboardData,
  FeePayment,
  MarkRecord,
  ParentDashboardData,
  Student,
  TeacherDashboardData
} from '../models/models';
import { ApiService } from './api.service';
import { ParentService } from './parent.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService, private parentService: ParentService) {}

  getAdminDashboard(): Observable<AdminDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({
        totalStudents: 2847,
        totalTeachers: 124,
        feesCollected: 284000,
        feesPending: 46300,
        collectionRate: 86,
        monthlyAdmissions: [
          { label: 'Sep', value: 42 },
          { label: 'Oct', value: 35 },
          { label: 'Nov', value: 28 },
          { label: 'Dec', value: 15 },
          { label: 'Jan', value: 48 },
          { label: 'Feb', value: 32 }
        ],
        monthlyCollections: [
          { label: 'Sep', value: 45000 },
          { label: 'Oct', value: 52000 },
          { label: 'Nov', value: 48000 },
          { label: 'Dec', value: 38000 },
          { label: 'Jan', value: 55000 },
          { label: 'Feb', value: 47000 }
        ],
        attendanceOverview: {
          total: 2678,
          present: 2498,
          absent: 92,
          late: 61,
          excused: 27
        },
        recentActivities: [
          { title: 'New student Arjun Patel admitted', description: 'Joined Class 5-A through the admissions office', type: 'success', timestamp: '2 hours ago' },
          { title: 'Fee payment batch posted', description: '37 receipts reconciled against January dues', type: 'info', timestamp: '4 hours ago' },
          { title: 'Midterm marks published', description: 'Class 8 results are now visible to parents', type: 'warning', timestamp: '6 hours ago' },
          { title: 'Transport route updated', description: 'Route 3 stop timings were adjusted for the afternoon run', type: 'info', timestamp: '1 day ago' }
        ],
        upcomingEvents: [
          { id: 'e1', title: 'Parent-Teacher Meeting', date: '2026-04-15', description: 'Campus-wide parent interaction day' },
          { id: 'e2', title: 'Annual Sports Day', date: '2026-04-22', description: 'Inter-house athletics and opening ceremony' },
          { id: 'e3', title: 'Final Exam Window', date: '2026-05-05', description: 'Main term-end examinations begin' }
        ],
        classesWithoutHomeroomTeacher: [
          { classId: 901, className: 'Grade 6 — Emerald', grade: 6 },
          { classId: 902, className: 'Grade 9 — Sapphire', grade: 9 }
        ]
      }).pipe();
    }
    return this.api.get<AdminDashboardData>('/reports/dashboard/admin');
  }

  getTeacherDashboard(): Observable<TeacherDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({
        assignedClasses: 6,
        studentsAssigned: 186,
        upcomingExams: 3,
        unreadNotifications: 5,
        classTeacherOf: [
          { classId: 'c8', className: 'Class 8', sectionName: 'A', totalStudents: 38 },
        ],
        messageQueue: [
          { conversationId: 'c-101', fromName: 'Michael Chen', studentName: 'Emma Chen', preview: 'Can we discuss her math progress?', timestamp: 'Today · 10:12', priority: 'high' as const },
          { conversationId: 'c-102', fromName: 'Parent - Rahul Singh', studentName: 'Arjun Singh', preview: 'Requesting re-test date for science.', timestamp: 'Yesterday · 17:40', priority: 'normal' as const }
        ],
        quickActions: [
          { label: 'Inbox', route: '/app/chat', icon: 'bi-inbox-fill' },
          { label: 'Attendance', route: '/app/attendance', icon: 'bi-calendar-check-fill' },
          { label: 'Exams', route: '/app/exams', icon: 'bi-journal-text' }
        ],
        todaySchedule: [
          { classId: 'c8', sectionId: 'sec8a', period: 1, subject: 'Mathematics', className: 'Class 8', sectionName: 'A', room: 'Room 201', startTime: '08:00', endTime: '08:45' },
          { classId: 'c9', sectionId: 'sec9b', period: 2, subject: 'Mathematics', className: 'Class 9', sectionName: 'B', room: 'Room 301', startTime: '08:45', endTime: '09:30' },
          { classId: 'c10', sectionId: 'sec10a', period: 4, subject: 'Physics', className: 'Class 10', sectionName: 'A', room: 'Lab 1', startTime: '10:30', endTime: '11:15' }
        ],
        pendingTasks: [
          { title: 'Submit Class 9-B Attendance', description: 'Today’s second period attendance is pending', type: 'warning', timestamp: '09:45 AM' },
          { title: 'Review Midterm Papers', description: '12 answer sheets left in the moderation queue', type: 'info', timestamp: 'Today' },
          { title: 'Parent Message', description: 'One guardian requested a callback about performance concerns', type: 'info', timestamp: '1 hour ago' }
        ]
      }).pipe(delay(200));
    }
    return this.api.get<any>('/reports/dashboard/teacher').pipe(
      map(dashboard => ({
        ...dashboard,
        classTeacherOf: (dashboard.classTeacherOf ?? []).map((row: any) => ({
          ...row,
          classId: row.classId != null ? String(row.classId) : ''
        })),
        messageQueue: (dashboard.messageQueue ?? []).map((m: any) => ({
          ...m,
          conversationId: String(m.conversationId ?? '')
        })),
        quickActions: dashboard.quickActions ?? [],
        todaySchedule: (dashboard.todaySchedule ?? []).map((item: any) => ({
          ...item,
          classId: item.classId != null ? String(item.classId) : '',
          sectionId: item.sectionId != null ? String(item.sectionId) : ''
        }))
      }))
    );
  }

  getParentDashboard(from: string, to: string): Observable<ParentDashboardData> {
    if (runtimeConfig.useMocks) {
      const children: Student[] = [
        {
          id: 's12',
          firstName: 'Emma',
          lastName: 'Chen',
          email: 'emma.c@school.com',
          phone: '+1-555-0212',
          dateOfBirth: '2009-02-14',
          gender: 'female',
          classId: 'c8',
          className: 'Class 8',
          sectionId: 'sec8a',
          sectionName: 'A',
          rollNumber: '805',
          admissionNumber: 'ADM2022080',
          admissionDate: '2022-06-08',
          parentId: 'u3',
          parentName: 'Michael Chen',
          address: '963 Willow Street',
          bloodGroup: 'A+',
          status: 'active' as const,
          tenantId: 't1'
        }
      ];
      return of({
        childCount: children.length,
        children,
        selectedChild: children[0],
        selectedChildId: children[0]?.id,
        attendancePercentage: 96.2,
        overallGrade: 'A',
        feeDue: 1200,
        attendanceSnapshot: { totalDays: 22, present: 20, absent: 1, late: 1, excused: 0 },
        alerts: [
          { type: 'warning' as const, title: 'Fee due this month', message: '₹1,200 is pending for Emma Chen. Pay before the due date to avoid late fee.', ctaLabel: 'Pay now', ctaRoute: '/app/parent' },
          { type: 'info' as const, title: 'Parent–Teacher Meeting', message: 'PTM is scheduled next week. Confirm your slot from Inbox.', ctaLabel: 'Open Inbox', ctaRoute: '/app/chat' }
        ],
        upcoming: [
          { id: 'up1', title: 'Unit Test: Mathematics', date: '2026-04-16', description: 'Chapters 5–7' },
          { id: 'up2', title: 'PTM (Class 8)', date: '2026-04-20', description: 'Meet class teacher and subject teachers' }
        ],
        childPerformance: [
          { id: 'm1', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
          { id: 'm2', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
          { id: 'm3', examId: 'e2', studentId: 's12', studentName: 'Emma Chen', subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' }
        ],
        feeStatus: [
          { id: 'fp8', studentId: 's12', studentName: 'Emma Chen', feeStructureId: 'fs2', amount: 5000, paidAmount: 3800, dueAmount: 1200, status: 'partial' as const, paymentDate: '2025-08-01', dueDate: '2025-08-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-004', tenantId: 't1' },
          { id: 'fp9', studentId: 's18', studentName: 'Lily Chen', feeStructureId: 'fs1', amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'paid' as const, paymentDate: '2025-08-01', dueDate: '2025-08-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-008', tenantId: 't1' }
        ]
      }).pipe(delay(200));
    }
    return this.parentService.getChildren().pipe(
      switchMap(children => {
        const selectedChild = children[0];
        if (!selectedChild) {
        return of({
            childCount: 0,
            children: [],
            attendancePercentage: 0,
            overallGrade: '-',
            feeDue: 0,
            childPerformance: [],
            feeStatus: [],
            alerts: [],
            upcoming: [],
            attendanceSnapshot: { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0 }
          });
        }
        return forkJoin({
          marks: this.parentService.getChildMarks(selectedChild.id),
          fees: this.parentService.getChildFees(selectedChild.id),
          attendance: this.parentService.getChildAttendance(selectedChild.id, from, to)
        }).pipe(
          map(({ marks, fees, attendance }) => {
            const feeDue = fees.reduce((sum, fee) => sum + (fee.dueAmount ?? 0), 0);
            const alerts: ParentDashboardData['alerts'] = [];
            if (feeDue > 0) {
              alerts.push({
                type: 'warning',
                title: 'Fee balance outstanding',
                message: `There is an unpaid balance for ${selectedChild.firstName} ${selectedChild.lastName}. Visit Fees to pay or review receipts.`,
                ctaLabel: 'Open fees',
                ctaRoute: '/app/parent'
              });
            }
            if ((attendance.totalDays ?? 0) > 0 && (attendance.attendancePercentage ?? 100) < 85) {
              alerts.push({
                type: 'info',
                title: 'Attendance this month',
                message: `Attendance is ${attendance.attendancePercentage?.toFixed(1) ?? '—'}% for the selected period. Contact the class teacher if you have questions.`,
                ctaLabel: 'Inbox',
                ctaRoute: '/app/chat'
              });
            }
            if (marks.length) {
              alerts.push({
                type: 'success',
                title: 'Latest results on file',
                message: `${marks.length} subject record(s) available. Overall grade trend: ${this.getOverallGrade(marks)}.`,
                ctaLabel: 'View inbox',
                ctaRoute: '/app/chat'
              });
            }
            return {
              childCount: children.length,
              children,
              selectedChild,
              selectedChildId: selectedChild.id,
              attendancePercentage: attendance.attendancePercentage,
              overallGrade: this.getOverallGrade(marks),
              feeDue,
              childPerformance: marks,
              feeStatus: fees,
              alerts,
              upcoming: [] as ParentDashboardData['upcoming'],
              attendanceSnapshot: {
                totalDays: attendance.totalDays,
                present: attendance.present,
                absent: attendance.absent,
                late: attendance.late,
                excused: attendance.excused ?? 0
              }
            };
          })
        );
      })
    );
  }

  private getOverallGrade(marks: MarkRecord[]): string {
    if (!marks.length) {
      return '-';
    }
    const total = marks.reduce((sum, mark) => sum + ((mark.marksObtained / Math.max(mark.maxMarks, 1)) * 100), 0) / marks.length;
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    return 'D';
  }
}
