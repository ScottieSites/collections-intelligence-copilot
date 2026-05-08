import { SeededRNG }   from './rng.js'
import {
  MALE_FIRST, FEMALE_FIRST, LAST, STREETS, STREET_TYPES, CITIES,
  EMAIL_DOMAINS, INDUSTRIES, BIZ_SUFFIXES, BIZ_PREFIXES,
  HARDSHIP_TYPES, HARDSHIP_DESCRIPTIONS, EMPLOYMENT_STATUSES,
  PERSONALITY_TYPES, COMMUNICATION_STYLES, CREDITORS,
  DELINQUENCY_REASONS, MONTHS_13, REFUSAL_REASONS,
} from './pools.js'
import {
  generatePattern, PATTERN_NAMES, currentDPDForPattern,
  paymentsLateFromDPD, riskFromPattern,
} from './patterns.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt2 = (n) => String(n).padStart(2, '0')
const fmtId = (prefix, seq) => `${prefix}-${String(seq).padStart(6, '0')}`
const fmtDate = (y, m, d) => `${y}-${fmt2(m)}-${fmt2(d)}`

// Segment-weighted pattern picker
const CONSUMER_PATTERNS = [
  { value:'always_current',            weight:12 },
  { value:'perfect_then_recent_5dpd',  weight:8  },
  { value:'first_time_30dpd',          weight:8  },
  { value:'first_time_60dpd',          weight:5  },
  { value:'sporadic_5dpd',             weight:8  },
  { value:'sporadic_30dpd_cures',      weight:10 },
  { value:'chronic_30dpd',             weight:10 },
  { value:'cycle_3060',                weight:8  },
  { value:'escalating_mild',           weight:7  },
  { value:'escalating_severe',         weight:5  },
  { value:'severe_90_120',             weight:6  },
  { value:'severe_150_180',            weight:4  },
  { value:'near_chargeoff',            weight:3  },
  { value:'recovering_from_90',        weight:5  },
  { value:'recovering_from_180',       weight:3  },
  { value:'cure_cycles',               weight:6  },
  { value:'broken_promises_pattern',   weight:5  },
]

const BUSINESS_PATTERNS = [
  { value:'always_current',            weight:14 },
  { value:'perfect_then_recent_5dpd',  weight:6  },
  { value:'first_time_30dpd',          weight:8  },
  { value:'business_seasonal',         weight:14 },
  { value:'sporadic_30dpd_cures',      weight:10 },
  { value:'chronic_30dpd',             weight:9  },
  { value:'cycle_3060',                weight:8  },
  { value:'escalating_mild',           weight:7  },
  { value:'escalating_severe',         weight:5  },
  { value:'severe_90_120',             weight:5  },
  { value:'severe_150_180',            weight:4  },
  { value:'near_chargeoff',            weight:3  },
  { value:'recovering_from_90',        weight:4  },
  { value:'broken_promises_pattern',   weight:3  },
]

// ─── Sub-generators ───────────────────────────────────────────────────────────

