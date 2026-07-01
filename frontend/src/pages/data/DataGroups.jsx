import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import TopBar from '../../components/TopBar.jsx'

export default function DataGroups() {
  const { data: groups = [], isLoading } = useQuery({ queryKey: ['data-groups'], queryFn: api.listGroups })

  return (
    <>
      <TopBar title="Groups" breadcrumb="Home / Data / Groups" />
      <div className="p-7 max-w-[1400px]">
        <p className="text-sm text-gray-500 mb-4">All medical groups in the system ({groups.length} records).</p>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11.5px] uppercase tracking-wide font-bold">
                <th className="text-left px-3.5 py-2.5">Group ID</th>
                <th className="text-left px-3.5 py-2.5">Name</th>
                <th className="text-left px-3.5 py-2.5">Tax ID</th>
                <th className="text-left px-3.5 py-2.5">Primary County</th>
                <th className="text-left px-3.5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center text-gray-500 py-8">Loading…</td></tr>
              ) : groups.map((g) => (
                <tr key={g.group_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3.5 py-3 font-mono font-semibold">{g.group_id}</td>
                  <td className="px-3.5 py-3 font-semibold">{g.group_name}</td>
                  <td className="px-3.5 py-3 font-mono text-gray-600">{g.tax_id || '—'}</td>
                  <td className="px-3.5 py-3 text-gray-600">{g.primary_county || '—'}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${g.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      ● {g.status}
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
