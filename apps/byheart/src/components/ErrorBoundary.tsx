import { Component, type ReactNode } from 'react'

interface ErrorBoundaryState {
  failed: boolean
}

// React only catches render errors in a class. Progress is saved as it is made, so a
// reload loses nothing but the current attempt.
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError = (): ErrorBoundaryState => ({ failed: true })

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="page fallen">
        <p className="session-message">Something slipped. Your verses are safe.</p>
        <button type="button" className="primary" onClick={() => window.location.reload()}>
          Open the page again
        </button>
      </div>
    )
  }
}
