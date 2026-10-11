/** Data Status page - detailed diagnostics */
import { useSyncStatus, formatRelativeTime, getStatusClass } from '../hooks/useCatalog'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'

export function StatusPage() {
  const { data: status, isLoading, error, refetch } = useSyncStatus()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-mapua-black">Data Status</h1>
        <div className="card" role="status">
          <div className="card-body text-center py-8">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-mapua-red border-t-transparent rounded-full" />
            <p className="mt-4 text-mapua-gray">Loading diagnostics...</p>
          </div>
        </div>
      </div>
    )
  }

  const snapshot = status?.last_snapshot
  const termId = snapshot?.term_id || '_758_1'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mapua-black">Data Status & Diagnostics</h1>
          <p className="text-mapua-gray mt-1">Monitor catalog synchronization health and data quality</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary" disabled={isLoading}>
          Refresh Status
        </button>
      </div>

      {/* Sync Health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="card-body">
            <p className="text-sm text-mapua-gray">Sync Status</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={status?.current_status || 'idle'} label={status?.current_status} />
              <div>
                <p className="text-sm text-mapua-gray">Stale threshold: {status?.stale_threshold_minutes} min</p>
                <StatusBadge status={status?.is_stale ? 'stale' : 'fresh'} label={status?.is_stale ? 'Stale' : 'Fresh'} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="card-body">
            <p className="text-sm text-mapua-gray">Last Successful Sync</p>
            <p className="text-lg font-mono text-mapua-black mt-1">
              {status?.last_successful_sync ? formatRelativeTime(status.last_successful_sync) : 'Never'}
            </p>
            {status?.last_successful_sync && (
              <p className="text-xs text-mapua-gray mt-1">
                {new Date(status.last_successful_sync).toLocaleString()}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="card-body">
            <p className="text-sm text-mapua-gray">Last Attempt</p>
            <p className="text-lg font-mono text-mapua-black mt-1">
              {status?.last_attempt ? formatRelativeTime(status.last_attempt) : 'Never'}
            </p>
            {status?.last_attempt && (
              <p className="text-xs text-mapua-gray mt-1">
                {new Date(status.last_attempt).toLocaleString()}
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="card-body">
            <p className="text-sm text-mapua-gray">Current Term</p>
            <p className="text-lg font-mono text-mapua-black mt-1">{termId}</p>
            <p className="text-xs text-mapua-gray mt-1">1Q2627 (Term ID: _758_1)</p>
          </div>
        </Card>
      </div>

      {/* Snapshot Details */}
      {snapshot && (
        <Card>
          <div className="card-header">
            <h2 className="text-lg font-semibold text-mapua-black">Latest Snapshot</h2>
          </div>
          <div className="card-body">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-mapua-gray">Snapshot ID</dt>
                <dd className="font-mono text-sm text-mapua-charcoal mt-1 break-all">{snapshot.snapshot_id}</dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Status</dt>
                <dd className="mt-1"><StatusBadge status={snapshot.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Total Records</dt>
                <dd className="text-2xl font-bold text-mapua-black mt-1">{snapshot.total_records.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Errors</dt>
                <dd className="text-2xl font-bold text-mapua-black mt-1">{snapshot.error_count}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-mapua-gray">Started</dt>
                <dd className="text-sm text-mapua-black mt-1">
                  {snapshot.started_at ? new Date(snapshot.started_at).toLocaleString() : 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-mapua-gray">Completed</dt>
                <dd className="text-sm text-mapua-black mt-1">
                  {snapshot.completed_at ? new Date(snapshot.completed_at).toLocaleString() : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">New Records</dt>
                <dd className="text-lg font-bold text-green-600 mt-1">{snapshot.new_records}</dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Updated Records</dt>
                <dd className="text-lg font-bold text-blue-600 mt-1">{snapshot.updated_records}</dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Unchanged Records</dt>
                <dd className="text-lg font-bold text-gray-500 mt-1">{snapshot.unchanged_records}</dd>
              </div>
            </dl>

            {snapshot.errors.length > 0 && (
              <details className="mt-6">
                <summary className="cursor-pointer font-medium text-mapua-red">
                  View {snapshot.errors.length} Error(s)
                </summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {snapshot.errors.map((err, i) => (
                    <li key={i} className="font-mono text-red-700 bg-red-50 p-2 rounded">
                      {err}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </Card>
      )}

      {/* Source Information */}
      <Card>
        <div className="card-header">
          <h2 className="text-lg font-semibold text-mapua-black">Source Catalog Information</h2>
        </div>
        <div className="card-body space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-mapua-gray">Catalog URL</dt>
              <dd className="font-mono text-sm text-mapua-charcoal mt-1 break-all">
                <a href="https://mapua.blackboard.com/webapps/blackboard/execute/viewCatalog?type=Course&termId=_758_1" target="_blank" rel="noopener" className="text-mapua-red hover:underline">
                  mapua.blackboard.com/webapps/blackboard/execute/viewCatalog
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Term ID</dt>
              <dd className="font-mono text-sm text-mapua-charcoal mt-1">{termId}</dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Access Method</dt>
              <dd className="text-sm text-mapua-black mt-1">Guest login + HTML table parsing</dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Pagination Limit</dt>
              <dd className="text-sm text-mapua-black mt-1">1,000 records per request (showAllMax)</dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Total Pages (est.)</dt>
              <dd className="text-sm text-mapua-black mt-1">~2,653 pages @ 25/page</dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Fields Extracted</dt>
              <dd className="text-sm text-mapua-black mt-1">Course ID, Course Name, Instructor(s), Description</dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Fields Not Available</dt>
              <dd className="text-sm text-mapua-black mt-1">Section codes, schedules, rooms, campuses, seat counts</dd>
            </div>
            <div>
              <dt className="text-sm text-mapua-gray">Authentication</dt>
              <dd className="text-sm text-mapua-black mt-1">Guest session cookies (no credentials stored)</dd>
            </div>
          </dl>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-mapua-charcoal mb-3">Data Quality Notes</h3>
            <ul className="space-y-2 text-sm text-mapua-gray">
              <li>• Course records represent Blackboard <em>course shells</em>, not necessarily individual enrollment sections</li>
              <li>• Multiple instructors listed per course are comma-separated in source; parsed as array</li>
              <li>• Description field is often empty in the catalog view</li>
              <li>• Course IDs like <code className="font-mono bg-gray-100 px-1 rounded">3DMOGC013_AM27_1Q2627</code> follow pattern: <code className="font-mono bg-gray-100 px-1 rounded">{SUBJECT}_{SECTION}_{TERM}</code></li>
              <li>• Some courses are templates, test shells, or non-enrollment shells (filtered by naming convention in future)</li>
              <li>• Data freshness depends on manual/auto sync; not real-time</li>
            </ul>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50" role="alert">
          <div className="card-body">
            <p className="text-red-800">Failed to load status: {error.message}</p>
            <button onClick={() => refetch()} className="btn-secondary mt-2">Retry</button>
          </div>
        </Card>
      )}
    </div>
  )
}