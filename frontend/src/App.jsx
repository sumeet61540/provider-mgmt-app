import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import { ToastProvider } from './components/Toast.jsx'
import ChatBubble from './components/ChatBubble.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProviderList from './pages/ProviderList.jsx'
import ProviderDetail from './pages/ProviderDetail.jsx'
import AuditLog from './pages/AuditLog.jsx'
import Crosswalk from './pages/Crosswalk.jsx'
import DataGroups from './pages/data/DataGroups.jsx'
import DataNetworks from './pages/data/DataNetworks.jsx'
import DataAffiliations from './pages/data/DataAffiliations.jsx'
import DataParticipations from './pages/data/DataParticipations.jsx'
import DataRules from './pages/data/DataRules.jsx'
import DataAgreements from './pages/data/DataAgreements.jsx'

export default function App() {
  const [chatEnabled, setChatEnabled] = useState(true)

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen">
        {/* Full-width centered topbar */}
        <div className="flex items-center justify-center shrink-0" style={{ height: '56px', backgroundColor: '#0F2D5E', borderBottom: '2px solid #00A99D', position: 'relative', zIndex: 50 }}>
          <span style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 700 }}>
            Provider Network Management
          </span>
        </div>
        <div className="flex flex-1 min-h-0">
          <Sidebar chatEnabled={chatEnabled} onToggleChat={() => setChatEnabled((v) => !v)} />
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/providers" element={<ProviderList />} />
              <Route path="/providers/:providerId" element={<ProviderDetail />} />
              <Route path="/audit" element={<AuditLog />} />
              {/* /crosswalk redirect — preserves any bookmarks to the old URL */}
              <Route path="/crosswalk" element={<Navigate to="/data/crosswalk" replace />} />
              {/* Data section */}
              <Route path="/data/groups" element={<DataGroups />} />
              <Route path="/data/networks" element={<DataNetworks />} />
              <Route path="/data/affiliations" element={<DataAffiliations />} />
              <Route path="/data/crosswalk" element={<Crosswalk />} />
              <Route path="/data/participations" element={<DataParticipations />} />
              <Route path="/data/rules" element={<DataRules />} />
              <Route path="/data/agreements" element={<DataAgreements />} />
            </Routes>
          </div>
        </div>
      </div>
      {/* ChatBubble renders outside Routes so it persists across navigation */}
      <ChatBubble enabled={chatEnabled} />
    </ToastProvider>
  )
}
