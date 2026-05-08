import { MONTHS_13 } from './pools.js'

// ─── DPD values and display labels ────────────────────────────────────────────
const DPD_VALUES = [0, 5, 30, 60, 90, 120, 150, 180]

function statusLabel(dpd) {
  if (dpd === 0)   return 'Current'
  if (dpd === 5)   return '5 DPD'
  if (dpd === 30)  return '30 DPD'
  if (dpd === 60)  return '60 DPD'
  if (dpd === 90)  return '90 DPD'
  if (dpd === 120) return '120 DPD'
  if (dpd === 150) return '150 DPD'
  return '180 DPD'
}

function entry(dpd) {
  return { dpd, status: statusLabel(dpd) }
}

function buildMonthly(dpdArray) {
  return dpdArray.map((dpd, i) => ({ month: MONTHS_13[i], ...entry(dpd) }))
}

function buildSummary(monthly) {
  const s = { '5dpd':0,'30dpd':0,'60dpd':0,'90dpd':0,'120dpd':0,'150dpd':0,'180dpd':0 }
  for (const m of monthly) {
    if      (m.dpd === 5)   s['5dpd']++
    else if (m.dpd === 30)  s['30dpd']++
    else if (m.dpd === 60)  s['60dpd']++
    else if (m.dpd === 90)  s['90dpd']++
    else if (m.dpd === 120) s['120dpd']++
    else if (m.dpd === 150) s['150dpd']++
    else if (m.dpd === 180) s['180dpd']++
  }
  return s
}

// Payments late = current DPD / 30 (capped at 7)
export function paymentsLateFromDPD(dpd) {
  if (dpd === 0)   return 0
  if (dpd === 5)   return 0
  if (dpd === 30)  return 1
  if (dpd === 60)  return 2
  if (dpd === 90)  return 3
  if (dpd === 120) return 4
  if (dpd === 150) return 5
  return 7
}

// ─── Pattern generators (each returns {summary, monthly}) ────────────────────

export const PATTERN_NAMES = [
  'always_current',
  'perfect_then_recent_5dpd',
  'first_time_30dpd',
  'first_time_60dpd',
  'sporadic_5dpd',
  'sporadic_30dpd_cures',
  'chronic_30dpd',
  'cycle_3060',
  'escalating_mild',
  'escalating_severe',
  'severe_90_120',
  'severe_150_180',
  'near_chargeoff',
  'recovering_from_90',
  'recovering_from_180',
  'cure_cycles',
  'business_seasonal',
  'broken_promises_pattern',
]

