const STATUS_PILL = {
  Active: 'bg-green-50 text-green-700',
  Pending: 'bg-orange-50 text-orange-700',
  Terminated: 'bg-red-50 text-red-700 line-through',
}

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${STATUS_PILL[status] || 'bg-gray-100 text-gray-600'}`}>
      ● {status}
    </span>
  )
}

export function NetworkPill({ network, terminated }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold mr-1 ${
        terminated ? 'bg-red-50 text-red-700 line-through' : 'bg-blue-50 text-sf-blue'
      }`}
    >
      {network}
    </span>
  )
}

export function SourceBadge({ source, analystName }) {
  if (source === 'API') {
    return (
      <span
        data-testid="source-badge-uipath-agent"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#00A99D,#00d4c4)', boxShadow: '0 1px 4px rgba(0,169,157,.35)' }}
      >
        🤖 UiPath Agent
      </span>
    )
  }
  if (source === 'RPA') {
    return (
      <span
        data-testid="source-badge-uipath-rpa"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#0176D3,#3aa1f0)', boxShadow: '0 1px 4px rgba(1,118,211,.35)' }}
      >
        🤖 UiPath RPA
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-gray-100 text-gray-600">
      {analystName || 'Manual'}
    </span>
  )
}

export function ActionPill({ action }) {
  const map = {
    Add: 'bg-green-50 text-green-700',
    Update: 'bg-orange-50 text-orange-700',
    Terminate: 'bg-red-50 text-red-700',
    GroupAdd: 'bg-green-50 text-green-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${map[action] || 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  )
}
