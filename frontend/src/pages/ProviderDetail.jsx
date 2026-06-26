import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import TopBar from '../components/TopBar.jsx'
import { StatusPill, SourceBadge } from '../components/Badges.jsx'
import { useToast } from '../components/Toast.jsx'
import ParticipationForm from '../components/ParticipationForm.jsx'
import TerminateDialog from '../components/TerminateDialog.jsx'

const NETWORK_CODES = ['Medicare', 'CCN', 'COD', 'Commercial PPO']

export default function ProviderDetail() {
  const { providerId } = useParams()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [showHistory, setShowHistory] = useState(false)
  const [formState, setFormState] = useState(null) // { mode: 'add' } | { mode: 'edit', participation }
  const [terminateTarget, setTerminateTarget] = useState(null)
  const [flashIds, setFlashIds] = useState(new Set())
  const knownIds = useRef(new Set())
  const firstLoad = useRef(true)

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => api.getProvider(providerId),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (!provider) return
    const currentIds = new Set(provider.participations.map((p) => p.participation_id))

    if (firstLoad.current) {
      knownIds.current = currentIds
      firstLoad.current = false
      return
    }

    const newIds = [...currentIds].filter((id) => !knownIds.current.has(id))
    if (newIds.length > 0) {
      setFlashIds(new Set(newIds))
      showToast('Participation updated by UiPath Automation')
      setTimeout(() => setFlashIds(new Set()), 2400)
    }
    knownIds.current = currentIds
  }, [provider, showToast])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['provider', providerId] })

  if (isLoading || !provider) {
    return (
      <>
        <TopBar title="Loading…" breadcrumb={`Home / Providers / ${providerId}`} />
        <div className="p-7 text-gray-500">Loading provider…</div>
      </>
    )
  }

  const active = provider.participations.filter((p) => p.status === 'Active' || p.status === 'Pending')
  const history = provider.participations.filter((p) => p.status === 'Terminated')
  const initials = provider.provider_name
    .replace('Dr. ', '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const dualAffiliation = provider.group_affiliations.length > 1

  return (
    <>
      <TopBar
        title={provider.provider_name}
        breadcrumb={`Home / Providers / ${provider.provider_id}`}
        actions={
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-green-700 live-dot inline-block" />
            <span className="text-[12.5px] text-gray-500">Live · polling every 5s</span>
          </>
        }
      />

      <div className="p-7 max-w-[1400px] grid grid-cols-[35%_1fr] gap-[18px]">
        {/* LEFT: Profile */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <div
            className="w-16 h-16 rounded-full text-white font-extrabold text-xl flex items-center justify-center mb-2.5"
            style={{ background: 'linear-gradient(135deg,#0176D3,#3aa1f0)' }}
          >
            {initials}
          </div>
          <div className="text-lg font-extrabold">{provider.provider_name}</div>
          <div className="text-[13px] text-gray-500 mt-0.5">{provider.specialty}</div>
          <div className="text-xs text-gray-500 mt-1 font-mono" data-testid={`provider-npi-${provider.provider_id}`}>
            NPI: {provider.npi}
          </div>

          <SectionLabel>Demographics</SectionLabel>
          <Kv k="County" v={provider.county} />
          <Kv k="State" v={provider.state} />
          <Kv k="Office" v={provider.office_address} />
          <Kv k="Phone" v={provider.office_phone} />
          <Kv k="Email" v={provider.email} />

          <SectionLabel>Credentials</SectionLabel>
          <Kv k="Credentialing" v={<StatusPill status={provider.credentialing_status} />} />
          <Kv k="Board Cert" v={provider.board_certified ? '✓ Yes' : 'No'} />
          <Kv k="License #" v={provider.license_number} />
          <Kv k="License Exp" v={provider.license_expiration} />

          <SectionLabel>Group Affiliations</SectionLabel>
          {dualAffiliation && (
            <div className="bg-orange-50 text-orange-800 border border-orange-200 rounded-md px-3 py-2 text-xs mb-2">
              ⚠️ Dual affiliation — provider belongs to {provider.group_affiliations.length} groups
            </div>
          )}
          {provider.group_affiliations.map((g) => (
            <Kv key={g.group_id} k={`● ${g.group_name} (${g.group_id})`} v={<StatusPill status={g.status} />} />
          ))}
        </div>

        {/* RIGHT: Participation Panel */}
        <div>
          {provider.participations.some((p) => p.batch_id) && (
            <div className="bg-gradient-to-r from-teal-50 to-sf-light border border-teal-200 rounded-lg px-4 py-3 mb-3.5 flex items-center justify-between text-sm">
              <span>
                📋 <b>Group Request</b> · Batch{' '}
                {provider.participations.find((p) => p.batch_id)?.batch_id}
              </span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[14.5px]">Network Participation Assignments</h3>
                <div className="text-xs text-gray-500 mt-0.5">Last updated {new Date(provider.updated_at).toLocaleString()}</div>
              </div>
              <button
                data-testid="add-participation-btn"
                onClick={() => setFormState({ mode: 'add' })}
                className="px-3.5 py-2 rounded-md bg-sf-blue text-white text-[13px] font-semibold"
              >
                + Add Participation
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-[11.5px] uppercase tracking-wide font-bold bg-gray-50">
                  <th className="text-left px-3.5 py-2.5">Network</th>
                  <th className="text-left px-3.5 py-2.5">Agreement</th>
                  <th className="text-left px-3.5 py-2.5">Effective Date</th>
                  <th className="text-left px-3.5 py-2.5">Status</th>
                  <th className="text-left px-3.5 py-2.5">Source</th>
                  <th className="text-left px-3.5 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map((p) => (
                  <tr
                    key={p.participation_id}
                    data-testid={`participation-row-${p.participation_id}`}
                    className={`border-b border-gray-100 last:border-0 ${flashIds.has(p.participation_id) ? 'row-flash' : ''}`}
                  >
                    <td className="px-3.5 py-3 font-semibold" data-testid={`participation-network-${p.participation_id}`}>
                      {p.network_code}
                    </td>
                    <td className="px-3.5 py-3">{p.agreement_id}</td>
                    <td className="px-3.5 py-3">{p.effective_date}</td>
                    <td className="px-3.5 py-3" data-testid={`participation-status-${p.participation_id}`}>
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-3.5 py-3">
                      <SourceBadge source={p.source} />
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <button
                        data-testid={`edit-participation-${p.participation_id}`}
                        title="Edit"
                        onClick={() => setFormState({ mode: 'edit', participation: p })}
                        className="px-2 py-1.5 rounded-md border border-gray-300 mr-1.5"
                      >
                        ✏️
                      </button>
                      <button
                        data-testid={`terminate-participation-${p.participation_id}`}
                        onClick={() => setTerminateTarget(p)}
                        className="px-2.5 py-1.5 rounded-md border border-gray-300 text-[12.5px] font-semibold"
                      >
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))}
                {active.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-6">
                      No active network participations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-3.5">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-[14.5px]">Participation History</h3>
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-[12.5px] font-semibold"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
            </div>
            {showHistory && (
              <table className="w-full text-sm">
                <tbody>
                  {history.map((p) => (
                    <tr key={p.participation_id} className="border-b border-gray-100 last:border-0">
                      <td className="px-5 py-3 font-semibold">{p.network_code}</td>
                      <td className="px-3.5 py-3">{p.agreement_id}</td>
                      <td className="px-3.5 py-3">{p.effective_date} → {p.termination_date}</td>
                      <td className="px-3.5 py-3">
                        <StatusPill status={p.status} />
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td className="px-5 py-4 text-gray-500" colSpan={4}>
                        No terminated participations.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {formState && (
        <ParticipationForm
          mode={formState.mode}
          providerId={provider.provider_id}
          participation={formState.participation}
          networkCodes={NETWORK_CODES}
          onClose={() => setFormState(null)}
          onSaved={() => {
            refresh()
            setFormState(null)
          }}
        />
      )}

      {terminateTarget && (
        <TerminateDialog
          participation={terminateTarget}
          onClose={() => setTerminateTarget(null)}
          onTerminated={() => {
            refresh()
            setTerminateTarget(null)
          }}
        />
      )}
    </>
  )
}

function SectionLabel({ children }) {
  return <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mt-[18px] mb-2">{children}</div>
}

function Kv({ k, v }) {
  return (
    <div className="flex justify-between text-[13px] py-1.5">
      <span className="text-gray-500">{k}</span>
      <span className="font-semibold text-right">{v ?? '—'}</span>
    </div>
  )
}
