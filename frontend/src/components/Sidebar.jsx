import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Users, ClipboardList, RotateCcw } from 'lucide-react'
import api from '../api/client'
import ResetConfirmModal from './ResetConfirmModal'

const dotClass = {
  Ready: 'bg-gray-400',
  'In Progress': 'bg-orange-600',
  Complete: 'bg-sf-teal',
}

export default function Sidebar() {
  const [showReset, setShowReset] = useState(false)

  const { data: status } = useQuery({
    queryKey: ['demo-status'],
    queryFn: api.demoStatus,
    refetchInterval: 5000,
  })

  const navClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] font-medium mb-0.5 border-l-[3px] ${
      isActive
        ? 'bg-sf-teal/15 border-sf-teal text-white font-semibold'
        : 'border-transparent text-white/80 hover:bg-white/5'
    }`

  return (
    <aside className="w-60 shrink-0 bg-sf-dark text-white flex flex-col sticky top-0 h-screen">
      <div className="px-5 py-5 pb-4 font-extrabold text-[15px] border-b border-white/10 flex items-center gap-2">
        Genzeon <span className="text-white/40 font-normal">×</span> UiPath
      </div>

      <nav className="p-2.5 flex-1">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>
        <NavLink to="/providers" className={navClass}>
          <Users size={16} /> Providers
        </NavLink>
        <NavLink to="/audit" className={navClass}>
          <ClipboardList size={16} /> Audit Log
        </NavLink>
      </nav>

      <div className="p-2.5 border-t border-white/10">
        <div className="text-[10.5px] uppercase tracking-wider text-white/40 px-3 pt-1 pb-1.5">
          Demo Controls
        </div>
        <button
          data-testid="demo-reset-btn"
          onClick={() => setShowReset(true)}
          className="w-full bg-sf-teal hover:bg-[#00928a] text-white font-semibold text-[13px] py-2.5 rounded-md flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} /> Reset Demo
        </button>
        <div className="flex gap-2 px-3 pt-2.5 pb-1 text-[11.5px] text-white/55">
          {(status || ['A', 'B', 'C', 'D'].map((s) => ({ scenario: s, status: 'Ready' }))).map((s) => (
            <span key={s.scenario} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass[s.status] || 'bg-gray-400'}`} />
              {s.scenario}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 text-[11px] text-white/40 border-t border-white/10">
        Provider Ops Simulator
        <br />
        Demo v1.0
      </div>

      {showReset && <ResetConfirmModal onClose={() => setShowReset(false)} />}
    </aside>
  )
}
