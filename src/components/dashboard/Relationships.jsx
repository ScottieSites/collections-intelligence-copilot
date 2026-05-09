import React, { useState } from 'react'
import {
  Plus, X, CreditCard, Briefcase, ChevronDown, ChevronUp,
  User, Phone, Mail, MapPin, DollarSign, CalendarClock, TrendingDown,
} from 'lucide-react'
import { getAccountsByCustomer } from '../../data/db/index'
import { useApp } from '../../context/AppContext'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RiskBadge({ level, label }) {
  const cls =
    level === 'high'   ? 'bg-red-100 text-red-700' :
    level === 'medium' ? 'bg-amber-100 text-amber-700' :
                         'bg-emerald-100 text-emerald-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function AccountDetailPanel({ account }) {
  const isConsumer = account.accountType === 'consumer'
  const utilization = ((account.balance / account.creditLimit) * 100).toFixed(1)

  return (
    <div className="border-t border-slate-200 mt-4 pt-5 space-y-5">

      {/* Customer details + balance row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Contact info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Customer Details
          </p>
          <div className="flex items-start gap-1.5 text-sm text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{account.address}</span>
          </div>
          {account.phones && (
            <div className="space-y-1.5">
              {[
                { label: 'Home',   val: account.phones.home },
                { label: 'Mobile', val: account.phones.mobile },
                { label: 'Work',   val: account.phones.work },
              ].map(({ label, val }) => val ? (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-500 w-12 text-xs">{label}</span>
                  <span className="text-slate-700 font-medium">{val}</span>
                  {account.preferredContact === label && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-semibold">
                      Preferred
                    </span>
                  )}
                </div>
              ) : null)}
            </div>
          )}
          {account.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{account.email}</span>
            </div>
          )}
          {!isConsumer && account.businessName && (
            <div className="mt-1 p-2.5 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-500 mb-0.5">Business</p>
              <p className="text-sm font-semibold text-purple-800">{account.businessName}</p>
              {account.industry && (
                <p className="text-xs text-purple-600">{account.industry}</p>
              )}
            </div>
          )}
        </div>

        {/* Balance + payment */}
        <div className="lg:col-span-2 space-y-3">
          {/* Balance card */}
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Account Balance
              </span>
            </div>
            <p className="text-3xl font-bold">${fmt(account.balance)}</p>
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-blue-500/50">
              <div>
                <p className="text-xs text-blue-300">Credit Limit</p>
                <p className="font-semibold text-sm">${fmt(account.creditLimit)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-300">Available</p>
                <p className="font-semibold text-sm">${fmt(account.creditLimit - account.balance)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-300">Utilization</p>
                <p className={`font-bold text-sm ${
                  parseFloat(utilization) > 75 ? 'text-red-300' :
                  parseFloat(utilization) > 50 ? 'text-amber-300' : 'text-emerald-300'
                }`}>{utilization}%</p>
              </div>
            </div>
          </div>

          {/* Payment due grid */}
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Due</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Min Payment</p>
                <p className="text-base font-bold text-slate-800">${fmt(account.minDue)}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Amount Due</p>
                <p className="text-base font-bold text-slate-800">${fmt(account.currentDue)}</p>
              </div>
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-500 mb-0.5 font-medium">Past Due</p>
                <p className="text-base font-bold text-red-700">${fmt(account.pastDue)}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Due Date</p>
                <p className="text-base font-bold text-slate-800">{fmtDate(account.dueDate)}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
              <span>Last Payment:</span>
              <span className="font-medium text-slate-700">${fmt(account.lastPaymentAmount)}</span>
              <span>on {fmtDate(account.lastPaymentDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delinquency status */}
      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delinquency Status</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            account.paymentsLate >= 5 ? 'bg-red-100 text-red-700 border-red-300' :
            account.paymentsLate >= 3 ? 'bg-orange-100 text-orange-700 border-orange-300' :
            account.paymentsLate >= 1 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                        'bg-emerald-100 text-emerald-700 border-emerald-300'
          }`}>
            {account.paymentsLate === 0
              ? 'Current'
              : `${account.paymentsLate} Payment${account.paymentsLate !== 1 ? 's' : ''} Past Due`}
          </span>
        </div>

        {account.paymentsLate > 0 && account.delinquencyHistory?.summary ? (
          <div className="flex gap-2">
            {[5, 30, 60, 90, 120, 150, 180].map(dpd => {
              const count = account.delinquencyHistory.summary[`${dpd}dpd`] || 0
              return (
                <div key={dpd} className={`flex-1 text-center p-2 rounded-lg ${count > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-bold ${count > 0 ? 'text-red-600' : 'text-slate-400'}`}>{count}×</p>
                  <p className={`text-[10px] ${count > 0 ? 'text-red-500' : 'text-slate-400'}`}>{dpd}DPD</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-emerald-600 font-medium">Account is current — no past-due payments.</p>
        )}
      </div>
    </div>
  )
}

function AccountCard({ account, isCurrent, isLinked, onToggle, isExpanded, onExpand }) {
  const isConsumer = account.accountType === 'consumer'
  const Icon = isConsumer ? CreditCard : Briefcase
  const ExpandIcon = isExpanded ? ChevronUp : ChevronDown

  return (
    <div className={`card ${
      isCurrent ? 'border-blue-300 bg-blue-50/30' :
      isLinked  ? 'border-indigo-300 bg-indigo-50/30' : ''
    }`}>
      {/* Clickable header row */}
      <button
        onClick={onExpand}
        className="w-full flex items-start gap-4 text-left group"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isConsumer ? 'bg-blue-100' : 'bg-purple-100'
        }`}>
          <Icon className={`w-5 h-5 ${isConsumer ? 'text-blue-600' : 'text-purple-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
              {account.id}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              isConsumer ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {isConsumer ? 'Consumer' : 'Business'}
            </span>
            {isCurrent && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">Current</span>
            )}
            {isLinked && !isCurrent && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-200 text-indigo-700 font-medium">Added to Call</span>
            )}
            <RiskBadge level={account.riskLevel} label={account.riskLabel} />
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500">Balance</p>
              <p className="font-bold text-slate-800">${fmt(account.balance)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Past Due</p>
              <p className={`font-bold ${account.pastDue > 0 ? 'text-red-700' : 'text-slate-800'}`}>
                ${fmt(account.pastDue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Payments Late</p>
              <p className={`font-bold ${account.paymentsLate > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {account.paymentsLate === 0 ? 'Current' : `${account.paymentsLate} late`}
              </p>
            </div>
            {account.businessName ? (
              <div>
                <p className="text-xs text-slate-500">Business</p>
                <p className="font-medium text-slate-700 text-sm truncate">{account.businessName}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500">Credit Limit</p>
                <p className="font-bold text-slate-800">${fmt(account.creditLimit)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {!isCurrent && (
            <button
              onClick={e => { e.stopPropagation(); onToggle() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isLinked
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLinked ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {isLinked ? 'Remove' : 'Add to Call'}
            </button>
          )}
          <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
            <ExpandIcon className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </button>

      {isExpanded && <AccountDetailPanel account={account} />}
    </div>
  )
}

export default function Relationships() {
  const { state, dispatch } = useApp()
  const { customer, linkedAccounts } = state
  const [expandedId, setExpandedId] = useState(null)

  if (!customer?.customerId) {
    return (
      <div className="card text-center py-12 text-slate-500">
        <p className="text-sm">No relationship data available for this account.</p>
      </div>
    )
  }

  const allAccounts = getAccountsByCustomer(customer.customerId)
  const otherAccounts = allAccounts.filter(a => a.id !== customer.id)

  const totalBalance = allAccounts.reduce((s, a) => s + a.balance, 0)
  const totalPastDue = allAccounts.reduce((s, a) => s + (a.pastDue || 0), 0)

  function isLinked(id) {
    return linkedAccounts.some(a => a.id === id)
  }

  function toggle(account) {
    if (isLinked(account.id)) {
      dispatch({ type: 'REMOVE_LINKED_ACCOUNT', payload: account.id })
    } else {
      dispatch({ type: 'ADD_LINKED_ACCOUNT', payload: account })
    }
  }

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  return (
    <div className="space-y-6">
      {/* Exposure summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-sm">
          <p className="text-xs text-slate-500">Total Accounts</p>
          <p className="text-2xl font-bold text-slate-800">{allAccounts.length}</p>
        </div>
        <div className="card-sm">
          <p className="text-xs text-slate-500">Combined Balance</p>
          <p className="text-2xl font-bold text-slate-800">${fmt(totalBalance)}</p>
        </div>
        <div className="card-sm">
          <p className="text-xs text-slate-500">Combined Past Due</p>
          <p className={`text-2xl font-bold ${totalPastDue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            ${fmt(totalPastDue)}
          </p>
        </div>
      </div>

      {/* Current account */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Account</p>
        <AccountCard
          account={customer}
          isCurrent
          isExpanded={expandedId === customer.id}
          onExpand={() => toggleExpand(customer.id)}
        />
      </div>

      {/* Other accounts */}
      {otherAccounts.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Linked Accounts — {otherAccounts.length} found
          </p>
          <div className="space-y-3">
            {otherAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                isLinked={isLinked(account.id)}
                onToggle={() => toggle(account)}
                isExpanded={expandedId === account.id}
                onExpand={() => toggleExpand(account.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-8 text-slate-500">
          <p className="text-sm">No other accounts found for this customer.</p>
        </div>
      )}
    </div>
  )
}
