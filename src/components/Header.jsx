import React from 'react'
import { Clock, User, Hash, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

function useCallTimer(startTime) {
  const [elapsed, setElapsed] = React.useState('00:00')
  React.useEffect(() => {
    if (!startTime) return
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      const m = String(Math.floor(diff / 60)).padStart(2, '0')
      const s = String(diff % 60).padStart(2, '0')
      setElapsed(`${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])
  return elapsed
}

export default function Header() {
  const { state, dispatch } = useApp()
  const { customer, callId, callStartTime, linkedAccounts } = state
  const elapsed = useCallTimer(callStartTime)

  if (!customer) return null

  const riskClass =
    customer.riskLevel === 'high'   ? 'risk-badge-high'   :
    customer.riskLevel === 'medium' ? 'risk-badge-medium' :
                                      'risk-badge-low'

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-6">
      <div className="flex items-center gap-2 text-slate-700">
        <User className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-sm">{customer.name}</span>
        <span className={riskClass}>{customer.riskLabel}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
          <Hash className="w-3.5 h-3.5" />
          <span className="font-mono">{customer.id}</span>
        </div>

        {linkedAccounts?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-xs">+</span>
            {linkedAccounts.map(acc => (
              <div
                key={acc.id}
                className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <span className="font-mono text-xs text-indigo-700 font-semibold">{acc.id}</span>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_LINKED_ACCOUNT', payload: acc.id })}
                  className="text-indigo-400 hover:text-indigo-700 transition-colors ml-0.5 p-0.5 rounded hover:bg-indigo-100"
                  title="Remove from call"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-slate-500 text-sm ml-auto">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-mono text-blue-600 font-semibold">{elapsed}</span>
        <span className="text-slate-400">call duration</span>
      </div>

      {callId && (
        <div className="text-xs text-slate-400 font-mono">{callId}</div>
      )}

      {state.mirandaConfirmed && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-emerald-700 font-medium">Miranda Read</span>
        </div>
      )}
    </header>
  )
}
