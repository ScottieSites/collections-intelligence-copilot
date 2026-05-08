import React, { useState } from 'react'
import { FileText, AlertTriangle, CheckCircle2, ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function MiniMiranda() {
  const { state, dispatch } = useApp()
  const [confirmed, setConfirmed] = useState(state.mirandaConfirmed)

  function handleConfirm() {
    dispatch({ type: 'CONFIRM_MIRANDA' })
    setConfirmed(true)
  }

  function handleNext() {
    dispatch({ type: 'SET_STEP', payload: 'dashboard' })
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'overview' })
  }

  function handleBack() {
    dispatch({ type: 'SET_STEP', payload: 'verification' })
  }

  const ts = state.mirandaTimestamp
    ? new Date(state.mirandaTimestamp).toLocaleTimeString()
    : null

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mini Miranda Disclosure</h1>
          <p className="text-sm text-slate-500">Step 3 of 3 — Required legal disclosure before collection</p>
        </div>
      </div>

      {/* Compliance alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Required Disclosure — FDCPA Compliance</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            This disclosure is required under the Fair Debt Collection Practices Act before any collection
            activity may take place. Read the script below to the customer verbatim before clicking confirm.
          </p>
        </div>
      </div>

      {/* Disclosure script */}
      <div className="card border-2 border-amber-300 bg-amber-50/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-700 font-bold text-xs">📢</span>
          </div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Script — Read Verbatim to Customer</span>
        </div>

        <blockquote className="text-base text-slate-800 font-medium leading-relaxed border-l-4 border-amber-400 pl-4 py-2 bg-white rounded-r-lg">
          "If your account is currently past due, this will be an attempt to collect a debt, and any
          information obtained will be used for that purpose."
        </blockquote>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          After reading this disclosure to the customer, click the button below to confirm it was read.
          The system will log the disclosure with a timestamp, your agent ID, and the account number.
        </p>
      </div>

      {/* Confirmation */}
      {!confirmed ? (
        <div className="card space-y-4">
          <p className="text-sm text-slate-700">
            By clicking below, you confirm that you have read the Mini Miranda disclosure to the customer at{' '}
            <strong>{state.customer?.name}</strong>'s account.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-700 mb-1">Agent</p>
              <p>{state.agentName} ({state.agentId})</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-700 mb-1">Account</p>
              <p>{state.customer?.id}</p>
            </div>
          </div>

          <button onClick={handleConfirm} className="btn-success w-full justify-center py-3 text-base">
            <CheckCircle2 className="w-5 h-5" />
            Disclosure Read & Confirmed
          </button>
        </div>
      ) : (
        <div className="card border-2 border-emerald-400 bg-emerald-50 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-emerald-800">Disclosure Confirmed</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
              <p className="text-slate-500 mb-0.5">Agent ID</p>
              <p className="font-semibold text-slate-700">{state.agentId}</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
              <p className="text-slate-500 mb-0.5">Account</p>
              <p className="font-semibold text-slate-700">{state.customer?.id}</p>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
              <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Timestamp
              </p>
              <p className="font-semibold text-slate-700">{ts}</p>
            </div>
          </div>

          <p className="text-xs text-emerald-700">
            Disclosure logged. You may now proceed to begin collection efforts on the account.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={handleBack} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button onClick={handleNext} disabled={!confirmed} className="btn-primary">
          Open Account Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Audit reminder */}
      <p className="text-xs text-slate-400 text-center">
        Disclosure events are recorded in the call audit log with timestamp, agent ID, and account number.
      </p>
    </div>
  )
}
