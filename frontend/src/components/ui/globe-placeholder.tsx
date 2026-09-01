"use client"

/** Lightweight globe placeholder so the landing page never blocks on WebGL / R3F. */
export default function GlobePlaceholder() {
  return (
    <div className="pv-globe pv-globe-3d pv-globe-3d--fallback" aria-hidden>
      <div className="pv-globe-3d__fallback-sphere" />
      <p className="pv-globe-3d__fallback-label">Hackathon locations</p>
    </div>
  )
}
