import { useState } from 'react'
import api from '../api/client'

export default function TerminateDialog({ participation, onClose, onTerminated }) {
  const [terminationDate, setTerminationDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setSaving(true)
    setError('')
    try {
      await api.terminateParticipation(participation.participation_id, {
        termination_date: terminationDate,
        source: 'Manual',
      })
      onTerminated()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not terminate participation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[420px] p-6">
        <h3 className="font-bold text-base mb-2">Terminate {participation.network_code} Participation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set a termination date for this network participation. This action is recorded in the audit log.
        </p>
        <label className="text-[11px] uppercase tracking-wide text-gray-500 font-bold block mb-1.5">
          Termination Date
        </label>
        <input
          type="date"
          value={terminationDate}
          onChange={(e) => setTerminationDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm"
        />
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || !terminationDate}
            className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Terminating…' : 'Confirm Terminate'}
          </button>
        </div>
      </div>
    </div>
  )
}
