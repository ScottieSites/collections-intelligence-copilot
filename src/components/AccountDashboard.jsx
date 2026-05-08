import React from 'react'
import {
  LayoutDashboard, TrendingDown, CreditCard,
  Calculator, StickyNote, BrainCircuit,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Overview         from './dashboard/Overview'
import DelinquencyHistory from './dashboard/DelinquencyHistory'
import CreditHistory    from './dashboard/CreditHistory'
import FinancialCalculator from './dashboard/FinancialCalculator'
import Notes            from './dashboard/Notes'
import AIStrategy       from './dashboard/AIStrategy'

const TABS = [
  { key: 'overview',    label: 'Overview',            icon: LayoutDashboard  },
  { key: 'delinquency', label: 'Delinquency History', icon: TrendingDown     },
  { key: 'credit',      label: 'Credit History',      icon: CreditCard       },
  { key: 'calculator',  label: 'Calculator',          icon: Calculator       },
  { key: 'notes',       label: 'Notes',               icon: StickyNote       },
  { key: 'ai-strategy', label: 'AI Strategy',         icon: BrainCircuit, badge: 'AI' },
]

export default function AccountDashboard() {
  const { state, dispatch } = useApp()
  const active = state.activeTab

  function setTab(key) {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: key })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {TABS.map(({ key, label, icon: Icon, badge }) => {
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {active === 'overview'    && <Overview />}
        {active === 'delinquency' && <DelinquencyHistory />}
        {active === 'credit'      && <CreditHistory />}
        {active === 'calculator'  && <FinancialCalculator />}
        {active === 'notes'       && <Notes />}
        {active === 'ai-strategy' && <AIStrategy />}
      </div>
    </div>
  )
}
