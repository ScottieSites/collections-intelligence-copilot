import React from 'react'
import { ShieldCheck, CheckCircle2, XCircle, MinusCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TOKEN_DEFS = [
  { key: 'ssn',         label: 'Last 4 of SSN',       field: (c) => `****${c.ssn_last4}` },
  { key: 'dob',         label: 'Date of Birth (M/D)',  field: (c) => `${c.dob.month}/${c.dob.day}` },
  { key: 'address',     label: 'Mailing Address',      field: (c) => c.address },
  { key: 'zip',         label: 'ZIP Code',             field: (c) => c.zip },
  { key: 'lastPayment', label: 'Last Payment Amount',  field: (c) => `$${c.lastPaymentAmount.toFixed(2)}` },
  { key: 'balance',     label: 'Account Balance',      field: (c) => `$${c.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
]

const STATUS_STYLES = {
  'verified':     'border-emerald-400 bg-emerald-50',
  'not-verified': 'border-red-400 bg-red-50',
  'not-asked':    'border-slate-200 bg-white',
}

const BUTTON_STYLES = {
  verified: {
    active: 'bg-emerald-500 text-white border-emerald-500',
    inactive: 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50',
  },
  'not-verified': {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
  },
  'not-asked': {
    active: 'bg-slate-400 text-white border-slate-400',
    inactive: 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
  },
}

export default function Verification() {
  const { state, dispatch } = useApp()
  const { customer, verificationTokens } = state

  const verifiedCount = Object.values(verificationTokens).filter(v => v === 'verified').length
  const canProceed = verifiedCount >= 2

  function setToken(key, value) {
    dispatch({ type: 'SET_VERIFICATION_TOKEN', payload: { token: key, value } })
  }

  function handleNext() {
    dispatch({ type: 'SET_STEP', payload: 'disclosure' })
  }

  function handleBack() {
    dispatch({ type: 'SET_STEP', payload: 'call-script' })
  }

  if (!customer) return null

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Verification</h1>
          <p className="text-sm text-slate-500">Step 2 of 3 — Verify at least 2 of 6 tokens</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`card border-l-4 ${canProceed ? 'border-l-emerald-500 bg-emerald-50' : 'border-l-blue-500'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {canProceed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-semibold text-sm text-slate-800">
              {verifiedCount} of 2 required verifications completed
            </span>
          </div>
          <span className={`text-sm font-bold ${canProceed ? 'text-emerald-600' : 'text-slate-500'}`}>
            {verifiedCount}/6 verified
          </span>
        </div>
        <div className="flex gap-1.5">
          {[...Array(6)].map((_, i) => {
            const tokenKey = Object.keys(verificationTokens)[i]
            const status = verificationTokens[tokenKey]
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  status === 'verified'     ? 'bg-emerald-500' :
                  status === 'not-verified' ? 'bg-red-400' :
                                              'bg-slate-200'
                }`}
              />
            )
          })}
        </div>
        {!canProceed && (
          <p className="text-xs text-slate-500 mt-2">
            Verify at least 2 tokens to proceed. Ask the customer for any 2 of the following.
          </p>
        )}
        {canProceed && (
          <p className="text-xs text-emerald-700 mt-2 font-medium">
            Verification requirement met. You may proceed to the Mini Miranda disclosure.
          </p>
        )}
      </div>

      {/* Token cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOKEN_DEFS.map((def) => {
          const status = verificationTokens[def.key]
          const cardClass = STATUS_STYLES[status] || STATUS_STYLES['not-asked']

          return (
            <div key={def.key} className={`rounded-xl border-2 p-4 transition-all ${cardClass}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{def.label}</p>
                  <p className="font-mono font-bold text-slate-800 mt-1">{def.field(customer)}</p>
                </div>
                {status === 'verified' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                {status === 'not-verified' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                {status === 'not-asked' && <MinusCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />}
              </div>

              <div className="flex gap-1.5">
                {[
                  { value: 'verified',     label: 'Verified',      icon: CheckCircle2 },
                  { value: 'not-verified', label: 'Not Verified',  icon: XCircle      },
                  { value: 'not-asked',    label: 'Not Asked',     icon: MinusCircle  },
                ].map((btn) => {
                  const styles = BUTTON_STYLES[btn.value]
                  const isActive = status === btn.value
                  const Icon = btn.icon
                  return (
                    <button
                      key={btn.value}
                      onClick={() => setToken(def.key, btn.value)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        isActive ? styles.active : styles.inactive
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{btn.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={handleBack} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button onClick={handleNext} disabled={!canProceed} className="btn-primary">
          Next — Mini Miranda Disclosure
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Guidance */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs font-semibold text-amber-800 mb-1">Verification Guidance</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Ask the customer to confirm any 2 of the 6 items above. Do not prompt the customer with the
          system values — let them provide the information independently. If the customer cannot verify
          2 tokens, do not proceed with account-level discussions.
        </p>
      </div>
    </div>
  )
}
