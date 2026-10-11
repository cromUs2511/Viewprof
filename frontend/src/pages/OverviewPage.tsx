/** Overview page - dashboard with stats and sync control */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSyncStatus, useRefreshCatalog, formatRelativeTime, getStatusClass, getFreshnessClass } from '../hooks/useCatalog'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'

export function OverviewPage() {
  const { data: status, isLoading, error, refetch } = useSyncStatus()
  const refreshMutation = useRefreshCatalog()
  const [adminKey, setAdminKey] = useState('')

  const handleRefresh = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminKey.trim()) return
    try {
      await refreshMutation.mutateAsync({ adminKey: adminKey.trim() })
      setAdminKey('')
      // Refetch status after a moment
      setTimeout(() => refetch(), 2000)
    } catch (err) {
      console.error('Refresh failed:', err)
    }
  }

  const termId = status?.last_snapshot?.term_id || '_758_1'
  const isStale = status?.is_stale ?? false
  const lastSync = status?.last_successful_sync
  const lastAttempt = status?.last_attempt

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-mapua-black">Enrollment Catalog Overview</h1>
            <p className="text-mapua-gray mt-1">Term: <span className="font-mono text-mapua-charcoal">{termId}</span></p>
          </div>
          <form onSubmit={handleRefresh} className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin API Key"
              className="input w-full sm:w-64"
              disabled={refreshMutation.isPending}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={refreshMutation.isPending || !adminKey.trim()}
            >
              {refreshMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Syncing...
                </>
              ) : (
                'Refresh Catalog'
              )}
            </button>
          </form>
        </div>

        {/* Status cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-mapua-gray">Data Freshness</p>
                  <p className="text-2xl font-bold text-mapua-black mt-1">
                    {isStale ? 'Stale' : 'Fresh'}
                  </p>
                  <StatusBadge status={isStale ? 'stale' : 'fresh'} className="mt-2" />
                </div>
                <div className="text-4xl" aria-hidden="true">{isStale ? '⏱' : '✓'}</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-body">
              <p className="text-sm text-mapua-gray">Last Successful Sync</p>
              <p className="text-xl font-medium text-mapua-black mt-1 font-mono">
                {lastSync ? formatRelativeTime(lastSync) : 'Never'}
              </p>
              <p className="text-xs text-mapua-gray mt-1">
                {lastSync ? new Date(lastSync).toLocaleString() : 'No successful sync recorded'}
              </p>
            </div>
          </Card>

          <Card>
            <div className="card-body">
              <p className="text-sm text-mapua-gray">Last Attempt</p>
              <p className="text-xl font-medium text-mapua-black mt-1 font-mono">
                {lastAttempt ? formatRelativeTime(lastAttempt) : 'Never'}
              </p>
              <p className="text-xs text-mapua-gray mt-1">
                {lastAttempt ? new Date(lastAttempt).toLocaleString() : 'No sync attempts recorded'}
              </p>
            </div>
          </Card>

          <Card>
            <div className="card-body">
              <p className="text-sm text-mapua-gray">Sync Status</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={status?.current_status || 'idle'} />
                {status?.last_snapshot && (
                  <span className="text-sm text-mapua-gray">
                    {status.last_snapshot.total_records.toLocaleString()} records
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Stats from latest snapshot */}
        {status?.last_snapshot && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="card-body">
                <p className="text-sm text-mapua-gray">Total Courses</p>
                <p className="text-3xl font-bold text-mapua-black mt-1">
                  {status.last_snapshot.total_records.toLocaleString()}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-green-600">+{status.last_snapshot.new_records} new</span>
                  <span className="text-blue-600">~{status.last_snapshot.updated_records} updated</span>
                  <span className="text-gray-500">={status.last_snapshot.unchanged_records} unchanged</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="card-body">
                <p className="text-sm text-mapua-gray">Errors</p>
                <p className="text-3xl font-bold text-mapua-black mt-1">
                  {status.last_snapshot.error_count}
                </p>
                {status.last_snapshot.errors.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="text-mapua-red cursor-pointer">View errors</summary>
                    <ul className="mt-2 space-y-1 text-mapua-gray">
                      {status.last_snapshot.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="font-mono text-xs">{err}</li>
                      ))}
                      {status.last_snapshot.errors.length > 5 && (
                        <li className="text-mapua-gray">...and {status.last_snapshot.errors.length - 5} more</li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            </Card>

            <Card>
              <div className="card-body">
                <p className="text-sm text-mapua-gray">Snapshot ID</p>
                <p className="font-mono text-sm text-mapua-charcoal mt-1 break-all">
                  {status.last_snapshot.snapshot_id}
                </p>
                <p className="text-xs text-mapua-gray mt-2">
                  Started: {status.last_snapshot.started_at ? formatRelativeTime(status.last_snapshot.started_at) : 'N/A'}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/professors" className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-mapua-gray">Professor Directory</p>
                  <h3 className="text-xl font-bold text-mapua-black mt-1">Browse by Instructor</h3>
                  <p className="text-sm text-mapua-gray mt-2">Search professors and view their assigned courses</p>
                </div>
                <span className="text-3xl" aria-hidden="true">👨‍🏫</span>
              </div>
            </div>
          </Link>

          <Link to="/subjects" className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-mapua-gray">Subject Catalog</p>
                  <h3 className="text-xl font-bold text-mapua-black mt-1">Browse by Subject</h3>
                  <p className="text-sm text-mapua-gray mt-2">Search subjects by code or name, view sections and instructors</p>
                </div>
                <span className="text-3xl" aria-hidden="true">📚</span>
              </div>
            </div>
          </Link>

          <Link to="/status" className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-mapua-gray">Data Status</p>
                  <h3 className="text-xl font-bold text-mapua-black mt-1">Sync Diagnostics</h3>
                  <p className="text-sm text-mapua-gray mt-2">View detailed sync history, errors, and data quality metrics</p>
                </div>
                <span className="text-3xl" aria-hidden="true">📡</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Current snapshot details */}
        {status?.last_snapshot && (
          <Card>
            <div className="card-header">
              <h2 className="text-lg font-semibold text-mapua-black">Latest Snapshot Details</h2>
            </div>
            <div className="card-body">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-mapua-gray">Snapshot ID</dt>
                  <dd className="font-mono text-sm text-mapua-charcoal mt-1">{status.last_snapshot.snapshot_id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-mapua-gray">Term</dt>
                  <dd className="font-mono text-sm text-mapua-charcoal mt-1">{status.last_snapshot.term_id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-mapua-gray">Started</dt>
                  <dd className="text-sm text-mapua-black mt-1">
                    {status.last_snapshot.started_at ? new Date(status.last_snapshot.started_at).toLocaleString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-mapua-gray">Completed</dt>
                  <dd className="text-sm text-mapua-black mt-1">
                    {status.last_snapshot.completed_at ? new Date(status.last_snapshot.completed_at).toLocaleString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-mapua-gray">Duration</dt>
                  <dd className="text-sm text-mapua-black mt-1">
                    {status.last_snapshot.started_at && status.last_snapshot.completed_at
                      ? `${((new Date(status.last_snapshot.completed_at).getTime() - new Date(status.last_snapshot.started_at).getTime()) / 1000).toFixed(1)}s`
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-mapua-gray">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={status.last_snapshot.status} />
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50" role="alert">
            <div className="card-body">
              <p className="text-red-800">Failed to load sync status: {error.message}</p>
              <button onClick={() => refetch()} className="btn-secondary mt-2">Retry</button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}