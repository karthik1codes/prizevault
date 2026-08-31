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

  return { locations: Array.from(groups.values()), unmapped }
}

/** @deprecated use GlobeLocationGroup */
export type HackathonGlobeMarker = GlobeLocationGroup & { hackathonId?: string }