function genPersonal(rng, seq) {
  const isFemale = rng.chance(0.48)
  const firstName = isFemale ? rng.pick(FEMALE_FIRST) : rng.pick(MALE_FIRST)
  const lastName  = rng.pick(LAST)
  const city      = rng.pick(CITIES)
  const streetNum = rng.int(100, 9999)
  const street    = rng.pick(STREETS)
  const streetType = rng.pick(STREET_TYPES)
  const address   = `${streetNum} ${street} ${streetType}, ${city.city}, ${city.state} ${city.zip}`

  const mobPre  = rng.int(200, 999)
  const mobMid  = rng.int(100, 999)
  const mobSuf  = rng.int(1000, 9999)
  const homePre = rng.int(200, 999)
  const homeMid = rng.int(100, 999)
  const homeSuf = rng.int(1000, 9999)
  const workPre = rng.int(200, 999)
  const workMid = rng.int(100, 999)
  const workSuf = rng.int(1000, 9999)

  const hasHome = rng.chance(0.55)
  const hasWork = rng.chance(0.65)
  const preferred = hasHome && rng.chance(0.3) ? 'Home' : hasWork && rng.chance(0.3) ? 'Work' : 'Mobile'

  const emailUser = rng.chance(0.5)
    ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    : rng.chance(0.5)
    ? `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}`
    : `${lastName.toLowerCase()}${rng.int(10, 999)}`
  const email = `${emailUser}@${rng.pick(EMAIL_DOMAINS)}`

  const dobMonth = rng.int(1, 12)
  const dobDay   = rng.day(dobMonth)
  const ssnD1    = rng.int(0, 9)
  const ssnD2    = rng.int(0, 9)
  const ssnD3    = rng.int(0, 9)
  const ssnD4    = rng.int(0, 9)

  return {
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    ssn_last4: `${ssnD1}${ssnD2}${ssnD3}${ssnD4}`,
    dob: { month: fmt2(dobMonth), day: fmt2(dobDay) },
    address,
    zip: city.zip,
    city: city.city,
    state: city.state,
    phones: {
      home:   hasHome ? `(${homePre}) ${homeMid}-${homeSuf}` : null,
      mobile: `(${mobPre}) ${mobMid}-${mobSuf}`,
      work:   hasWork ? `(${workPre}) ${workMid}-${workSuf}` : null,
    },
    email,
    preferredContact: preferred,
  }
}

function genFinancial(rng, accountType) {
  // Income profiles
  const incomeProfile = rng.pickWeighted([
    { value:{ label:'Very Low',  range:[18000,32000],  tier:0 }, weight:8  },
    { value:{ label:'Low',       range:[32000,52000],  tier:1 }, weight:15 },
    { value:{ label:'Moderate',  range:[52000,78000],  tier:2 }, weight:25 },
    { value:{ label:'Mid-High',  range:[78000,115000], tier:3 }, weight:25 },
    { value:{ label:'High',      range:[115000,200000],tier:4 }, weight:18 },
    { value:{ label:'Very High', range:[200000,500000],tier:5 }, weight:9  },
  ])
  const annualIncome = rng.int(incomeProfile.range[0], incomeProfile.range[1])
  const monthlyIncome = Math.round(annualIncome / 12)

  // Credit limit based on income + account type
  const bizMultiplier = accountType === 'business' ? rng.float(1.5, 4.0) : 1
  const baseLimitByIncome = [3000,7000,12000,18000,28000,50000]
  const baseLimit = baseLimitByIncome[incomeProfile.tier]
  const limitVariance = rng.float(0.7, 1.6)
  const creditLimit = Math.round((baseLimit * limitVariance * bizMultiplier) / 100) * 100

  // Utilization profile
  const utilPct = rng.pickWeighted([
    { value:rng.float(0.01,0.10), weight:15 }, // low
    { value:rng.float(0.10,0.30), weight:20 }, // moderate
    { value:rng.float(0.30,0.55), weight:20 }, // fair
    { value:rng.float(0.55,0.75), weight:15 }, // high
    { value:rng.float(0.75,0.95), weight:15 }, // very high
    { value:rng.float(0.95,1.05), weight:10 }, // maxed/over
    { value:rng.float(1.05,1.20), weight:5  }, // over limit
  ])
  const balance = Math.min(Math.round(creditLimit * utilPct / 10) * 10, creditLimit * 1.2)

  // Payment derived from balance and rate
  const interestRate = rng.float(0.18, 0.30)
  const minPct = rng.float(0.018, 0.025)
  const minDue = Math.max(25, Math.round(balance * minPct))

  // Credit score correlated with income and utilization
  const baseScore = 580 + incomeProfile.tier * 30 + (1 - Math.min(utilPct, 1)) * 60
  const creditScore = Math.round(Math.min(850, Math.max(300, baseScore + rng.int(-40, 40))))

  return {
    annualIncome,
    monthlyIncome,
    creditLimit,
    balance,
    minDue,
    creditScore,
    incomeLabel: incomeProfile.label,
  }
}

