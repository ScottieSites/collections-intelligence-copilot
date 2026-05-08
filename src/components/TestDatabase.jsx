import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Database, Search, SlidersHorizontal, PhoneCall, RefreshCw,
  ChevronLeft, ChevronRight, X, Building2, User, Users,
  TrendingDown, BarChart3, AlertTriangle, Sparkles, Link,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { searchAccounts, getStats, getDatabase } from '../data/db/index.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'

function RiskBadge({ level, label }) {
  const cls = level === 'high' ? 'risk-badge-high' : level === 'medium' ? 'risk-badge-medium' : 'risk-badge-low'
  return <span className={cls}>{label}</span>
}

function DPDBadge({ n }) {
  if (n === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Current</span>
  const cls =
    n >= 5 ? 'bg-red-200 text-red-900' :
    n >= 3 ? 'bg-orange-100 text-orange-800' :
    n >= 1 ? 'bg-amber-100 text-amber-800' : ''
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{n}× late</span>
}

function PersonalityBadge({ type }) {
  const map = {
    cooperative:  'bg-emerald-100 text-emerald-700',
    defensive:    'bg-amber-100 text-amber-700',
    avoidant:     'bg-orange-100 text-orange-700',
    angry:        'bg-red-100 text-red-700',
    confused:     'bg-blue-100 text-blue-700',
    overwhelmed:  'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {type}
    </span>
  )
}

const PAGE_SIZE = 20

const SCENARIO_LABELS = {
  all: 'All Scenarios',
  current: 'Current Account',
  first_delinquency: 'First Delinquency',
  chronic_delinquency: 'Chronic Delinquency',
  hardship: 'Hardship',
  severe_delinquency: 'Severe Delinquency',
  broken_promise: 'Broken Promise',
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {[
        { label:'Total Accounts',  val: stats.total,    icon:'🗂️'  },
        { label:'Consumer',        val: stats.consumer, icon:'👤'  },
        { label:'Business',        val: stats.business, icon:'🏢'  },
        { label:'Multi-Account',   val: stats.multi,    icon:'🔗'  },
        { label:'Current',         val: stats.current,  icon:'✅'  },
        { label:'Delinquent',      val: stats.delinquent,icon:'⚠️'  },
        { label:'Severe (4+ late)',val: stats.severe,   icon:'🔴'  },
      ].map(({ label, val, icon }) => (
        <div key={label} className="card-sm text-center">
          <p className="text-xl">{icon}</p>
          <p className="text-lg font-bold text-slate-800">{val?.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Filter panel ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onReset, resultCount }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-700">Filters</span>
          <span className="text-xs text-slate-400">({resultCount.toLocaleString()} results)</span>
        </div>
        <button onClick={onReset} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <X className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="section-label mb-1 block">Account Type</label>
          <select value={filters.accountType} onChange={e => onChange('accountType', e.target.value)} className="input-field text-xs">
            <option value="all">All Types</option>
            <option value="consumer">Consumer</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div>
          <label className="section-label mb-1 block">Risk Level</label>
          <select value={filters.riskLevel} onChange={e => onChange('riskLevel', e.target.value)} className="input-field text-xs">
            <option value="all">All Risk</option>
            <option value="low">Low Risk</option>
            <option value="medium">Moderate Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        <div>
          <label className="section-label mb-1 block">Delinquency</label>
          <select value={filters.delinquencyLevel} onChange={e => onChange('delinquencyLevel', e.target.value)} className="input-field text-xs">
            <option value="all">All</option>
            <option value="current">Current</option>
            <option value="mild">Mild (1–2×)</option>
            <option value="moderate">Moderate (3–4×)</option>
            <option value="severe">Severe (5+×)</option>
          </select>
        </div>

        <div>
          <label className="section-label mb-1 block">Scenario</label>
          <select value={filters.scenarioType} onChange={e => onChange('scenarioType', e.target.value)} className="input-field text-xs">
            {Object.entries(SCENARIO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="section-label mb-1 block">Personality</label>
          <select value={filters.personalityType} onChange={e => onChange('personalityType', e.target.value)} className="input-field text-xs">
            <option value="all">All Types</option>
            {['cooperative','defensive','avoidant','angry','confused','overwhelmed'].map(p => (
              <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="section-label block">Quick Filters</label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={filters.hasHardship} onChange={e => onChange('hasHardship', e.target.checked)} className="accent-blue-600" />
            <span className="text-xs text-slate-600">Has Hardship</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={filters.isMultiAccount} onChange={e => onChange('isMultiAccount', e.target.checked)} className="accent-blue-600" />
            <span className="text-xs text-slate-600">Multi-Account</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Account row ─────────────────────────────────────────────────────────────
function AccountRow({ account, onLoad }) {
  const isConsumer = account.accountType === 'consumer'
  const hasLinked = !!account.linkedAccountId

  return (
    <tr className="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            isConsumer ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {isConsumer ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{account.name}</p>
            {account.businessName && <p className="text-xs text-slate-500">{account.businessName}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-mono text-xs text-slate-600">{account.id}</p>
        <p className="text-[10px] text-slate-400">{account.customerId}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
          isConsumer ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
        }`}>
          {account.accountType}
        </span>
        {hasLinked && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Link className="w-2.5 h-2.5 text-slate-400" />
            <span className="text-[9px] text-slate-400">linked</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <DPDBadge n={account.paymentsLate} />
      </td>
      <td className="px-4 py-3">
        <p className="font-mono text-sm font-semibold text-slate-800">${fmt(account.balance)}</p>
        <p className="text-[10px] text-slate-400">limit ${fmt(account.creditLimit)}</p>
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={account.riskLevel} label={account.riskLabel} />
      </td>
      <td className="px-4 py-3">
        <PersonalityBadge type={account.personalityType} />
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-600 capitalize">{account.scenarioType?.replace(/_/g, ' ')}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            account.aiRiskScore >= 0.7 ? 'bg-red-500' :
            account.aiRiskScore >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
          <span className="text-xs text-slate-600">{(account.aiRiskScore * 100).toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onLoad(account)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          <PhoneCall className="w-3 h-3" />
          Load
        </button>
      </td>
    </tr>
  )
}

// ─── Account detail drawer ────────────────────────────────────────────────────
function AccountDrawer({ account, onClose, onLoad }) {
  if (!account) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Account Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onLoad(account); onClose() }}
              className="btn-primary text-sm"
            >
              <PhoneCall className="w-4 h-4" />
              Start Call
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Identity */}
          <div>
            <p className="section-label mb-2">Customer</p>
            <p className="text-lg font-bold text-slate-900">{account.name}</p>
            {account.businessName && <p className="text-sm text-slate-500">{account.businessName} · {account.businessType}</p>}
            <p className="text-sm text-slate-600 mt-1">{account.address}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {account.accountType === 'business'
                ? `${account.industry} · ${account.employees} employee(s) · ${account.yearsInBusiness}yr in business`
                : account.email}
            </p>
          </div>

          {/* Account numbers */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Account #</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{account.id}</p>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Customer ID</p>
              <p className="font-mono font-bold text-slate-800 mt-0.5">{account.customerId}</p>
            </div>
          </div>

          {/* Financials */}
          <div>
            <p className="section-label mb-2">Account Financials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { l:'Balance',       v:`$${fmt(account.balance)}` },
                { l:'Credit Limit',  v:`$${fmt(account.creditLimit)}` },
                { l:'Past Due',      v:`$${fmt(account.pastDue)}` },
                { l:'Min Payment',   v:`$${fmt(account.minDue)}` },
                { l:'Payments Late', v:`${account.paymentsLate}` },
                { l:'Credit Score',  v:account.creditScore },
              ].map(({l,v}) => (
                <div key={l} className="p-2 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">{l}</p>
                  <p className="font-bold text-slate-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI metadata */}
          <div>
            <p className="section-label mb-2">AI Testing Metadata</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                <span className="text-purple-700">Personality</span>
                <PersonalityBadge type={account.personalityType} />
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Communication Style</span>
                <span className="font-medium capitalize">{account.communicationStyle}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Payment Likelihood</span>
                <span className="font-bold text-slate-800">{(account.paymentLikelihood * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">AI Risk Score</span>
                <span className={`font-bold ${account.aiRiskScore >= 0.7 ? 'text-red-600' : account.aiRiskScore >= 0.4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {(account.aiRiskScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Broken Promises</span>
                <span className="font-bold text-slate-800">{account.brokenPromiseHistory}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Scenario Type</span>
                <span className="font-medium capitalize">{account.scenarioType?.replace(/_/g,' ')}</span>
              </div>
            </div>
          </div>

          {/* Hardship */}
          {account.hasHardship && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800 mb-1">Hardship Indicator</p>
              <p className="text-xs text-amber-700 capitalize">{account.hardshipType?.replace(/_/g,' ')}</p>
              <p className="text-xs text-amber-700 mt-1">{account.hardshipDescription}</p>
            </div>
          )}

          {/* Delinquency reason */}
          {account.delinquencyReason && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-semibold text-slate-700 mb-1">Scripted Delinquency Reason</p>
              <p className="text-xs text-slate-600 italic">"{account.delinquencyReason}"</p>
            </div>
          )}

          {/* Recommended strategy */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-semibold text-blue-800 mb-1">Recommended Strategy</p>
            <p className="text-xs text-blue-700">{account.recommendedStrategy}</p>
          </div>

          {/* Linked account */}
          {account.linkedAccountId && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Link className="w-3.5 h-3.5 text-indigo-600" />
                <p className="text-xs font-semibold text-indigo-800">Linked Account</p>
              </div>
              <p className="text-xs text-indigo-600 font-mono mt-1">{account.linkedAccountId}</p>
              <p className="text-[10px] text-indigo-500 mt-0.5">This customer has a linked {account.accountType === 'consumer' ? 'business' : 'consumer'} account</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  query: '',
  accountType: 'all',
  riskLevel: 'all',
  delinquencyLevel: 'all',
  scenarioType: 'all',
  personalityType: 'all',
  hasHardship: false,
  isMultiAccount: false,
}

export default function TestDatabase() {
  const { dispatch } = useApp()

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState(null)
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Lazy-load the database on first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(getStats())
      setLoading(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const results = useMemo(() => {
    if (loading) return []
    return searchAccounts(filters)
  }, [filters, loading])

  const totalPages = Math.ceil(results.length / PAGE_SIZE)
  const paginated  = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function updateFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  function loadAccount(account) {
    dispatch({ type: 'SELECT_CUSTOMER', payload: account })
    dispatch({ type: 'SET_STEP', payload: 'verification' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <Database className="w-10 h-10 text-blue-500 mx-auto animate-pulse" />
          <p className="text-slate-600 font-medium">Generating test database…</p>
          <p className="text-sm text-slate-400">Building 850+ realistic mock accounts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Test Database</h1>
              <p className="text-xs text-slate-500">Mock enterprise collections portfolio — all data is fictional</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 px-3 py-1.5 bg-slate-100 rounded-lg font-mono">
              Seed: 2026 · {stats?.total.toLocaleString()} accounts
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.query}
            onChange={e => updateFilter('query', e.target.value)}
            placeholder="Search by name, account number, customer ID, email, or address…"
            className="input-field pl-10 py-2.5"
          />
          {filters.query && (
            <button onClick={() => updateFilter('query', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
          resultCount={results.length}
        />

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Customer','Account #','Type','Delinquency','Balance','Risk','Personality','Scenario','AI Risk',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      No accounts match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map(a => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      onLoad={loadAccount}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, results.length)} of {results.length.toLocaleString()} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="card-sm">
          <p className="section-label mb-3">AI Testing — Personality Type Guide</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {[
              { type:'cooperative',  desc:'Willing to discuss, open to solutions' },
              { type:'defensive',    desc:'Reluctant, questions legitimacy' },
              { type:'avoidant',     desc:'Evasive, avoids commitment' },
              { type:'angry',        desc:'Hostile, escalation risk' },
              { type:'confused',     desc:'Does not understand their situation' },
              { type:'overwhelmed',  desc:'Anxious, financially distressed' },
            ].map(({ type, desc }) => (
              <div key={type} className="p-2 bg-slate-50 rounded-lg">
                <PersonalityBadge type={type} />
                <p className="text-slate-500 mt-1.5 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer */}
      <AccountDrawer account={selected} onClose={() => setSelected(null)} onLoad={(a) => { loadAccount(a); setSelected(null) }} />
    </div>
  )
}
