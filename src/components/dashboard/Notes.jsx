import React from 'react'
import { StickyNote, Save, CheckCircle2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const RECOMMENDED_ACTIONS = [
  'Request payment in full',
  'Request past-due amount',
  'Offer partial payment',
  'Offer payment arrangement',
  'Discuss hardship options',
  'Ask more discovery questions',
  'Escalate to specialist',
  'Review possible dispute',
  'Review possible fraud claim',
  'Review possible bankruptcy concern',
  'Schedule follow-up call',
  'No action taken — customer unavailable',
]

const DURATION_OPTIONS = [
  'Less than 1 month',
  '1–2 months',
  '3–6 months',
  '6–12 months',
  'More than 1 year',
  'Customer did not specify',
]

export default function Notes() {
  const { state, dispatch } = useApp()
  const [saved, setSaved] = React.useState(false)
  const notes = state.notes

  function update(field, value) {
    dispatch({ type: 'UPDATE_NOTES', payload: { [field]: value } })
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <StickyNote className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Call Notes</h2>
            <p className="text-sm text-slate-500">Document customer conversation details</p>
          </div>
        </div>
        <button onClick={handleSave} className={saved ? 'btn-success' : 'btn-primary'}>
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Notes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left column */}
        <div className="space-y-5">

          {/* Reason for delinquency */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Reason for Delinquency</span>
              <textarea
                rows={3}
                value={notes.reasonForDelinquency}
                onChange={(e) => update('reasonForDelinquency', e.target.value)}
                placeholder="Enter the customer's stated reason for falling behind on payments..."
                className="textarea-field"
              />
            </label>
          </div>

          {/* Duration */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">How Long Has the Issue Been Occurring?</span>
              <select
                value={notes.durationOfIssue}
                onChange={(e) => update('durationOfIssue', e.target.value)}
                className="input-field"
              >
                <option value="">Select duration...</option>
                {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>

          {/* Financial situation */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Current Financial Situation</span>
              <textarea
                rows={3}
                value={notes.financialSituation}
                onChange={(e) => update('financialSituation', e.target.value)}
                placeholder="Describe the customer's overall financial situation as stated..."
                className="textarea-field"
              />
            </label>
          </div>

          {/* Promise to pay */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Promise-to-Pay Details</span>
              <textarea
                rows={2}
                value={notes.promiseToPay}
                onChange={(e) => update('promiseToPay', e.target.value)}
                placeholder="e.g. Customer promised $200 by May 20, 2026..."
                className="textarea-field"
              />
            </label>
          </div>

          {/* Refusal reason */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Refusal Reason</span>
              <textarea
                rows={2}
                value={notes.refusalReason}
                onChange={(e) => update('refusalReason', e.target.value)}
                placeholder="If customer refused payment, note the reason..."
                className="textarea-field"
              />
            </label>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Indicators */}
          <div className="card">
            <span className="section-label mb-3 block">Indicators — Check All That Apply</span>
            <div className="space-y-2.5">
              {[
                { field: 'hardshipIndicator',   label: '💛 Hardship Indicator',    desc: 'Customer has expressed genuine financial hardship' },
                { field: 'disputeIndicator',    label: '🔵 Dispute Indicator',     desc: 'Customer is disputing the debt or amount' },
                { field: 'bankruptcyIndicator', label: '⚫ Bankruptcy Indicator',  desc: 'Customer mentioned bankruptcy or consulting an attorney' },
                { field: 'fraudIndicator',      label: '🔴 Fraud Indicator',       desc: 'Customer alleges account fraud or identity theft' },
              ].map(({ field, label, desc }) => (
                <label key={field} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  notes[field] ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={notes[field]}
                    onChange={(e) => update(field, e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Follow-up date */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Follow-Up Date</span>
              <input
                type="date"
                value={notes.followUpDate}
                onChange={(e) => update('followUpDate', e.target.value)}
                className="input-field"
              />
            </label>
          </div>

          {/* Recommended action */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Recommended Next Action</span>
              <select
                value={notes.recommendedAction}
                onChange={(e) => update('recommendedAction', e.target.value)}
                className="input-field"
              >
                <option value="">Select action...</option>
                {RECOMMENDED_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </div>

          {/* Additional notes */}
          <div className="card">
            <label className="block">
              <span className="section-label mb-2 block">Additional Notes</span>
              <textarea
                rows={4}
                value={notes.additionalNotes}
                onChange={(e) => update('additionalNotes', e.target.value)}
                placeholder="Any other relevant details from the call..."
                className="textarea-field"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Active indicators summary */}
      {(notes.hardshipIndicator || notes.disputeIndicator || notes.bankruptcyIndicator || notes.fraudIndicator) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-800 mb-2">⚠ Active Indicators — Special Handling Required</p>
          <div className="flex flex-wrap gap-2">
            {notes.hardshipIndicator   && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">Hardship</span>}
            {notes.disputeIndicator    && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Dispute</span>}
            {notes.bankruptcyIndicator && <span className="px-3 py-1 bg-slate-200 text-slate-800 rounded-full text-xs font-semibold">Bankruptcy</span>}
            {notes.fraudIndicator      && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Fraud</span>}
          </div>
          <p className="text-xs text-red-700 mt-2">
            One or more special indicators are active. Review your team's handling protocols for each flagged category before proceeding.
          </p>
        </div>
      )}
    </div>
  )
}
