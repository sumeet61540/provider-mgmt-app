import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import TopBar from '../../components/TopBar.jsx'

export default function DataAffiliations() {
  const [groupFilter, setGroupFilter] = useState('')
  const { data: rows = [], isLoading } = useQuery({ queryKey: ['data-affiliations'], queryFn: () => api.listAffiliations({}) })

  const groups = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => map.set(r.group_id, r.group_name))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows])

  const filtered = groupFilter ? rows.filter((r) => r.group_id === groupFilter) : rows

  return (
    <>
      <TopBar title="Group Affiliations" breadcrumb="Home / Data / Group Affiliations" />
      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-4">
          Provider ↔ Group memberships ({rows.length} rows — providers with dual affiliation appear twice).
        </p>
        <div className="flex gap-2.5 mb-4">
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Groups</option>
            {groups.map(([id, name]) => <option key={id} value={id}>{name} ({id})</option>)}
          </select>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Provider</th>
                <th className="text-left px-3.5 py-2.5">NPI</th>
                <th className="text-left px-3.5 py-2.5">Group</th>
                <th className="text-left px-3.5 py-2.5">Effective Date</th>
                <th className="text-left px-3.5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center text-gray-500 py-8">Loading…</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-3.5 py-3 font-semibold">{r.provider_name} <span className="text-gray-400 font-normal">({r.provider_id})</span></td>
                  <td className="px-3.5 py-3 font-mono text-gray-600">{r.npi}</td>
                  <td className="px-3.5 py-3">{r.group_name} <span className="text-gray-400">({r.group_id})</span></td>
                  <td className="px-3.5 py-3 text-gray-600">{r.effective_date || '—'}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${r.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      ● {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-500 py-8">No affiliations match your filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
