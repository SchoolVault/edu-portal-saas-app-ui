import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Announcement, AnnouncementPreview } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

/** Payload for POST /communication/announcements (matches backend CreateAnnouncementRequest). */
export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  targetAudience: string;
  targetClassId?: number;
  targetSectionId?: number;
}

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private announcements: Announcement[] = [
    { id: 'a1', title: 'Annual Sports Day Registration', content: 'Registration for Annual Sports Day 2026 is now open. All students from classes 5-12 are encouraged to participate. Events include track and field, swimming, basketball, and more. Registration deadline is February 20, 2026.', author: 'John Anderson', authorRole: 'Admin', targetAudience: 'all', createdAt: '2026-02-05T08:00:00Z', tenantId: 't1' },
    { id: 'a2', title: 'Parent-Teacher Meeting Schedule', content: 'The quarterly parent-teacher meeting is scheduled for February 15, 2026. Parents are requested to confirm their attendance through the school portal. Individual session slots will be assigned based on class teacher availability.', author: 'John Anderson', authorRole: 'Admin', targetAudience: 'parents', createdAt: '2026-02-03T10:00:00Z', tenantId: 't1' },
    { id: 'a3', title: 'Science Exhibition Announcement', content: 'Our annual Science Exhibition will be held on March 5, 2026. Students from classes 6-12 are invited to submit their project proposals by February 25. Themes include sustainability, AI, and space exploration.', author: 'Sarah Mitchell', authorRole: 'Teacher', targetAudience: 'all', createdAt: '2026-02-01T14:00:00Z', tenantId: 't1' },
    { id: 'a4', title: 'Library Book Return Reminder', content: 'Students who have borrowed library books are reminded to return them before the end of this month. Failure to return books on time will result in late fees.', author: 'James O\'Brien', authorRole: 'Teacher', targetAudience: 'all', createdAt: '2026-01-28T09:00:00Z', tenantId: 't1' },
    { id: 'a5', title: 'Midterm Exam Timetable Published', content: 'The midterm examination timetable for all classes has been published. Students can view their exam schedules in the Exams module. Exams begin on March 10, 2026.', author: 'John Anderson', authorRole: 'Admin', targetAudience: 'all', createdAt: '2026-01-25T11:00:00Z', tenantId: 't1' },
  ];

  getAnnouncements(): Observable<Announcement[]> {
    if (!environment.useMocks) { return this.api.get<Announcement[]>('/communication/announcements'); }
    return of([...this.announcements]).pipe(delay(400));
  }

  getAnnouncement(id: string): Observable<Announcement> {
    if (!environment.useMocks) {
      return this.api.get<Announcement>(`/communication/announcements/${encodeURIComponent(id)}`);
    }
    const found = this.announcements.find(a => String(a.id) === String(id));
    if (!found) {
      return throwError(() => new Error('Announcement not found'));
    }
    return of({ ...found }).pipe(delay(200));
  }

  createAnnouncement(payload: CreateAnnouncementPayload): Observable<Announcement> {
    if (!environment.useMocks) {
      return this.api.post<Announcement>('/communication/announcements', {
        title: payload.title,
        content: payload.content,
        targetAudience: payload.targetAudience,
        targetClassId: payload.targetClassId,
        targetSectionId: payload.targetSectionId
      });
    }
    const ann: Announcement = {
      id: 'a' + Date.now(),
      title: payload.title,
      content: payload.content,
      author: 'You',
      authorRole: 'Admin',
      targetAudience: (payload.targetAudience || 'ALL').toLowerCase(),
      createdAt: new Date().toISOString(),
      tenantId: 't1'
    };
    this.announcements = [ann, ...this.announcements];
    return of(ann).pipe(delay(500));
  }

  getAnnouncementPreviews(): Observable<AnnouncementPreview[]> {
    if (!environment.useMocks) {
      return this.api.get<AnnouncementPreview[]>('/communication/announcements/previews');
    }
    return this.getAnnouncements().pipe(
      map(list =>
        (list || []).slice(0, 5).map(a => {
          const t = (a.content || '').replace(/\s+/g, ' ').trim();
          const preview = t.length > 140 ? t.slice(0, 139) + '…' : t;
          return { id: String(a.id), title: a.title, preview, createdAt: a.createdAt };
        })
      )
    );
  }

  constructor(private api: ApiService) {}

  addAnnouncement(announcement: Announcement): Observable<Announcement> {
    if (!environment.useMocks) { return this.api.post<Announcement>('/communication/announcements', announcement); }
    this.announcements = [announcement, ...this.announcements];
    return of(announcement).pipe(delay(500));
  }
}
