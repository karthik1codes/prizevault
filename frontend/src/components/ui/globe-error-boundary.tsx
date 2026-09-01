"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

type GlobeErrorBoundaryProps = {
  children: ReactNode
}

type GlobeErrorBoundaryState = {
  hasError: boolean
}

/** Keeps the landing page usable if the WebGL globe fails to initialize. */
export default class GlobeErrorBoundary extends Component<
  GlobeErrorBoundaryProps,
  GlobeErrorBoundaryState
> {
  state: GlobeErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): GlobeErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[PrizeVault] Globe failed to render:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pv-globe pv-globe-3d pv-globe-3d--fallback" aria-hidden>
          <span className="pv-globe-3d__loader" />
        </div>
      )
    }

    return this.props.children
  }
}
