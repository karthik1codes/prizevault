declare module 'cobe' {
  type CobeMarker = {
    location: [number, number]
    size: number
    id?: string
  }

  type CobeArc = {
    from: [number, number]
    to: [number, number]
    id?: string
  }

  type CobeOptions = {
    devicePixelRatio?: number
    width: number
    height: number
    phi?: number
    theta?: number
    dark?: number
    diffuse?: number
    mapSamples?: number
    mapBrightness?: number
    baseColor?: [number, number, number]
    markerColor?: [number, number, number]
    glowColor?: [number, number, number]
    markerElevation?: number
    markers?: CobeMarker[]
    arcs?: CobeArc[]
    arcColor?: [number, number, number]
    arcWidth?: number
    arcHeight?: number
    opacity?: number
  }

  type CobeUpdate = {
    phi?: number
    theta?: number
  }

  export default function createGlobe(
    canvas: HTMLCanvasElement,
    options: CobeOptions,
  ): {
    update: (state: CobeUpdate) => void
    destroy: () => void
  }
}
