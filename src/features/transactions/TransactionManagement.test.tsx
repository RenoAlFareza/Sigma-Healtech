import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionManagement } from './TransactionManagement';

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

describe('TransactionManagement Component (OpenBoxes Architecture)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 5 core OpenBoxes transaction charts and metric cards', () => {
    render(<TransactionManagement />);

    expect(screen.getByRole('heading', { name: 'Transaction Management' })).toBeInTheDocument();
    expect(screen.getByText('Fill Rate Last Month')).toBeInTheDocument();
    expect(screen.getByText('99%')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Stock Movements Received by Month' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stock Movements Sent by Month' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stock vs ad-hoc requests last month' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fill Rate Last 12 Months' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stock out last month' })).toBeInTheDocument();

    expect(screen.getByText(/ADHOC/)).toBeInTheDocument();
    expect(screen.getByText(/STOCK/)).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByText('99.25%')).toBeInTheDocument();
  });
});
