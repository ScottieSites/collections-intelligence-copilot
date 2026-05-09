import React, { useState, useEffect, useRef } from 'react'
import {
  BrainCircuit, AlertTriangle, MessageSquare, Target, Shield,
  Mic, RefreshCw, Loader2, AlertCircle, Sparkles,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

async function fetchAnalysis(account, notes, calculator, incomeConfirmed) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, notes, calculator, incomeConfirmed }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${res.status})`)
  }
  return res.json()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color = 'blue', children }) {
  const bg = { purple: 'bg-purple-100', teal: 'bg-teal-100', amber: 'bg-amber-100', blue: 'bg-blue-100', emerald: 'bg-emerald-100' }[color] ?? 'bg-blue-100'
  const ic = { purple: 'text-purple-600', teal: 'text-teal-600', amber: 'text-amber-600', blue: 'text-blue-600', emerald: 'text-emerald-600' }[color] ?? 'text-blue-600'
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

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-slate-200 rounded-xl" />
        <div className="h-24 bg-slate-200 rounded-xl" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="card space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIStrategy() {
  const { state } = useApp()
  const [analysis, setAnalysis]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const debounceRef = useRef(null)
  const abortRef    = useRef(null)

  async function runAnalysis() {
    if (!state.customer) return
    // Cancel any in-flight request
    abortRef.current?.abort()
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAnalysis(
        state.customer,
        state.notes,
        state.calculator,
        state.incomeDisclosureConfirmed,
      )
      setAnalysis(result)
      setLastUpdated(new Date())
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fire immediately when customer loads
  useEffect(() => {
    if (!state.customer) return
    runAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.customer?.id])

  // Debounce re-analysis when notes or calculator change
  useEffect(() => {
    if (!state.customer) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runAnalysis, 1500)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.notes, state.calculator, state.incomeDisclosureConfirmed])

  if (!state.customer) return null

  const toneColorMap = {
    blue:    'bg-blue-100 text-blue-800 border-blue-300',
    teal:    'bg-teal-100 text-teal-800 border-teal-300',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    amber:   'bg-amber-100 text-amber-800 border-amber-300',
    indigo:  'bg-indigo-100 text-indigo-800 border-indigo-300',
    purple:  'bg-purple-100 text-purple-800 border-purple-300',
    red:     'bg-red-100 text-red-800 border-red-300',
  }

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
            <p className="text-sm text-slate-500">
              {loading
                ? 'Analyzing with Claude...'
                : lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                : 'Guidance updates as you add notes'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="btn-secondary text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Powered by Claude badge */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
        <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <p className="text-xs text-purple-800">
          <strong>Powered by Claude</strong> — Analysis updates automatically as you fill in notes.
          Income and DTI data are included after the customer completes income disclosure.
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

      {/* Error state (shown above existing analysis if one exists) */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Analysis failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button onClick={runAnalysis} className="btn-secondary text-xs px-2 py-1">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton — only shown on first load (no existing analysis yet) */}
      {loading && !analysis && <LoadingSkeleton />}

      {/* Analysis — dimmed slightly while re-loading */}
      {analysis && (
        <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>

          {/* Compliance flags */}
          {analysis.complianceFlags?.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-bold text-red-700">FDCPA Compliance Alert</p>
              </div>
              {analysis.complianceFlags.map((flag, i) => (
                <p key={i} className="text-xs text-red-700 pl-6">{flag}</p>
              ))}
            </div>
          )}

          {/* Strategy + Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="card bg-gradient-to-br from-purple-600 to-purple-800 text-white">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide mb-1">Recommended Strategy</p>
              <p className="text-lg font-bold">{analysis.strategy}</p>
              {analysis.strategyReason && (
                <p className="text-xs text-purple-200 mt-2">{analysis.strategyReason}</p>
              )}
            </div>
            {analysis.tone && (
              <div className={`card border-2 ${toneColorMap[analysis.tone.color] ?? 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Recommended Tone</p>
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  <p className="text-lg font-bold">{analysis.tone.label}</p>
                </div>
                <p className="text-xs mt-2 opacity-80">{analysis.tone.desc}</p>
              </div>
            )}
          </div>

          {/* 1. Delinquency Summary */}
          <div className="space-y-4">
            <Section icon={Target} title="1. Delinquency Summary" color="blue">
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.delinquencySummary}</p>
            </Section>

            {/* 2. Explanation Analysis */}
            <Section icon={MessageSquare} title="2. Customer Explanation Analysis" color="teal">
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.explanationAnalysis}</p>
            </Section>

            {/* 3. Missing Information */}
            {analysis.missing?.length > 0 && (
              <Section icon={AlertTriangle} title="3. Missing Information" color="amber">
                <p className="text-xs text-amber-700 mb-2">Gather these before finalizing your strategy:</p>
                <ul className="space-y-1.5">
                  {analysis.missing.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 4. Suggested Questions */}
            {analysis.questions?.length > 0 && (
              <Section icon={MessageSquare} title="4. Suggested Agent Questions" color="purple">
                <ul className="space-y-2">
                  {analysis.questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-purple-50 transition-colors">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-sm text-slate-700 italic">"{q}"</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* 5. Risk Indicators */}
            <Section icon={Shield} title="5. Risk Indicators" color="amber">
              {!analysis.risks?.length ? (
                <p className="text-sm text-emerald-600">No significant risk indicators detected at this time.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {analysis.risks.map((r, i) => <RiskPill key={i} {...r} />)}
                  </div>
                  <div className="space-y-2 mt-2">
                    {analysis.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          r.level === 'high' ? 'bg-red-500' : r.level === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span><strong>{r.label}:</strong> {r.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* Notes snapshot */}
          {(state.notes.reasonForDelinquency || state.notes.promiseToPay) && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="section-label mb-2">Notes Feeding This Analysis</p>
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
      )}
    </div>
  )
}