function genAccount(rng, personal, financial, pattern, delinquencyHistory, seq, accountType, customerId) {
  const currentDPD = delinquencyHistory.monthly[12].dpd
  const paymentsLate = paymentsLateFromDPD(currentDPD)
  const risk = riskFromPattern(pattern)

  const pastDue = paymentsLate > 0
    ? Math.round(financial.minDue * paymentsLate * (1 + rng.float(0, 0.05)))
    : 0
  const currentDue = financial.minDue

  // Due date: random day 1-28 of next month
  const dueDay  = rng.int(1, 28)
  const dueDate = fmtDate(2026, 5, dueDay)

  // Last payment
  const lastPaymentDaysAgo = paymentsLate > 0 ? rng.int(32, 32 + paymentsLate * 30) : rng.int(5, 30)
  const lastPayDate = new Date(Date.now() - lastPaymentDaysAgo * 86400000)
  const lastPaymentDate = fmtDate(
    lastPayDate.getFullYear(),
    lastPayDate.getMonth() + 1,
    lastPayDate.getDate()
  )
  const lastPaymentAmount = paymentsLate > 0 && rng.chance(0.3)
    ? Math.round(financial.minDue * rng.float(0.4, 0.9))  // partial payment
    : financial.minDue

  const prefix = accountType === 'business' ? 'ACC-B' : 'ACC-C'
  const id = fmtId(prefix, seq)

  return {
    // ─ Identity
    id,
    customerId,
    accountType,
    ...personal,

    // ─ Account financials
    balance: financial.balance,
    creditLimit: financial.creditLimit,
    minDue: financial.minDue,
    currentDue,
    pastDue,
    dueDate,
    lastPaymentAmount,
    lastPaymentDate,
    paymentsLate,
    ...risk,

    // ─ Delinquency history
    delinquencyHistory,
    patternName: pattern,

    // ─ Extended financial info (for calculator + AI)
    annualIncome: financial.annualIncome,
    monthlyIncome: financial.monthlyIncome,
    creditScore: financial.creditScore,
    incomeLabel: financial.incomeLabel,
  }
}

function genBusinessInfo(rng, personal) {
  const industry     = rng.pick(INDUSTRIES)
  const bizType      = rng.pickWeighted([
    { value:'Sole Proprietor', weight:30 },
    { value:'LLC',             weight:40 },
    { value:'S-Corp',          weight:15 },
    { value:'Corporation',     weight:10 },
    { value:'Partnership',     weight:5  },
  ])
  const prefix = rng.chance(0.4) ? `${rng.pick(BIZ_PREFIXES)} ` : ''
  const suffix = rng.pick(BIZ_SUFFIXES)
  const bizName = rng.chance(0.45)
    ? `${personal.lastName} ${industry} ${suffix}`
    : rng.chance(0.5)
    ? `${prefix}${industry} ${suffix}`
    : `${personal.city} ${industry} ${suffix}`

  const employees = rng.pickWeighted([
    { value:1,   weight:25 },
    { value:rng.int(2,5),   weight:30 },
    { value:rng.int(6,15),  weight:25 },
    { value:rng.int(16,50), weight:15 },
    { value:rng.int(51,200),weight:5  },
  ])

  const yearsInBusiness = rng.pickWeighted([
    { value:rng.int(0,1),  weight:10 },
    { value:rng.int(2,4),  weight:25 },
    { value:rng.int(5,9),  weight:30 },
    { value:rng.int(10,20),weight:25 },
    { value:rng.int(21,40),weight:10 },
  ])

  const estRevenue = rng.int(50000, 5000000)

  const authUsers = rng.int(0, 3)
  const authorizedUsers = []
  for (let i = 0; i < authUsers; i++) {
    const fn = rng.chance(0.5) ? rng.pick(MALE_FIRST) : rng.pick(FEMALE_FIRST)
    const ln = rng.pick(LAST)
    authorizedUsers.push(`${fn} ${ln}`)
  }

  return {
    businessName: bizName,
    businessType: bizType,
    industry,
    estimatedRevenue: estRevenue,
    employees,
    yearsInBusiness,
    authorizedUsers,
  }
}

