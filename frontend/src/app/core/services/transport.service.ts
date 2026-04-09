import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransportDriver, TransportRoute, TransportVehicle } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

/** Mutable mock fleet (same response shape as API). */
const MOCK_VEHICLES: TransportVehicle[] = [
  { id: 'v1', registrationNumber: 'BUS-001', vehicleType: 'BUS', capacity: 40, model: 'Volvo' },
  { id: 'v2', registrationNumber: 'VAN-014', vehicleType: 'VAN', capacity: 12, model: 'Force Traveller' }
];
const MOCK_DRIVERS: TransportDriver[] = [
  { id: 'd1', fullName: 'Mark Stevens', phone: '+91-9800011001', licenseNumber: 'DL042011009988' },
  { id: 'd2', fullName: 'Paul Walker', phone: '+91-9800011002', licenseNumber: 'DL042011009977' }
];
let MOCK_ROUTES: TransportRoute[] = [
  {
    id: 'tr1',
    name: 'Route A - North',
    vehicleNumber: 'BUS-001',
    driverName: 'Mark Stevens',
    driverPhone: '+91-9800011001',
    vehicleId: 'v1',
    driverId: 'd1',
    vehicleType: 'BUS',
    liveLatitude: 28.55,
    liveLongitude: 77.22,
    liveRecordedAt: new Date().toISOString(),
    stops: [
      { id: 's1', name: 'Main Gate', time: '07:00', order: 1 },
      { id: 's2', name: 'School', time: '07:50', order: 2 }
    ],
    assignedStudents: 42,
    students: [],
    tenantId: 't1'
  },
  {
    id: 'tr2',
    name: 'Route B - South',
    vehicleNumber: 'VAN-014',
    driverName: 'Paul Walker',
    driverPhone: '+91-9800011002',
    vehicleId: 'v2',
    driverId: 'd2',
    vehicleType: 'VAN',
    stops: [{ id: 's3', name: 'South Gate', time: '07:10', order: 1 }],
    assignedStudents: 12,
    students: [],
    tenantId: 't1'
  }
];

@Injectable({ providedIn: 'root' })
export class TransportService {
  constructor(private api: ApiService) {}

