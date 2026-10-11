/** React Query hooks for catalog data */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type CourseListResponse, type ProfessorSummary, type SubjectSummary, type SyncStatus, type RefreshResponse } from '../lib/api'

// Query keys
export const keys = {
  syncStatus: (termId?: string) => ['syncStatus', termId] as const,
  catalog: (params: Record<string, unknown>) => ['catalog', params] as const,
  professors: (termId?: string, snapshotId?: string) => ['professors', termId, snapshotId] as const,
  subjects: (termId?: string, snapshotId?: string) => ['subjects', termId, snapshotId] as const,
}

// Sync hooks
export function useSyncStatus(termId?: string) {
  return useQuery({
    queryKey: keys.syncStatus(termId),
    queryFn: () => api.sync.status(termId),
    refetchInterval: 30_000, // Poll status every 30s
  })
}

export function useRefreshCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ termId, adminKey }: { termId?: string; adminKey?: string }) => api.sync.refresh(termId, adminKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syncStatus'] })
      qc.invalidateQueries({ queryKey: ['catalog'] })
      qc.invalidateQueries({ queryKey: ['professors'] })
      qc.invalidateQueries({ queryKey: ['subjects'] })
    },
  })
}

// Catalog hooks
export function useCatalog(params: {
  term_id?: string
  snapshot_id?: string
  search?: string
  professor?: string
  subject_code?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: keys.catalog(params),
    queryFn: () => api.catalog.list(params),
    placeholderData: (prev) => prev, // Keep previous data while fetching
  })
}

export function useProfessors(termId?: string, snapshotId?: string) {
  return useQuery({
    queryKey: keys.professors(termId, snapshotId),
    queryFn: () => api.professors.list(termId, snapshotId),
  })
}

export function useSubjects(termId?: string, snapshotId?: string) {
  return useQuery({
    queryKey: keys.subjects(termId, snapshotId),
    queryFn: () => api.subjects.list(termId, snapshotId),
  })
}

// Utility: format relative time
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Utility: status badge class
export function getStatusClass(status: string): string {
  switch (status) {
    case 'completed': return 'badge-fresh'
    case 'partial': return 'badge-stale'
    case 'failed': return 'badge-error'
    case 'running': return 'badge-running'
    default: return 'badge-idle'
  }
}

export function getFreshnessClass(isStale: boolean): string {
  return isStale ? 'badge-stale' : 'badge-fresh'
}