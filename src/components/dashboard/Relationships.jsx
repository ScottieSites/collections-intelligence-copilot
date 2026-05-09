import React from 'react'
import { Plus, X, CreditCard, Briefcase } from 'lucide-react'
import { getAccountsByCustomer } from '../../data/db/index'
import { useApp } from '../../context/AppContext'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

function AccountCard({ account, isCurrent, isLinked, onToggle }) {
  const isConsumer = account.accountType === 'consumer'
  const Icon = isConsumer ? CreditCard : Briefcase

  return (
    <div className={`card flex items-start gap-4 ${
      isCurrent ? 'border-blue-300 bg-blue-50/30' :
      isLinked  ? 'border-indigo-300 bg-indigo-50/30' : ''
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isConsumer ? 'bg-blue-100' : 'bg-purple-100'
      }`}>
        <Icon className={`w-5 h-5 ${isConsumer ? 'text-blue-600' : 'text-purple-600'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold text-slate-800">{account.id}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            isConsumer ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {isConsumer ? 'Consumer' : 'Business'}
          </span>
          {isCurrent && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
              Current
            </span>
          )}
          {isLinked && !isCurrent && (
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-200 text-indigo-700 font-medium">
              Added to Call
            </span>
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
            <p className={`font-bold ${
              account.paymentsLate > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
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

      {!isCurrent && (
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
            isLinked
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isLinked ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isLinked ? 'Remove' : 'Add to Call'}
        </button>
      )}
    </div>
  )
}

export default function Relationships() {
  const { state, dispatch } = useApp()
  const { customer, linkedAccounts } = state

  if (!customer?.customerId) {
    return (
      <div className="card text-center py-12 text-slate-500">
        <p className="text-sm">No relationship data available for this account.</p>
      </div>
    )
  }

  const allAccounts = getAccountsByCustomer(customer.customerId)
  const otherAccounts = allAccounts.filter(a => a.id !== customer.id)

  const totalBalance  = allAccounts.reduce((s, a) => s + a.balance, 0)
  const totalPastDue  = allAccounts.reduce((s, a) => s + (a.pastDue || 0), 0)

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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Current Account
        </p>
        <AccountCard account={customer} isCurrent />
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
