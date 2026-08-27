import { describe, it, expect, beforeEach } from 'vitest';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  listLocations,
  createLocation,
} from '@/api/_fixtures/config';
import { resetDb, getDb } from '@/api/_fixtures/store';

describe('config store', () => {
  beforeEach(() => resetDb());

  it('lists seed users', () => {
    expect(listUsers().length).toBeGreaterThan(0);
    expect(listUsers().some((u) => u.username === 'admin')).toBe(true);
  });

  it('creates a user', () => {
    const res = createUser({
      username: 'nurse2',
      name: 'Perawat Dua',
      role: 'REQUESTOR',
      defaultLocationId: 'depo-igd',
      locationIds: ['depo-igd'],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(getUserById(res.data.id)?.username).toBe('nurse2');
    }
  });

  it('rejects duplicate usernames', () => {
    const res = createUser({ username: 'admin', name: 'X', role: 'VIEWER', defaultLocationId: 'wh-pusat', locationIds: ['wh-pusat'] });
    expect(res.ok).toBe(false);
  });

  it('updates a user role and active flag', () => {
    const admin = getDb().users.find((u) => u.username === 'admin')!;
    const res = updateUser(admin.id, { role: 'MANAGER', active: false });
    expect(res.ok).toBe(true);
    const stored = getDb().users.find((u) => u.id === admin.id)!;
    expect(stored.role).toBe('MANAGER');
    expect(stored.active).toBe(false);
  });

  it('lists locations and creates a new one', () => {
    expect(listLocations().length).toBeGreaterThan(0);
    const res = createLocation({ name: 'Depo Bedah', code: 'DBS', type: 'DEPOT' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(listLocations().some((l) => l.code === 'DBS')).toBe(true);
    }
  });

  it('rejects duplicate location codes', () => {
    const res = createLocation({ name: 'X', code: 'GFP', type: 'WAREHOUSE' });
    expect(res.ok).toBe(false);
  });
});