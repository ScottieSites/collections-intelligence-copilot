import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar         from './components/Sidebar'
import Header          from './components/Header'
import CallScript      from './components/CallScript'
import Verification    from './components/Verification'
import MiniMiranda     from './components/MiniMiranda'
import AccountDashboard from './components/AccountDashboard'
import TestDatabase    from './components/TestDatabase'

function Main() {
  const { state } = useApp()
  const { step } = state

  const isDashboard = step === 'dashboard'
  const isTestDb    = step === 'test-db'

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isTestDb && <Header />}

        <main className={`flex-1 overflow-y-auto ${isDashboard || isTestDb ? '' : 'bg-slate-50'}`}>
          {step === 'call-script'  && <CallScript />}
          {step === 'verification' && <Verification />}
          {step === 'disclosure'   && <MiniMiranda />}
          {step === 'dashboard'    && <AccountDashboard />}
          {step === 'test-db'      && <TestDatabase />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  )
}
