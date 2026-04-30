import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { runtimeConfig } from '../config/runtime-config';

export interface ApiResp<T = unknown> {
  success: boolean;
  message: string;
  /** On success this is the payload; on some errors (e.g. 409 scheduling) the server may still attach structured data. */
  data?: T;
  timestamp: string;
  errors?: string[];
  /** Stable code from Spring {@code ApiResponse} for client-side i18n (e.g. {@code LEAVE_OTHER_REASON_REQUIRED}). */
  errorCode?: string;
}

export interface PageResp<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {

  /** Exposed for callers that need custom HTTP handling (e.g. structured 409 conflict bodies). */
  getBaseUrl(): string {
    return runtimeConfig.apiUrl ?? '';
  }

  private get baseUrl(): string {
    return runtimeConfig.apiUrl ?? '';
  }

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<ApiResp<T>>(`${this.baseUrl}${path}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  /** GET with query string (same unwrap as {@link #get}). */
  getParams<T>(path: string, query: Record<string, string | number | boolean | undefined | null>): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http.get<ApiResp<T>>(`${this.baseUrl}${path}`, { params }).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  getPage<T>(path: string): Observable<PageResp<T>> {
    return this.http.get<ApiResp<PageResp<T>>>(`${this.baseUrl}${path}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as PageResp<T>;
      })
    );
  }

  /** Paged GET with query params (Spring {@code PageResponse} in {@code data}). */
  getPageParams<T>(path: string, query: Record<string, string | number | boolean | undefined | null>): Observable<PageResp<T>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http.get<ApiResp<PageResp<T>>>(`${this.baseUrl}${path}`, { params }).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as PageResp<T>;
      })
    );
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<ApiResp<T>>(`${this.baseUrl}${path}`, body).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  postFormData<T>(path: string, body: FormData): Observable<T> {
    return this.http.post<ApiResp<T>>(`${this.baseUrl}${path}`, body).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<ApiResp<T>>(`${this.baseUrl}${path}`, body).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<ApiResp<T>>(`${this.baseUrl}${path}`, body).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResp<T>>(`${this.baseUrl}${path}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data as T;
      })
    );
  }

  /** Raw binary (e.g. PDF) — not wrapped in {@link ApiResp}. */
  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, { responseType: 'blob' });
  }

  /** Raw binary GET with query params (e.g. filtered CSV/PDF export). */
  getBlobParams(path: string, query: Record<string, string | number | boolean | undefined | null>): Observable<Blob> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return this.http.get(`${this.baseUrl}${path}`, { params, responseType: 'blob' });
  }
}
