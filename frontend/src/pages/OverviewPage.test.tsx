import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { OverviewPage } from '../pages/OverviewPage'
import { Layout } from '../components/Layout'

// Mock the hooks
jest.mock('../hooks/useCatalog', () => ({
  useSyncStatus: () => ({
    data: {
      last_successful_sync: '2026-10-11T07:00:00.000Z',
      last_attempt: '2026-10-11T07:00:00.000Z',
      last_snapshot: {
        snapshot_id: 'snap_20261011_070000_abc123',
        term_id: '_758_1',
        started_at: '2026-10-11T07:00:00.000Z',
        completed_at: '2026-10-11T07:00:05.000Z',
        total_records: 66307,
        new_records: 100,
        updated_records: 50,
        unchanged_records: 66157,
        error_count: 0,
        errors: [],
        status: 'completed',
      },
      current_status: 'idle',
      is_stale: false,
      stale_threshold_minutes: 120,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useRefreshCatalog: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  formatRelativeTime: (date) => '2h ago',
  getStatusClass: (status) => 'badge-fresh',
  getFreshnessClass: (isStale) => isStale ? 'badge-stale' : 'badge-fresh',
}))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>{ui}</Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('OverviewPage', () => {
  it('renders overview title', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Enrollment Catalog Overview')).toBeInTheDocument()
  })

  it('shows term ID', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('_758_1')).toBeInTheDocument()
  })

  it('shows data freshness as Fresh', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Fresh')).toBeInTheDocument()
  })

  it('shows last successful sync', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })

  it('shows total records from snapshot', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('66,307')).toBeInTheDocument()
  })

  it('has refresh button', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByRole('button', { name: /refresh catalog/i })).toBeInTheDocument()
  })

  it('shows quick link cards', () => {
    renderWithProviders(<OverviewPage />)
    expect(screen.getByText('Professor Directory')).toBeInTheDocument()
    expect(screen.getByText('Subject Catalog')).toBeInTheDocument()
    expect(screen.getByText('Data Status')).toBeInTheDocument()
  })
})