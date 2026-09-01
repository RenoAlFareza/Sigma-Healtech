import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/features/auth/AuthProvider';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginPage', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      user: null,
    });
  });

  it('renders login form with branding and demo credentials list', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Workspace operasional SIGMA/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Pengguna/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kata Sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk/i })).toBeInTheDocument();
    
    // Check demo credentials demo list
    expect(screen.getByText(/Akun Demo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });

  it('handles filling and submitting login form successfully', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/Nama Pengguna/i);
    const passwordInput = screen.getByLabelText(/Kata Sandi/i);
    const submitBtn = screen.getByRole('button', { name: /Masuk/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'demo' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'demo');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error alert on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Nama pengguna atau kata sandi salah'));

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/Nama Pengguna/i);
    const passwordInput = screen.getByLabelText(/Kata Sandi/i);
    const submitBtn = screen.getByRole('button', { name: /Masuk/i });

    fireEvent.change(usernameInput, { target: { value: 'invalid' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Nama pengguna atau kata sandi salah/i)).toBeInTheDocument();
    });
  });

  it('disables button during loading state', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      user: null,
    });

    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Memproses\.\.\./i });
    expect(submitBtn).toBeDisabled();
  });
});
