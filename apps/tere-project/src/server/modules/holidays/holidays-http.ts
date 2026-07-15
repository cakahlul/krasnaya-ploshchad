import { withAuth, type AuthedHandler } from '@server/auth/with-auth';
import { withRole } from '@server/auth/with-role';
import { HolidaysError } from './holidays.service';

export type HolidaysApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR';

type RouteContext = { params: Promise<Record<string, string>> };

function fixedError(
  code: HolidaysApiErrorCode,
  message: string,
  status: number,
): Response {
  return Response.json({ code, message }, { status });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HolidaysError) {
    return Response.json(
      {
        code: error.code,
        message: error.message,
        ...(error.fields && { fields: error.fields }),
      },
      { status: error.status },
    );
  }
  return fixedError('INTERNAL_SERVER_ERROR', 'Internal Server Error', 500);
}

export function normalizeHolidayResponse(response: Response): Response {
  if (response.status === 401) return fixedError('UNAUTHORIZED', 'Unauthorized', 401);
  if (response.status === 403) return fixedError('FORBIDDEN', 'Forbidden', 403);
  if (response.status >= 500) {
    return fixedError('INTERNAL_SERVER_ERROR', 'Internal Server Error', 500);
  }
  return response;
}

function safely(handler: AuthedHandler): AuthedHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function withHolidayAuth(handler: AuthedHandler) {
  const guarded = withAuth(safely(handler));
  return async (req: Request, context: RouteContext): Promise<Response> =>
    normalizeHolidayResponse(await guarded(req, context));
}

export function withLead(handler: AuthedHandler) {
  const guarded = withRole('Lead', safely(handler));
  return async (req: Request, context: RouteContext): Promise<Response> =>
    normalizeHolidayResponse(await guarded(req, context));
}
