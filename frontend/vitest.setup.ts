import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children,
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  NavLink: ({ children, to }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: '/' }),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>,
}))