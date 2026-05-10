import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_HOSTEL_BUILDINGS_SEED, MOCK_HOSTEL_ROOMS_SEED } from '../mocks/hostel.mock-data';
import {
  HostelBillingProfile,
  HostelBillingRunResult,
  HostelBuilding,
  HostelGatePass,
  HostelIncident,
  HostelBookingRequest,
  HostelPortalProfile,
  HostelResident,
  HostelRoom,
  HostelVisitorEntry
} from '../models/models';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

export interface HostelStats {
  totalRooms: number;
  totalCapacity: number;
  totalOccupancy: number;
  availableBeds: number;
  blocks: number;
}

export interface HostelAnalyticsSnapshot {
  occupancyPct: number;
  overcrowdedRooms: number;
  nearCapacityRooms: number;
  openIncidents: number;
  escalatedIncidents: number;
  avgIncidentSlaMinutes: number;
}

let MOCK_BUILDINGS: HostelBuilding[] = MOCK_HOSTEL_BUILDINGS_SEED.map(b => ({ ...b }));

let MOCK_ROOMS: HostelRoom[] = MOCK_HOSTEL_ROOMS_SEED.map(r => ({
  ...r,
  residents: (r.residents || []).map(x => ({ ...x })),
}));

function recomputeMockStats(): HostelStats {
  const totalRooms = MOCK_ROOMS.length;
  const totalCapacity = MOCK_ROOMS.reduce((s, r) => s + r.capacity, 0);
  const totalOccupancy = MOCK_ROOMS.reduce((s, r) => s + r.occupancy, 0);
  const blocks = new Set(MOCK_ROOMS.map(r => r.block)).size;
  return {
    totalRooms,
    totalCapacity,
    totalOccupancy,
    availableBeds: totalCapacity - totalOccupancy,
    blocks
  };
}

function syncBuildingCounts(): void {
  for (const b of MOCK_BUILDINGS) {
    const rooms = MOCK_ROOMS.filter(r => r.hostelId === b.id);
    b.roomCount = rooms.length;
    b.availableBeds = rooms.reduce((s, r) => s + Math.max(0, r.capacity - r.occupancy), 0);
  }
}

@Injectable({ providedIn: 'root' })
export class HostelService {
  constructor(private api: ApiService) {}

  listBuildings(): Observable<HostelBuilding[]> {
    if (runtimeConfig.useMocks) {
      syncBuildingCounts();
      return of(MOCK_BUILDINGS.map(b => ({ ...b })));
    }
    return this.api.get<any[]>('/hostel/buildings').pipe(
      map(list =>
        (list || []).map(b => ({
          id: String(b.id),
          name: b.name ?? '',
          code: b.code ?? '',
          genderScope: b.genderScope ?? '',
          roomCount: Number(b.roomCount ?? 0),
          availableBeds: Number(b.availableBeds ?? 0)
        }))
      )
    );
  }

  createBuilding(body: { name: string; code?: string; genderScope?: string }): Observable<HostelBuilding> {
    if (runtimeConfig.useMocks) {
      const b: HostelBuilding = {
        id: 'h' + Date.now(),
        name: body.name,
        code: body.code ?? '',
        genderScope: body.genderScope,
        roomCount: 0,
        availableBeds: 0
      };
      MOCK_BUILDINGS = [...MOCK_BUILDINGS, b];
      return of(b);
    }
    return this.api.post<any>('/hostel/buildings', body).pipe(
      map(b => ({
        id: String(b.id),
        name: b.name ?? '',
        code: b.code ?? '',
        genderScope: b.genderScope ?? '',
        roomCount: Number(b.roomCount ?? 0),
        availableBeds: Number(b.availableBeds ?? 0)
      }))
    );
  }

  listRooms(): Observable<HostelRoom[]> {
    if (runtimeConfig.useMocks) {
      syncBuildingCounts();
      return of(MOCK_ROOMS.map(r => ({ ...r, residents: (r.residents || []).map(x => ({ ...x })) })));
    }
    return this.api.get<any[]>('/hostel/rooms').pipe(map(list => list.map(r => this.normalizeRoom(r))));
  }