function genCreditHistory(rng, financial, accountType, primaryBalance) {
  const count = rng.int(0, 5)
  const results = []
  const usedCreditors = new Set()

  for (let i = 0; i < count; i++) {
    let cred
    do { cred = rng.pick(CREDITORS) } while (usedCreditors.has(cred.name))
    usedCreditors.add(cred.name)

    const isRevolving = ['Credit Card','Retail Credit'].includes(cred.type)
    const limit   = isRevolving ? rng.int(500, 15000) : null
    const balance = isRevolving
      ? Math.round(limit * rng.float(0.05, 1.05))
      : rng.int(1000, 30000)
    const minPay  = cred.type === 'Collection Account'
      ? 0
      : Math.max(20, Math.round(balance * rng.float(0.015, 0.030)))

    const statusOptions = financial.creditScore > 700
      ? [{ value:'Current', weight:85 }, { value:'30 DPD', weight:15 }]
      : financial.creditScore > 620
      ? [{ value:'Current', weight:65 }, { value:'30 DPD', weight:20 }, { value:'60 DPD', weight:10 }, { value:'Collections', weight:5 }]
      : [{ value:'Current', weight:40 }, { value:'30 DPD', weight:25 }, { value:'60 DPD', weight:15 }, { value:'90 DPD', weight:10 }, { value:'Collections', weight:10 }]

    const status = rng.pickWeighted(statusOptions)
    const dpd    = status === 'Current' ? 0 : status === '30 DPD' ? 30 : status === '60 DPD' ? 60 : status === '90 DPD' ? 90 : 0

    results.push({
      creditor: cred.name,
      type: cred.type,
      balance: Math.min(balance, limit ? limit * 1.1 : balance),
      minPayment: minPay,
      status,
      dpd,
      creditLimit: limit,
    })
  }

  return results
}

function genAIMetadata(rng, pattern, financial, currentDPD) {
  const isSevere = currentDPD >= 90
  const isModerate = currentDPD >= 30 && currentDPD < 90
  const isCurrent = currentDPD === 0

  // Personality weighted by delinquency severity
  const personalityWeights = isSevere
    ? [{ value:'overwhelmed',weight:30},{ value:'avoidant',weight:25},{ value:'defensive',weight:20},{ value:'angry',weight:15},{ value:'cooperative',weight:7},{ value:'confused',weight:3}]
    : isModerate
    ? [{ value:'cooperative',weight:20},{ value:'confused',weight:20},{ value:'overwhelmed',weight:20},{ value:'defensive',weight:15},{ value:'avoidant',weight:15},{ value:'angry',weight:10}]
    : [{ value:'cooperative',weight:50},{ value:'confused',weight:20},{ value:'defensive',weight:10},{ value:'avoidant',weight:10},{ value:'overwhelmed',weight:7},{ value:'angry',weight:3}]

  const personalityType   = rng.pickWeighted(personalityWeights)
  const communicationStyle = rng.pick(COMMUNICATION_STYLES)

  // Hardship likelihood
  const hasHardship = rng.chance(isSevere ? 0.7 : isModerate ? 0.4 : 0.1)
  const hardshipType = hasHardship ? rng.pick(HARDSHIP_TYPES) : null
  const hardshipDescription = hardshipType ? HARDSHIP_DESCRIPTIONS[hardshipType] : null

  // Delinquency reason
  const delinquencyReason = currentDPD > 0 ? rng.pick(DELINQUENCY_REASONS) : null

  // Payment likelihood
  const baselikelihood = isCurrent ? 0.95 : isSevere ? 0.25 : 0.55
  const paymentLikelihood = Math.max(0.05, Math.min(0.98,
    baselikelihood + rng.float(-0.15, 0.15)
  ))

  // Broken promise history
  const brokenPromiseHistory = isSevere
    ? rng.int(1, 4)
    : isModerate
    ? rng.int(0, 2)
    : 0

  // AI risk score
  const aiRiskScore = Math.max(0.01, Math.min(0.99,
    (1 - paymentLikelihood) * 0.5 +
    (currentDPD / 180) * 0.3 +
    (brokenPromiseHistory / 5) * 0.2
  ))

  // Scenario type
  const scenarioType = isCurrent ? 'current'
    : pattern.includes('first_time') ? 'first_delinquency'
    : isSevere ? (hasHardship ? 'hardship' : 'severe_delinquency')
    : hasHardship ? 'hardship'
    : pattern === 'broken_promises_pattern' ? 'broken_promise'
    : 'chronic_delinquency'

  // Recommended strategy
  const recommendedStrategy =
    currentDPD === 0     ? 'No action needed — account is current' :
    currentDPD <= 30     ? 'Request past-due amount' :
    currentDPD <= 60     ? 'Offer payment arrangement' :
    currentDPD <= 90     ? hasHardship ? 'Discuss hardship options' : 'Offer payment arrangement' :
    currentDPD <= 120    ? 'Discuss hardship options or escalate to specialist' :
                           'Escalate to specialist — charge-off risk'

  return {
    personalityType,
    communicationStyle,
    hasHardship,
    hardshipType,
    hardshipDescription,
    delinquencyReason,
    paymentLikelihood: Math.round(paymentLikelihood * 100) / 100,
    brokenPromiseHistory,
    aiRiskScore: Math.round(aiRiskScore * 100) / 100,
    scenarioType,
    recommendedStrategy,
  }
}

