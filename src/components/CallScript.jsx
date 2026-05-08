import React, { useState } from 'react'
import { PhoneCall, MessageSquare, ArrowRight, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { mockCustomers, getCustomerById } from '../data/mockCustomers'

export default function CallScript() {
  const { state, dispatch } = useApp()
  const [inputId, setInputId] = useState(state.accountNumber || '')
  const [error, setError] = useState('')

  function handleSelect(customer) {
    setInputId(customer.id)
    setError('')
    dispatch({ type: 'SELECT_CUSTOMER', payload: customer })
  }

  function handleNext() {
    const customer = getCustomerById(inputId)
    if (!customer) {
      setError('Account number not found. Please check and try again, or select a demo account below.')
      return
    }
    dispatch({ type: 'SELECT_CUSTOMER', payload: customer })
    dispatch({ type: 'SET_STEP', payload: 'verification' })
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <PhoneCall className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Call Session</h1>
          <p className="text-sm text-slate-500">Step 1 of 3 — Account Lookup</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['Account Lookup', 'Verification', 'Miranda Disclosure'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                i === 0 ? 'bg-blue-500' : 'bg-slate-300 text-slate-500'
              }`}>{i + 1}</span>
              {s}
            </div>
            {i < 2 && <div className="w-6 h-px bg-slate-300" />}
          </React.Fragment>
        ))}
      </div>

      {/* Script panel */}
      <div className="card border-l-4 border-l-blue-500">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span className="section-label text-blue-600">Opening Script</span>
        </div>
        <p className="text-slate-800 text-sm leading-relaxed italic">
          "Thank you for calling. May I please have your account number?"
        </p>
        <p className="text-xs text-slate-400 mt-3">
          After obtaining the account number, enter it below and click Next to proceed to verification.
        </p>
      </div>

      {/* Account number input */}
      <div className="card space-y-4">
        <label className="block">
          <span className="section-label mb-2 block">Account Number</span>
          <input
            type="text"
            value={inputId}
            onChange={(e) => { setInputId(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            placeholder="e.g. ACC-001234"
            className="input-field font-mono text-base"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-500 text-sm">⚠</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!inputId.trim()}
          className="btn-primary w-full justify-center py-2.5"
        >
          Next — Proceed to Verification
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Demo accounts */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="section-label">Demo Accounts — Select to Auto-Load</span>
        </div>
        <div className="space-y-2">
          {mockCustomers.map((c) => {
            const riskClass =
              c.riskLevel === 'high'   ? 'border-red-200 hover:border-red-400 hover:bg-red-50' :
              c.riskLevel === 'medium' ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50' :
                                         'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
            const badgeClass =
              c.riskLevel === 'high'   ? 'risk-badge-high'   :
              c.riskLevel === 'medium' ? 'risk-badge-medium' :
                                         'risk-badge-low'
            const selected = state.customer?.id === c.id

            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 text-left transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : `border-slate-200 ${riskClass}`
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">{c.name}</span>
                    <span className={badgeClass}>{c.riskLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-mono text-xs text-slate-500">{c.id}</span>
                    <span className="text-xs text-slate-500">
                      {c.paymentsLate} payment{c.paymentsLate !== 1 ? 's' : ''} past due
                    </span>
                    <span className="text-xs text-slate-500">
                      Balance: ${c.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {selected && (
                  <span className="text-blue-600 text-xs font-semibold flex-shrink-0">Selected</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
