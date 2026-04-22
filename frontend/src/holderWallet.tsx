import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import '../styles.css'
import './holderWallet.css'
import HolderApp from './holder/HolderApp.tsx'

class HolderErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="holder-wallet">
          <div className="grid-backdrop" aria-hidden />
          <header className="main-header">
            <div className="header-brand">
              <a href="/" className="logo-link logo-tab"><span className="logo">Prize Vault</span></a>
            </div>
          </header>
          <main style={{ padding: '24px clamp(24px, 6vw, 72px)' }}>
            <section className="wallet-login-section">
              <div className="wallet-login-container">
                <h2>Connect Your Stellar Wallet</h2>
                <p>Connect your Stellar wallet to access the escrow dashboard.</p>
                <p className="muted" style={{ marginTop: 12 }}>
                  Something went wrong loading the app. Try refreshing. If the problem continues, check the browser console.
                </p>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try again
                </button>
              </div>
            </section>
          </main>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HolderErrorBoundary>
      <HolderApp />
    </HolderErrorBoundary>
  </React.StrictMode>,
)
