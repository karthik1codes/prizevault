import type { Hackathon } from '@/client/types/hackathon'
import { deriveStatus } from '@/client/utils/format'

/** [latitude, longitude] — cobe uses lat/lng order */
export type GlobeCoords = [number, number]

export type GlobeLocationHackathon = {
  id: string
  name: string
}

export type GlobeLocationGroup = {
  id: string
  location: GlobeCoords
  label: string
  hackathons: GlobeLocationHackathon[]
  /** Screen-space px offset so nearby city capsules do not stack. */
  labelDx?: number
  labelDy?: number
}

/** Normalized city name → precise coordinates */
const CITY_COORDINATES: Record<string, GlobeCoords> = {
  'san francisco': [37.7749, -122.4194],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  'new delhi': [28.6139, 77.209],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  noida: [28.5355, 77.391],
  gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266],
  london: [51.5074, -0.1278],
  paris: [48.8566, 2.3522],
  berlin: [52.52, 13.405],
  amsterdam: [52.3676, 4.9041],
  singapore: [1.3521, 103.8198],
  tokyo: [35.6762, 139.6503],
  sydney: [-33.8688, 151.2093],
  'new york': [40.7128, -74.006],
  boston: [42.3601, -71.0589],
  austin: [30.2672, -97.7431],
  seattle: [47.6062, -122.3321],
  toronto: [43.6532, -79.3832],
  dubai: [25.2048, 55.2708],
  'são paulo': [-23.5505, -46.6333],
  'sao paulo': [-23.5505, -46.6333],
}

function normalizeCityKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function locationKey(coords: GlobeCoords): string {
  return `${coords[0].toFixed(4)}:${coords[1].toFixed(4)}`
}

/** Resolve precise coordinates from explicit lat/lng or a known city name. */
export function resolveHackathonCoords(hackathon: Hackathon): GlobeCoords | null {
  const lat = hackathon.latitude
  const lng = hackathon.longitude
  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng]
  }

  const city = hackathon.venueCity?.trim()
  if (!city) return null

  const exact = CITY_COORDINATES[normalizeCityKey(city)]
  if (exact) return exact

  const partial = Object.entries(CITY_COORDINATES).find(([key]) => normalizeCityKey(city).includes(key))
  return partial ? partial[1] : null
}

export function lookupCityCoordinates(city: string): GlobeCoords | null {
  const key = normalizeCityKey(city)
  return CITY_COORDINATES[key] ?? null
}

/** Group open hackathons by venue coordinates for globe pins. */
export function hackathonsToGlobeData(hackathons: Hackathon[]): {
  locations: GlobeLocationGroup[]
  unmapped: Hackathon[]
} {
  const open = hackathons.filter((h) => deriveStatus(h) !== 'completed')
  const groups = new Map<string, GlobeLocationGroup>()
  const unmapped: Hackathon[] = []

  for (const hackathon of open) {
    const location = resolveHackathonCoords(hackathon)
    if (!location) {
      unmapped.push(hackathon)
      continue
    }

    const key = locationKey(location)
    const label = hackathon.venueCity?.trim() || hackathon.name
    const entry: GlobeLocationHackathon = {
      id: hackathon.id,
      name: hackathon.name || 'Untitled event',
    }

    const existing = groups.get(key)
    if (existing) {
      existing.hackathons.push(entry)
      continue
    }

    groups.set(key, {
      id: `loc-${key.replace(/[^a-z0-9]+/gi, '-')}`,
      location,
      label,
      hackathons: [entry],
    })
  }

  return { locations: spreadNearbyGlobeLabels(Array.from(groups.values())), unmapped }
}

/**
 * Nearby cities (Bengaluru / Chennai, Delhi / Noida, …) project on top of each
 * other on a 480px globe. Fan their HTML labels apart in screen space so every
 * event stays readable. Marker coordinates stay accurate.
 */
export function spreadNearbyGlobeLabels(locations: GlobeLocationGroup[]): GlobeLocationGroup[] {
  if (locations.length < 2) return locations

  const parent = locations.map((_, index) => index)

  function find(i: number): number {
    if (parent[i] !== i) parent[i] = find(parent[i])
    return parent[i]
  }

  function union(a: number, b: number) {
    const pa = find(a)
    const pb = find(b)
    if (pa !== pb) parent[pb] = pa
  }

  for (let i = 0; i < locations.length; i += 1) {
    for (let j = i + 1; j < locations.length; j += 1) {
      if (approxDegreeDistance(locations[i].location, locations[j].location) <= CLUSTER_DEGREES) {
        union(i, j)
      }
    }
  }

  const clusters = new Map<number, number[]>()
  locations.forEach((_, index) => {
    const root = find(index)
    const members = clusters.get(root)
    if (members) members.push(index)
    else clusters.set(root, [index])
  })

  const next = locations.map((loc) => ({ ...loc, labelDx: 0, labelDy: 0 }))

  for (const members of clusters.values()) {
    if (members.length < 2) continue

    members.sort((a, b) => {
      const lng = locations[a].location[1] - locations[b].location[1]
      if (Math.abs(lng) > 0.01) return lng
      return locations[b].location[0] - locations[a].location[0]
    })

    const slot = LABEL_SLOT_PX
    const mid = (members.length - 1) / 2
    members.forEach((index, i) => {
      next[index].labelDx = Math.round((i - mid) * slot)
      next[index].labelDy = Math.round((i % 2 === 0 ? 0 : -26) - Math.abs(i - mid) * 8)
    })
  }

  return next
}

/** ~5.5° (~600km): Bengaluru–Chennai cluster; Singapore stays separate. */
const CLUSTER_DEGREES = 5.5
/** Capsule width is ~110–140px; this keeps a visible gap between neighbors. */
const LABEL_SLOT_PX = 148

function approxDegreeDistance(a: GlobeCoords, b: GlobeCoords): number {
  const midLat = ((a[0] + b[0]) / 2) * (Math.PI / 180)
  const dLat = a[0] - b[0]
  const dLng = (a[1] - b[1]) * Math.cos(midLat)
  return Math.hypot(dLat, dLng)
}

/** @deprecated use GlobeLocationGroup */
export type HackathonGlobeMarker = GlobeLocationGroup & { hackathonId?: string }
