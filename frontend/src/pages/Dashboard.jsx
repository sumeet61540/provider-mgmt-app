import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isToday, parseISO } from 'date-fns'
import api from '../api/client'
import TopBar from '../components/TopBar.jsx'
import { SourceBadge } from '../components/Badges.jsx'
import ResetConfirmModal from '../components/ResetConfirmModal.jsx'

const NETWORK_CODES = ['Medicare', 'CCN', 'COD', 'Commercial PPO']

const SCENARIO_PILL = {
  Ready: 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-orange-50 text-orange-700',
  Complete: 'bg-green-50 text-green-700',
}

export default function Dashboard() {
  const [showReset, setShowReset] = useState(false)

  const { data: providers = [] } = useQuery({ queryKey: ['providers'], queryFn: api.listProviders })
  const { data: audit = [] } = useQuery({ queryKey: ['audit-all'], queryFn: () => api.listAudit({}) })
  const { data: status = [] } = useQuery({ queryKey: ['demo-status'], queryFn: api.demoStatus })

  const activeParticipations = providers.reduce((sum, p) => sum + p.networks.length, 0)
  const pendingProviders = providers.filter((p) => p.credentialing_status === 'Pending').length
  const automationToday = audit.filter((a) => a.source !== 'Manual' && isToday(parseISO(a.timestamp))).length

  const networkCounts = NETWORK_CODES.map((code) => ({
    code,
    count: providers.filter((p) => p.networks.includes(code)).length,
  }))

  return (
    <>
      <TopBar
        title="Dashboard"
        breadcrumb="Home"
        actions={
          <button
            data-testid="demo-reset-btn"
            onClick={() => setShowReset(true)}
            className="px-3.5 py-2 rounded-md bg-sf-blue text-white text-[13px] font-semibold"
          >
            🔄 Reset Demo
          </button>
        }
      />

      <div className="p-7 max-w-[1400px]">
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard label="Total Providers" value={providers.length} />
          <StatCard label="Active Participations" value={activeParticipations} foot="across 4 networks" />
          <StatCard label="Pending Updates" value={pendingProviders} foot="awaiting review" footClass="text-orange-600" />
          <StatCard label="Automation Actions Today" value={automationToday} foot="🤖 UiPath Agent + RPA" footClass="text-sf-teal" />
        </div>

        <div className="grid grid-cols-[60%_1fr] gap-[18px]">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-[14.5px]">Recent Activity</h3>
              <div className="text-xs text-gray-500 mt-0.5">Last 10 audit log entries</div>
            </div>
            <div className="px-5">
              {audit.slice(0, 10).map((a) => (
                <div
                  key={a.transaction_id}
                  className={`flex gap-3 py-3 border-b border-gray-100 last:border-0 pl-3 -ml-0.5 border-l-[3px] ${
                    a.source !== 'Manual' ? 'border-l-sf-teal bg-teal-50/40' : 'border-l-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-sf-light flex items-center justify-center shrink-0 text-sm">
                    {a.action_type === 'Terminate' ? '🛑' : a.action_type === 'Update' ? '✏️' : '➕'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[13.5px]">
                      {a.provider_name} — {a.action_type} {a.network_code}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                      {new Date(a.timestamp).toLocaleString()} <SourceBadge source={a.source} analystName={a.analyst_name} />
                    </div>
                  </div>
                </div>
              ))}
              {audit.length === 0 && <div className="text-sm text-gray-500 py-6 text-center">No activity yet.</div>}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-fit">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-[14.5px]">Network Coverage</h3>
            </div>
            <div className="px-5 py-3">
              {networkCounts.map((n) => (
                <div key={n.code} className="flex justify-between items-center py-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-sf-blue">
                    {n.code}
                  </span>
                  <span className="font-bold">{n.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-[18px]">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[14.5px]">Scenario Status</h3>
              <div className="text-xs text-gray-500 mt-0.5">Pre-demo state for each Blues Connect walkthrough</div>
            </div>
            <button
              data-testid="demo-reset-btn"
              onClick={() => setShowReset(true)}
              className="px-3.5 py-2 rounded-md border border-gray-300 text-[13px] font-semibold"
            >
              Reset All
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3.5 p-5">
            {status.map((s) => (
              <div key={s.scenario} className="border border-gray-200 rounded-lg p-3.5">
                <div className="w-7 h-7 rounded-md bg-sf-light text-sf-dark font-extrabold text-[13px] flex items-center justify-center mb-2">
                  {s.scenario}
                </div>
                <div className="font-bold text-[13px]">{s.label}</div>
                <div className="text-[11.5px] text-gray-500 my-1">{s.description}</div>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${SCENARIO_PILL[s.status]}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReset && <ResetConfirmModal onClose={() => setShowReset(false)} />}
    </>
  )
}

function StatCard({ label, value, foot, footClass = 'text-green-700' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-[18px] shadow-sm">
      <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-[28px] font-extrabold mt-1.5 text-sf-dark">{value}</div>
      {foot && <div className={`text-xs mt-1 font-semibold ${footClass}`}>{foot}</div>}
    </div>
  )
}
