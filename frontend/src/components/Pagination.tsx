/** Pagination component */
import { useMemo } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  maxVisible?: number
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  maxVisible = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = useMemo(() => {
    const result: (number | 'ellipsis')[] = []
    const half = Math.floor(maxVisible / 2)

    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    if (start > 1) {
      result.push(1)
      if (start > 2) result.push('ellipsis')
    }

    for (let i = start; i <= end; i++) {
      result.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) result.push('ellipsis')
      result.push(totalPages)
    }

    return result
  }, [currentPage, totalPages, maxVisible])

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200" aria-label="Pagination">
      <div className="text-sm text-mapua-gray">
        Showing <span className="font-medium">{startItem.toLocaleString()}</span> to{' '}
        <span className="font-medium">{endItem.toLocaleString()}</span> of{' '}
        <span className="font-medium">{totalItems.toLocaleString()}</span> results
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary p-2 text-sm"
          aria-label="Previous page"
          aria-disabled={currentPage === 1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>

        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-mapua-gray" aria-hidden="true">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-mapua-red text-white'
                  : 'text-mapua-charcoal hover:bg-gray-100'
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary p-2 text-sm"
          aria-label="Next page"
          aria-disabled={currentPage === totalPages}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </nav>
  )
}