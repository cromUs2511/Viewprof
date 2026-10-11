/** Professor Directory page */
import { useState, useMemo } from 'react'
import { useProfessors, formatRelativeTime, getStatusClass } from '../hooks/useCatalog'
import { useSyncStatus } from '../hooks/useCatalog'
import { Layout } from '../components/Layout'
import { DataTable } from '../components/DataTable'
import { SearchBar } from '../components/SearchBar'
import { Pagination } from '../components/Pagination'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'

export function ProfessorsPage() {
  const { data: syncStatus } = useSyncStatus()
  const snapshotId = syncStatus?.last_snapshot?.snapshot_id
  const { data, isLoading, error } = useProfessors(undefined, snapshotId)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.courses.some((c) => c.toLowerCase().includes(search.toLowerCase()))
    )
  }, [data, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / pageSize)

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-mapua-black">Professor Directory</h1>
          <DataTable
            columns={[
              { key: 'name', header: 'Professor' },
              { key: 'course_count', header: 'Courses' },
            ]}
            data={[]}
            keyExtractor={(r) => r.name}
            isLoading
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-mapua-black">Professor Directory</h1>
            <p className="text-mapua-gray mt-1">
              {filtered.length} professor{filtered.length !== 1 ? 's' : ''} found
              {data && ` (from ${data.length} total)`}
            </p>
          </div>
          <div className="w-full sm:w-80">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by professor name or course code..."
              debounceMs={200}
            />
          </div>
        </div>

        <Card>
          <div className="card-body p-0">
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Professor',
                  render: (prof) => (
                    <div>
                      <p className="font-medium text-mapua-charcoal">{prof.name}</p>
                      <p className="text-xs text-mapua-gray truncate max-w-xs">{prof.courses.join(', ')}</p>
                    </div>
                  ),
                },
                {
                  key: 'course_count',
                  header: 'Courses',
                  render: (prof) => (
                    <span className="font-mono text-mapua-charcoal">{prof.course_count}</span>
                  ),
                  className: 'w-24',
                },
                {
                  key: 'actions',
                  header: '',
                  render: (prof) => (
                    <button
                      className="btn-ghost text-sm px-2 py-1"
                      onClick={() => alert(`Navigate to professor detail: ${prof.name}`)}
                      aria-label={`View details for ${prof.name}`}
                    >
                      View
                    </button>
                  ),
                  className: 'w-24',
                },
              ]}
              data={paginated}
              keyExtractor={(p) => p.name}
              emptyMessage="No professors match your search"
            />
          </div>
        </Card>

        {filtered.length > pageSize && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}

        {error && (
          <div className="card border-red-200 bg-red-50" role="alert">
            <div className="card-body">
              <p className="text-red-800">Failed to load professors: {error.message}</p>
            </div>
          </div>
        )}

        <div className="text-sm text-mapua-gray">
          Data from snapshot: <code className="font-mono">{snapshotId || 'latest'}</code>
          {syncStatus?.last_successful_sync && (
            <> • Last sync: {formatRelativeTime(syncStatus.last_successful_sync)}</>
          )}
        </div>
      </div>
    </Layout>
  )
}