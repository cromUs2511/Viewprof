/** Subject Catalog page */
import { useState, useMemo } from 'react'
import { useSubjects, useSyncStatus, formatRelativeTime } from '../hooks/useCatalog'
import { Layout } from '../components/Layout'
import { DataTable } from '../components/DataTable'
import { SearchBar } from '../components/SearchBar'
import { Pagination } from '../components/Pagination'
import { Card } from '../components/Card'

export function SubjectsPage() {
  const { data: syncStatus } = useSyncStatus()
  const snapshotId = syncStatus?.last_snapshot?.snapshot_id
  const { data, isLoading, error } = useSubjects(undefined, snapshotId)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((s) =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.instructors.some((i) => i.toLowerCase().includes(search.toLowerCase()))
    )
  }, [data, search])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const totalPages = Math.ceil(filtered.length / pageSize)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-mapua-black">Subject Catalog</h1>
            <p className="text-mapua-gray mt-1">
              {filtered.length} subject{filtered.length !== 1 ? 's' : ''} found
              {data && ` (from ${data.length} total)`}
            </p>
          </div>
          <div className="w-full sm:w-80">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by subject code, name, or instructor..."
              debounceMs={200}
            />
          </div>
        </div>

        <Card>
          <div className="card-body p-0">
            {isLoading ? (
              <DataTable
                columns={[
                  { key: 'code', header: 'Code' },
                  { key: 'name', header: 'Subject Name' },
                  { key: 'section_count', header: 'Sections' },
                  { key: 'instructors', header: 'Instructors' },
                ]}
                data={[]}
                keyExtractor={(s) => s.code}
                isLoading
              />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (s) => <code className="font-mono text-mapua-charcoal">{s.code}</code>,
                    className: 'w-48',
                  },
                  {
                    key: 'name',
                    header: 'Subject Name',
                    render: (s) => <p className="font-medium text-mapua-charcoal">{s.name}</p>,
                  },
                  {
                    key: 'section_count',
                    header: 'Sections',
                    render: (s) => <span className="font-mono text-mapua-charcoal">{s.section_count}</span>,
                    className: 'w-24',
                  },
                  {
                    key: 'instructors',
                    header: 'Instructors',
                    render: (s) => (
                      <div className="flex flex-wrap gap-1">
                        {s.instructors.slice(0, 3).map((inst, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-mapua-charcoal">
                            {inst}
                          </span>
                        ))}
                        {s.instructors.length > 3 && (
                          <span className="text-xs text-mapua-gray px-2 py-0.5">+{s.instructors.length - 3} more</span>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={paginated}
                keyExtractor={(s) => s.code}
                emptyMessage="No subjects match your search"
              />
            )}
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
              <p className="text-red-800">Failed to load subjects: {error.message}</p>
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