import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import TopBar from '../../components/TopBar.jsx'

const STATUS_PILL = {
  Active:  'bg-green-50 text-green-700',
  Expired: 'bg-gray-100 text-gray-500',
  Pending: 'bg-amber-50 text-amber-700',
}

export default function DataAgreements() {
  const [filterStatus, setFilterStatus] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterNetwork, setFilterNetwork] = useState('')

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['data-agreements'],
    queryFn: () => api.listAgreements(),
  })

  const groups = [...new Map(agreements.map((a) => [a.group_id, a.group_name])).entries()]
  const networks = [...new Map(agreements.map((a) => [a.network_code, a.network_name])).entries()]

  const filtered = agreements.filter((a) =>
    (!filterStatus  || a.status       === filterStatus)  &&
    (!filterGroup   || a.group_id     === filterGroup)   &&
    (!filterNetwork || a.network_code === filterNetwork)
  )

  return (
    <>
      <TopBar title="Agreement Repository" breadcrumb="Home / Data / Agreements" />
      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-4">
          All group–network agreements ({filtered.length} of {agreements.length} records).
        </p>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-sf-blue"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-sf-blue"
          >
            <option value="">All Groups</option>
            {groups.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-[13px] text-gray-700 focus:outline-none focus:border-sf-blue"
          >
            <option value="">All Networks</option>
            {networks.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          {(filterStatus || filterGroup || filterNetwork) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterGroup(''); setFilterNetwork('') }}
              className="text-[13px] text-sf-blue hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Agreement ID</th>
                <th className="text-left px-3.5 py-2.5">Agreement Name</th>
                <th className="text-left px-3.5 py-2.5">Group</th>
                <th className="text-left px-3.5 py-2.5">Network</th>
                <th className="text-left px-3.5 py-2.5">Effective Date</th>
                <th className="text-left px-3.5 py-2.5">Expiration Date</th>
                <th className="text-left px-3.5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">No agreements match the selected filters.</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.agreement_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-3.5 py-3 font-mono font-semibold text-sf-blue">{a.agreement_id}</td>
                  <td className="px-3.5 py-3">{a.agreement_name}</td>
                  <td className="px-3.5 py-3 text-gray-700">{a.group_name} <span className="text-gray-400 text-[11px]">({a.group_id})</span></td>
                  <td className="px-3.5 py-3 text-gray-700">{a.network_name}</td>
                  <td className="px-3.5 py-3 font-mono text-gray-600">{a.effective_date ?? '—'}</td>
                  <td className="px-3.5 py-3 font-mono text-gray-600">{a.expiration_date ?? '—'}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${STATUS_PILL[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      ● {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
