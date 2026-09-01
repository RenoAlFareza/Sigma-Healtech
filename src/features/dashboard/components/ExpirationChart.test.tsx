import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpirationChart } from './ExpirationChart';

describe('ExpirationChart Component', () => {
  it('renders title, time range selector, and expiration line chart', () => {
    render(<ExpirationChart />);
    expect(screen.getByRole('heading', { name: 'Expiration Summary' })).toBeInTheDocument();
    expect(screen.getByText('6 Bulan Kedepan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Laporan Kedaluwarsa/i })).toHaveAttribute(
      'href',
      '/reports?type=EXPIRY'
    );
  });
});
