import React, { useMemo } from 'react'
import { BrainCircuit, AlertTriangle, MessageSquare, Target, Shield, Mic, RefreshCw } from 'lucide-react'
import { useApp } from '../../context/AppContext'

// ─── Rules-based mock AI analysis (Phase 3 will replace with real LLM) ───────
function generateAnalysis(customer, notes, calculator, incomeConfirmed) {
  if (!customer) return null
  const { paymentsLate, balance, pastDue, delinquencyHistory, creditHistory, riskLevel } = customer

  const income = parseFloat(calculator.monthlyIncome) || 0
  const revolving = creditHistory.filter(a => a.creditLimit)
  const totalRevBal = revolving.reduce((s, a) => s + a.balance, 0) + balance
  const totalRevLim = revolving.reduce((s, a) => s + a.creditLimit, 0) + customer.creditLimit
  const utilPct = totalRevLim > 0 ? (totalRevBal / totalRevLim) * 100 : 0
  const autoDebt = creditHistory.reduce((s, a) => s + a.minPayment, 0) + customer.minDue
  const dti = income > 0 ? (autoDebt / income) * 100 : null
  const pastDueAccountCount = creditHistory.filter(a => a.dpd > 0 || a.status === 'Collections').length

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ── 1. Delinquency Summary ──────────────────────────────────────────────
  let delinquencySummary
  if (paymentsLate === 0) {
    delinquencySummary = 'The account is current with no past-due payments at this time.'
  } else if (paymentsLate === 1) {
    delinquencySummary = `The account is 1 payment past due with a past-due balance of $${fmt(pastDue)}. This is an early-stage delinquency. The 13-month history shows ${delinquencyHistory.summary['30dpd']} occurrence(s) at 30 DPD, suggesting this may not be the customer's first late event.`
  } else if (paymentsLate <= 3) {
    delinquencySummary = `The account is ${paymentsLate} payments past due with a past-due balance of $${fmt(pastDue)}. The 13-month delinquency history shows a recurring pattern: ${delinquencyHistory.summary['30dpd']}× at 30 DPD, ${delinquencyHistory.summary['60dpd']}× at 60 DPD, and ${delinquencyHistory.summary['90dpd']}× at 90 DPD. This pattern suggests a chronic payment management issue rather than a single hardship event.`
  } else {
    delinquencySummary = `The account is severely delinquent at ${paymentsLate} payments past due. The past-due balance is $${fmt(pastDue)}, and the account has reached ${delinquencyHistory.summary['120dpd']}× at 120 DPD, ${delinquencyHistory.summary['150dpd']}× at 150 DPD, and ${delinquencyHistory.summary['180dpd']}× at 180 DPD over the last 13 months. This account is at serious risk of charge-off if no resolution is reached.`
  }

  // ── 2. Explanation Analysis ─────────────────────────────────────────────
  let explanationAnalysis
  const hasExplanation = notes.reasonForDelinquency?.trim().length > 10
  const hasDuration = notes.durationOfIssue && notes.durationOfIssue !== 'Customer did not specify'

  if (!hasExplanation) {
    explanationAnalysis = 'No customer explanation has been recorded yet. Ask the customer why the account became past due and how long the situation has been occurring before attempting a resolution strategy.'
  } else if (hasDuration && notes.durationOfIssue === 'Less than 1 month' && paymentsLate >= 3) {
    explanationAnalysis = `The customer states the issue began less than 1 month ago, but the delinquency history shows ${paymentsLate} payments past due with a pattern dating back several months. This is a significant inconsistency. Ask the customer to clarify the timeline — there may be an earlier underlying issue that predates the stated reason.`
  } else if (hasDuration && (notes.durationOfIssue === '1–2 months' || notes.durationOfIssue === '3–6 months') && paymentsLate >= 5) {
    explanationAnalysis = `The customer's stated duration (${notes.durationOfIssue}) does not fully align with the severity of the delinquency history, which shows payments past due for ${paymentsLate} months. Consider probing for earlier contributing factors.`
  } else {
    explanationAnalysis = `The customer's stated explanation — "${notes.reasonForDelinquency.substring(0, 80)}${notes.reasonForDelinquency.length > 80 ? '...' : ''}" — has been recorded. ${hasDuration ? `The stated duration is "${notes.durationOfIssue}."` : 'Duration has not been captured yet.'} Continue gathering details before recommending a resolution path.`
  }

  // ── 3. Missing Information ──────────────────────────────────────────────
  const missing = []
  if (!hasExplanation) missing.push('Customer\'s stated reason for delinquency')
  if (!hasDuration)    missing.push('How long the situation has been occurring')
  if (!incomeConfirmed) missing.push('Income information (requires income disclosure first)')
  if (!notes.financialSituation?.trim()) missing.push('Overview of customer\'s current financial situation')
  if (pastDueAccountCount > 1 && !notes.financialSituation?.trim()) missing.push('Discussion of other past-due accounts visible in credit history')
  if (!notes.promiseToPay?.trim() && !notes.refusalReason?.trim()) missing.push('Payment commitment or documented refusal reason')

  // ── 4. Suggested Questions ─────────────────────────────────────────────
  const questions = [
    '"What caused your account to become past due?"',
    '"How long has this situation been affecting your ability to pay?"',
    '"Has your income changed recently?"',
    '"When do you expect your financial situation to improve?"',
    '"Are you able to make any payment toward the past-due amount today?"',
    '"Would setting up a payment arrangement help you get back on track?"',
    '"Are there other financial obligations making it difficult to pay?"',
  ]
  if (paymentsLate >= 5) {
    questions.push('"Have you spoken with anyone about your overall financial situation, such as a credit counselor?"')
    questions.push('"Is there a specific barrier we can help address to prevent this account from going further past due?"')
  }
  if (notes.hardshipIndicator) {
    questions.push('"What type of hardship assistance are you looking for?"')
    questions.push('"Have you explored any government or non-profit financial assistance programs?"')
  }

  // ── 5. Recommended Strategy ────────────────────────────────────────────
  let strategy
  if (!hasExplanation || missing.length >= 3) {
    strategy = 'Ask More Discovery Questions'
  } else if (notes.fraudIndicator) {
    strategy = 'Review Possible Fraud Claim'
  } else if (notes.bankruptcyIndicator) {
    strategy = 'Review Possible Bankruptcy Concern'
  } else if (notes.disputeIndicator) {
    strategy = 'Review Possible Dispute'
  } else if (notes.hardshipIndicator || paymentsLate >= 5) {
    strategy = paymentsLate >= 7 ? 'Discuss Hardship Options / Escalate to Specialist' : 'Discuss Hardship Options'
  } else if (paymentsLate >= 3) {
    strategy = 'Offer Payment Arrangement'
  } else if (paymentsLate === 1 || paymentsLate === 2) {
    strategy = pastDue < 200 ? 'Request Past-Due Amount' : 'Offer Partial Payment'
  } else {
    strategy = 'Request Payment in Full'
  }

  // ── 6. Risk Indicators ─────────────────────────────────────────────────
  const risks = []
  if (delinquencyHistory.summary['30dpd'] >= 3) risks.push({ label: 'Broken Promise Risk', level: 'medium', reason: 'Repeated prior delinquencies suggest pattern behavior' })
  if (notes.hardshipIndicator || paymentsLate >= 4)     risks.push({ label: 'Hardship Risk', level: paymentsLate >= 5 ? 'high' : 'medium', reason: 'Multiple overdue accounts or stated hardship' })
  if (notes.bankruptcyIndicator)                         risks.push({ label: 'Bankruptcy Risk', level: 'high', reason: 'Agent flagged bankruptcy indicator' })
  if (paymentsLate >= 3 && !notes.promiseToPay)          risks.push({ label: 'Avoidance Risk', level: 'medium', reason: 'No payment commitment captured after extended delinquency' })
  if (notes.disputeIndicator)                            risks.push({ label: 'Dispute Risk', level: 'medium', reason: 'Agent flagged dispute indicator' })
  if (notes.fraudIndicator)                              risks.push({ label: 'Fraud Risk', level: 'high', reason: 'Agent flagged fraud indicator — stop collection activity' })
  if (paymentsLate >= 6)                                 risks.push({ label: 'Charge-Off Risk', level: 'high', reason: `Account is ${paymentsLate} payments past due` })
  if (utilPct > 75)                                      risks.push({ label: 'High Utilization Risk', level: 'medium', reason: `Overall revolving utilization at ${utilPct.toFixed(0)}%` })

  // ── 7. Recommended Tone ────────────────────────────────────────────────
  let tone
  if (notes.fraudIndicator || notes.bankruptcyIndicator || notes.disputeIndicator) {
    tone = { label: 'De-escalating', color: 'blue', desc: 'Remain calm, do not argue, and refer to specialized team' }
  } else if (notes.hardshipIndicator || paymentsLate >= 5) {
    tone = { label: 'Empathetic', color: 'teal', desc: 'Lead with understanding; acknowledge the difficulty before exploring solutions' }
  } else if (!hasExplanation || missing.length >= 3) {
    tone = { label: 'Clarifying', color: 'indigo', desc: 'Ask open-ended questions to gather critical missing information' }
  } else if (paymentsLate >= 3) {
    tone = { label: 'Supportive', color: 'emerald', desc: 'Acknowledge the situation and focus on solutions' }
  } else {
    tone = { label: 'Direct', color: 'blue', desc: 'Clear, concise communication focused on collecting the past-due amount' }
  }

  return { delinquencySummary, explanationAnalysis, missing, questions, strategy, risks, tone, utilPct, dti }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color = 'blue', children }) {
  const bg = color === 'purple' ? 'bg-purple-100' : color === 'teal' ? 'bg-teal-100' : color === 'amber' ? 'bg-amber-100' : 'bg-blue-100'
  const ic = color === 'purple' ? 'text-purple-600' : color === 'teal' ? 'text-teal-600' : color === 'amber' ? 'text-amber-600' : 'text-blue-600'
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon className={`w-4 h-4 ${ic}`} />
        </div>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function RiskPill({ label, level }) {
  const cls =
    level === 'high'   ? 'bg-red-100 text-red-700 border-red-300' :
    level === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                         'bg-slate-100 text-slate-600 border-slate-200'
  return (
    <div className={`inline-flex flex-col px-3 py-1.5 rounded-lg border text-xs font-semibold ${cls}`}>
      {label}
      <span className="font-normal opacity-80 capitalize">{level} risk</span>
    </div>
  )
}

export default function AIStrategy() {
  const { state, dispatch } = useApp()
  const [refreshKey, setRefreshKey] = React.useState(0)

  const analysis = useMemo(
    () => generateAnalysis(state.customer, state.notes, state.calculator, state.incomeDisclosureConfirmed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.customer, state.notes, state.calculator, state.incomeDisclosureConfirmed, refreshKey]
  )

  if (!analysis) return null

  const { delinquencySummary, explanationAnalysis, missing, questions, strategy, risks, tone } = analysis

  const toneColor = {
    'Empathetic': 'bg-teal-100 text-teal-800 border-teal-300',
    'Direct': 'bg-blue-100 text-blue-800 border-blue-300',
    'Supportive': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Urgent': 'bg-orange-100 text-orange-800 border-orange-300',
    'Clarifying': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'De-escalating': 'bg-slate-100 text-slate-800 border-slate-300',
  }[tone.label] || 'bg-slate-100 text-slate-800'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI Collection Strategy</h2>
            <p className="text-sm text-slate-500">Guidance updates as you add notes and account data</p>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="btn-secondary text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Analysis
        </button>
      </div>

      {/* Demo mode banner */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
        <BrainCircuit className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <p className="text-xs text-purple-800">
          <strong>Phase 1 Demo Mode:</strong> Analysis is generated using rules-based logic from account data and notes.
          Phase 3 will replace this with a real LLM (OpenAI / Claude) for dynamic, conversational guidance.
        </p>
      </div>

      {/* Compliance notice */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <Shield className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>AI Safety Notice:</strong> This guidance is for informational support only. The AI does not make
          autonomous collection decisions, replace required disclosures, guarantee outcomes, or provide legal advice.
          All actions must be reviewed and approved by the agent before use.
        </p>
      </div>

      {/* Strategy + Tone highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-gradient-to-br from-purple-600 to-purple-800 text-white">
          <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-1">Recommended Strategy</p>
          <p className="text-lg font-bold">{strategy}</p>
          <p className="text-xs text-purple-200 mt-2">Based on current account data, notes, and delinquency history.</p>
        </div>
        <div className={`card border-2 ${toneColor}`}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Recommended Tone</p>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            <p className="text-lg font-bold">{tone.label}</p>
          </div>
          <p className="text-xs mt-2 opacity-80">{tone.desc}</p>
        </div>
      </div>

      {/* 1. Delinquency Summary */}
      <Section icon={Target} title="1. Delinquency Summary" color="blue">
        <p className="text-sm text-slate-700 leading-relaxed">{delinquencySummary}</p>
      </Section>

      {/* 2. Customer Explanation Analysis */}
      <Section icon={MessageSquare} title="2. Customer Explanation Analysis" color="teal">
        <p className="text-sm text-slate-700 leading-relaxed">{explanationAnalysis}</p>
      </Section>

      {/* 3. Missing Information */}
      {missing.length > 0 && (
        <Section icon={AlertTriangle} title="3. Missing Information" color="amber">
          <p className="text-xs text-amber-700 mb-2">The following information has not yet been captured. Gather these before finalizing your strategy:</p>
          <ul className="space-y-1.5">
            {missing.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 4. Suggested Questions */}
      <Section icon={MessageSquare} title="4. Suggested Agent Questions" color="purple">
        <ul className="space-y-2">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-purple-50 transition-colors">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm text-slate-700 italic">{q}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 5. Risk Indicators */}
      <Section icon={Shield} title="5. Risk Indicators" color="amber">
        {risks.length === 0 ? (
          <p className="text-sm text-emerald-600">No significant risk indicators detected at this time.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {risks.map((r, i) => <RiskPill key={i} {...r} />)}
            </div>
            <div className="space-y-2 mt-2">
              {risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    r.level === 'high' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <span><strong>{r.label}:</strong> {r.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Notes summary */}
      {(state.notes.reasonForDelinquency || state.notes.promiseToPay) && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="section-label mb-2">Notes Snapshot — Feeding This Analysis</p>
          <div className="space-y-1 text-xs text-slate-600">
            {state.notes.reasonForDelinquency && (
              <p><strong>Reason stated:</strong> {state.notes.reasonForDelinquency}</p>
            )}
            {state.notes.durationOfIssue && (
              <p><strong>Duration:</strong> {state.notes.durationOfIssue}</p>
            )}
            {state.notes.promiseToPay && (
              <p><strong>Promise to pay:</strong> {state.notes.promiseToPay}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
