import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Users, ClipboardList, RotateCcw,
  Database, ChevronDown, ChevronRight,
  Building2, Network, Link2, UserCheck, ListChecks, ShieldCheck, Bot, FileText,
} from 'lucide-react'
import api from '../api/client'
import ResetConfirmModal from './ResetConfirmModal'

const dotClass = {
  Ready: 'bg-gray-400',
  'In Progress': 'bg-orange-600',
  Complete: 'bg-sf-teal',
}

export default function Sidebar({ chatEnabled, onToggleChat }) {
  const [showReset, setShowReset] = useState(false)
  const [isDataOpen, setIsDataOpen] = useState(true)

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

  const subNavClass = ({ isActive }) =>
    `flex items-center gap-2 pl-7 pr-3 py-2 rounded-md text-[12.5px] font-medium mb-0.5 border-l-[3px] ${
      isActive
        ? 'bg-sf-teal/15 border-sf-teal text-white font-semibold'
        : 'border-transparent text-white/65 hover:bg-white/5'
    }`

  return (
    <aside className="w-60 shrink-0 bg-sf-dark text-white flex flex-col sticky top-0 h-screen overflow-y-auto">
      <nav className="p-2.5 flex-1 pt-3.5">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>
        <NavLink to="/providers" className={navClass}>
          <Users size={16} /> Providers
        </NavLink>

        {/* Collapsible Data section */}
        <button
          onClick={() => setIsDataOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13.5px] font-medium mb-0.5 border-l-[3px] border-transparent text-white/80 hover:bg-white/5"
        >
          <span className="flex items-center gap-2.5">
            <Database size={16} /> Data
          </span>
          {isDataOpen ? <ChevronDown size={14} className="text-white/50" /> : <ChevronRight size={14} className="text-white/50" />}
        </button>

        {isDataOpen && (
          <div className="mb-1">
            <NavLink to="/providers" end className={subNavClass}>
              <Users size={13} /> Providers
            </NavLink>
            <NavLink to="/data/groups" className={subNavClass}>
              <Building2 size={13} /> Groups
            </NavLink>
            <NavLink to="/data/networks" className={subNavClass}>
              <Network size={13} /> Networks
            </NavLink>
            <NavLink to="/data/affiliations" className={subNavClass}>
              <UserCheck size={13} /> Affiliations
            </NavLink>
            <NavLink to="/data/crosswalk" className={subNavClass}>
              <Link2 size={13} /> Crosswalk
            </NavLink>
            <NavLink to="/data/agreements" className={subNavClass}>
              <FileText size={13} /> Agreements
            </NavLink>
            <NavLink to="/data/participations" className={subNavClass}>
              <ListChecks size={13} /> Participations
            </NavLink>
            <NavLink to="/data/rules" className={subNavClass}>
              <ShieldCheck size={13} /> Eligibility Rules
            </NavLink>
          </div>
        )}

        <NavLink to="/audit" className={navClass}>
          <ClipboardList size={16} /> Audit Log
        </NavLink>
      </nav>

      <div className="p-2.5 border-t border-white/10 shrink-0">
        <div className="text-[10.5px] uppercase tracking-wider text-white/40 px-3 pt-1 pb-1.5">
          Controls
        </div>
        <button
          data-testid="demo-reset-btn"
          onClick={() => setShowReset(true)}
          className="w-full bg-sf-teal hover:bg-[#00928a] text-white font-semibold text-[13px] py-2.5 rounded-md flex items-center justify-center gap-1.5"
        >
          <RotateCcw size={14} /> Reset
        </button>
        {/* AI Assistant toggle */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span className="flex items-center gap-1.5 text-[12px] text-white/70">
            <Bot size={13} /> AI Assistant
          </span>
          <button
            onClick={onToggleChat}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              chatEnabled ? 'bg-sf-teal' : 'bg-white/20'
            }`}
            title={chatEnabled ? 'Disable AI chat' : 'Enable AI chat'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                chatEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex gap-2 px-3 pt-2.5 pb-1 text-[11.5px] text-white/55">
          {(status || ['A', 'B', 'C', 'D'].map((s) => ({ scenario: s, status: 'Ready' }))).map((s) => (
            <span key={s.scenario} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass[s.status] || 'bg-gray-400'}`} />
              {s.scenario}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 text-[13px] font-extrabold text-white/50 border-t border-white/10 shrink-0">
        Genzeon <span className="text-white/30 font-normal">×</span> UiPath
      </div>

      {showReset && <ResetConfirmModal onClose={() => setShowReset(false)} />}
    </aside>
  )
}
