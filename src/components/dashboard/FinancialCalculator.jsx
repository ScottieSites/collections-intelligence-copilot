import React, { useState, useMemo } from 'react'
import { Calculator, AlertCircle, CheckCircle2, X, Lock } from 'lucide-react'
import { useApp } from '../../context/AppContext'

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function RatioBar({ value, max = 100, thresholds }) {
  const pct = Math.min((value / max) * 100, 100)
  const color =
    value >= thresholds.high   ? 'bg-red-500' :
    value >= thresholds.medium ? 'bg-amber-500' :
    value >= thresholds.low    ? 'bg-yellow-400' : 'bg-emerald-500'
  return (
    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RatingBadge({ label, color }) {
  const cls =
    color === 'red'    ? 'bg-red-100 text-red-700 border-red-200' :
    color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
    color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                         'bg-emerald-100 text-emerald-700 border-emerald-200'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>{label}</span>
  )
}

export default function FinancialCalculator() {
  const { state, dispatch } = useApp()
  const c = state.customer

  // Disclosure gate
  const [showDisclosureModal, setShowDisclosureModal] = useState(false)
  const [disclosureRead, setDisclosureRead] = useState(false)
  const [unlocked, setUnlocked] = useState(state.incomeDisclosureConfirmed)

  const { monthlyIncome, otherMonthlyDebt } = state.calculator

  // Auto-sum minimum payments from credit history + this account
  const autoDebt = useMemo(() => {
    if (!c) return 0
    const external = c.creditHistory.reduce((s, a) => s + a.minPayment, 0)
    return external + c.minDue
  }, [c])

  const income = parseFloat(monthlyIncome) || 0
  const manualDebt = parseFloat(otherMonthlyDebt)
  const totalDebt = isNaN(manualDebt) ? autoDebt : manualDebt

  const dti = income > 0 ? (totalDebt / income) * 100 : null

  // Credit utilization
  const revolving = c ? c.creditHistory.filter(a => a.creditLimit) : []
  const totalRevBal = revolving.reduce((s, a) => s + a.balance, 0) + (c?.balance || 0)
  const totalRevLim = revolving.reduce((s, a) => s + a.creditLimit, 0) + (c?.creditLimit || 0)
  const utilization = totalRevLim > 0 ? (totalRevBal / totalRevLim) * 100 : 0

  function dtiRating(v) {
    if (v < 28) return { label: 'Excellent (< 28%)',   color: 'green'  }
    if (v < 36) return { label: 'Good (< 36%)',         color: 'green'  }
    if (v < 42) return { label: 'Fair (36–42%)',         color: 'yellow' }
    if (v < 50) return { label: 'High (42–50%)',         color: 'orange' }
    return         { label: 'Very High (> 50%)',        color: 'red'    }
  }

  function utilRating(v) {
    if (v < 10) return { label: 'Excellent (< 10%)',    color: 'green'  }
    if (v < 30) return { label: 'Good (< 30%)',          color: 'green'  }
    if (v < 50) return { label: 'Fair (30–50%)',          color: 'yellow' }
    if (v < 75) return { label: 'High (50–75%)',          color: 'orange' }
    return         { label: 'Very High (> 75%)',         color: 'red'    }
  }

  function handleOpenCalculator() {
    if (unlocked) return
    setShowDisclosureModal(true)
  }

  function handleConfirmDisclosure() {
    dispatch({ type: 'CONFIRM_INCOME_DISCLOSURE' })
    setUnlocked(true)
    setShowDisclosureModal(false)
  }

  if (!c) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calculator className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Financial Calculator</h2>
          <p className="text-sm text-slate-500">Debt-to-Income Ratio · Credit Utilization</p>
        </div>
      </div>

      {/* Income disclosure gate */}
      {!unlocked && (
        <div
          onClick={handleOpenCalculator}
          className="card border-2 border-dashed border-amber-300 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Income Disclosure Required</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Click here to read the income disclosure to the customer and unlock the calculator.
              </p>
            </div>
          </div>
        </div>
      )}

      {unlocked && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <p className="text-sm text-emerald-700 font-medium">
            Income disclosure confirmed at {new Date(state.incomeDisclosureTimestamp).toLocaleTimeString()}.
          </p>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!unlocked ? 'opacity-40 pointer-events-none' : ''}`}>

        {/* DTI Calculator */}
        <div className="card space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            Debt-to-Income Ratio
            <span className="text-xs text-slate-400 font-normal">monthly debt ÷ gross income</span>
          </h3>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1 block">Monthly Gross Income ($)</span>
              <input
                type="number"
                min="0"
                value={monthlyIncome}
                onChange={(e) => dispatch({ type: 'UPDATE_CALCULATOR', payload: { monthlyIncome: e.target.value } })}
                placeholder="0.00"
                className="input-field"
              />
            </label>

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-medium text-slate-600 mb-2">Monthly Debt Payments</p>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>This account (min payment)</span>
                  <span className="font-mono">${fmt(c.minDue)}</span>
                </div>
                {c.creditHistory.filter(a => a.minPayment > 0).map((a, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{a.creditor} ({a.type})</span>
                    <span className="font-mono">${fmt(a.minPayment)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-800">
                  <span>Auto-calculated total</span>
                  <span className="font-mono">${fmt(autoDebt)}/mo</span>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1 block">
                Override Total Monthly Debt ($) <span className="text-slate-400 font-normal">— optional, if customer reports additional obligations</span>
              </span>
              <input
                type="number"
                min="0"
                value={otherMonthlyDebt}
                onChange={(e) => dispatch({ type: 'UPDATE_CALCULATOR', payload: { otherMonthlyDebt: e.target.value } })}
                placeholder={fmt(autoDebt)}
                className="input-field"
              />
            </label>
          </div>

          {dti !== null && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Debt-to-Income Ratio</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">{dti.toFixed(1)}%</span>
                  <RatingBadge {...dtiRating(dti)} />
                </div>
              </div>
              <RatioBar value={dti} max={80} thresholds={{ low: 28, medium: 36, high: 50 }} />
              <div className="text-xs text-slate-500 space-y-0.5">
                <div className="flex justify-between"><span>Monthly debt:</span><span className="font-mono font-medium">${fmt(totalDebt)}</span></div>
                <div className="flex justify-between"><span>Monthly income:</span><span className="font-mono font-medium">${fmt(income)}</span></div>
              </div>
            </div>
          )}

          {dti === null && income === 0 && (
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              Enter the customer's monthly gross income to calculate the DTI ratio.
            </div>
          )}
        </div>

        {/* Utilization */}
        <div className="card space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            Credit Utilization
            <span className="text-xs text-slate-400 font-normal">revolving balance ÷ revolving limit</span>
          </h3>

          <div className="space-y-3">
            {[c, ...revolving.map(a => ({ name: a.creditor, balance: a.balance, creditLimit: a.creditLimit }))].map((a, i) => {
              const name = i === 0 ? `This Account (${c.id})` : a.name || a.creditor
              const u = ((a.balance / a.creditLimit) * 100).toFixed(1)
              return (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-slate-700">{name}</span>
                    <span className={`text-xs font-bold ${
                      parseFloat(u) > 75 ? 'text-red-600' :
                      parseFloat(u) > 50 ? 'text-orange-600' :
                      parseFloat(u) > 30 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{u}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        parseFloat(u) > 75 ? 'bg-red-500' :
                        parseFloat(u) > 50 ? 'bg-orange-500' :
                        parseFloat(u) > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(parseFloat(u), 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>${fmt(a.balance)} balance</span>
                    <span>${fmt(a.creditLimit)} limit</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Overall Revolving Utilization</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">{utilization.toFixed(1)}%</span>
                <RatingBadge {...utilRating(utilization)} />
              </div>
            </div>
            <RatioBar value={utilization} max={100} thresholds={{ low: 30, medium: 50, high: 75 }} />
            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between"><span>Total revolving balance:</span><span className="font-mono font-medium">${fmt(totalRevBal)}</span></div>
              <div className="flex justify-between"><span>Total revolving limit:</span><span className="font-mono font-medium">${fmt(totalRevLim)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Income Disclosure Modal */}
      {showDisclosureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Income Disclosure Required</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Have you read the income disclosure to the customer?</p>
                </div>
              </div>
              <button onClick={() => setShowDisclosureModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!disclosureRead ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Before collecting income information, you must read the income disclosure to the customer.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDisclosureRead(true)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    No — Show Disclosure
                  </button>
                  <button
                    onClick={handleConfirmDisclosure}
                    className="btn-success justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Yes — Already Read
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Script — Read to Customer</p>
                  <p className="text-sm text-slate-800 leading-relaxed italic">
                    "Before we continue, I'd like to let you know that any income information you share
                    with us today will be used solely to help us understand your financial situation and
                    identify payment options that may be available to you. You are not required to provide
                    this information. Would you be willing to share your income details with me today?"
                  </p>
                </div>
                <button
                  onClick={handleConfirmDisclosure}
                  className="btn-success w-full justify-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Disclosure Read — Unlock Calculator
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
