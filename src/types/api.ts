// API Key types
export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  status: 'active' | 'expired' | 'revoked'
  environment: 'production' | 'development' | 'staging'
}

export interface ApiKeyCreateRequest {
  name: string
  environment: 'production' | 'development' | 'staging'
}

export interface ApiKeyCreateResponse {
  id: string
  name: string
  key: string // Full key, shown once
  environment: string
  createdAt: string
}

// Aviation data types (matching backend responses)
export interface Metar {
  stationId: string
  rawText: string
  observationTime: string
  temperature: number | null
  dewpoint: number | null
  windDirection: number | null
  windSpeed: number | null
  windGust: number | null
  visibility: number | null
  altimeter: number | null
  flightCategory: string | null
  skyConditions: Array<SkyCondition>
}

export interface SkyCondition {
  skyCover: string
  cloudBase: number | null
}

export interface Taf {
  stationId: string
  rawText: string
  issueTime: string
  validTimeFrom: string
  validTimeTo: string
  forecasts: Array<TafForecast>
}

export interface TafForecast {
  forecastTimeFrom: string
  forecastTimeTo: string
  changeIndicator: string | null
  windDirection: number | null
  windSpeed: number | null
  visibility: number | null
  skyConditions: Array<SkyCondition>
}

export interface Airport {
  siteNumber: string
  icaoId: string | null
  faaIdentifier: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  elevation: number | null
  magneticVariation: string | null
  fuelTypes: string | null
}

export interface Runway {
  id: string
  runwayId: string
  length: number | null
  width: number | null
  surfaceType: string | null
  runwayEnds: Array<RunwayEnd>
}

export interface RunwayEnd {
  runwayEndId: string
  trueAlignment: number | null
  approachType: string | null
  rightHandTrafficPattern: boolean
}

export interface Notam {
  id: string
  facilityId: string
  text: string
  effectiveStart: string
  effectiveEnd: string | null
  classification: string | null
}

export interface Airspace {
  globalId: string
  identifier: string | null
  icaoId: string | null
  name: string
  airspaceClass: string
  upperAltitude: AltitudeInfo | null
  lowerAltitude: AltitudeInfo | null
}

export interface AltitudeInfo {
  value: number
  unitOfMeasure: string
  code: string
}

export interface Obstacle {
  oasNumber: string
  latitude: number
  longitude: number
  heightAgl: number
  heightAmsl: number
  obstacleType: string
  lighting: string | null
}

export interface ApiErrorResponse {
  code: string
  message: string
  details: string | null
  validationErrors: Record<string, Array<string>> | null
  timestamp: string
  traceId: string
}
