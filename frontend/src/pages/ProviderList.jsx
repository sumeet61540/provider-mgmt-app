import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { isWithinInterval, subMinutes } from 'date-fns'
import api from '../api/client'
import TopBar from '../components/TopBar.jsx'
import { StatusPill, NetworkPill } from '../components/Badges.jsx'

export default function ProviderList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: api.listProviders,
    refetchInterval: 5000,
  })

  const groups = useMemo(() => {
    const set = new Map()
    providers.forEach((p) => p.group_names.forEach((g) => set.set(g, g)))
    return [...set.values()].sort()
  }, [providers])

  const filtered = providers.filter((p) => {
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      p.provider_name.toLowerCase().includes(term) ||
      p.npi.includes(term) ||
      (p.specialty || '').toLowerCase().includes(term)
    const matchesGroup = !groupFilter || p.group_names.includes(groupFilter)
    return matchesSearch && matchesGroup
  })

  const recentlyAutomated = (provider) =>
    provider.networks.length > 0 &&
    isWithinInterval(new Date(provider.updated_at), { start: subMinutes(new Date(), 30), end: new Date() })

  return (
    <>
      <TopBar title="Providers" breadcrumb="Home / Providers" />

      <div className="p-7 max-w-[1400px]">
        <div className="flex gap-2.5 mb-4 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            <input
              data-testid="provider-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, NPI, or specialty…"
              className="border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm min-w-[260px]"
            />
          </div>
          <select
            data-testid="group-filter-select"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Provider ID</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Name</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">NPI</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Specialty</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">County</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Group</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Credentialing</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Networks</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Last Updated</th>
                <th className="text-left px-3.5 py-2.5 border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.provider_id}
                  data-testid={`provider-row-${p.provider_id}`}
                  className={`border-b border-gray-100 last:border-0 hover:bg-blue-50 ${i % 2 === 1 ? 'bg-gray-50/60' : ''}`}
                >
                  <td className="px-3.5 py-3">
                    {recentlyAutomated(p) && <span className="inline-block w-2 h-2 rounded-full bg-sf-teal robot-dot mr-1.5" />}
                    {p.provider_id}
                  </td>
                  <td className="px-3.5 py-3 font-semibold" data-testid={`provider-name-${p.provider_id}`}>
                    {p.provider_name}
                  </td>
                  <td className="px-3.5 py-3 font-mono" data-testid={`provider-npi-${p.provider_id}`}>
                    {p.npi}
                  </td>
                  <td className="px-3.5 py-3">{p.specialty}</td>
                  <td className="px-3.5 py-3">{p.county}</td>
                  <td className="px-3.5 py-3">
                    {p.group_names[0]}
                    {p.group_names.length > 1 && (
                      <span className="ml-1 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700">
                        +{p.group_names.length - 1}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-3">
                    <StatusPill status={p.credentialing_status} />
                  </td>
                  <td className="px-3.5 py-3">
                    {p.networks.length > 0 ? (
                      p.networks.map((n) => <NetworkPill key={n} network={n} />)
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 text-gray-500">{new Date(p.updated_at).toLocaleDateString()}</td>
                  <td className="px-3.5 py-3">
                    <button
                      data-testid={`provider-view-${p.provider_id}`}
                      onClick={() => navigate(`/providers/${p.provider_id}`)}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-[12.5px] font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-gray-500 py-8">
                    No providers match your filters.
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
