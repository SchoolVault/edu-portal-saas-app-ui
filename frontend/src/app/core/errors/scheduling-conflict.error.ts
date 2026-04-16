import type { AttendanceCoverConflictPayload } from '../models/operations.models';

/**
 * Thrown when POST /attendance/covers returns HTTP 409 with {@code SCHEDULING_CONFLICT} so the UI can offer replace flow.
 */
export class SchedulingConflictError extends Error {
  readonly code = 'SCHEDULING_CONFLICT';

  constructor(
    message: string,
    public readonly conflict: AttendanceCoverConflictPayload
  ) {
    super(message);
    this.name = 'SchedulingConflictError';
    Object.setPrototypeOf(this, SchedulingConflictError.prototype);
  }
}
