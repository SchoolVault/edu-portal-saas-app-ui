import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MOCK_TRANSPORT_DRIVERS_SEED,
  MOCK_TRANSPORT_ROUTES_SEED,
  MOCK_TRANSPORT_VEHICLES_SEED,
} from '../mocks/transport.mock-data';
import { TransportDriver, TransportRoute, TransportVehicle } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

/** Mutable mock fleet (same response shape as API). */
let MOCK_VEHICLES: TransportVehicle[] = MOCK_TRANSPORT_VEHICLES_SEED.map(v => ({ ...v }));
let MOCK_DRIVERS: TransportDriver[] = MOCK_TRANSPORT_DRIVERS_SEED.map(d => ({ ...d }));
let MOCK_ROUTES: TransportRoute[] = MOCK_TRANSPORT_ROUTES_SEED.map(r => ({
  ...r,
  stops: r.stops.map(s => ({ ...s })),
  students: [...(r.students || [])],
}));

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

  addStop(body: { routeId: string; name: string; stopOrder: number; stopTime?: string }): Observable<{ id: number }> {
    if (runtimeConfig.useMocks) {
      const route = MOCK_ROUTES.find(r => r.id === body.routeId);
      if (route) {
        const sid = Date.now();
        route.stops = [...route.stops, { id: sid, name: body.name, time: body.stopTime || '', order: body.stopOrder }];
      }
      return of({ id: Date.now() });
    }
    const rid = Number(body.routeId);
    if (!Number.isFinite(rid)) {
      return of({ id: 0 });
    }
    const payload: any = {
      routeId: rid,
      name: body.name,
      stopOrder: body.stopOrder,
      stopTime: body.stopTime || null
    };
    return this.api.post<{ id?: number }>('/transport/stops', payload).pipe(map(s => ({ id: Number(s?.id ?? 0) })));
  }

  updateStop(
    stopId: number,
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
    const id = stopId;
    if (!Number.isFinite(id)) return of(undefined);
    const payload: Record<string, unknown> = {};
    if (body.name != null) payload.name = body.name;
    if (body.stopOrder != null) payload.stopOrder = body.stopOrder;
    if (body.stopTime != null) payload.stopTime = body.stopTime;
    return this.api.put<unknown>(`/transport/stops/${id}`, payload).pipe(map(() => void 0));
  }

  removeStop(stopId: number): Observable<void> {
    if (runtimeConfig.useMocks) {
      MOCK_ROUTES.forEach(r => {
        r.stops = r.stops.filter(s => s.id !== stopId);
      });
      return of(undefined);
    }
    return this.api.delete<void>(`/transport/stops/${stopId}`);
  }

  assignStudent(body: { routeId: string; studentId: number; studentName?: string; pickupStop?: string; dropStop?: string }): Observable<void> {
    if (runtimeConfig.useMocks) {
      const route = MOCK_ROUTES.find(r => r.id === body.routeId);
      if (route) {
        route.students = [
          ...(route.students || []),
          {
            id: Date.now(),
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

  removeStudentMapping(mappingId: number): Observable<void> {
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
      id: s.id != null ? Number(s.id) : undefined,
      name: s.name ?? '',
      time: s.time ?? '',
      order: Number(s.order ?? 0)
    }));
    const students = (r.students ?? []).map((m: any) => ({
      id: Number(m.id),
      studentId: Number(m.studentId),
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
