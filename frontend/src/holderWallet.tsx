import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import HolderApp from './holder/HolderApp.tsx'

class HolderErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('Escrow wallet crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pv-shell pv-app">
          <header className="pv-topbar">
            <div className="pv-topbar__inner">
              <a href="/" className="pv-brand">
                <span className="pv-brand__mark" aria-hidden>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
                    <path d="M8 9V6a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <span>PrizeVault</span>
                <span className="pv-brand__sub">Escrow Wallet</span>
              </a>
            </div>
          </header>

          <main className="pv-container" style={{ padding: 'var(--pv-space-12) var(--pv-gutter)' }}>
            <div className="pv-card pv-card--raised" style={{ maxWidth: 520, margin: '0 auto' }}>
              <div className="pv-empty">
                <span className="pv-empty__icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  </svg>
                </span>
                <h1 className="pv-empty__title">Something went wrong</h1>
                <p className="pv-empty__text">
                  The escrow wallet could not load. Your funds and registrations are unaffected —
                  they live on-chain and in this browser, not in this screen.
                </p>
                <div className="pv-btn-group">
                  <button
                    type="button"
                    className="pv-btn pv-btn--primary pv-btn--sm"
                    onClick={() => this.setState({ hasError: false, error: null })}
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    className="pv-btn pv-btn--secondary pv-btn--sm"
                    onClick={() => window.location.reload()}
                  >
                    Reload page
                  </button>
                </div>
                {this.state.error?.message ? (
                  <code
                    style={{
                      marginTop: 'var(--pv-space-6)',
                      maxWidth: '100%',
                      overflowWrap: 'anywhere',
                      fontSize: 'var(--pv-text-xs)',
                    }}
                  >
                    {this.state.error.message}
                  </code>
                ) : null}
              </div>
            </div>
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
