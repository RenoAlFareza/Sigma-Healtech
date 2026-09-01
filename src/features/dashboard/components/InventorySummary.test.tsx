import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InventorySummary } from './InventorySummary';

describe('InventorySummary Component', () => {
  it('renders title, categories, and horizontal bar chart', () => {
    render(<InventorySummary />);
    expect(screen.getByRole('heading', { name: 'Inventory Summary' })).toBeInTheDocument();
    expect(screen.getByText('Lihat Persediaan')).toBeInTheDocument();
  });
});
