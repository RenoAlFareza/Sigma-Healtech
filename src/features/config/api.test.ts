import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { listUsers, createUserApi, updateUserApi, listLocationsApi, createLocationApi } from './api';

const mockApiFetch = vi.mocked(apiFetch);

const user = {
  id: 'usr-1', username: 'nurse2', name: 'Perawat Dua', role: 'REQUESTOR', defaultLocationId: 'depo-igd', locationIds: ['depo-igd'], active: true,
};
const location = { id: 'loc-1', name: 'Depo Bedah', code: 'DBS', type: 'DEPOT' as const };

describe('config api', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('listUsers unwraps the envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [user], totalCount: 1 });
    const res = await listUsers();
    expect(mockApiFetch).toHaveBeenCalledWith('/config/users');
    expect(res).toEqual([user]);
  });

  it('createUserApi POSTs to /config/users', async () => {
    mockApiFetch.mockResolvedValue(user);
    const payload = { username: 'nurse2', name: 'Perawat Dua', role: 'REQUESTOR' as never, defaultLocationId: 'depo-igd', locationIds: ['depo-igd'] };
    const res = await createUserApi(payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/config/users', { method: 'POST', body: payload });
    expect(res).toEqual(user);
  });

  it('updateUserApi PUTs to /config/users/:id', async () => {
    const updated = { ...user, role: 'MANAGER' };
    mockApiFetch.mockResolvedValue(updated);
    const res = await updateUserApi('usr-1', { role: 'MANAGER' as never });
    expect(mockApiFetch).toHaveBeenCalledWith('/config/users/usr-1', { method: 'PUT', body: { role: 'MANAGER' } });
    expect(res).toEqual(updated);
  });

  it('listLocationsApi unwraps location envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [location], totalCount: 1 });
    const res = await listLocationsApi();
    expect(mockApiFetch).toHaveBeenCalledWith('/config/locations');
    expect(res).toEqual([location]);
  });

  it('createLocationApi POSTs to /config/locations', async () => {
    mockApiFetch.mockResolvedValue(location);
    const payload = { name: 'Depo Bedah', code: 'DBS', type: 'DEPOT' as const };
    const res = await createLocationApi(payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/config/locations', { method: 'POST', body: payload });
    expect(res).toEqual(location);
  });
});