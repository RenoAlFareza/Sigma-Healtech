import { apiFetch } from '@/api';
import type { Location, Role, User } from '@/shared/types/domain';

export async function listUsers(): Promise<User[]> {
  const res = await apiFetch<{ data: User[] }>('/config/users');
  return res.data;
}

export async function createUserApi(payload: {
  username: string;
  name: string;
  role: Role;
  defaultLocationId: string;
  locationIds: string[];
  active?: boolean;
}): Promise<User> {
  return apiFetch<User>('/config/users', { method: 'POST', body: payload });
}

export async function updateUserApi(
  id: string,
  payload: Partial<Omit<User, 'id'>> & { username?: string }
): Promise<User> {
  return apiFetch<User>(`/config/users/${id}`, { method: 'PUT', body: payload });
}

export async function listLocationsApi(): Promise<Location[]> {
  const res = await apiFetch<{ data: Location[] }>('/config/locations');
  return res.data;
}

export async function createLocationApi(payload: {
  name: string;
  code: string;
  type: Location['type'];
}): Promise<Location> {
  return apiFetch<Location>('/config/locations', { method: 'POST', body: payload });
}