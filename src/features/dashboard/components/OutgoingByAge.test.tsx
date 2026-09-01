import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OutgoingByAge } from './OutgoingByAge';

describe('OutgoingByAge Component', () => {
  it('renders heading and age indicators', () => {
    render(<OutgoingByAge createdUnder4Days={4} createdOver4Days={0} createdOver7Days={0} />);
    expect(screen.getByRole('heading', { name: 'Pergerakan Stok Keluar (Stock Out)' })).toBeInTheDocument();
    expect(screen.getByText('< 4 Hari (Lancar)')).toBeInTheDocument();
    expect(screen.getByText('> 4 Hari (Perhatian)')).toBeInTheDocument();
    expect(screen.getByText('> 7 Hari (Kritis)')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
