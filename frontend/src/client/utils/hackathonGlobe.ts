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
  chicago: [41.8781, -87.6298],
  'los angeles': [34.0522, -118.2437],
  'san jose': [37.3382, -121.8863],
  melbourne: [-37.8136, 144.9631],
  'hong kong': [22.3193, 114.1694],
  bangkok: [13.7563, 100.5018],
  jakarta: [-6.2088, 106.8456],
  manila: [14.5995, 120.9842],
  'mexico city': [19.4326, -99.1332],
  madrid: [40.4168, -3.7038],
  rome: [41.9028, 12.4964],
  zurich: [47.3769, 8.5417],
  stockholm: [59.3293, 18.0686],
  oslo: [59.9139, 10.7522],
  cairo: [30.0444, 31.2357],
  nairobi: [-1.2921, 36.8219],
  lagos: [6.5244, 3.3792],
  johannesburg: [-26.2041, 28.0473],
}

function normalizeCityKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/** Use the city portion before commas / dashes / parentheses. */
function primaryCityLabel(value: string): string {
  const segment = value.split(/[,|–—\-/(]/)[0]?.trim() || value.trim()
  return normalizeCityKey(segment)
}

function parseCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function locationKey(coords: GlobeCoords): string {
  return `${coords[0].toFixed(4)}:${coords[1].toFixed(4)}`
}

function matchCityCoordinates(city: string): GlobeCoords | null {
  const primary = primaryCityLabel(city)
  if (!primary) return null

  if (CITY_COORDINATES[primary]) return CITY_COORDINATES[primary]

  const exact = normalizeCityKey(city)
  if (CITY_COORDINATES[exact]) return CITY_COORDINATES[exact]

  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (primary === key || primary.includes(key) || key.includes(primary)) {
      return coords
    }
  }

  return null
}

export function lookupCityCoordinates(city: string): GlobeCoords | null {
  return matchCityCoordinates(city)
}

/** Best-effort online geocode for cities not in the built-in table. */
export async function geocodeCity(city: string): Promise<GlobeCoords | null> {
  const query = city.trim()
  if (!query) return null

  const local = lookupCityCoordinates(query)
  if (local) return local

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('q', query)

    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'PrizeVault/1.0 (hackathon globe)' },
    })
    if (!res.ok) return null

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
    const hit = data?.[0]
    if (!hit) return null

    const lat = Number(hit.lat)
    const lng = Number(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return [lat, lng]
  } catch {
    return null
  }
}

/** Resolve precise coordinates from explicit lat/lng or a known city name. */
export function resolveHackathonCoords(hackathon: Hackathon): GlobeCoords | null {
  const lat = parseCoord(hackathon.latitude)
  const lng = parseCoord(hackathon.longitude)
  if (lat !== null && lng !== null) {
    return [lat, lng]
  }

  const city = hackathon.venueCity?.trim()
  if (!city) return null

  return matchCityCoordinates(city)
}

/** Fill missing coordinates from venueCity when we can resolve them locally. */
export function enrichHackathonLocation<T extends Hackathon>(hackathon: T): T {
  const coords = resolveHackathonCoords(hackathon)
  if (!coords) return hackathon

  const lat = parseCoord(hackathon.latitude)
  const lng = parseCoord(hackathon.longitude)

  return {
    ...hackathon,
    latitude: lat ?? coords[0],
    longitude: lng ?? coords[1],
  }
}

/** Group open hackathons by venue coordinates for globe pins. */
export function hackathonsToGlobeData(hackathons: Hackathon[]): {
  locations: GlobeLocationGroup[]
  unmapped: Hackathon[]
} {
  const open = hackathons.map(enrichHackathonLocation).filter((h) => deriveStatus(h) !== 'completed')
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
