import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotificationItem } from '@/context/NotificationContext';
import NotificationsPage from '../NotificationsPage';

const markAsReadMock = vi.fn();
const markAllAsReadMock = vi.fn();
let isConnected = true;
let notifications: NotificationItem[] = [];

vi.mock('@/context/NotificationContext', () => ({
  useNotification: () => ({
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead: markAsReadMock,
    markAllAsRead: markAllAsReadMock,
  }),
}));

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => ({ isConnected }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

// App chrome (navbar/footer) pulls in providers and browser APIs that are
// irrelevant to what this screen owns.
vi.mock('@/components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

function makeNotification(overrides: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n-1',
    category: 'invoice',
    type: 'funded',
    title: 'Invoice funded',
    message: 'Your invoice was funded',
    href: '/invoices/1',
    createdAt: '2026-01-01T00:00:00.000Z',
    read: false,
    ...overrides,
  };
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    isConnected = true;
    notifications = [];
    markAsReadMock.mockClear();
    markAllAsReadMock.mockClear();
  });

  it('asks the user to connect a wallet when disconnected', () => {
    isConnected = false;
    render(<NotificationsPage />);

    expect(screen.getByText('Connect your wallet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it('renders the empty state when there are no notifications', () => {
    render(<NotificationsPage />);

    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it('orders notifications newest first regardless of input order', () => {
    notifications = [
      makeNotification({ id: 'old', title: 'Older', createdAt: '2026-01-01T00:00:00.000Z' }),
      makeNotification({ id: 'new', title: 'Newer', createdAt: '2026-03-01T00:00:00.000Z' }),
      makeNotification({ id: 'mid', title: 'Middle', createdAt: '2026-02-01T00:00:00.000Z' }),
    ];
    render(<NotificationsPage />);

    const titles = screen
      .getAllByRole('link')
      .map((link) => link.textContent ?? '')
      .filter((text) => text.includes('Invoice') || /Newer|Older|Middle/.test(text));
    expect(titles[0]).toContain('Newer');
    expect(titles[1]).toContain('Middle');
    expect(titles[2]).toContain('Older');
  });

  it('marks a single notification as read when its row is activated', () => {
    notifications = [makeNotification({ id: 'abc' })];
    render(<NotificationsPage />);

    fireEvent.click(screen.getByRole('link', { name: /Invoice funded/ }));
    expect(markAsReadMock).toHaveBeenCalledWith('abc');
  });

  it('exposes a mark-all control only while something is unread', () => {
    notifications = [makeNotification({ id: 'read-1', read: true })];
    const { unmount } = render(<NotificationsPage />);
    expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    unmount();

    notifications = [makeNotification({ id: 'unread-1', read: false })];
    render(<NotificationsPage />);
    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));
    expect(markAllAsReadMock).toHaveBeenCalledTimes(1);
  });

  it('renders a relative timestamp for each notification', () => {
    notifications = [makeNotification({ id: 'fresh', createdAt: new Date().toISOString() })];
    render(<NotificationsPage />);

    expect(screen.getByText(/ago|just now|now/i)).toBeInTheDocument();
  });
});
