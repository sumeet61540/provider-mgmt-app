import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import TopBar from '../../components/TopBar.jsx'
import { StatusPill, SourceBadge } from '../../components/Badges.jsx'

export default function DataParticipations() {
  const [networkFilter, setNetworkFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['data-participations', networkFilter, statusFilter],
    queryFn: () => api.listAllParticipations({
      ...(networkFilter ? { network_code: networkFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
  })

  return (
    <>
      <TopBar title="Provider Participations" breadcrumb="Home / Data / Participations" />
      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-4">All network participation assignments across all providers ({rows.length} rows).</p>
        <div className="flex gap-2.5 mb-4 flex-wrap">
          <select value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Networks</option>
            {['Medicare', 'CCN', 'COD', 'Commercial PPO'].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            {['Active', 'Pending', 'Terminated'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Provider</th>
                <th className="text-left px-3.5 py-2.5">NPI</th>
                <th className="text-left px-3.5 py-2.5">Network</th>
                <th className="text-left px-3.5 py-2.5">Agreement</th>
                <th className="text-left px-3.5 py-2.5">Effective Date</th>
                <th className="text-left px-3.5 py-2.5">Termination Date</th>
                <th className="text-left px-3.5 py-2.5">Status</th>
                <th className="text-left px-3.5 py-2.5">Source</th>
                <th className="text-left px-3.5 py-2.5">Batch ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center text-gray-500 py-8">Loading…</td></tr>
              ) : rows.map((r) => (
                <tr key={r.participation_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3.5 py-3 font-semibold">{r.provider_name} <span className="text-gray-400 font-normal">({r.provider_id})</span></td>
                  <td className="px-3.5 py-3 font-mono text-gray-600">{r.npi}</td>
                  <td className="px-3.5 py-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-sf-blue">{r.network_code}</span>
                  </td>
                  <td className="px-3.5 py-3 font-mono text-gray-600">{r.agreement_id || '—'}</td>
                  <td className="px-3.5 py-3 text-gray-600">{r.effective_date || '—'}</td>
                  <td className="px-3.5 py-3 text-gray-500">{r.termination_date || '—'}</td>
                  <td className="px-3.5 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-3.5 py-3"><SourceBadge source={r.source} /></td>
                  <td className="px-3.5 py-3 font-mono text-gray-500 text-xs">{r.batch_id || '—'}</td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-500 py-8">No participations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
