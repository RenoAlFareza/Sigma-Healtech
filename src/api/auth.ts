import { apiFetch } from './client';
import { setSession, clearSession } from './session';
import type { Role, User } from '@/api/_fixtures/types';
import type { MenuItem } from '@/shared/config/menu';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContext {
  user: User;
  role: Role;
  defaultLocationId: string;
  locationIds: string[];
  menu: MenuItem[];
}

/**
 * Authenticate a user with username/password.
 * On success, persists the session (userId + token) to localStorage.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  setSession({ userId: result.user.id, token: result.token });
  return result;
}

/**
 * Fetch the authenticated user's context (role, locations, menu) using the
 * persisted `x-user-id` header. Throws ApiError(401) when the session is
 * missing or invalid.
 */
export async function getAuthContext(): Promise<AuthContext> {
  return apiFetch<AuthContext>('/auth/context', { method: 'GET' });
}

/**
 * Clear the local session and notify the backend (best-effort logout).
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' });
  } finally {
    clearSession();
  }
}