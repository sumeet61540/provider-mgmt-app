import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import TopBar from '../components/TopBar.jsx'
import { ActionPill, SourceBadge } from '../components/Badges.jsx'

const BORDER_BY_ACTION = {
  Add: 'border-l-green-600',
  GroupAdd: 'border-l-green-600',
  Update: 'border-l-orange-500',
  Terminate: 'border-l-red-600',
}

export default function AuditLog() {
  const [providerTerm, setProviderTerm] = useState('')
  const [network, setNetwork] = useState('')
  const [action, setAction] = useState('')
  const [source, setSource] = useState('')
  const [scenario, setScenario] = useState('')
  const [expanded, setExpanded] = useState(null)

  const { data: audit = [] } = useQuery({ queryKey: ['audit-all'], queryFn: () => api.listAudit({}) })

  const filtered = useMemo(() => {
    return audit.filter((a) => {
      const term = providerTerm.toLowerCase()
      const matchesProvider =
        !term || a.provider_name.toLowerCase().includes(term) || a.provider_id.toLowerCase().includes(term)
      const matchesNetwork = !network || a.network_code === network
      const matchesAction = !action || a.action_type === action
      const matchesSource = !source || a.source === source
      const matchesScenario = !scenario || a.scenario === scenario
      return matchesProvider && matchesNetwork && matchesAction && matchesSource && matchesScenario
    })
  }, [audit, providerTerm, network, action, source, scenario])

  const exportCsv = () => {
    const headers = [
      'Transaction ID', 'Timestamp', 'Provider', 'Action', 'Network', 'Effective Date',
      'Performed By', 'Source', 'Scenario', 'Notes',
    ]
    const rows = filtered.map((a) => [
      a.transaction_id, a.timestamp, a.provider_name, a.action_type, a.network_code,
      a.effective_date, a.performed_by, a.source, a.scenario || '', a.notes || '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'audit-log.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <TopBar
        title="Audit Log"
        breadcrumb="Home / Audit Log"
        actions={
          <button onClick={exportCsv} className="px-3.5 py-2 rounded-md border border-gray-300 text-[13px] font-semibold">
            ⬇ Export CSV
          </button>
        }
      />

      <div className="p-7 max-w-[1400px]">
        <div className="flex gap-2.5 mb-4 flex-wrap">
          <input
            value={providerTerm}
            onChange={(e) => setProviderTerm(e.target.value)}
            placeholder="Provider name or ID…"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[220px]"
          />
          <select value={network} onChange={(e) => setNetwork(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Networks</option>
            {['Medicare', 'CCN', 'COD', 'Commercial PPO'].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Actions</option>
            {['Add', 'Update', 'Terminate', 'GroupAdd'].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Sources</option>
            <option value="API">UiPath Agent</option>
            <option value="RPA">UiPath RPA</option>
            <option value="Manual">Manual</option>
          </select>
          <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Scenarios</option>
            {['A', 'B', 'C', 'D'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Transaction ID</th>
                <th className="text-left px-3.5 py-2.5">Timestamp</th>
                <th className="text-left px-3.5 py-2.5">Provider</th>
                <th className="text-left px-3.5 py-2.5">Action</th>
                <th className="text-left px-3.5 py-2.5">Network</th>
                <th className="text-left px-3.5 py-2.5">Effective Date</th>
                <th className="text-left px-3.5 py-2.5">Performed By</th>
                <th className="text-left px-3.5 py-2.5">Scenario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const isOpen = expanded === a.transaction_id
                const borderClass = a.source !== 'Manual' ? 'border-l-sf-teal' : BORDER_BY_ACTION[a.action_type] || 'border-l-transparent'
                return (
                  <FragmentRow key={a.transaction_id}>
                    <tr
                      data-testid={`audit-row-${a.transaction_id}`}
                      className={`border-b border-gray-100 border-l-[3px] ${borderClass}`}
                    >
                      <td className="px-3.5 py-3 font-mono text-xs">{a.transaction_id.slice(0, 8)}</td>
                      <td className="px-3.5 py-3 text-gray-500">{new Date(a.timestamp).toLocaleString()}</td>
                      <td className="px-3.5 py-3 font-semibold">{a.provider_name}</td>
                      <td className="px-3.5 py-3"><ActionPill action={a.action_type} /></td>
                      <td className="px-3.5 py-3">{a.network_code}</td>
                      <td className="px-3.5 py-3">{a.effective_date}</td>
                      <td className="px-3.5 py-3"><SourceBadge source={a.source} analystName={a.analyst_name} /></td>
                      <td className="px-3.5 py-3">
                        {a.scenario ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-gray-100 text-gray-600">
                            {a.scenario}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <button
                          className="text-sf-blue font-semibold text-[12.5px]"
                          onClick={() => setExpanded(isOpen ? null : a.transaction_id)}
                        >
                          Details {isOpen ? '▴' : '▾'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={9} className="bg-gray-50 px-6 py-3.5 text-[12.5px]">
                          <div className="grid grid-cols-4 gap-3.5">
                            <div><span className="text-gray-500">Previous Status</span><br /><b>{a.previous_status || 'None'}</b></div>
                            <div><span className="text-gray-500">New Status</span><br /><b>{a.new_status}</b></div>
                            <div><span className="text-gray-500">Work Item ID</span><br /><b>{a.work_item_id || '—'}</b></div>
                            <div><span className="text-gray-500">Batch ID</span><br /><b>{a.batch_id || '—'}</b></div>
                          </div>
                          {a.notes && <div className="mt-2"><span className="text-gray-500">Notes</span><br />{a.notes}</div>}
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-8">
                    No audit entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function FragmentRow({ children }) {
  return <>{children}</>
}
