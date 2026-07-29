import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Skeleton from '../Skeleton';

describe('Skeleton (#155)', () => {
  test('renders with the shared shimmer class plus custom utilities', () => {
    render(<Skeleton className="h-4 w-32" data-testid="sk" />);
    const el = screen.getByTestId('sk');
    expect(el).toHaveClass('skeleton-cell');
    expect(el).toHaveClass('h-4');
    expect(el).toHaveClass('w-32');
  });

  test('is decorative (aria-hidden) so it is ignored by screen readers', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'true');
  });

  test('forwards arbitrary div props', () => {
    render(<Skeleton data-testid="sk" id="custom-id" />);
    expect(screen.getByTestId('sk')).toHaveAttribute('id', 'custom-id');
  });
});
