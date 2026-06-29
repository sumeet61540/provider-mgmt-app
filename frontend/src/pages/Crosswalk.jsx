import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import TopBar from '../components/TopBar.jsx'

export default function Crosswalk() {
  const [groupFilter, setGroupFilter] = useState('')
  const [networkFilter, setNetworkFilter] = useState('')

  const { data: rows = [] } = useQuery({ queryKey: ['crosswalk'], queryFn: () => api.listCrosswalk({}) })

  const groups = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => map.set(r.group_id, r.group_name))
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows])

  const networks = useMemo(() => {
    const set = new Set(rows.map((r) => r.network_code))
    return [...set]
  }, [rows])

  const filtered = rows.filter(
    (r) => (!groupFilter || r.group_id === groupFilter) && (!networkFilter || r.network_code === networkFilter)
  )

  return (
    <>
      <TopBar title="Network Crosswalk" breadcrumb="Home / Crosswalk" />

      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-4 max-w-2xl">
          Reference mapping of which agreement applies to which network for each group. Use this to confirm the
          correct Agreement ID before adding or editing a provider's network participation.
        </p>

        <div className="flex gap-2.5 mb-4 flex-wrap">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Groups</option>
            {groups.map(([id, name]) => (
              <option key={id} value={id}>
                {name} ({id})
              </option>
            ))}
          </select>
          <select
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Networks</option>
            {networks.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Group</th>
                <th className="text-left px-3.5 py-2.5">Network</th>
                <th className="text-left px-3.5 py-2.5">Agreement ID</th>
                <th className="text-left px-3.5 py-2.5">Product Line</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.agreement_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3.5 py-3 font-semibold">
                    {r.group_name} <span className="text-gray-400 font-normal">({r.group_id})</span>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-sf-blue">
                      {r.network_code}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-mono">{r.agreement_id}</td>
                  <td className="px-3.5 py-3 text-gray-500">{r.product_line}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    No crosswalk entries match your filters.
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
