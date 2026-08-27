import { getDb } from './store';
import type { Location, Role, User } from '@/shared/types/domain';

/**
 * In-memory config store for users & locations. Mutates the shared db arrays
 * (users/locations) so changes are visible to auth and other modules during
 * the dev server's lifetime. resetDb() restores the originals.
 */

export type ConfigResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function listUsers(): User[] {
  return getDb().users;
}

export function getUserById(id: string): User | undefined {
  return getDb().users.find((u) => u.id === id || u.username === id);
}

export function createUser(input: {
  username: string;
  name: string;
  role: Role;
  defaultLocationId: string;
  locationIds: string[];
  active?: boolean;
}): ConfigResult<User> {
  const db = getDb();
  if (input.username.trim() === '') return { ok: false, error: 'username is required' };
  if (db.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    return { ok: false, error: 'username already exists' };
  }
  const user: User = {
    id: `usr-${Date.now().toString(36)}`,
    username: input.username,
    name: input.name,
    role: input.role,
    defaultLocationId: input.defaultLocationId,
    locationIds: input.locationIds,
    active: input.active ?? true,
    password: 'demo',
  };
  db.users.push(user);
  return { ok: true, data: user };
}

export function updateUser(
  id: string,
  patch: Partial<Omit<User, 'id' | 'username'>> & { username?: string }
): ConfigResult<User> {
  const db = getDb();
  const user = db.users.find((u) => u.id === id || u.username === id);
  if (!user) return { ok: false, error: 'User not found' };
  const updated = {
    ...user,
    ...patch,
    id: user.id,
    username: patch.username ?? user.username,
  };
  Object.assign(user, updated);
  return { ok: true, data: user };
}

export function listLocations(): Location[] {
  return getDb().locations;
}

export function createLocation(input: {
  name: string;
  code: string;
  type: Location['type'];
}): ConfigResult<Location> {
  const db = getDb();
  if (input.name.trim() === '' || input.code.trim() === '') {
    return { ok: false, error: 'name and code are required' };
  }
  if (db.locations.some((l) => l.code.toLowerCase() === input.code.toLowerCase())) {
    return { ok: false, error: 'location code already exists' };
  }
  const location: Location = {
    id: `loc-${Date.now().toString(36)}`,
    name: input.name,
    code: input.code,
    type: input.type,
  };
  db.locations.push(location);
  return { ok: true, data: location };
}