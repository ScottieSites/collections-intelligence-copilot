import React from 'react'
import {
  PhoneCall, ShieldCheck, FileText, LayoutDashboard,
  TrendingDown, CreditCard, Calculator, StickyNote,
  BrainCircuit, RotateCcw, ChevronRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const STEPS = [
  { key: 'call-script',   label: 'Call Script',    icon: PhoneCall,      minStep: 0 },
  { key: 'verification',  label: 'Verification',   icon: ShieldCheck,    minStep: 1 },
  { key: 'disclosure',    label: 'Mini Miranda',   icon: FileText,       minStep: 2 },
  { key: 'dashboard',     label: 'Account Dashboard', icon: LayoutDashboard, minStep: 3 },
]

const TABS = [
  { key: 'overview',          label: 'Overview',            icon: LayoutDashboard  },
  { key: 'delinquency',       label: 'Delinquency History', icon: TrendingDown     },
  { key: 'credit',            label: 'Credit History',      icon: CreditCard       },
  { key: 'calculator',        label: 'Financial Calculator',icon: Calculator       },
  { key: 'notes',             label: 'Notes',               icon: StickyNote       },
  { key: 'ai-strategy',       label: 'AI Strategy',         icon: BrainCircuit     },
]

function stepIndex(step) {
  const map = { 'call-script': 0, verification: 1, disclosure: 2, dashboard: 3 }
  return map[step] ?? 0
}

export default function Sidebar() {
  const { state, dispatch } = useApp()
  const current = stepIndex(state.step)

  function navigate(stepKey) {
    dispatch({ type: 'SET_STEP', payload: stepKey })
    if (stepKey === 'dashboard') dispatch({ type: 'SET_ACTIVE_TAB', payload: 'overview' })
  }

  function navigateTab(tab) {
    dispatch({ type: 'SET_STEP', payload: 'dashboard' })
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#0f2744' }}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">Collections</p>
            <p className="text-blue-300 text-xs leading-tight">Intelligence Copilot</p>
          </div>
        </div>
      </div>

      {/* Agent info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">
            AS
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{state.agentName}</p>
            <p className="text-slate-400 text-xs">{state.agentId}</p>
          </div>
        </div>
      </div>

      {/* Workflow steps */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Call Workflow
        </p>

        {STEPS.map((s, i) => {
          const Icon = s.icon
          const unlocked = current >= i
          const active = state.step === s.key && !(state.step === 'dashboard' && s.key === 'dashboard' && false)
          const isDashboard = s.key === 'dashboard'
          const isOnDashboard = state.step === 'dashboard'

          // When on dashboard the top-level "Account Dashboard" row is highlighted
          // only if no specific tab — we show it as a section header
          const sectionActive = isDashboard ? isOnDashboard : active

          return (
            <div key={s.key}>
              <button
                onClick={() => unlocked && navigate(s.key)}
                disabled={!unlocked}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  sectionActive
                    ? 'bg-blue-700 text-white'
                    : unlocked
                    ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 font-medium">{s.label}</span>
                {unlocked && current > i && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </span>
                )}
                {!unlocked && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                )}
              </button>

              {/* Sub-tabs when dashboard is unlocked */}
              {isDashboard && current >= 3 && (
                <div className="ml-4 mt-1 space-y-0.5">
                  {TABS.map((tab) => {
                    const TabIcon = tab.icon
                    const tabActive = isOnDashboard && state.activeTab === tab.key
                    return (
                      <button
                        key={tab.key}
                        onClick={() => navigateTab(tab.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors text-left ${
                          tabActive
                            ? 'bg-blue-600/80 text-white'
                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tab.label}</span>
                        {tab.key === 'ai-strategy' && (
                          <span className="ml-auto px-1 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white">
                            AI
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Reset / New Call */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Call / Reset</span>
        </button>
      </div>
    </aside>
  )
}