// ─── Segment generators ───────────────────────────────────────────────────────

function makeAccount(rng, seq, accountType, customerId, personalOverride = null) {
  const personal  = personalOverride ?? genPersonal(rng, seq)
  const financial = genFinancial(rng, accountType)
  const pattern   = rng.pickWeighted(accountType === 'business' ? BUSINESS_PATTERNS : CONSUMER_PATTERNS)
  const delinquencyHistory = generatePattern(pattern, rng)
  const creditHistory = genCreditHistory(rng, financial, accountType, financial.balance)
  const currentDPD = delinquencyHistory.monthly[12].dpd
  const ai = genAIMetadata(rng, pattern, financial, currentDPD)

  const account = genAccount(rng, personal, financial, pattern, delinquencyHistory, seq, accountType, customerId)

  // Attach extras
  account.creditHistory = creditHistory
  Object.assign(account, ai)

  // Business accounts get extra fields
  if (accountType === 'business') {
    const biz = genBusinessInfo(rng, personal)
    Object.assign(account, biz)
  }

  return account
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateDatabase(seed = 2026) {
  const rng = new SeededRNG(seed)
  const accounts = []
  let seq = 1
  let custSeq = 1

  // ── Segment A: Consumer-only (400 accounts) ──────────────────────────────
  for (let i = 0; i < 400; i++) {
    const custId = fmtId('CUST', custSeq++)
    accounts.push(makeAccount(rng, seq++, 'consumer', custId))
  }

  // ── Segment B: Business-only (150 accounts) ──────────────────────────────
  for (let i = 0; i < 150; i++) {
    const custId = fmtId('CUST', custSeq++)
    accounts.push(makeAccount(rng, seq++, 'business', custId))
  }

  // ── Segment C: Multi-account customers (150 people × 2 accounts = 300) ──
  for (let i = 0; i < 150; i++) {
    const custId  = fmtId('CUST', custSeq++)
    const personal = genPersonal(rng, seq) // shared personal info

    const consumerAcc = makeAccount(rng, seq++, 'consumer', custId, personal)
    const bizAcc      = makeAccount(rng, seq++, 'business', custId, personal)

    // Link them
    consumerAcc.linkedAccountId = bizAcc.id
    bizAcc.linkedAccountId      = consumerAcc.id

    accounts.push(consumerAcc)
    accounts.push(bizAcc)
  }

  return accounts
}
