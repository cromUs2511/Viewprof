/** API client with typed endpoints */
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => fetchJson<{ status: string; timestamp: string }>('/health'),

  sync: {
    status: (termId?: string) =>
      fetchJson<SyncStatus>(`/sync/status${termId ? `?term_id=${termId}` : ''}`),
    refresh: (termId?: string, adminKey?: string) =>
      fetchJson<RefreshResponse>(
        `/sync/refresh${termId ? `?term_id=${termId}` : ''}`,
        { method: 'POST', headers: adminKey ? { 'X-Admin-Key': adminKey } : {} }
      ),
  },

  catalog: {
    list: (params: {
      term_id?: string
      snapshot_id?: string
      search?: string
      professor?: string
      subject_code?: string
      limit?: number
      offset?: number
    }) => {
      const sp = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => v !== undefined && sp.set(k, String(v)))
      return fetchJson<CourseListResponse>(`/catalog?${sp}`)
    },
    get: (id: number, termId?: string, snapshotId?: string) => {
      const sp = new URLSearchParams()
      if (termId) sp.set('term_id', termId)
      if (snapshotId) sp.set('snapshot_id', snapshotId)
      return fetchJson<CourseRecord>(`/catalog/${id}?${sp}`)
    },
  },

  professors: {
    list: (termId?: string, snapshotId?: string) => {
      const sp = new URLSearchParams()
      if (termId) sp.set('term_id', termId)
      if (snapshotId) sp.set('snapshot_id', snapshotId)
      return fetchJson<ProfessorSummary[]>(`/professors?${sp}`)
    },
  },

  subjects: {
    list: (termId?: string, snapshotId?: string) => {
      const sp = new URLSearchParams()
      if (termId) sp.set('term_id', termId)
      if (snapshotId) sp.set('snapshot_id', snapshotId)
      return fetchJson<SubjectSummary[]>(`/subjects?${sp}`)
    },
  },
}

// Re-export types for convenience
export type {
  CourseRecord,
  CourseSection,
  CourseListResponse,
  ProfessorSummary,
  SubjectSummary,
  SyncSnapshot,
  SyncStatus,
  RefreshResponse,
} from '../types/api'