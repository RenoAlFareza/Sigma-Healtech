import { getSession } from './session';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Typed fetch wrapper for the backend-mock route handlers.
 * - prefixes paths with `/api`
 * - JSON serializes/parses request/response bodies
 * - attaches the `x-user-id` header from the current session (if present)
 * - throws a typed `ApiError` on non-2xx responses
 *
 * The raw JSON body is returned as-is. List endpoints return their
 * `{ data, totalCount }` envelope intact; consumers read `res.data` /
 * `res.totalCount` directly.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const session = getSession();

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (session?.userId) {
    finalHeaders['x-user-id'] = session.userId;
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as { error?: string };
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // ignore unparseable error bodies
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}