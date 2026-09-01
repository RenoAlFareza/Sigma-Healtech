import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IncomingByStatus } from './IncomingByStatus';

describe('IncomingByStatus Component', () => {
  it('renders heading and status counts', () => {
    render(<IncomingByStatus pendingCount={8} shippedCount={5} partiallyReceivedCount={1} />);
    expect(screen.getByRole('heading', { name: 'Pergerakan Stok Masuk (Stock In)' })).toBeInTheDocument();
    expect(screen.getByText('Menunggu Masuk')).toBeInTheDocument();
    expect(screen.getByText('Kirim Pemasok')).toBeInTheDocument();
    expect(screen.getByText('Diterima Sebagian')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
