/** Main layout with navigation */
import { ReactNode } from 'react'
import { Link, useLocation, NavLink } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/professors', label: 'Professors', icon: '👨‍🏫' },
    { path: '/subjects', label: 'Subjects', icon: '📚' },
    { path: '/sections', label: 'Sections', icon: '📋' },
    { path: '/status', label: 'Data Status', icon: '📡' },
  ]

  return (
    <div className="min-h-screen bg-mapua-gray-light">
      {/* Header */}
      <header className="bg-mapua-black border-b border-mapua-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" aria-label="Mapúa Enrollment Dashboard Home">
              <svg className="w-8 h-8 text-mapua-red" viewBox="0 0 32 32" fill="currentColor">
                <rect width="32" height="32" rx="6"/>
                <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="18" fill="white">M</text>
              </svg>
              <span className="text-xl font-bold text-white hidden sm:block">Mapúa Enrollment Intelligence</span>
            </Link>

            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-mapua-red/10 text-mapua-red'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="content">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-mapua-gray">
          Mapúa Enrollment Intelligence Dashboard • Source: Mapúa Blackboard Course Catalog • Data refreshed on demand
        </div>
      </footer>
    </div>
  )
}