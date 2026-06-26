import { useState } from 'react'
import api from '../api/client'

export default function ParticipationForm({ mode, providerId, participation, networkCodes, onClose, onSaved }) {
  const isEdit = mode === 'edit'
  const [networkCode, setNetworkCode] = useState(participation?.network_code || networkCodes[0])
  const [agreementId, setAgreementId] = useState(participation?.agreement_id || '')
  const [effectiveDate, setEffectiveDate] = useState(participation?.effective_date || '')
  const [source, setSource] = useState(participation?.source === 'RPA' ? 'RPA' : 'Manual')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await api.updateParticipation(participation.participation_id, {
          agreement_id: agreementId,
          effective_date: effectiveDate,
          source,
        })
      } else {
        await api.addParticipation(providerId, {
          network_code: networkCode,
          agreement_id: agreementId,
          effective_date: effectiveDate,
          source,
        })
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-[480px] p-6">
        <h3 className="font-bold text-base mb-4">{isEdit ? 'Edit Participation' : 'Add Participation'}</h3>

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-gray-500 font-bold block mb-1.5">Network</label>
            <select
              data-testid="network-select"
              value={networkCode}
              onChange={(e) => setNetworkCode(e.target.value)}
              disabled={isEdit}
              className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm disabled:bg-gray-100"
            >
              {networkCodes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-gray-500 font-bold block mb-1.5">Agreement ID</label>
            <input
              data-testid="agreement-input"
              value={agreementId}
              onChange={(e) => setAgreementId(e.target.value)}
              placeholder="AGR100"
              required
              className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-gray-500 font-bold block mb-1.5">Effective Date</label>
            <input
              data-testid="effective-date-input"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-gray-500 font-bold block mb-1.5">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
            >
              <option value="API">API</option>
              <option value="RPA">RPA</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="submit-participation-btn"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-sf-blue text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  )
}
