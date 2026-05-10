const SYSTEM_PROMPT = `You are an AI assistant embedded in a credit card collections intelligence platform.
Your role is to analyze debtor account data and agent call notes to provide real-time strategic guidance.

Rules you must always follow:
- Only recommend strategies that comply with the Fair Debt Collection Practices Act (FDCPA)
- Never suggest threatening, harassing, misleading, or deceptive tactics
- If a fraud or bankruptcy indicator is flagged, instruct the agent to stop collection activity immediately
- Flag any FDCPA compliance concerns in the risks array
- Be concise and actionable — agents are on live calls

Return ONLY a valid JSON object with no markdown fences, no preamble, no explanation. Just the JSON.`

function buildPrompt(account, notes, calculator, incomeConfirmed) {
  const fmt = (n) =>
    typeof n === 'number'
      ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00'

  const income    = parseFloat(calculator?.monthlyIncome)   || 0
  const otherDebt = parseFloat(calculator?.otherMonthlyDebt) || 0
  const dti       = income > 0 ? ((otherDebt + (account.minDue || 0)) / income * 100).toFixed(1) : null
  const util      = account.creditLimit > 0
    ? ((account.balance / account.creditLimit) * 100).toFixed(1)
    : 'N/A'

  const dpdSummary = [5, 30, 60, 90, 120, 150, 180]
    .map(d => `  ${d}DPD: ${account.delinquencyHistory?.summary?.[`${d}dpd`] || 0}x`)
    .join('\n')

  const creditLines = (account.creditHistory || [])
  const otherPastDue = creditLines.filter(a => a.dpd > 0 || a.status === 'Collections').length
  const otherBalTotal = creditLines.reduce((s, a) => s + (a.balance || 0), 0)

  return `Analyze this collections account and return strategic guidance as JSON.

ACCOUNT:
  ID: ${account.id}
  Type: ${account.accountType}
  Customer: ${account.name}${account.businessName ? `\n  Business: ${account.businessName}` : ''}
  Balance: $${fmt(account.balance)}
  Credit Limit: $${fmt(account.creditLimit)}
  Utilization: ${util}%
  Payments Late: ${account.paymentsLate}
  Past Due Amount: $${fmt(account.pastDue)}
  Min Payment: $${fmt(account.minDue)}
  Risk Level: ${account.riskLevel} — ${account.riskLabel}
  Last Payment: $${fmt(account.lastPaymentAmount)} on ${account.lastPaymentDate}

DELINQUENCY HISTORY (13-month):
${dpdSummary}

CREDIT PROFILE:
  Other open accounts: ${creditLines.length}
  Other accounts past due: ${otherPastDue}
  Total other balances: $${fmt(otherBalTotal)}

AGENT NOTES:
  Reason for delinquency: ${notes.reasonForDelinquency || 'Not captured'}
  Duration of issue: ${notes.durationOfIssue || 'Not captured'}
  Financial situation: ${notes.financialSituation || 'Not captured'}
  Promise to pay: ${notes.promiseToPay || 'Not captured'}
  Refusal reason: ${notes.refusalReason || 'Not captured'}
  Additional notes: ${notes.additionalNotes || 'None'}
  Hardship flag: ${notes.hardshipIndicator ? 'YES' : 'No'}
  Dispute flag: ${notes.disputeIndicator ? 'YES' : 'No'}
  Bankruptcy flag: ${notes.bankruptcyIndicator ? 'YES' : 'No'}
  Fraud flag: ${notes.fraudIndicator ? 'YES — STOP COLLECTION ACTIVITY' : 'No'}

${incomeConfirmed
  ? `FINANCIAL DATA (income disclosed):
  Monthly Income: $${fmt(income)}
  Other Monthly Debt: $${fmt(otherDebt)}
  DTI Ratio: ${dti}%`
  : 'FINANCIAL DATA: Income not yet disclosed by customer'}

Return this exact JSON structure:
{
  "delinquencySummary": "2-3 sentence analysis of the delinquency situation and pattern",
  "explanationAnalysis": "2-3 sentence analysis of how the agent notes align or conflict with the account data",
  "missing": ["critical missing info item", ...],
  "questions": ["suggested question for the agent to ask", ...],
  "strategy": "Short strategy label (e.g. Offer Payment Arrangement, Request Full Payment, Discuss Hardship Options, Review Possible Fraud Claim)",
  "strategyReason": "1 sentence explaining why this strategy",
  "risks": [{"label": "Risk Name", "level": "high|medium|low", "reason": "brief explanation"}],
  "tone": {"label": "Tone Name", "color": "blue|teal|emerald|amber|indigo|purple", "desc": "1 sentence on how to apply this tone"},
  "complianceFlags": ["any FDCPA compliance concern to surface to the agent"]
}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on this server.' })
  }

  const { account, notes, calculator, incomeConfirmed } = req.body || {}
  if (!account) return res.status(400).json({ error: 'Missing account data' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(account, notes, calculator, incomeConfirmed) }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(502).json({ error: 'Anthropic API error', details: err })
    }

    const data  = await response.json()
    const raw   = data.content?.[0]?.text ?? ''
    // Extract the JSON object regardless of any surrounding markdown or text
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return res.status(500).json({ error: 'Claude returned no JSON object', raw })
    const analysis = JSON.parse(match[0])
    return res.status(200).json(analysis)

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
