import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock matchMedia for testing components that use prefers-reduced-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock react 'use' hook for Next.js params
vi.mock('react', async () => {
  const actual = await vi.importActual('react') as any;
  return {
    ...actual,
    use: vi.fn((input) => {
      if (input && typeof input.then === 'function') {
        if (input._resolvedValue) return input._resolvedValue;
        return input; 
      }
      return input;
    }),
  };
});

// Initialize i18n
import './src/i18n';

// Mock global fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  } as Response)
);
