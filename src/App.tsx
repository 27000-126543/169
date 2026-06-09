import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import MineDetail from '@/pages/MineDetail'
import Alerts from '@/pages/Alerts'
import Geology from '@/pages/Geology'
import Reports from '@/pages/Reports'
import { mines } from '@/data/mock'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mine/:mineId" element={<MineDetail />} />
          <Route path="/mine" element={<Navigate to={`/mine/${mines[0].id}`} replace />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/geology" element={<Geology />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  )
}
