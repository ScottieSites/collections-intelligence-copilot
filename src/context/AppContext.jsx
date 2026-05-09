import React, { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

const initialNotes = {
  reasonForDelinquency: '',
  durationOfIssue: '',
  financialSituation: '',
  promiseToPay: '',
  refusalReason: '',
  hardshipIndicator: false,
  disputeIndicator: false,
  bankruptcyIndicator: false,
  fraudIndicator: false,
  followUpDate: '',
  recommendedAction: '',
  additionalNotes: '',
}

const initialVerification = {
  ssn:         'not-asked',
  dob:         'not-asked',
  address:     'not-asked',
  zip:         'not-asked',
  lastPayment: 'not-asked',
  balance:     'not-asked',
}

const buildInitialState = () => ({
  step: 'call-script',           // call-script | verification | disclosure | dashboard
  accountNumber: '',
  customer: null,
  linkedAccounts: [],
  activeViewId: null,   // null = primary customer; account id = viewing a linked account
  agentId: 'AGT-001',
  agentName: 'Agent Smith',
  callId: null,
  callStartTime: null,
  verificationTokens: { ...initialVerification },
  mirandaConfirmed: false,
  mirandaTimestamp: null,
  incomeDisclosureConfirmed: false,
  incomeDisclosureTimestamp: null,
  activeTab: 'overview',
  notes: { ...initialNotes },
  calculator: { monthlyIncome: '', otherMonthlyDebt: '' },
  logs: [],
})

function reducer(state, action) {
  switch (action.type) {

    case 'SET_ACCOUNT_NUMBER':
      return { ...state, accountNumber: action.payload }

    case 'ADD_LINKED_ACCOUNT': {
      const already = state.linkedAccounts.some(a => a.id === action.payload.id)
      if (already) return state
      return { ...state, linkedAccounts: [...state.linkedAccounts, action.payload] }
    }

    case 'REMOVE_LINKED_ACCOUNT':
      return {
        ...state,
        linkedAccounts: state.linkedAccounts.filter(a => a.id !== action.payload),
        activeViewId: state.activeViewId === action.payload ? null : state.activeViewId,
      }

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeViewId: action.payload }

    case 'UPDATE_CONTACT': {
      const { accountId, phones, email } = action.payload
      const patch = (a) => a.id === accountId
        ? { ...a, phones: { ...a.phones, ...phones }, email }
        : a
      return {
        ...state,
        customer: patch(state.customer),
        linkedAccounts: state.linkedAccounts.map(patch),
      }
    }

    case 'SELECT_CUSTOMER':
      return {
        ...state,
        customer: action.payload,
        linkedAccounts: [],
        activeViewId: null,
        accountNumber: action.payload.id,
        callId: `CALL-${Date.now()}`,
        callStartTime: new Date().toISOString(),
        logs: [
          ...state.logs,
          {
            type: 'SYSTEM',
            event: 'account_loaded',
            timestamp: new Date().toISOString(),
            agentId: state.agentId,
            accountId: action.payload.id,
            detail: `Account ${action.payload.id} loaded for ${action.payload.name}`,
          },
        ],
      }

    case 'SET_STEP':
      return { ...state, step: action.payload }

    case 'SET_VERIFICATION_TOKEN': {
      const tokens = { ...state.verificationTokens, [action.payload.token]: action.payload.value }
      return { ...state, verificationTokens: tokens }
    }

    case 'CONFIRM_MIRANDA':
      return {
        ...state,
        mirandaConfirmed: true,
        mirandaTimestamp: new Date().toISOString(),
        logs: [
          ...state.logs,
          {
            type: 'DISCLOSURE',
            event: 'mini_miranda_displayed',
            timestamp: new Date().toISOString(),
            agentId: state.agentId,
            accountId: state.customer?.id,
            detail: 'Mini Miranda disclosure displayed to agent',
          },
          {
            type: 'DISCLOSURE',
            event: 'mini_miranda_confirmed',
            timestamp: new Date().toISOString(),
            agentId: state.agentId,
            accountId: state.customer?.id,
            detail: 'Agent confirmed Mini Miranda read to customer',
          },
        ],
      }

    case 'CONFIRM_INCOME_DISCLOSURE':
      return {
        ...state,
        incomeDisclosureConfirmed: true,
        incomeDisclosureTimestamp: new Date().toISOString(),
        logs: [
          ...state.logs,
          {
            type: 'DISCLOSURE',
            event: 'income_disclosure_confirmed',
            timestamp: new Date().toISOString(),
            agentId: state.agentId,
            accountId: state.customer?.id,
            detail: 'Agent confirmed income disclosure read to customer',
          },
        ],
      }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }

    case 'UPDATE_NOTES':
      return { ...state, notes: { ...state.notes, ...action.payload } }

    case 'UPDATE_CALCULATOR':
      return { ...state, calculator: { ...state.calculator, ...action.payload } }

    case 'RESET':
      return buildInitialState()

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, buildInitialState())
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
