import { generateDatabase } from './generate.js'

// ─── Generated once at import time (seed 2026 = deterministic) ───────────────
let _db = null
export function getDatabase() {
  if (!_db) _db = generateDatabase(2026)
  return _db
}

export function getAccountById(id) {
  return getDatabase().find(a => a.id === id)
}

export function getAccountsByCustomer(customerId) {
  return getDatabase().filter(a => a.customerId === customerId)
}

// ─── Summary stats (computed once) ───────────────────────────────────────────
let _stats = null
export function getStats() {
  if (_stats) return _stats
  const db = getDatabase()
  _stats = {
    total:    db.length,
    consumer: db.filter(a => a.accountType === 'consumer').length,
    business: db.filter(a => a.accountType === 'business').length,
    multi:    new Set(
                db.filter(a => a.linkedAccountId).map(a => a.customerId)
              ).size,
    current:       db.filter(a => a.paymentsLate === 0).length,
    delinquent:    db.filter(a => a.paymentsLate > 0).length,
    severe:        db.filter(a => a.paymentsLate >= 4).length,
  }
  return _stats
}

// ─── Search & filter ─────────────────────────────────────────────────────────
export function searchAccounts(filters = {}) {
  let results = getDatabase()

  if (filters.query) {
    const q = filters.query.toLowerCase()
    results = results.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.customerId.toLowerCase().includes(q) ||
      (a.businessName?.toLowerCase().includes(q)) ||
      a.address.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
  }

  if (filters.accountType && filters.accountType !== 'all') {
    results = results.filter(a => a.accountType === filters.accountType)
  }

  if (filters.riskLevel && filters.riskLevel !== 'all') {
    results = results.filter(a => a.riskLevel === filters.riskLevel)
  }

  if (filters.delinquencyLevel && filters.delinquencyLevel !== 'all') {
    const map = {
      current:  (a) => a.paymentsLate === 0,
      mild:     (a) => a.paymentsLate >= 1 && a.paymentsLate <= 2,
      moderate: (a) => a.paymentsLate >= 3 && a.paymentsLate <= 4,
      severe:   (a) => a.paymentsLate >= 5,
    }
    const fn = map[filters.delinquencyLevel]
    if (fn) results = results.filter(fn)
  }

  if (filters.scenarioType && filters.scenarioType !== 'all') {
    results = results.filter(a => a.scenarioType === filters.scenarioType)
  }

  if (filters.personalityType && filters.personalityType !== 'all') {
    results = results.filter(a => a.personalityType === filters.personalityType)
  }

  if (filters.hasHardship === true) {
    results = results.filter(a => a.hasHardship)
  }

  if (filters.hasBankruptcy === true) {
    results = results.filter(a => a.hardshipType === 'bankruptcy_risk')
  }

  if (filters.isMultiAccount === true) {
    results = results.filter(a => !!a.linkedAccountId)
  }

  if (filters.minBalance !== undefined) {
    results = results.filter(a => a.balance >= filters.minBalance)
  }

  if (filters.maxBalance !== undefined) {
    results = results.filter(a => a.balance <= filters.maxBalance)
  }

  if (filters.patternName && filters.patternName !== 'all') {
    results = results.filter(a => a.patternName === filters.patternName)
  }

  return results
}
