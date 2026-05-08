import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Sidebar         from './components/Sidebar'
import Header          from './components/Header'
import CallScript      from './components/CallScript'
import Verification    from './components/Verification'
import MiniMiranda     from './components/MiniMiranda'
import AccountDashboard from './components/AccountDashboard'

function Main() {
  const { state } = useApp()
  const { step } = state

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className={`flex-1 overflow-y-auto ${step === 'dashboard' ? '' : 'bg-slate-50'}`}>
          {step === 'call-script'  && <CallScript />}
          {step === 'verification' && <Verification />}
          {step === 'disclosure'   && <MiniMiranda />}
          {step === 'dashboard'    && <AccountDashboard />}
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
