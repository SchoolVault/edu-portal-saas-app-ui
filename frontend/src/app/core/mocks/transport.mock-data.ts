import type { TransportDriver, TransportRoute, TransportVehicle } from '../models/models';

export const MOCK_TRANSPORT_VEHICLES_SEED: TransportVehicle[] = [
  { id: 'v1', registrationNumber: 'BUS-001', vehicleType: 'BUS', capacity: 40, model: 'Volvo' },
  { id: 'v2', registrationNumber: 'VAN-014', vehicleType: 'VAN', capacity: 12, model: 'Force Traveller' },
];

export const MOCK_TRANSPORT_DRIVERS_SEED: TransportDriver[] = [
  { id: 'd1', fullName: 'Mark Stevens', phone: '+91-9800011001', licenseNumber: 'DL042011009988' },
  { id: 'd2', fullName: 'Paul Walker', phone: '+91-9800011002', licenseNumber: 'DL042011009977' },
];

export const MOCK_TRANSPORT_ROUTES_SEED: TransportRoute[] = [
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
      { id: 1, name: 'Main Gate', time: '07:00', order: 1 },
      { id: 2, name: 'School', time: '07:50', order: 2 },
    ],
    assignedStudents: 42,
    students: [],
    tenantId: 't1',
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
    stops: [{ id: 3, name: 'South Gate', time: '07:10', order: 1 }],
    assignedStudents: 12,
    students: [],
    tenantId: 't1',
  },
];
