import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useToast } from './Toast'

export default function ResetConfirmModal({ onClose, providerId }) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const handleReset = async () => {
    setLoading(true)
    try {
      if (providerId) {
        await api.demoResetProvider(providerId)
      } else {
        await api.demoReset()
      }
      await queryClient.invalidateQueries()
      showToast('Demo reset to initial state. Ready for Scenario A.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[420px] p-6">
        <h3 className="font-bold text-base mb-2">⚠️ Reset Demo State</h3>
        <p className="text-sm text-gray-600 mb-5">
          This will restore {providerId ? `provider ${providerId}'s` : 'all provider'} participation
          records to the pre-demo state. All automation-created records will be removed.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold disabled:opacity-60"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-sf-teal text-white text-sm font-semibold disabled:opacity-60"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? 'Resetting…' : 'Reset Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
