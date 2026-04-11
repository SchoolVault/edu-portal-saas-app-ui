import type { HostelBuilding, HostelRoom } from '../models/models';

export const MOCK_HOSTEL_BUILDINGS_SEED: HostelBuilding[] = [
  { id: 'h1', name: 'Boys Hostel BH1', code: 'BH1', genderScope: 'MALE', roomCount: 2, availableBeds: 3 },
  { id: 'h2', name: 'Boys Hostel BH2', code: 'BH2', genderScope: 'MALE', roomCount: 1, availableBeds: 2 },
  { id: 'h3', name: 'Girls Hostel GH1', code: 'GH1', genderScope: 'FEMALE', roomCount: 1, availableBeds: 1 },
];

export const MOCK_HOSTEL_ROOMS_SEED: HostelRoom[] = [
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
      { allocationId: 'ha1', studentId: 1, studentName: 'Alex Kumar' },
      { allocationId: 'ha2', studentId: 2, studentName: 'Ben Lee' },
      { allocationId: 'ha3', studentId: 3, studentName: 'Chris Park' },
    ],
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
      { allocationId: 'ha4', studentId: 4, studentName: 'Dan Ross' },
      { allocationId: 'ha5', studentId: 5, studentName: 'Evan Singh' },
    ],
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
    residents: [],
  },
];
