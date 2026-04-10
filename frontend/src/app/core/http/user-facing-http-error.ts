import { HttpErrorResponse } from '@angular/common/http';

/** Thrown by the HTTP error interceptor so subscribers always get a safe, user-facing {@link Error#message}. */
export class UserFacingHttpError extends Error {
  override readonly name = 'UserFacingHttpError';

  constructor(
    message: string,
    readonly httpStatus: number
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const MSG_CONNECTIVITY = `We couldn't reach the service. Check your internet connection and try again. If it keeps happening, contact your school or IT support.`;

const MSG_TRY_AGAIN = `Something went wrong. Please try again in a moment.`;

const MSG_BAD_REQUEST = `We couldn't process this request. Check your information and try again.`;

const MSG_FORBIDDEN = `You don't have access to this. Contact your administrator if you need help.`;

const MSG_NOT_FOUND = `This information isn't available right now. It may have been moved or removed.`;

const MSG_CONFLICT = `This action couldn't be completed because it conflicts with existing data.`;

const MSG_RATE_LIMIT = `Too many attempts. Please wait a few minutes and try again.`;

const MSG_SERVER_UNAVAILABLE = `The service is temporarily unavailable. Please try again shortly.`;

const MSG_LOGIN_CONTEXT = `Sign-in wasn't successful. Check your school code, email, and password, then try again.`;

const MSG_SESSION = `Your session has expired or you are not signed in. Please sign in again.`;

function isAuthPublicEndpoint(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/onboard-tenant') ||
    url.includes('/auth/refresh-token')
  );
}

/**
 * Reject bodies that look like HTML, stack traces, or accidental URL dumps — never show those to end users.
 */
function isSafeUserFacingText(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 400) {
    return false;
  }
  const lower = t.toLowerCase();
  if (lower.includes('<html') || lower.includes('<!doctype')) {
    return false;
  }
  if (/\bhttps?:\/\//i.test(t) || /\blocalhost\b/i.test(t)) {
    return false;
  }
  if (/\bat\s+[\w.$]+\s*\(/i.test(t) || t.includes('java.')) {
    return false;
  }
  return true;
}

function parseApiBody(raw: unknown): { message?: string; errors: string[] } {
  let body: unknown = raw;
  if (typeof body === 'string') {
    const s = body.trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        body = JSON.parse(s) as unknown;
      } catch {
        return { errors: [] };
      }
    } else {
      return { message: isSafeUserFacingText(s) ? s : undefined, errors: [] };
    }
  }
  if (!body || typeof body !== 'object') {
    return { errors: [] };
  }
  const o = body as Record<string, unknown>;
  const msg = o['message'];
  const message = typeof msg === 'string' && isSafeUserFacingText(msg) ? msg.trim() : undefined;
  const errArr = o['errors'];
  const errors: string[] = Array.isArray(errArr)
    ? errArr.filter((e): e is string => typeof e === 'string').map(e => e.trim()).filter(e => isSafeUserFacingText(e))
    : [];
  return { message, errors };
}

/**
 * Maps {@link HttpErrorResponse} to a single string suitable for alerts, toasts, and inline banners.
 * Prefer structured {@link ApiResp} fields when present and safe; never include request URLs.
 */
export function mapHttpErrorResponseToUserMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return MSG_CONNECTIVITY;
  }

  const { message, errors } = parseApiBody(error.error);
  if (errors.length > 0) {
    return errors[0];
  }
  if (message) {
    return message;
  }

  const authPublic = isAuthPublicEndpoint(error.url ?? undefined);

  switch (error.status) {
    case 400:
      return MSG_BAD_REQUEST;
    case 401:
      return authPublic ? MSG_LOGIN_CONTEXT : MSG_SESSION;
    case 403:
      return MSG_FORBIDDEN;
    case 404:
      return MSG_NOT_FOUND;
    case 409:
      return MSG_CONFLICT;
    case 408:
    case 504:
      return MSG_SERVER_UNAVAILABLE;
    case 429:
      return MSG_RATE_LIMIT;
    case 502:
    case 503:
      return MSG_SERVER_UNAVAILABLE;
    default:
      if (error.status >= 500) {
        return MSG_TRY_AGAIN;
      }
      return MSG_TRY_AGAIN;
  }
}
