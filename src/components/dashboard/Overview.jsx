import React from 'react'
import {
  User, Phone, Mail, MapPin, DollarSign,
  CalendarClock, AlertTriangle, TrendingDown, ChevronRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DelinquencyBadge({ n }) {
  const cls =
    n >= 5 ? 'bg-red-100 text-red-700 border-red-300' :
    n >= 3 ? 'bg-orange-100 text-orange-700 border-orange-300' :
    n >= 1 ? 'bg-amber-100 text-amber-700 border-amber-300' :
              'bg-emerald-100 text-emerald-700 border-emerald-300'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>
      {n === 0 ? 'Current' : `${n} Payment${n !== 1 ? 's' : ''} Past Due`}
    </span>
  )
}

export default function Overview() {
  const { state, dispatch } = useApp()
  const c = state.activeViewId
    ? (state.linkedAccounts.find(a => a.id === state.activeViewId) ?? state.customer)
    : state.customer
  if (!c) return null

  const utilization = ((c.balance / c.creditLimit) * 100).toFixed(1)

  function goDelinquency() {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'delinquency' })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Panel 1: Customer Details */}
        <div className="card lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="section-label">Customer Details</h2>
          </div>

          <div>
            <p className="text-xl font-bold text-slate-900">{c.name}</p>
            <div className="flex items-start gap-1.5 mt-2 text-sm text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{c.address}</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Home', val: c.phones.home },
              { label: 'Mobile', val: c.phones.mobile },
              { label: 'Work', val: c.phones.work },
            ].map(({ label, val }) => val ? (
              <div key={label} className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-500 w-12 text-xs">{label}</span>
                <span className="text-slate-700 font-medium">{val}</span>
                {c.preferredContact === label && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-semibold">Preferred</span>
                )}
              </div>
            ) : null)}
          </div>

          {c.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{c.email}</span>
            </div>
          )}
        </div>

        {/* Panel 2: Balance + Panel 3: Payment Due */}
        <div className="lg:col-span-2 space-y-4">

          {/* Main Balance */}
          <div className="card bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Total Account Balance</span>
            </div>
            <p className="text-4xl font-bold">${fmt(c.balance)}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-blue-500/50">
              <div>
                <p className="text-xs text-blue-300">Credit Limit</p>
                <p className="font-semibold">${fmt(c.creditLimit)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-300">Available Credit</p>
                <p className="font-semibold">${fmt(c.creditLimit - c.balance)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-300">Utilization</p>
                <p className={`font-bold ${parseFloat(utilization) > 75 ? 'text-red-300' : parseFloat(utilization) > 50 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {utilization}%
                </p>
              </div>
            </div>
          </div>

          {/* Payment Due */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4 h-4 text-slate-400" />
              <h2 className="section-label">Payment Due</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Min Payment Due</p>
                <p className="text-lg font-bold text-slate-800">${fmt(c.minDue)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Current Amount Due</p>
                <p className="text-lg font-bold text-slate-800">${fmt(c.currentDue)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-500 mb-1 font-medium">Past-Due Amount</p>
                <p className="text-lg font-bold text-red-700">${fmt(c.pastDue)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Due Date</p>
                <p className="text-lg font-bold text-slate-800">{fmtDate(c.dueDate)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 text-sm text-slate-500">
              <span>Last Payment:</span>
              <span className="font-medium text-slate-700">${fmt(c.lastPaymentAmount)}</span>
              <span>on {fmtDate(c.lastPaymentDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 4: Delinquency Status */}
      <button
        onClick={goDelinquency}
        className="w-full card hover:border-blue-300 hover:shadow-md transition-all cursor-pointer text-left group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              c.paymentsLate >= 5 ? 'bg-red-100' :
              c.paymentsLate >= 3 ? 'bg-orange-100' :
              c.paymentsLate >= 1 ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              <TrendingDown className={`w-5 h-5 ${
                c.paymentsLate >= 5 ? 'text-red-600' :
                c.paymentsLate >= 3 ? 'text-orange-600' :
                c.paymentsLate >= 1 ? 'text-amber-600' : 'text-emerald-600'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="section-label">Delinquency Status</h2>
                <DelinquencyBadge n={c.paymentsLate} />
              </div>
              <p className="text-sm text-slate-600">
                {c.paymentsLate === 0
                  ? 'Account is current — no past-due payments.'
                  : `Account is ${c.paymentsLate} payment${c.paymentsLate !== 1 ? 's' : ''} past due. Past-due balance: $${fmt(c.pastDue)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 group-hover:text-blue-700">
            <span className="text-sm font-medium">View 13-Month History</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {c.paymentsLate > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-2">
              {[5, 30, 60, 90, 120, 150, 180].map((dpd) => {
                const count = c.delinquencyHistory.summary[`${dpd}dpd`] || 0
                const hasHit = count > 0
                return (
                  <div key={dpd} className={`flex-1 text-center p-2 rounded-lg ${hasHit ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-bold ${hasHit ? 'text-red-600' : 'text-slate-400'}`}>{count}×</p>
                    <p className={`text-[10px] ${hasHit ? 'text-red-500' : 'text-slate-400'}`}>{dpd}DPD</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </button>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Other Open Accounts', val: c.creditHistory.length, icon: '🏦' },
          { label: 'Accounts Past Due', val: c.creditHistory.filter(a => a.dpd > 0).length, icon: '⚠️' },
          { label: 'Total Other Balances', val: `$${fmt(c.creditHistory.reduce((s,a) => s + a.balance, 0))}`, icon: '💳' },
          { label: 'Risk Level', val: c.riskLabel, icon: c.riskLevel === 'high' ? '🔴' : c.riskLevel === 'medium' ? '🟡' : '🟢' },
        ].map(({ label, val, icon }) => (
          <div key={label} className="card-sm flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{icon}</span>
            <div>
              <p className="text-xs text-slate-500 leading-tight">{label}</p>
              <p className="font-bold text-slate-800 mt-0.5">{val}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
