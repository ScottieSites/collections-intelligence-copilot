import React from 'react'
import { TrendingDown, Info } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const DPD_META = [
  { key: '5dpd',   label: '5 DPD',   color: 'amber',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400'  },
  { key: '30dpd',  label: '30 DPD',  color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { key: '60dpd',  label: '60 DPD',  color: 'red',    bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400'    },
  { key: '90dpd',  label: '90 DPD',  color: 'red',    bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500'    },
  { key: '120dpd', label: '120 DPD', color: 'rose',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200',   dot: 'bg-rose-500'   },
  { key: '150dpd', label: '150 DPD', color: 'rose',   bg: 'bg-rose-100',  text: 'text-rose-800',   border: 'border-rose-300',   dot: 'bg-rose-600'   },
  { key: '180dpd', label: '180 DPD', color: 'red',    bg: 'bg-red-200',   text: 'text-red-900',    border: 'border-red-400',    dot: 'bg-red-700'    },
]

function dpd2meta(dpd) {
  if (dpd === 0)   return { label: 'Current', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' }
  if (dpd <= 5)    return DPD_META[0]
  if (dpd <= 30)   return DPD_META[1]
  if (dpd <= 60)   return DPD_META[2]
  if (dpd <= 90)   return DPD_META[3]
  if (dpd <= 120)  return DPD_META[4]
  if (dpd <= 150)  return DPD_META[5]
  return DPD_META[6]
}

export default function DelinquencyHistory() {
  const { state } = useApp()
  const c = state.customer
  if (!c) return null

  const { summary, monthly } = c.delinquencyHistory

  const maxBar = Math.max(...Object.values(summary), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">13-Month Delinquency History</h2>
          <p className="text-sm text-slate-500">Apr 2025 – Apr 2026  ·  {c.name}</p>
        </div>
      </div>

      {/* Summary counts */}
      <div className="card">
        <h3 className="section-label mb-4">Frequency Summary — Last 13 Months</h3>
        <div className="grid grid-cols-7 gap-3">
          {DPD_META.map((m) => {
            const count = summary[m.key] || 0
            const barH = count > 0 ? Math.max((count / maxBar) * 80, 12) : 0
            return (
              <div key={m.key} className="flex flex-col items-center gap-1">
                <div className="h-20 w-full flex items-end justify-center">
                  {count > 0 && (
                    <div
                      className={`w-full rounded-t-md ${m.dot}`}
                      style={{ height: `${barH}px` }}
                    />
                  )}
                  {count === 0 && <div className="w-full h-1 bg-slate-100 rounded" />}
                </div>
                <span className="text-lg font-bold text-slate-800">{count}×</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${m.bg} ${m.text}`}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly timeline */}
      <div className="card">
        <h3 className="section-label mb-4">Month-by-Month Timeline</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {monthly.map((row) => {
            const m = dpd2meta(row.dpd)
            return (
              <div key={row.month} className={`p-3 rounded-xl border ${m.bg} border-slate-200 text-center`}>
                <p className="text-xs text-slate-500 font-medium mb-1">{row.month}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${m.bg} ${m.text}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                  {row.status}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Agent guidance */}
      <div className="flex items-start gap-3 p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-2">Delinquency History — Agent Guidance</p>
          <p className="text-sm text-blue-800 leading-relaxed">
            When the customer explains the reason for delinquency, ask why the account became past due and how
            long the issue has been occurring. <strong>Compare the customer's explanation against the delinquency
            history above.</strong> If the explanation does not match the account history — for example, the customer
            says the problem started one month ago but the account shows repeated late payments over 12 months —
            gather more details to understand the missing information.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-700">
            <li>• "What caused your account to become past due?"</li>
            <li>• "How long has this situation been affecting your ability to pay?"</li>
            <li>• "Has anything changed recently with your income or expenses?"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
