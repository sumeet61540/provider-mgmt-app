import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import TopBar from '../../components/TopBar.jsx'

const ACTION_STYLE = {
  Exclude: 'bg-red-50 text-red-700',
  ExceptionFlag: 'bg-orange-50 text-orange-700',
  'N/A': 'bg-gray-100 text-gray-600',
}

export default function DataRules() {
  const [networkFilter, setNetworkFilter] = useState('')
  const { data: rules = [], isLoading } = useQuery({ queryKey: ['data-rules'], queryFn: () => api.listRules({}) })

  const filtered = networkFilter ? rules.filter((r) => r.network_name === networkFilter) : rules
  const networks = [...new Set(rules.map((r) => r.network_name))]

  return (
    <>
      <TopBar title="Network Eligibility Rules" breadcrumb="Home / Data / Eligibility Rules" />
      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-1">
          Rules R001–R010 governing which networks a provider qualifies for (from UIPATH_BUILD_STEPS.md Appendix B).
        </p>
        <p className="text-sm text-gray-500 mb-4">
          <span className="inline-flex px-2 py-0.5 rounded text-[11.5px] font-semibold bg-red-50 text-red-700 mr-1.5">Exclude</span>
          Provider is excluded from that network if rule fails.
          <span className="inline-flex px-2 py-0.5 rounded text-[11.5px] font-semibold bg-orange-50 text-orange-700 mx-1.5">ExceptionFlag</span>
          Agent flags for manual review but doesn't auto-exclude.
        </p>
        <div className="flex gap-2.5 mb-4">
          <select value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Networks</option>
            {networks.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Rule ID</th>
                <th className="text-left px-3.5 py-2.5">Network</th>
                <th className="text-left px-3.5 py-2.5">Rule Type</th>
                <th className="text-left px-3.5 py-2.5">Rule Value</th>
                <th className="text-left px-3.5 py-2.5">Action if Fails</th>
                <th className="text-left px-3.5 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Loading…</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.rule_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3.5 py-3 font-mono font-semibold">{r.rule_id}</td>
                  <td className="px-3.5 py-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-sf-blue">{r.network_name}</span>
                  </td>
                  <td className="px-3.5 py-3 text-gray-700">{r.rule_type}</td>
                  <td className="px-3.5 py-3 text-gray-600">{r.rule_value || '—'}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${ACTION_STYLE[r.action_if_fails] || 'bg-gray-100 text-gray-600'}`}>
                      {r.action_if_fails}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-gray-500 text-xs">{r.notes || '—'}</td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">No rules match your filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
