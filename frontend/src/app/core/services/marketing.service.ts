import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MarketingFeature {
  id?: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  detailedDescription?: string;
  highlights: string[];
  enabledForMarketing?: boolean;
  sortOrder?: number;
  status?: string;
}

export interface MarketingTestimonial {
  id: string;
  name: string;
  designation?: string;
  institution?: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
  featured: boolean;
  published?: boolean;
  displayOrder?: number;
}

export interface MarketingLeadRequest {
  fullName: string;
  workEmail: string;
  phone?: string;
  schoolName?: string;
  role?: string;
  studentStrengthRange?: string;
  city?: string;
  country?: string;
  message?: string;
  preferredContactTime?: string;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pagePath?: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
}

export interface MarketingLeadResponse {
  id: string;
  reference: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  schoolName?: string;
  status: string;
  source: string;
  createdAt: string;
}

export interface MarketingVideo {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  category?: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface MarketingVideoUpsertRequest {
  slug: string;
  title: string;
  summary?: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string;
  featured: boolean;
  published: boolean;
  displayOrder: number;
}

export interface NewsletterResponse {
  subscribed: boolean;
  alreadyExists: boolean;
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

export interface MarketingLeadAdmin {
  id: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  schoolName?: string;
  source: string;
  status: string;
  message?: string;
  notes?: string;
  createdAt: string;
}

export interface MarketingLeadDashboard {
  totalLeads: number;
  leadsLast7Days: number;
  leadsLast30Days: number;
  newLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  closedLeads: number;
  byStatus: Array<{ key: string; count: number }>;
  bySource: Array<{ key: string; count: number }>;
  topSchools: Array<{ key: string; count: number }>;
  trend: Array<{ label: string; count: number }>;
}

export interface MarketingFeatureUpsertRequest {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  detailedDescription?: string;
  highlights?: string;
  enabledForMarketing: boolean;
  sortOrder: number;
  status: string;
}

export interface MarketingTestimonialUpsertRequest {
  name: string;
  designation?: string;
  institution?: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
  featured: boolean;
  published: boolean;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class MarketingService {
  constructor(private readonly api: ApiService) {}

  listFeatures(): Observable<MarketingFeature[]> {
    return this.api.get<MarketingFeature[]>('/features');
  }

  listTestimonials(featured = true): Observable<MarketingTestimonial[]> {
    return this.api.getParams<MarketingTestimonial[]>('/testimonials', { featured });
  }

  submitLead(payload: MarketingLeadRequest): Observable<MarketingLeadResponse> {
    return this.api.post<MarketingLeadResponse>('/leads', payload);
  }

  listVideos(params?: { featured?: boolean; category?: string; tag?: string; q?: string }): Observable<MarketingVideo[]> {
    return this.api.getParams<MarketingVideo[]>('/videos', {
      featured: params?.featured,
      category: params?.category,
      tag: params?.tag,
      q: params?.q
    });
  }

  subscribeNewsletter(email: string): Observable<NewsletterResponse> {
    return this.api.post<NewsletterResponse>('/newsletter/subscribe', {
      email,
      source: 'footer'
    });
  }

  brochureUrl(): string {
    return `${this.api.getBaseUrl()}/brochure`;
  }

  listAdminVideos(params: { q?: string; category?: string; tag?: string; published?: boolean; page?: number; size?: number; sort?: string }): Observable<PageResp<MarketingVideo>> {
    return this.api.getPageParams<MarketingVideo>('/admin/videos', params);
  }

  createAdminVideo(body: MarketingVideoUpsertRequest): Observable<MarketingVideo> {
    return this.api.post<MarketingVideo>('/admin/videos', body);
  }

  updateAdminVideo(id: string, body: MarketingVideoUpsertRequest): Observable<MarketingVideo> {
    return this.api.put<MarketingVideo>(`/admin/videos/${id}`, body);
  }

  deleteAdminVideo(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/videos/${id}`);
  }

  bulkPublishVideos(ids: string[], published: boolean): Observable<number> {
    return this.api.patch<number>('/admin/videos/bulk-publish', { ids, published });
  }

  listAdminLeads(params?: {
    q?: string;
    status?: string;
    source?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }): Observable<PageResp<MarketingLeadAdmin>> {
    return this.api.getPageParams<MarketingLeadAdmin>('/admin/leads', {
      q: params?.q,
      status: params?.status,
      source: params?.source,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      page: params?.page,
      size: params?.size
    });
  }

  getAdminLeadDashboard(params?: { fromDate?: string; toDate?: string }): Observable<MarketingLeadDashboard> {
    return this.api.getParams<MarketingLeadDashboard>('/admin/leads/dashboard', {
      fromDate: params?.fromDate,
      toDate: params?.toDate
    });
  }

  updateLeadStatus(id: string, status: string, note?: string): Observable<{ updated: boolean }> {
    return this.api.patch<{ updated: boolean }>(`/admin/leads/${id}/status`, { status, note });
  }

  listAdminFeatures(): Observable<MarketingFeature[]> {
    return this.api.get<MarketingFeature[]>('/admin/features');
  }

  createAdminFeature(body: MarketingFeatureUpsertRequest): Observable<MarketingFeature> {
    return this.api.post<MarketingFeature>('/admin/features', body);
  }

  updateAdminFeature(id: string, body: MarketingFeatureUpsertRequest): Observable<MarketingFeature> {
    return this.api.put<MarketingFeature>(`/admin/features/${id}`, body);
  }

  deleteAdminFeature(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/features/${id}`);
  }

  listAdminTestimonials(): Observable<MarketingTestimonial[]> {
    return this.api.get<MarketingTestimonial[]>('/admin/testimonials');
  }

  createAdminTestimonial(body: MarketingTestimonialUpsertRequest): Observable<MarketingTestimonial> {
    return this.api.post<MarketingTestimonial>('/admin/testimonials', body);
  }

  updateAdminTestimonial(id: string, body: MarketingTestimonialUpsertRequest): Observable<MarketingTestimonial> {
    return this.api.put<MarketingTestimonial>(`/admin/testimonials/${id}`, body);
  }

  deleteAdminTestimonial(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/testimonials/${id}`);
  }
}
