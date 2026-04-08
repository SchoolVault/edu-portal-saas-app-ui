import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, map } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  token$ = this.tokenSubject.asObservable();

  private mockUsers = [
    {
      email: 'admin@school.com', password: 'admin123', schoolCode: 'SCH001',
      user: { id: 'u1', email: 'admin@school.com', name: 'John Anderson', role: 'admin' as const, tenantId: 't1', phone: '+1-555-0101' }
    },
    {
      email: 'teacher@school.com', password: 'teacher123', schoolCode: 'SCH001',
      user: { id: 'u2', email: 'teacher@school.com', name: 'Sarah Mitchell', role: 'teacher' as const, tenantId: 't1', phone: '+1-555-0102' }
    },
    {
      email: 'parent@school.com', password: 'parent123', schoolCode: 'SCH001',
      user: { id: 'u3', email: 'parent@school.com', name: 'Michael Chen', role: 'parent' as const, tenantId: 't1', phone: '+1-555-0103' }
    },
  ];

  constructor(private api: ApiService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('erp_token');
    const userStr = localStorage.getItem('erp_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    if (!environment.useMocks) {
      return this.api.post<LoginResponse>('/auth/login', request).pipe(
        tap(res => {
          localStorage.setItem('erp_token', res.token);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.tokenSubject.next(res.token);
          this.currentUserSubject.next(res.user);
        })
      );
    }
    const found = this.mockUsers.find(
      u => u.email === request.email && u.password === request.password && u.schoolCode === request.schoolCode
    );
    if (found) {
      const response: LoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiJ9.mock-jwt-' + found.user.role + '-' + Date.now(),
        user: found.user,
      };
      return of(response).pipe(
        delay(800),
        tap(res => {
          localStorage.setItem('erp_token', res.token);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.tokenSubject.next(res.token);
          this.currentUserSubject.next(res.user);
        })
      );
    }
    return throwError(() => new Error('Invalid credentials or school code')).pipe(delay(500));
  }

  logout(): void {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  getTenantId(): string | null {
    return this.currentUserSubject.value?.tenantId || null;
  }

  getUserInitials(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';
    const parts = user.name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
  }
}
