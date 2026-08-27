import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockListUsers = vi.fn();
const mockListLocations = vi.fn();
const mockCreateUser = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

vi.mock('@/features/config/api', () => ({
  listUsers: (...a: unknown[]) => mockListUsers(...a),
  listLocationsApi: (...a: unknown[]) => mockListLocations(...a),
  createUserApi: (...a: unknown[]) => mockCreateUser(...a),
  updateUserApi: vi.fn(),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

import { UsersConfig } from './UsersConfig';

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('UsersConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListUsers.mockResolvedValue([
      { id: 'usr-admin', username: 'admin', name: 'Admin', role: 'ADMIN', defaultLocationId: 'wh-pusat', locationIds: ['wh-pusat'], active: true },
    ]);
    mockListLocations.mockResolvedValue([
      { id: 'wh-pusat', name: 'Gudang', code: 'GFP', type: 'WAREHOUSE' },
    ]);
    mockCreateUser.mockResolvedValue({ id: 'u2', username: 'nurse2', name: 'Perawat', role: 'REQUESTOR' });
  });

  it('renders existing users', async () => {
    render(<UsersConfig />);
    await flush();
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument());
  });

  it('opens the create modal and creates a user', async () => {
    render(<UsersConfig />);
    await flush();
    await waitFor(() => expect(screen.getByRole('button', { name: /tambah user/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /tambah user/i }));
    await waitFor(() => expect(screen.getByLabelText(/username/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'nurse2' } });
    fireEvent.change(screen.getByLabelText(/nama/i), { target: { value: 'Perawat Dua' } });
    fireEvent.click(screen.getByRole('button', { name: /simpan/i }));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalled();
    });
    const payload = mockCreateUser.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.username).toBe('nurse2');
  });
});