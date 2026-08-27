const SESSION_KEY = 'sigma.session';

export interface Session {
  userId: string;
  token: string;
}

/**
 * Persist the current session to localStorage (client-only).
 * No-op on the server / during SSR.
 */
export function setSession(session: Session): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Read the current session from localStorage (client-only).
 * Returns `null` on the server / during SSR or when nothing is stored.
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

/**
 * Clear the current session from localStorage (client-only).
 */
export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
}