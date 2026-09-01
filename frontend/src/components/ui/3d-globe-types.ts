export type GlobeMarker = {
  lat: number
  lng: number
  src: string
  label?: string
  size?: number
  id?: string
}

export type Globe3DConfig = {
  radius?: number
  globeColor?: string
  textureUrl?: string
  bumpMapUrl?: string
  showAtmosphere?: boolean
  atmosphereColor?: string
  atmosphereIntensity?: number
  atmosphereBlur?: number
  bumpScale?: number
  autoRotateSpeed?: number
  enableZoom?: boolean
  enablePan?: boolean
  minDistance?: number
  maxDistance?: number
  initialRotation?: { x: number; y: number }
  markerSize?: number
  showWireframe?: boolean
  wireframeColor?: string
  ambientIntensity?: number
  pointLightIntensity?: number
  backgroundColor?: string | null
}

export type Globe3DProps = {
  markers?: GlobeMarker[]
  config?: Globe3DConfig
  className?: string
  onMarkerClick?: (marker: GlobeMarker) => void
  onMarkerHover?: (marker: GlobeMarker | null) => void
}
