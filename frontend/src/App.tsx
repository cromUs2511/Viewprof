/** Main App with routing */
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OverviewPage } from './pages/OverviewPage'
import { ProfessorsPage } from './pages/ProfessorsPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SectionsPage } from './pages/SectionsPage'
import { StatusPage } from './pages/StatusPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><OverviewPage /></Layout>} />
      <Route path="/professors" element={<Layout><ProfessorsPage /></Layout>} />
      <Route path="/subjects" element={<Layout><SubjectsPage /></Layout>} />
      <Route path="/sections" element={<Layout><SectionsPage /></Layout>} />
      <Route path="/status" element={<Layout><StatusPage /></Layout>} />
    </Routes>
  )
}