  listRoomsPaged(opts: { page?: number; size?: number }): Observable<PageResp<HostelRoom>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/hostel/rooms/paged', { page, size })
        .pipe(map(p => ({ ...p, content: p.content.map((r: any) => this.normalizeRoom(r)) })));
    }
    return this.listRooms().pipe(
      map(rows => sliceToPage(rows ?? [], page, size)),
      delay(200)
    );
  }

  getAnalyticsSnapshot(): Observable<HostelAnalyticsSnapshot> {
    if (runtimeConfig.useMocks) {
      return of({
        occupancyPct: 72,
        overcrowdedRooms: 1,
        nearCapacityRooms: 3,
        openIncidents: 2,
        escalatedIncidents: 1,
        avgIncidentSlaMinutes: 118,
      });
    }
    return this.api.get<any>('/hostel/analytics/snapshot').pipe(
      map(r => ({
        occupancyPct: Number(r.occupancyPct ?? 0),
        overcrowdedRooms: Number(r.overcrowdedRooms ?? 0),
        nearCapacityRooms: Number(r.nearCapacityRooms ?? 0),
        openIncidents: Number(r.openIncidents ?? 0),
        escalatedIncidents: Number(r.escalatedIncidents ?? 0),
        avgIncidentSlaMinutes: Number(r.avgIncidentSlaMinutes ?? 0),
      }))
    );
  }

  listOccupancyRecommendations(): Observable<Array<{
    fromRoomId: string;
    fromRoomNumber: string;
    toRoomId: string;
    toRoomNumber: string;
    occupancyPressureDiff: number;
    rationale: string;
  }>> {
    if (runtimeConfig.useMocks) {
      return of([]);
    }
    return this.api.get<any[]>('/hostel/occupancy/recommendations').pipe(
      map(rows => (rows || []).map(r => ({
        fromRoomId: String(r.fromRoomId),
        fromRoomNumber: r.fromRoomNumber ?? '',
        toRoomId: String(r.toRoomId),
        toRoomNumber: r.toRoomNumber ?? '',
        occupancyPressureDiff: Number(r.occupancyPressureDiff ?? 0),
        rationale: r.rationale ?? '',
      })))
    );
  }

  exportAnalyticsCsv(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      return of(new Blob(['metric,value\noccupancy_pct,0\n'], { type: 'text/csv;charset=UTF-8' }));
    }
    return this.api.getBlob('/hostel/analytics/export.csv');
  }

  exportAnalyticsPdf(): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      return of(new Blob(['Hostel analytics export'], { type: 'application/pdf' }));
    }
    return this.api.getBlob('/hostel/analytics/export.pdf');
  }

  listIncidentPolicies(): Observable<Array<{
    id?: string;
    incidentType: string;
    severity: string;
    slaMinutes: number;
    escalationAfterMinutes: number;
  }>> {
    if (runtimeConfig.useMocks) {
      return of([]);
    }
    return this.api.get<any[]>('/hostel/incidents/policies').pipe(
      map(rows => (rows || []).map(r => ({
        id: r.id != null ? String(r.id) : undefined,
        incidentType: r.incidentType ?? '',
        severity: r.severity ?? 'MEDIUM',
        slaMinutes: Number(r.slaMinutes ?? 0),
        escalationAfterMinutes: Number(r.escalationAfterMinutes ?? 0),
      })))
    );
  }

  upsertIncidentPolicy(body: {
    incidentType: string;
    severity: string;
    slaMinutes: number;
    escalationAfterMinutes: number;
  }): Observable<void> {
    if (runtimeConfig.useMocks) {
      return of(undefined);
    }
    return this.api.put<unknown>('/hostel/incidents/policies', body).pipe(map(() => undefined));
  }

  stats(): Observable<HostelStats> {
    if (runtimeConfig.useMocks) {
      return of(recomputeMockStats());
    }
    return this.api.get<HostelStats>('/hostel/stats');
  }

  createRoom(body: {
    hostelId?: string;
    roomNumber: string;
    block: string;
    floor: number;
    capacity: number;
    roomType: string;
  }): Observable<HostelRoom> {
    if (runtimeConfig.useMocks) {
      const hb = MOCK_BUILDINGS.find(x => x.id === body.hostelId);
      const room: HostelRoom = {
        id: 'hr' + Date.now(),
        roomNumber: body.roomNumber,
        block: body.block,
        floor: body.floor,
        capacity: body.capacity,
        occupancy: 0,
        type: body.roomType,
        hostelId: body.hostelId,
        hostelName: hb?.name,
        residents: [],
        tenantId: 't1'
      };
      MOCK_ROOMS = [...MOCK_ROOMS, room];
      syncBuildingCounts();
      return of({ ...room });
    }
    const payload: any = { ...body, occupancy: 0 };
    if (body.hostelId) payload.hostelId = Number(body.hostelId);
    return this.api.post<any>('/hostel/rooms', payload).pipe(map(r => this.normalizeRoom(r)));
  }

  updateRoom(
    roomId: string,
    body: {
      hostelId?: string;
      roomNumber?: string;
      block?: string;
      floor?: number;
      capacity?: number;
      roomType?: string;
    }
  ): Observable<HostelRoom> {
    if (runtimeConfig.useMocks) {
      const room = MOCK_ROOMS.find(r => r.id === roomId);
      if (!room) {
        return of({} as HostelRoom);
      }
      if (body.hostelId != null && body.hostelId !== '') {
        room.hostelId = body.hostelId;
        room.hostelName = MOCK_BUILDINGS.find(b => b.id === body.hostelId)?.name;
      }
      if (body.roomNumber != null && body.roomNumber.trim()) room.roomNumber = body.roomNumber.trim();
      if (body.block != null) room.block = body.block.trim();
      if (body.floor != null && !Number.isNaN(Number(body.floor))) room.floor = Number(body.floor);
      if (body.roomType != null && body.roomType.trim()) {
        room.type = body.roomType.trim().toLowerCase();
      }
      if (body.capacity != null && !Number.isNaN(Number(body.capacity))) {
        const cap = Number(body.capacity);
        if (cap < room.occupancy) {
          return of({ ...room });
        }
        room.capacity = cap;
      }
      syncBuildingCounts();
      return of({ ...room, residents: (room.residents || []).map(x => ({ ...x })) });
    }
    const payload: Record<string, unknown> = {};
    if (body.hostelId != null && body.hostelId !== '') payload.hostelId = Number(body.hostelId);
    if (body.roomNumber != null) payload.roomNumber = body.roomNumber;
    if (body.block != null) payload.block = body.block;
    if (body.floor != null) payload.floor = body.floor;
    if (body.capacity != null) payload.capacity = body.capacity;
    if (body.roomType != null) payload.roomType = body.roomType;
    return this.api.put<any>(`/hostel/rooms/${roomId}`, payload).pipe(map(r => this.normalizeRoom(r)));
  }

  allocate(body: { roomId: string; studentId: number; studentName?: string; fromDate?: string; toDate?: string }): Observable<void> {
    if (runtimeConfig.useMocks) {
      const room = MOCK_ROOMS.find(r => r.id === body.roomId);
      if (!room || room.occupancy >= room.capacity) {
        return of(undefined);
      }
      const allocationId = 'ha' + Date.now();
      const nextResidents: HostelResident[] = [
        ...(room.residents || []),
        {
          allocationId,
          studentId: body.studentId,
          studentName: body.studentName ?? 'Student',
          fromDate: body.fromDate,
          toDate: body.toDate
        }
      ];
      room.residents = nextResidents;
      room.occupancy = nextResidents.length;
      syncBuildingCounts();
      return of(undefined);
    }
    return this.api.post<void>('/hostel/allocate', {
      roomId: Number(body.roomId),
      studentId: body.studentId,
      studentName: body.studentName,
      fromDate: body.fromDate || null,
      toDate: body.toDate || null
    });
  }

  vacate(allocationId: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      for (const room of MOCK_ROOMS) {
        if (!room.residents?.length) continue;
        const next = room.residents.filter(r => r.allocationId !== allocationId);
        if (next.length !== room.residents.length) {
          room.residents = next;
          room.occupancy = next.length;
          break;
        }
      }
      syncBuildingCounts();
      return of(undefined);
    }
    return this.api.put<void>(`/hostel/vacate/${allocationId}`, {});
  }

  transfer(allocationId: string, body: { targetRoomId: string; effectiveDate?: string; reason?: string }): Observable<void> {
    if (runtimeConfig.useMocks) {
      let moved: HostelResident | null = null;
      for (const room of MOCK_ROOMS) {
        const residents = room.residents || [];
        const idx = residents.findIndex(r => r.allocationId === allocationId);
        if (idx >= 0) {
          moved = { ...residents[idx] };
          residents.splice(idx, 1);
          room.residents = residents;
          room.occupancy = residents.length;
          break;
        }
      }
      if (!moved) {
        return of(undefined);
      }
      const target = MOCK_ROOMS.find(r => r.id === body.targetRoomId);
      if (!target || target.occupancy >= target.capacity) {
        return of(undefined);
      }
      const nextAllocationId = 'ha' + Date.now();
      target.residents = [
        ...(target.residents || []),
        {
          ...moved,
          allocationId: nextAllocationId,
          fromDate: body.effectiveDate || moved.fromDate,
        },
      ];
      target.occupancy = target.residents.length;
      syncBuildingCounts();
      return of(undefined);
    }
    return this.api.put<void>(`/hostel/transfer/${allocationId}`, {
      targetRoomId: Number(body.targetRoomId),
      effectiveDate: body.effectiveDate || null,
      reason: body.reason || null,
    });
  }

  private normalizeRoom(r: any): HostelRoom {
    const residents = (r.residents ?? []).map((a: any) => ({
      allocationId: String(a.id ?? a.allocationId),
      studentId: Number(a.studentId),
      studentName: a.studentName ?? '',
      fromDate: a.fromDate,
      toDate: a.toDate
    }));
    return {
      id: String(r.id),
      roomNumber: r.roomNumber ?? '',
      block: r.block ?? '',
      floor: Number(r.floor ?? 0),
      capacity: Number(r.capacity ?? 0),
      occupancy: Number(r.occupancy ?? 0),
      type: (r.roomType ?? r.type ?? 'dormitory').toString().toLowerCase(),
      hostelId: r.hostelId != null ? String(r.hostelId) : undefined,
      hostelName: r.hostelName ?? undefined,
      residents,
      tenantId: r.tenantId ?? ''
    };
  }

  listBillingProfiles(): Observable<HostelBillingProfile[]> {
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<any[]>('/hostel/billing/profiles').pipe(
      map(rows => (rows || []).map(r => this.normalizeBillingProfile(r)))
    );
  }

  upsertBillingProfile(body: HostelBillingProfile): Observable<HostelBillingProfile> {
    if (runtimeConfig.useMocks) return of({ ...body });
    return this.api.put<any>('/hostel/billing/profiles', body).pipe(map(r => this.normalizeBillingProfile(r)));
  }

  triggerBillingRun(body?: { dueDate?: string; includeDisabled?: boolean; note?: string }): Observable<HostelBillingRunResult> {
    if (runtimeConfig.useMocks) {
      return of({
        runRef: 'hostel-billing-mock-' + Date.now(),
        queuedProfiles: 0,
        dueDate: body?.dueDate || new Date().toISOString().slice(0, 10),
        note: body?.note,
      });
    }
    return this.api.post<any>('/hostel/billing/runs', body || {}).pipe(
      map(r => ({
        runRef: String(r.runRef ?? ''),
        queuedProfiles: Number(r.queuedProfiles ?? 0),
        dueDate: String(r.dueDate ?? ''),
        note: r.note ?? undefined,
      }))
    );
  }

  listGatePasses(status?: string): Observable<HostelGatePass[]> {
    const qp = status ? `?status=${encodeURIComponent(status)}` : '';
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<any[]>(`/hostel/gate-passes${qp}`).pipe(map(rows => (rows || []).map(r => this.normalizeGatePass(r))));
  }

  createGatePass(body: {
    studentId: number;
    studentName?: string;
    requestType?: string;
    reason?: string;
    outAt?: string;
    expectedInAt?: string;
  }): Observable<HostelGatePass> {
    if (runtimeConfig.useMocks) {
      return of({
        id: String(Date.now()),
        studentId: body.studentId,
        studentName: body.studentName,
        requestType: body.requestType || 'LEAVE_OUT',
        status: 'PENDING',
        reason: body.reason,
        outAt: body.outAt,
        expectedInAt: body.expectedInAt,
      });
    }
    return this.api.post<any>('/hostel/gate-passes', body).pipe(map(r => this.normalizeGatePass(r)));
  }

  approveGatePass(id: string, note?: string): Observable<HostelGatePass> {
    if (runtimeConfig.useMocks) return of({ id, studentId: 0, requestType: 'LEAVE_OUT', status: 'APPROVED' });
    return this.api.put<any>(`/hostel/gate-passes/${id}/approve`, { note: note || null }).pipe(map(r => this.normalizeGatePass(r)));
  }

  rejectGatePass(id: string, note?: string): Observable<HostelGatePass> {
    if (runtimeConfig.useMocks) return of({ id, studentId: 0, requestType: 'LEAVE_OUT', status: 'REJECTED' });
    return this.api.put<any>(`/hostel/gate-passes/${id}/reject`, { note: note || null }).pipe(map(r => this.normalizeGatePass(r)));
  }

  returnGatePass(id: string): Observable<HostelGatePass> {
    if (runtimeConfig.useMocks) return of({ id, studentId: 0, requestType: 'LEAVE_OUT', status: 'RETURNED' });
    return this.api.put<any>(`/hostel/gate-passes/${id}/return`, {}).pipe(map(r => this.normalizeGatePass(r)));
  }

  listVisitors(status?: string): Observable<HostelVisitorEntry[]> {
    const qp = status ? `?status=${encodeURIComponent(status)}` : '';
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<any[]>(`/hostel/visitors${qp}`).pipe(map(rows => (rows || []).map(r => this.normalizeVisitor(r))));
  }

  createVisitor(body: {
    studentId: number;
    studentName?: string;
    visitorName?: string;
    relationLabel?: string;
    visitorPhone?: string;
    purpose?: string;
    checkInAt?: string;
  }): Observable<HostelVisitorEntry> {
    if (runtimeConfig.useMocks) return of({ id: String(Date.now()), studentId: body.studentId, status: 'PENDING', studentName: body.studentName });
    return this.api.post<any>('/hostel/visitors', body).pipe(map(r => this.normalizeVisitor(r)));
  }

  approveVisitor(id: string, note?: string): Observable<HostelVisitorEntry> {
    if (runtimeConfig.useMocks) return of({ id, studentId: 0, status: 'APPROVED' });
    return this.api.put<any>(`/hostel/visitors/${id}/approve`, { note: note || null }).pipe(map(r => this.normalizeVisitor(r)));
  }

  rejectVisitor(id: string, note?: string): Observable<HostelVisitorEntry> {
    if (runtimeConfig.useMocks) return of({ id, studentId: 0, status: 'REJECTED' });
    return this.api.put<any>(`/hostel/visitors/${id}/reject`, { note: note || null }).pipe(map(r => this.normalizeVisitor(r)));
  }

  checkoutVisitor(id: string): Observable<HostelVisitorEntry> {
    if (runtimeConfig.useMocks) return of({ id, studentId: 0, status: 'CHECKED_OUT' });
    return this.api.put<any>(`/hostel/visitors/${id}/checkout`, {}).pipe(map(r => this.normalizeVisitor(r)));
  }

  listIncidents(studentId?: number): Observable<HostelIncident[]> {
    const qp = studentId != null ? `?studentId=${encodeURIComponent(String(studentId))}` : '';
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<any[]>(`/hostel/incidents${qp}`).pipe(map(rows => (rows || []).map(r => this.normalizeIncident(r))));
  }

  createIncident(body: {
    studentId?: number;
    studentName?: string;
    incidentType?: string;
    severity?: string;
    summary?: string;
    occurredAt?: string;
  }): Observable<HostelIncident> {
    if (runtimeConfig.useMocks) {
      return of({
        id: String(Date.now()),
        studentId: body.studentId,
        studentName: body.studentName,
        incidentType: body.incidentType || 'GENERAL',
        severity: body.severity || 'MEDIUM',
        status: 'OPEN',
        summary: body.summary,
        occurredAt: body.occurredAt || new Date().toISOString(),
      });
    }
    return this.api.post<any>('/hostel/incidents', body).pipe(map(r => this.normalizeIncident(r)));
  }

  escalateIncident(id: string, body?: { escalationLevel?: string; note?: string }): Observable<HostelIncident> {
    if (runtimeConfig.useMocks) return of({ id, status: 'ESCALATED' });
    return this.api.put<any>(`/hostel/incidents/${id}/escalate`, body || {}).pipe(map(r => this.normalizeIncident(r)));
  }

  resolveIncident(id: string, body?: { note?: string; resolutionReason?: string }): Observable<HostelIncident> {
    if (runtimeConfig.useMocks) return of({ id, status: 'RESOLVED', resolutionNote: body?.note, resolutionReason: body?.resolutionReason });
    return this.api.put<any>(`/hostel/incidents/${id}/resolve`, body || {}).pipe(map(r => this.normalizeIncident(r)));
  }

  listIncidentResolutionReasons(): Observable<string[]> {
    if (runtimeConfig.useMocks) {
      return of([
        'MEDICAL_HANDLED',
        'DISCIPLINE_COUNSELLED',
        'FALSE_ALARM',
        'PARENT_INFORMED',
        'FACILITY_FIXED',
        'EXTERNAL_SUPPORT_CLOSED',
        'OTHER',
      ]);
    }
    return this.api.get<string[]>('/hostel/incidents/resolution-reasons');
  }

  getParentPortalProfile(studentId: number): Observable<HostelPortalProfile> {
    if (runtimeConfig.useMocks) {
      return of({
        studentId,
        studentName: 'Student',
        hostelName: 'Hostel',
        roomNumber: '101',
      });
    }
    return this.api.get<any>(`/hostel/portal/children/${studentId}/profile`).pipe(map(r => this.normalizePortalProfile(r)));
  }

  getStudentPortalProfile(): Observable<HostelPortalProfile> {
    if (runtimeConfig.useMocks) {
      return of({
        studentId: 0,
        studentName: 'Student',
      });
    }
    return this.api.get<any>('/hostel/portal/me/profile').pipe(map(r => this.normalizePortalProfile(r)));
  }

  createBookingRequest(body: {
    studentId: number;
    preferredHostelId?: number;
    preferredRoomType?: string;
    requestNote?: string;
  }): Observable<HostelBookingRequest> {
    if (runtimeConfig.useMocks) {
      return of({
        id: String(Date.now()),
        studentId: body.studentId,
        preferredHostelId: body.preferredHostelId,
        preferredRoomType: body.preferredRoomType,
        requestNote: body.requestNote,
        status: 'PENDING',
      });
    }
    return this.api.post<any>('/hostel/portal/bookings', body).pipe(map(r => this.normalizeBooking(r)));
  }

  listMyBookings(): Observable<HostelBookingRequest[]> {
    if (runtimeConfig.useMocks) return of([]);
    return this.api.get<any[]>('/hostel/portal/bookings').pipe(map(rows => (rows || []).map(r => this.normalizeBooking(r))));
  }

  listBookingsPaged(opts: {
    status?: string;
    studentId?: number;
    query?: string;
    page?: number;
    size?: number;
  }): Observable<PageResp<HostelBookingRequest>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (runtimeConfig.useMocks) {
      return this.listMyBookings().pipe(map(rows => sliceToPage(rows ?? [], page, size)));
    }
    return this.api.getPageParams<any>('/hostel/bookings/paged', {
      status: opts.status,
      studentId: opts.studentId,
      query: opts.query,
      page,
      size,
    }).pipe(map(p => ({ ...p, content: (p.content || []).map((r: any) => this.normalizeBooking(r)) })));
  }

  approveBooking(id: string, body: { roomId: string; decisionNote?: string }): Observable<HostelBookingRequest> {
    if (runtimeConfig.useMocks) {
      return of({
        id,
        studentId: 0,
        status: 'APPROVED',
        decisionNote: body.decisionNote,
      });
    }
    return this.api.put<any>(`/hostel/bookings/${id}/approve`, {
      roomId: Number(body.roomId),
      decisionNote: body.decisionNote || null,
    }).pipe(map(r => this.normalizeBooking(r)));
  }

  rejectBooking(id: string, body?: { note?: string }): Observable<HostelBookingRequest> {
    if (runtimeConfig.useMocks) {
      return of({
        id,
        studentId: 0,
        status: 'REJECTED',
        decisionNote: body?.note,
      });
    }
    return this.api.put<any>(`/hostel/bookings/${id}/reject`, body || {}).pipe(map(r => this.normalizeBooking(r)));
  }

  private normalizeBillingProfile(r: any): HostelBillingProfile {
    return {
      id: r.id != null ? String(r.id) : undefined,
      studentId: Number(r.studentId),
      studentName: r.studentName ?? '',
      feeStructureId: Number(r.feeStructureId ?? 0),
      billingCadence: String(r.billingCadence ?? 'MONTHLY'),
      depositAmount: r.depositAmount != null ? Number(r.depositAmount) : null,
      messChargeAmount: r.messChargeAmount != null ? Number(r.messChargeAmount) : null,
      autoInvoiceEnabled: !!r.autoInvoiceEnabled,
      lastInvoiceDate: r.lastInvoiceDate ?? null,
      nextDueDate: r.nextDueDate ?? null,
    };
  }

  private normalizeGatePass(r: any): HostelGatePass {
    return {
      id: String(r.id),
      studentId: Number(r.studentId ?? 0),
      studentName: r.studentName ?? '',
      requestType: String(r.requestType ?? 'LEAVE_OUT'),
      status: String(r.status ?? 'PENDING'),
      reason: r.reason ?? undefined,
      outAt: r.outAt ?? undefined,
      expectedInAt: r.expectedInAt ?? undefined,
      actualInAt: r.actualInAt ?? undefined,
      approvalNote: r.approvalNote ?? undefined,
    };
  }

  private normalizeVisitor(r: any): HostelVisitorEntry {
    return {
      id: String(r.id),
      studentId: Number(r.studentId ?? 0),
      studentName: r.studentName ?? '',
      visitorName: r.visitorName ?? undefined,
      relationLabel: r.relationLabel ?? undefined,
      visitorPhone: r.visitorPhone ?? undefined,
      purpose: r.purpose ?? undefined,
      status: String(r.status ?? 'PENDING'),
      checkInAt: r.checkInAt ?? undefined,
      checkOutAt: r.checkOutAt ?? undefined,
      approvalNote: r.approvalNote ?? undefined,
    };
  }

  private normalizeIncident(r: any): HostelIncident {
    return {
      id: String(r.id),
      studentId: r.studentId != null ? Number(r.studentId) : undefined,
      studentName: r.studentName ?? undefined,
      incidentType: r.incidentType ?? undefined,
      severity: r.severity ?? undefined,
      status: r.status ?? undefined,
      summary: r.summary ?? undefined,
      occurredAt: r.occurredAt ?? undefined,
      escalatedAt: r.escalatedAt ?? undefined,
      escalationLevel: r.escalationLevel ?? undefined,
      resolutionNote: r.resolutionNote ?? undefined,
      resolutionReason: r.resolutionReason ?? undefined,
      slaDueAt: r.slaDueAt ?? undefined,
    };
  }

  private normalizePortalProfile(r: any): HostelPortalProfile {
    return {
      studentId: Number(r.studentId ?? 0),
      studentName: String(r.studentName ?? ''),
      hostelName: r.hostelName ?? undefined,
      roomNumber: r.roomNumber ?? undefined,
      roomType: r.roomType ?? undefined,
      occupancyLabel: r.occupancyLabel ?? undefined,
      billingCadence: r.billingCadence ?? undefined,
      nextDueDate: r.nextDueDate ?? undefined,
      activeGatePassStatus: r.activeGatePassStatus ?? undefined,
    };
  }

  private normalizeBooking(r: any): HostelBookingRequest {
    return {
      id: String(r.id),
      studentId: Number(r.studentId ?? 0),
      studentName: r.studentName ?? undefined,
      parentUserId: r.parentUserId != null ? Number(r.parentUserId) : undefined,
      preferredHostelId: r.preferredHostelId != null ? Number(r.preferredHostelId) : undefined,
      preferredRoomType: r.preferredRoomType ?? undefined,
      status: r.status ?? undefined,
      requestNote: r.requestNote ?? undefined,
      decisionNote: r.decisionNote ?? undefined,
      approvedAllocationId: r.approvedAllocationId != null ? Number(r.approvedAllocationId) : undefined,
      createdAt: r.createdAt ?? undefined,
    };
  }
}
