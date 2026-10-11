/** API types matching backend schemas */
export interface CourseRecord {
  source_id: string
  course_code: string
  course_name: string
  instructors: string[]
  description: string | null
  term_id: string
  retrieved_at: string
  snapshot_id: string | null
  sections: CourseSection[]
  schedule: string | null
  campus: string | null
}

export interface CourseSection {
  section_id: string
  section_name: string | null
  instructor: string | null
  schedule: string | null
  location: string | null
  seats_total: number | null
  seats_available: number | null
}

export interface CourseListResponse {
  items: CourseRecord[]
  total: number
  limit: number
  offset: number
}

export interface ProfessorSummary {
  name: string
  course_count: number
  courses: string[]
}

export interface SubjectSummary {
  code: string
  name: string
  section_count: number
  instructors: string[]
}

export interface SyncSnapshot {
  snapshot_id: string
  term_id: string
  started_at: string
  completed_at: string | null
  total_records: number
  new_records: number
  updated_records: number
  unchanged_records: number
  error_count: number
  errors: string[]
  status: 'running' | 'completed' | 'failed' | 'partial'
}

export interface SyncStatus {
  last_successful_sync: string | null
  last_attempt: string | null
  last_snapshot: SyncSnapshot | null
  current_status: 'idle' | 'running' | 'failed'
  is_stale: boolean
  stale_threshold_minutes: number
}

export interface RefreshResponse {
  snapshot_id: string
  status: string
  total_records: number
  new_records: number
  updated_records: number
  unchanged_records: number
  errors: string[]
}