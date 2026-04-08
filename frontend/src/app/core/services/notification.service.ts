import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AppNotification } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications: AppNotification[] = [
    { id: 'n1', title: 'New Admission', message: 'Arjun Patel has been admitted to Class 5-A', type: 'success', read: false, userId: 'u1', createdAt: '2026-02-05T10:30:00Z' },
    { id: 'n2', title: 'Fee Payment Received', message: 'Fee payment of $2,500 received from Emily Watson', type: 'info', read: false, userId: 'u1', createdAt: '2026-02-05T09:15:00Z' },
    { id: 'n3', title: 'Exam Schedule Updated', message: 'Midterm exam schedule has been updated for Class 8', type: 'warning', read: false, userId: 'u1', createdAt: '2026-02-04T16:45:00Z' },
    { id: 'n4', title: 'Attendance Alert', message: 'Class 3-B has below 80% attendance today', type: 'error', read: true, userId: 'u1', createdAt: '2026-02-04T11:00:00Z' },
    { id: 'n5', title: 'Parent Meeting', message: 'Parent-teacher meeting scheduled for Feb 15', type: 'info', read: true, userId: 'u1', createdAt: '2026-02-03T14:20:00Z' },
    { id: 'n6', title: 'Library Book Overdue', message: '5 books are overdue from Class 7 students', type: 'warning', read: true, userId: 'u1', createdAt: '2026-02-03T10:00:00Z' },
  ];

  private notificationsSubject = new BehaviorSubject<AppNotification[]>(this.notifications);
  notifications$ = this.notificationsSubject.asObservable();

  getNotifications(): Observable<AppNotification[]> {
    return of(this.notifications).pipe(delay(300));
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: string): void {
    const n = this.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationsSubject.next([...this.notifications]);
  }
}
