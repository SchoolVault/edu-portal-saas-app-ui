import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HostelBuilding, HostelResident, HostelRoom } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

export interface HostelStats {
  totalRooms: number;
  totalCapacity: number;
  totalOccupancy: number;
  availableBeds: number;
  blocks: number;
}

let MOCK_BUILDINGS: HostelBuilding[] = [
  { id: 'h1', name: 'Boys Hostel BH1', code: 'BH1', genderScope: 'MALE', roomCount: 2, availableBeds: 3 },
  { id: 'h2', name: 'Boys Hostel BH2', code: 'BH2', genderScope: 'MALE', roomCount: 1, availableBeds: 2 },
  { id: 'h3', name: 'Girls Hostel GH1', code: 'GH1', genderScope: 'FEMALE', roomCount: 1, availableBeds: 1 }
];

let MOCK_ROOMS: HostelRoom[] = [
  {
    id: 'hr1',
    roomNumber: 'A-101',
    block: 'Block A',
    floor: 1,
    capacity: 4,
    occupancy: 3,
    type: 'four',
    hostelId: 'h1',
    hostelName: 'Boys Hostel BH1',
    tenantId: 't1',
    residents: [
      { allocationId: 'ha1', studentId: '1', studentName: 'Alex Kumar' },
      { allocationId: 'ha2', studentId: '2', studentName: 'Ben Lee' },
      { allocationId: 'ha3', studentId: '3', studentName: 'Chris Park' }
    ]
  },
  {
    id: 'hr2',
    roomNumber: 'A-102',
    block: 'Block A',
    floor: 1,
    capacity: 2,
    occupancy: 2,
    type: 'double',
    hostelId: 'h1',
    hostelName: 'Boys Hostel BH1',
    tenantId: 't1',
    residents: [
      { allocationId: 'ha4', studentId: '4', studentName: 'Dan Ross' },
      { allocationId: 'ha5', studentId: '5', studentName: 'Evan Singh' }
    ]
  },
  {
    id: 'hr3',
    roomNumber: 'B-101',
    block: 'Block B',
    floor: 1,
    capacity: 1,
    occupancy: 0,
    type: 'single',
    hostelId: 'h2',
    hostelName: 'Boys Hostel BH2',
    tenantId: 't1',
    residents: []
  }
];

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

  allocate(body: { roomId: string; studentId: string; studentName?: string; fromDate?: string; toDate?: string }): Observable<void> {
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
      studentId: Number(body.studentId),
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

  private normalizeRoom(r: any): HostelRoom {
    const residents = (r.residents ?? []).map((a: any) => ({
      allocationId: String(a.id),
      studentId: String(a.studentId),
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
}
