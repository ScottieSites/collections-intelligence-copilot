import React from 'react'
import { CreditCard, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status, dpd }) {
  if (status === 'Current') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Current</span>
  }
  if (status === 'Collections') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Collections</span>
  }
  const cls =
    dpd >= 120 ? 'bg-red-200 text-red-800' :
    dpd >= 90  ? 'bg-red-100 text-red-700'  :
    dpd >= 60  ? 'bg-orange-100 text-orange-700' :
                 'bg-amber-100 text-amber-700'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>
}

export default function CreditHistory() {
  const { state } = useApp()
  const c = state.customer
  if (!c) return null

  const accounts = c.creditHistory
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const totalMinPay  = accounts.reduce((s, a) => s + a.minPayment, 0)
  const pastDueCount = accounts.filter(a => a.dpd > 0 || a.status === 'Collections').length

  const revolving = accounts.filter(a => a.creditLimit)
  const totalRevBal = revolving.reduce((s, a) => s + a.balance, 0) + c.balance
  const totalRevLim = revolving.reduce((s, a) => s + a.creditLimit, 0) + c.creditLimit
  const overallUtil = totalRevLim > 0 ? ((totalRevBal / totalRevLim) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Credit History</h2>
          <p className="text-sm text-slate-500">Other outstanding accounts  ·  {c.name}</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', val: accounts.length, sub: 'external accounts', cls: 'text-slate-800' },
          { label: 'Accounts Past Due', val: pastDueCount, sub: 'delinquent or in collections', cls: pastDueCount > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Total Balances', val: `$${fmt(totalBalance)}`, sub: 'across all external accounts', cls: 'text-slate-800' },
          { label: 'Total Min Payments', val: `$${fmt(totalMinPay)}/mo`, sub: 'minimum payments due', cls: 'text-slate-800' },
        ].map(({ label, val, sub, cls }) => (
          <div key={label} className="card-sm">
            <p className="section-label mb-1">{label}</p>
            <p className={`text-xl font-bold ${cls}`}>{val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Utilization summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-label">Overall Revolving Utilization</h3>
          <span className={`text-lg font-bold ${
            parseFloat(overallUtil) > 75 ? 'text-red-600' :
            parseFloat(overallUtil) > 50 ? 'text-orange-600' :
            parseFloat(overallUtil) > 30 ? 'text-amber-600' : 'text-emerald-600'
          }`}>{overallUtil}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              parseFloat(overallUtil) > 75 ? 'bg-red-500' :
              parseFloat(overallUtil) > 50 ? 'bg-orange-500' :
              parseFloat(overallUtil) > 30 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(parseFloat(overallUtil), 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0%</span>
          <span className="text-emerald-500">30% Good</span>
          <span className="text-amber-500">50% Fair</span>
          <span className="text-red-500">75%+ High</span>
          <span>100%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Includes this account (${fmt(c.balance)} / ${fmt(c.creditLimit)}) plus {revolving.length} revolving account{revolving.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Account table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="section-label">Account Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                {['Creditor', 'Type', 'Balance', 'Min Payment', 'Status', 'Days Past Due', 'Credit Limit'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a, i) => (
                <tr key={i} className={`hover:bg-slate-50 ${a.dpd > 60 || a.status === 'Collections' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{a.creditor}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.type}</td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">${fmt(a.balance)}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{a.minPayment > 0 ? `$${fmt(a.minPayment)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} dpd={a.dpd} />
                  </td>
                  <td className="px-4 py-3">
                    {a.dpd > 0 ? (
                      <span className="font-bold text-red-600">{a.dpd} days</span>
                    ) : a.status === 'Collections' ? (
                      <span className="text-purple-600 font-medium">In Collections</span>
                    ) : (
                      <span className="text-emerald-600">Current</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {a.creditLimit ? `$${fmt(a.creditLimit)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pastDueCount > 1 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This customer has {pastDueCount} accounts currently past due or in collections.
            This pattern may indicate broader financial hardship. Consider exploring a hardship payment option
            or asking additional discovery questions about the customer's overall financial situation.
          </p>
        </div>
      )}
    </div>
  )
}
