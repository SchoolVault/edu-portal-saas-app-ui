import type { TimetableEntry } from '../models/models';
import { buildGeneratedMockTimetableEntries } from './timetable-mock.generator';

/** Mon–Sat × 8 periods × eight sections — one subject specialization per teacher; library-only staff on Library rows only. */
export const MOCK_TIMETABLE_ENTRIES: TimetableEntry[] = buildGeneratedMockTimetableEntries();