export function generatePattern(name, rng) {
  let dpds

  switch (name) {
    case 'always_current':
      dpds = Array(13).fill(0)
      break

    case 'perfect_then_recent_5dpd':
      dpds = Array(13).fill(0)
      dpds[rng.int(11,12)] = 5
      break

    case 'first_time_30dpd':
      dpds = Array(13).fill(0)
      const startIdx = rng.int(10, 12)
      for (let i = startIdx; i < 13; i++) dpds[i] = 30
      break

    case 'first_time_60dpd':
      dpds = Array(13).fill(0)
      const s60 = rng.int(10, 11)
      dpds[s60] = 30
      for (let i = s60 + 1; i < 13; i++) dpds[i] = 60
      break

    case 'sporadic_5dpd':
      dpds = Array(13).fill(0)
      // 2-4 random months are 5 DPD
      const n5 = rng.int(2, 4)
      let indices = []
      while (indices.length < n5) {
        const idx = rng.int(0, 12)
        if (!indices.includes(idx)) indices.push(idx)
      }
      indices.forEach(i => { dpds[i] = 5 })
      break

    case 'sporadic_30dpd_cures': {
      dpds = Array(13).fill(0)
      // 2-4 isolated months of 30 DPD with cures between
      const spots = []
      for (let i = 0; i < 13; i++) {
        if (rng.chance(0.28) && !spots.includes(i - 1)) spots.push(i)
      }
      spots.slice(0, 4).forEach(i => { dpds[i] = 30 })
      break
    }

    case 'chronic_30dpd': {
      dpds = Array(13).fill(0)
      for (let i = 0; i < 13; i++) {
        dpds[i] = rng.chance(0.65) ? 30 : rng.chance(0.5) ? 5 : 0
      }
      // Ensure last month is 30
      dpds[12] = 30
      break
    }

    case 'cycle_3060': {
      dpds = Array(13).fill(0)
      let d = 0
      for (let i = 0; i < 13; i++) {
        if (d === 0) d = rng.chance(0.5) ? 30 : 0
        else if (d === 30) d = rng.chance(0.55) ? 60 : rng.chance(0.3) ? 0 : 30
        else d = rng.chance(0.4) ? 30 : rng.chance(0.2) ? 0 : 60
        dpds[i] = d
      }
      break
    }

    case 'escalating_mild': {
      // Starts current, slow escalation to 30-60
      dpds = Array(13).fill(0)
      const milestones = [0,0,0,0,0,5,5,30,30,30,60,60,60]
      dpds = milestones.map(d => d + (rng.chance(0.15) ? -d : 0))
      break
    }

    case 'escalating_severe': {
      // Starts current, reaches 90-150
      dpds = [0,0,0,5,30,30,60,60,90,90,120,120,150]
      // Add some jitter
      dpds = dpds.map((d, i) => i < 3 ? d : Math.max(0, d))
      break
    }

    case 'severe_90_120': {
      dpds = Array(13).fill(0)
      for (let i = 0; i < 13; i++) {
        dpds[i] = rng.pick([60, 90, 90, 120, 120])
      }
      dpds[12] = rng.pick([90, 120])
      break
    }

    case 'severe_150_180': {
      dpds = [30, 60, 90, 90, 120, 150, 150, 180, 180, 150, 120, 150, 180]
      break
    }

    case 'near_chargeoff': {
      dpds = [60, 90, 120, 150, 180, 180, 180, 180, 180, 180, 180, 180, 180]
      break
    }

    case 'recovering_from_90': {
      dpds = [60, 90, 90, 90, 60, 30, 30, 5, 0, 0, 0, 5, 0]
      break
    }

    case 'recovering_from_180': {
      dpds = [180, 180, 150, 120, 90, 60, 30, 30, 5, 0, 0, 0, 0]
      break
    }

    case 'cure_cycles': {
      // 3+ cycles: goes late, cures, goes late again
      dpds = [0,30,60,30,0,0,30,60,30,0,0,30,60]
      break
    }

    case 'business_seasonal': {
      // Good months, then seasonal dip (winter or summer)
      const isSummer = rng.chance(0.5)
      dpds = Array(13).fill(0)
      // Summer dip: Jun-Aug = months 2-4
      // Winter dip: Dec-Feb = months 8-10
      const dipStart = isSummer ? 2 : 8
      dpds[dipStart]     = 30
      dpds[dipStart + 1] = rng.chance(0.6) ? 60 : 30
      dpds[dipStart + 2] = rng.chance(0.4) ? 30 : 0
      break
    }

    case 'broken_promises_pattern': {
      // Goes 30 DPD, cures briefly, goes again — repeated
      dpds = [30, 0, 30, 60, 0, 30, 30, 60, 0, 30, 60, 60, 90]
      break
    }

    default:
      dpds = Array(13).fill(0)
  }

  const monthly = buildMonthly(dpds)
  return { monthly, summary: buildSummary(monthly) }
}

// Map pattern name → typical current DPD (last month = index 12)
export function currentDPDForPattern(name) {
  const map = {
    always_current: 0,
    perfect_then_recent_5dpd: 5,
    first_time_30dpd: 30,
    first_time_60dpd: 60,
    sporadic_5dpd: 5,
    sporadic_30dpd_cures: 30,
    chronic_30dpd: 30,
    cycle_3060: 60,
    escalating_mild: 60,
    escalating_severe: 150,
    severe_90_120: 120,
    severe_150_180: 180,
    near_chargeoff: 180,
    recovering_from_90: 0,
    recovering_from_180: 0,
    cure_cycles: 60,
    business_seasonal: 30,
    broken_promises_pattern: 90,
  }
  return map[name] ?? 0
}

// Assign risk level from pattern
export function riskFromPattern(name) {
  const high = ['severe_150_180','near_chargeoff','broken_promises_pattern','escalating_severe','severe_90_120']
  const medium = ['cycle_3060','chronic_30dpd','escalating_mild','cure_cycles','business_seasonal','first_time_60dpd']
  if (high.includes(name)) return { riskLevel:'high', riskLabel:'High Risk' }
  if (medium.includes(name)) return { riskLevel:'medium', riskLabel:'Moderate Risk' }
  return { riskLevel:'low', riskLabel:'Low Risk' }
}