  listRoutes(): Observable<TransportRoute[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_ROUTES.map(r => ({ ...r, stops: r.stops.map(s => ({ ...s })) })));
    }
    return this.api.get<any[]>('/transport/routes').pipe(map(list => list.map(r => this.normalizeRoute(r))));
  }

  listVehicles(): Observable<TransportVehicle[]> {
    if (runtimeConfig.useMocks) {
      return of([...MOCK_VEHICLES]);
    }
    return this.api.get<any[]>('/transport/vehicles').pipe(
      map(list =>
        (list || []).map(v => ({
          id: String(v.id),
          registrationNumber: v.registrationNumber ?? '',
          vehicleType: (v.vehicleType ?? 'BUS').toString(),
          capacity: Number(v.capacity ?? 0),
          model: v.model ?? ''
        }))
      )
    );
  }

  listDrivers(): Observable<TransportDriver[]> {
    if (runtimeConfig.useMocks) {
      return of([...MOCK_DRIVERS]);
    }
    return this.api.get<any[]>('/transport/drivers').pipe(
      map(list =>
        (list || []).map(d => ({
          id: String(d.id),
          fullName: d.fullName ?? '',
          phone: d.phone ?? '',
          licenseNumber: d.licenseNumber ?? ''
        }))
      )
    );
  }

  createVehicle(body: { registrationNumber: string; vehicleType: string; capacity: number; model?: string }): Observable<TransportVehicle> {
    if (runtimeConfig.useMocks) {
      const v: TransportVehicle = {
        id: 'v' + Date.now(),
        registrationNumber: body.registrationNumber,
        vehicleType: body.vehicleType,
        capacity: body.capacity,
        model: body.model
      };
      MOCK_VEHICLES.push(v);
      return of(v);
    }
    return this.api.post<any>('/transport/vehicles', body).pipe(
      map(v => ({
        id: String(v.id),
        registrationNumber: v.registrationNumber ?? '',
        vehicleType: (v.vehicleType ?? 'BUS').toString(),
        capacity: Number(v.capacity ?? 0),
        model: v.model ?? ''
      }))
    );
  }

  createDriver(body: { fullName: string; phone?: string; licenseNumber?: string }): Observable<TransportDriver> {
    if (runtimeConfig.useMocks) {
      const d: TransportDriver = {
        id: 'd' + Date.now(),
        fullName: body.fullName,
        phone: body.phone ?? '',
        licenseNumber: body.licenseNumber
      };
      MOCK_DRIVERS.push(d);
      return of(d);
    }
    return this.api.post<any>('/transport/drivers', body).pipe(
      map(d => ({
        id: String(d.id),
        fullName: d.fullName ?? '',
        phone: d.phone ?? '',
        licenseNumber: d.licenseNumber ?? ''
      }))
    );
  }

  createRoute(body: {
    name: string;
    vehicleId?: string;
    driverId?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
  }): Observable<TransportRoute> {
    if (runtimeConfig.useMocks) {
      const v = body.vehicleId ? MOCK_VEHICLES.find(x => x.id === body.vehicleId) : undefined;
      const d = body.driverId ? MOCK_DRIVERS.find(x => x.id === body.driverId) : undefined;
      const r: TransportRoute = {
        id: 'tr' + Date.now(),
        name: body.name,
        vehicleNumber: v?.registrationNumber ?? body.vehicleNumber ?? '',
        driverName: d?.fullName ?? body.driverName ?? '',
        driverPhone: d?.phone ?? body.driverPhone ?? '',
        vehicleId: body.vehicleId,
        driverId: body.driverId,
        vehicleType: v?.vehicleType,
        stops: [],
        assignedStudents: 0,
        students: [],
        tenantId: 't1'
      };
      MOCK_ROUTES = [r, ...MOCK_ROUTES];
      return of({ ...r });
    }
    const payload: any = {
      name: body.name,
      vehicleNumber: body.vehicleNumber ?? null,
      driverName: body.driverName ?? null,
      driverPhone: body.driverPhone ?? null,
      vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
      driverId: body.driverId ? Number(body.driverId) : null
    };
    return this.api.post<any>('/transport/routes', payload).pipe(map(r => this.normalizeRoute(r)));
  }

  updateRoute(
    id: string,
    body: Partial<{ name: string; vehicleNumber: string; driverName: string; driverPhone: string; vehicleId: string; driverId: string }>
  ): Observable<TransportRoute> {
    if (runtimeConfig.useMocks) {
      const idx = MOCK_ROUTES.findIndex(r => r.id === id);
      if (idx === -1) return of({} as TransportRoute);
      const cur = MOCK_ROUTES[idx];
      const v = body.vehicleId ? MOCK_VEHICLES.find(x => x.id === body.vehicleId) : undefined;
      const d = body.driverId ? MOCK_DRIVERS.find(x => x.id === body.driverId) : undefined;
      const next: TransportRoute = {
        ...cur,
        name: body.name ?? cur.name,
        vehicleId: body.vehicleId ?? cur.vehicleId,
        driverId: body.driverId ?? cur.driverId,
        vehicleNumber: v?.registrationNumber ?? body.vehicleNumber ?? cur.vehicleNumber,
        driverName: d?.fullName ?? body.driverName ?? cur.driverName,
        driverPhone: d?.phone ?? body.driverPhone ?? cur.driverPhone,
        vehicleType: v?.vehicleType ?? cur.vehicleType
      };
      MOCK_ROUTES[idx] = next;
      return of({ ...next });
    }
    const payload: any = { ...body, vehicleId: body.vehicleId != null ? Number(body.vehicleId) : undefined, driverId: body.driverId != null ? Number(body.driverId) : undefined };
    return this.api.put<any>(`/transport/routes/${id}`, payload).pipe(map(r => this.normalizeRoute(r)));
  }

  deleteRoute(id: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      MOCK_ROUTES = MOCK_ROUTES.filter(r => r.id !== id);
      return of(undefined);
    }
    return this.api.delete<void>(`/transport/routes/${id}`);
  }

  addStop(body: { routeId: string; name: string; stopOrder: number; stopTime?: string }): Observable<{ id: string }> {
    if (runtimeConfig.useMocks) {
      const route = MOCK_ROUTES.find(r => r.id === body.routeId);
      if (route) {
        const sid = 'stop-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
        route.stops = [...route.stops, { id: sid, name: body.name, time: body.stopTime || '', order: body.stopOrder }];
      }
      return of({ id: 'stop-new' });
    }
    const rid = Number(body.routeId);
    if (!Number.isFinite(rid)) {
      return of({ id: '' });
    }
    const payload: any = {
      routeId: rid,
      name: body.name,
      stopOrder: body.stopOrder,
      stopTime: body.stopTime || null
    };
    return this.api.post<{ id?: number }>('/transport/stops', payload).pipe(map(s => ({ id: String(s?.id ?? '') })));
  }

  updateStop(
    stopId: string,
    body: Partial<{ name: string; stopOrder: number; stopTime: string }>
  ): Observable<void> {
    if (runtimeConfig.useMocks) {
      const sid = stopId;
      MOCK_ROUTES.forEach(route => {
        route.stops = route.stops.map(s => {
          if (s.id !== sid) return s;
          return {
            ...s,
            name: body.name ?? s.name,
            order: body.stopOrder != null ? body.stopOrder : s.order,
            time: body.stopTime != null ? body.stopTime : s.time
          };
        });
      });
      return of(undefined);
    }
    const id = Number(stopId);
    if (!Number.isFinite(id)) return of(undefined);
    const payload: Record<string, unknown> = {};
    if (body.name != null) payload.name = body.name;
    if (body.stopOrder != null) payload.stopOrder = body.stopOrder;
    if (body.stopTime != null) payload.stopTime = body.stopTime;
    return this.api.put<unknown>(`/transport/stops/${id}`, payload).pipe(map(() => void 0));
  }

  removeStop(stopId: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      MOCK_ROUTES.forEach(r => {
        r.stops = r.stops.filter(s => s.id !== stopId);
      });
      return of(undefined);
    }
    return this.api.delete<void>(`/transport/stops/${stopId}`);
  }

  assignStudent(body: { routeId: string; studentId: string; studentName?: string; pickupStop?: string; dropStop?: string }): Observable<void> {
    if (runtimeConfig.useMocks) {
      const route = MOCK_ROUTES.find(r => r.id === body.routeId);
      if (route) {
        route.students = [
          ...(route.students || []),
          {
            id: 'm' + Date.now(),
            studentId: body.studentId,
            studentName: body.studentName ?? '',
            pickupStop: body.pickupStop,
            dropStop: body.dropStop
          }
        ];
        route.assignedStudents = route.students.length;
      }
      return of(undefined);
    }
    return this.api.post<void>('/transport/assign-student', {
      routeId: Number(body.routeId),
      studentId: Number(body.studentId),
      studentName: body.studentName,
      pickupStop: body.pickupStop,
      dropStop: body.dropStop
    });
  }

  removeStudentMapping(mappingId: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      MOCK_ROUTES.forEach(r => {
        if (r.students) {
          r.students = r.students.filter(m => m.id !== mappingId);
          r.assignedStudents = r.students.length;
        }
      });
      return of(undefined);
    }
    return this.api.delete<void>(`/transport/student-mapping/${mappingId}`);
  }

  /** Admin / simulator: push a GPS point for map widgets. */
  reportVehicleLocation(vehicleId: string, lat: number, lng: number, routeId?: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      MOCK_ROUTES.filter(r => r.vehicleId === vehicleId).forEach(r => {
        r.liveLatitude = lat;
        r.liveLongitude = lng;
        r.liveRecordedAt = new Date().toISOString();
      });
      return of(undefined);
    }
    let q = `lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`;
    if (routeId) q += `&routeId=${encodeURIComponent(routeId)}`;
    return this.api.post<unknown>(`/transport/vehicles/${vehicleId}/location?${q}`, {}).pipe(map(() => undefined));
  }

  private normalizeRoute(r: any): TransportRoute {
    const stops = (r.stops ?? []).map((s: any) => ({
      id: s.id != null ? String(s.id) : undefined,
      name: s.name ?? '',
      time: s.time ?? '',
      order: Number(s.order ?? 0)
    }));
    const students = (r.students ?? []).map((m: any) => ({
      id: String(m.id),
      studentId: String(m.studentId),
      studentName: m.studentName ?? '',
      pickupStop: m.pickupStop,
      dropStop: m.dropStop
    }));
    return {
      id: String(r.id),
      name: r.name ?? '',
      vehicleNumber: r.vehicleNumber ?? '',
      driverName: r.driverName ?? '',
      driverPhone: r.driverPhone ?? '',
      vehicleId: r.vehicleId != null ? String(r.vehicleId) : undefined,
      driverId: r.driverId != null ? String(r.driverId) : undefined,
      vehicleType: r.vehicleType ?? undefined,
      liveLatitude: r.liveLatitude != null ? Number(r.liveLatitude) : undefined,
      liveLongitude: r.liveLongitude != null ? Number(r.liveLongitude) : undefined,
      liveRecordedAt: r.liveRecordedAt ?? undefined,
      stops,
      assignedStudents: Number(r.assignedStudents ?? students.length ?? 0),
      students,
      tenantId: r.tenantId ?? ''
    };
  }
}
