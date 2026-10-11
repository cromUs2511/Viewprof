/** Sections Comparison page - placeholder for section-level data */
import { useSyncStatus, formatRelativeTime } from '../hooks/useCatalog'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'

export function SectionsPage() {
  const { data: syncStatus } = useSyncStatus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mapua-black">Section Comparison</h1>
        <p className="text-mapua-gray mt-1">Compare verified section information side by side</p>
      </div>

      <Card>
        <div className="card-body">
          <div className="flex items-start gap-4">
            <div className="text-4xl" aria-hidden="true">📋</div>
            <div>
              <h2 className="text-lg font-semibold text-mapua-black">Section Data Not Available</h2>
              <p className="text-mapua-gray mt-2">
                The public Blackboard course catalog view only exposes course-level information
                (course code, name, instructor, description). Section-level details such as
                section identifiers, schedules, room assignments, campuses, and seat availability
                require authenticated access to individual courses or an institutional API integration.
              </p>
              <p className="text-mapua-gray mt-3">
                <strong>Current data source:</strong> Mapúa Blackboard public catalog (guest access)
              </p>
              <p className="text-mapua-gray">
                <strong>Fields available:</strong> Course ID, Course Name, Instructor(s), Description
              </p>
              <p className="text-mapua-gray">
                <strong>Fields unavailable:</strong> Section Code, Schedule, Room, Campus, Seats, Enrollment Status
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <h2 className="text-lg font-semibold text-mapua-black">What Would Be Needed</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-mapua-charcoal">Option 1: Authenticated Browser Session</h3>
              <p className="text-sm text-mapua-gray mt-2">
                Use Playwright with a user's authenticated session to navigate into each course
                and extract section data from the course dashboard. Requires user credentials
                and cannot run unattended on a server.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-mapua-charcoal">Option 2: Institutional API</h3>
              <p className="text-sm text-mapua-gray mt-2">
                Request access to Mapúa's Blackboard REST APIs or SIS integration endpoints.
                Requires institutional approval and administrator credentials.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-mapua-charcoal">Option 3: Manual CSV/Export</h3>
              <p className="text-sm text-mapua-gray mt-2">
                Provide a mechanism for authorized staff to upload section exports (CSV/Excel)
                which the dashboard then merges with the catalog data.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-mapua-charcoal">Option 4: Public Schedule Page</h3>
              <p className="text-sm text-mapua-gray mt-2">
                Check if Mapúa publishes a separate public class schedule page with section details
                that can be scraped independently.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {syncStatus?.last_snapshot && (
        <Card>
          <div className="card-header">
            <h2 className="text-lg font-semibold text-mapua-black">Current Catalog Coverage</h2>
          </div>
          <div className="card-body">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-mapua-gray">Total Courses</dt>
                <dd className="text-2xl font-bold text-mapua-black mt-1">{syncStatus.last_snapshot.total_records.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Term</dt>
                <dd className="font-mono text-mapua-charcoal mt-1">{syncStatus.last_snapshot.term_id}</dd>
              </div>
              <div>
                <dt className="text-sm text-mapua-gray">Last Sync</dt>
                <dd className="text-sm text-mapua-black mt-1">{formatRelativeTime(syncStatus.last_snapshot.completed_at || '')}</dd>
              </div>
            </dl>
          </div>
        </Card>
      )}
    </div>
  )
}