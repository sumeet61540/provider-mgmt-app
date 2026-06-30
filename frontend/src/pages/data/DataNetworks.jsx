import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import TopBar from '../../components/TopBar.jsx'

export default function DataNetworks() {
  const { data: networks = [], isLoading } = useQuery({ queryKey: ['data-networks'], queryFn: api.listNetworks })

  return (
    <>
      <TopBar title="Networks" breadcrumb="Home / Data / Networks" />
      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-4">All provider networks in the system ({networks.length} records).</p>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Network Code</th>
                <th className="text-left px-3.5 py-2.5">Name</th>
                <th className="text-left px-3.5 py-2.5">Product Line</th>
                <th className="text-left px-3.5 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center text-gray-500 py-8">Loading…</td></tr>
              ) : networks.map((n) => (
                <tr key={n.network_code} className="border-b border-gray-100 last:border-0">
                  <td className="px-3.5 py-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-sf-blue">
                      {n.network_code}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-semibold">{n.network_name}</td>
                  <td className="px-3.5 py-3 text-gray-600">{n.product_line || '—'}</td>
                  <td className="px-3.5 py-3 text-gray-500">{n.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
