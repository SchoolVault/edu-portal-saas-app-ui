import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResp<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  errors?: string[];
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

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<ApiResp<T>>(`${this.baseUrl}${path}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data;
      })
    );
  }

  getPage<T>(path: string): Observable<PageResp<T>> {
    return this.http.get<ApiResp<PageResp<T>>>(`${this.baseUrl}${path}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data;
      })
    );
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<ApiResp<T>>(`${this.baseUrl}${path}`, body).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data;
      })
    );
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<ApiResp<T>>(`${this.baseUrl}${path}`, body).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message);
        return res.data;
      })
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResp<T>>(`${this.baseUrl}${path}`).pipe(
      map(res => res.data)
    );
  }
}
