/** Reusable data table with sorting, empty, loading states */
import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  rowClassName?: (row: T) => string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="table-container" role="status" aria-label="Loading data">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className}>
                    <div className="skeleton h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="empty-state" role="status" aria-live="polite">
        {emptyIcon || (
          <svg className="empty-state-icon w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <p className="empty-state-title">No Results</p>
        <p className="empty-state-text">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="table-container" role="region" aria-label="Data table" tabIndex={0}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className} scope="col">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={keyExtractor(row)} className={rowClassName?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}