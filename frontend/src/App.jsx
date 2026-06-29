import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import { ToastProvider } from './components/Toast.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProviderList from './pages/ProviderList.jsx'
import ProviderDetail from './pages/ProviderDetail.jsx'
import Crosswalk from './pages/Crosswalk.jsx'
import AuditLog from './pages/AuditLog.jsx'

export default function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/providers" element={<ProviderList />} />
            <Route path="/providers/:providerId" element={<ProviderDetail />} />
            <Route path="/crosswalk" element={<Crosswalk />} />
            <Route path="/audit" element={<AuditLog />} />
          </Routes>
        </div>
      </div>
    </ToastProvider>
  )
}
