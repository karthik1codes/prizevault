"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Html, OrbitControls, useTexture } from "@react-three/drei"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import type { Globe3DConfig, Globe3DProps, GlobeMarker } from "./3d-globe-types"

export type { Globe3DConfig, Globe3DProps, GlobeMarker } from "./3d-globe-types"

const EARTH_TEXTURE =
  "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
const BUMP_TEXTURE =
  "https://unpkg.com/three-globe/example/img/earth-topology.png"

const DEFAULT_CONFIG: Required<
  Pick<
    Globe3DConfig,
    | "radius"
    | "showAtmosphere"
    | "atmosphereColor"
    | "atmosphereIntensity"
    | "bumpScale"
    | "autoRotateSpeed"
    | "enableZoom"
    | "enablePan"
    | "markerSize"
    | "ambientIntensity"
    | "pointLightIntensity"
  >
> = {
  radius: 2,
  showAtmosphere: true,
  atmosphereColor: "#4da6ff",
  atmosphereIntensity: 20,
  bumpScale: 5,
  autoRotateSpeed: 0.3,
  enableZoom: true,
  enablePan: false,
  markerSize: 1,
  ambientIntensity: 0.85,
  pointLightIntensity: 1.2,
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lng + 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function mergeConfig(config?: Globe3DConfig) {
  return { ...DEFAULT_CONFIG, ...config }
}

type EarthProps = {
  config: ReturnType<typeof mergeConfig>
  textureUrl: string
  bumpMapUrl: string
}

function Earth({ config, textureUrl, bumpMapUrl }: EarthProps) {
  const [colorMap, bumpMap] = useTexture([textureUrl, bumpMapUrl])
  colorMap.colorSpace = THREE.SRGBColorSpace

  return (
    <group>
      <mesh>
        <sphereGeometry args={[config.radius, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={config.bumpScale / 50}
          roughness={0.85}
          metalness={0.05}
          color={config.globeColor ? new THREE.Color(config.globeColor) : undefined}
        />
      </mesh>
      {config.showAtmosphere ? (
        <mesh scale={[1.04, 1.04, 1.04]}>
          <sphereGeometry args={[config.radius, 64, 64]} />
          <meshBasicMaterial
            color={config.atmosphereColor}
            transparent
            opacity={Math.min(0.35, config.atmosphereIntensity / 60)}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ) : null}
    </group>
  )
}

type MarkerPinProps = {
  marker: GlobeMarker
  radius: number
  baseSize: number
  onMarkerClick?: (marker: GlobeMarker) => void
  onMarkerHover?: (marker: GlobeMarker | null) => void
}

function MarkerPin({
  marker,
  radius,
  baseSize,
  onMarkerClick,
  onMarkerHover,
}: MarkerPinProps) {
  const groupRef = useRef<THREE.Group>(null)
  const position = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.02),
    [marker.lat, marker.lng, radius],
  )
  const scale = (marker.size ?? 1) * baseSize

  useFrame(({ camera }) => {
    if (!groupRef.current) return
    groupRef.current.quaternion.copy(camera.quaternion)
  })

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      onMarkerClick?.(marker)
    },
    [marker, onMarkerClick],
  )

  return (
    <group ref={groupRef} position={position}>
      <Html center distanceFactor={6.5} zIndexRange={[100, 0]} style={{ pointerEvents: "auto" }}>
        <button
          type="button"
          className="pv-globe-3d__marker"
          title={marker.label}
          onClick={handleClick}
          onPointerEnter={() => onMarkerHover?.(marker)}
          onPointerLeave={() => onMarkerHover?.(null)}
          style={{ transform: `scale(${scale})` }}
        >
          <img src={marker.src} alt={marker.label || "Location"} loading="lazy" />
          {marker.label ? (
            <span className="pv-globe-3d__marker-label">{marker.label}</span>
          ) : null}
        </button>
      </Html>
    </group>
  )
}

type GlobeSceneProps = {
  markers: GlobeMarker[]
  config: ReturnType<typeof mergeConfig>
  textureUrl: string
  bumpMapUrl: string
  onMarkerClick?: (marker: GlobeMarker) => void
  onMarkerHover?: (marker: GlobeMarker | null) => void
}

function GlobeScene({
  markers,
  config,
  textureUrl,
  bumpMapUrl,
  onMarkerClick,
  onMarkerHover,
}: GlobeSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight position={[4, 2, 4]} intensity={config.pointLightIntensity} />
      <pointLight position={[-4, -2, -4]} intensity={0.35} />

      <Suspense fallback={null}>
        <Earth config={config} textureUrl={textureUrl} bumpMapUrl={bumpMapUrl} />
      </Suspense>

      {markers.map((marker, index) => (
        <MarkerPin
          key={marker.id || `${marker.lat}-${marker.lng}-${index}`}
          marker={marker}
          radius={config.radius}
          baseSize={config.markerSize}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={config.enablePan}
        enableZoom={config.enableZoom}
        minDistance={config.minDistance ?? config.radius * 1.8}
        maxDistance={config.maxDistance ?? config.radius * 4}
        autoRotate={config.autoRotateSpeed > 0}
        autoRotateSpeed={config.autoRotateSpeed}
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI - Math.PI / 4}
      />
    </>
  )
}

export function Globe3D({
  markers = [],
  config,
  className = "",
  onMarkerClick,
  onMarkerHover,
}: Globe3DProps) {
  const merged = useMemo(() => mergeConfig(config), [config])
  const textureUrl = config?.textureUrl || EARTH_TEXTURE
  const bumpMapUrl = config?.bumpMapUrl || BUMP_TEXTURE
  const [ready, setReady] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`pv-globe pv-globe-3d pv-globe-3d--loading ${className}`.trim()} aria-hidden>
        <span className="pv-globe-3d__loader" />
      </div>
    )
  }

  return (
    <div className={`pv-globe pv-globe-3d ${className}`.trim()}>
      <Canvas
        className={`pv-globe-3d__canvas ${ready ? "is-ready" : ""}`.trim()}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, merged.radius * 3.2], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={() => setReady(true)}
        style={{ background: merged.backgroundColor ?? "transparent" }}
      >
        <GlobeScene
          markers={markers}
          config={merged}
          textureUrl={textureUrl}
          bumpMapUrl={bumpMapUrl}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
      </Canvas>
    </div>
  )
}
