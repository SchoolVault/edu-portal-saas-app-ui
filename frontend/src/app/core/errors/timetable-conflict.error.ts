import type { TimetableConflictPayload } from '../models/models';

/** Thrown when timetable create/update returns HTTP 409 with {@code TIMETABLE_SLOT_CONFLICT}. */
export class TimetableConflictError extends Error {
  readonly code = 'TIMETABLE_SLOT_CONFLICT';

  constructor(
    message: string,
    public readonly conflict: TimetableConflictPayload
  ) {
    super(message);
    this.name = 'TimetableConflictError';
    Object.setPrototypeOf(this, TimetableConflictError.prototype);
  }
}
