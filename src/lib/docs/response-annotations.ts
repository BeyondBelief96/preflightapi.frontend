export interface FieldAnnotation {
  field: string
  explanation: string
}

export interface AnnotatedResponseData {
  example: string
  annotations: Array<FieldAnnotation>
}

const RESPONSE_ANNOTATIONS: Record<string, AnnotatedResponseData> = {
  Metar_GetMetarByIcao: {
    example: `{
  "stationId": "KJFK",
  "observationTime": "2026-01-15T14:56:00Z",
  "rawText": "KJFK 151456Z 31012KT 10SM FEW250 M04/M18 A3042 RMK AO2 SLP308 T10441183",
  "tempC": -4.4,
  "dewpointC": -18.3,
  "windDirDegrees": "310",
  "windSpeedKt": 12,
  "windGustKt": null,
  "visibilityStatuteMi": "10",
  "altimInHg": 30.42,
  "seaLevelPressureMb": 1030.8,
  "flightCategory": "VFR",
  "skyCondition": [
    { "skyCover": "FEW", "cloudBaseFtAgl": 25000 }
  ],
  "wxString": null
}`,
    annotations: [
      {
        field: 'flightCategory',
        explanation:
          'Flight rules classification: VFR (clear), MVFR (marginal), IFR (instrument only), or LIFR (low instrument). Use this as a quick go/no-go indicator.',
      },
      {
        field: 'rawText',
        explanation:
          'The original encoded METAR string as broadcast. Useful for display to pilots who prefer the raw format.',
      },
      {
        field: 'windSpeedKt',
        explanation:
          'Sustained wind speed in knots. Combine with windDirDegrees and runway heading to calculate crosswind component.',
      },
      {
        field: 'windGustKt',
        explanation:
          'Peak gust speed in knots, or null when winds are steady. Gusts are reported when the variation exceeds 10 kts.',
      },
      {
        field: 'skyCondition',
        explanation:
          'Array of cloud layers. skyCover values: SKC (clear), FEW (1-2 oktas), SCT (3-4), BKN (5-7), OVC (8). cloudBaseFtAgl is height in feet above ground level.',
      },
      {
        field: 'altimInHg',
        explanation:
          'Altimeter setting in inches of mercury. Pilots set this on their altimeter for accurate altitude readings. Standard pressure is 29.92 inHg.',
      },
      {
        field: 'visibilityStatuteMi',
        explanation:
          'Prevailing visibility in statute miles. VFR requires at least 3 SM in controlled airspace, 1 SM in uncontrolled.',
      },
      {
        field: 'wxString',
        explanation:
          'Present weather phenomena (rain, snow, fog, etc.) using standard abbreviations, or null for clear conditions. Examples: "RA" (rain), "-SN" (light snow), "BR" (mist).',
      },
    ],
  },

  Taf_GetTafByIcao: {
    example: `{
  "stationId": "KJFK",
  "issueTime": "2026-01-15T12:30:00Z",
  "rawText": "KJFK 151130Z 1512/1618 31010KT P6SM FEW250 ...",
  "validTimeFrom": "2026-01-15T12:00:00Z",
  "validTimeTo": "2026-01-16T18:00:00Z",
  "forecastGroup": [
    {
      "timeFrom": "2026-01-15T12:00:00Z",
      "timeTo": "2026-01-16T00:00:00Z",
      "changeIndicator": null,
      "windDirDegrees": "310",
      "windSpeedKt": 10,
      "visibilityStatuteMi": "6+",
      "skyCondition": [
        { "skyCover": "FEW", "cloudBaseFtAgl": 25000 }
      ]
    }
  ]
}`,
    annotations: [
      {
        field: 'forecastGroup',
        explanation:
          'Array of time-based forecast periods. Each group covers a specific time range and may indicate changing (BECMG), temporary (TEMPO), or from (FM) conditions.',
      },
      {
        field: 'changeIndicator',
        explanation:
          'How conditions transition: null (prevailing), "BECMG" (gradual change), "TEMPO" (temporary fluctuation), or "FM" (abrupt change from this time).',
      },
      {
        field: 'validTimeFrom / validTimeTo',
        explanation:
          'The full validity window of the TAF, typically 24-30 hours. Plan your flight within this window for the most relevant forecast.',
      },
    ],
  },

  Airport_GetAirportByIcao: {
    example: `{
  "icaoCode": "KJFK",
  "iataCode": "JFK",
  "faaLid": "JFK",
  "name": "John F Kennedy Intl",
  "city": "New York",
  "state": "NY",
  "latitude": 40.6399,
  "longitude": -73.7787,
  "elevationFt": 13,
  "facilityType": "AIRPORT",
  "ownershipType": "PU",
  "towered": true,
  "fuelTypes": "100LL,JET-A",
  "hasBeenTowered": true
}`,
    annotations: [
      {
        field: 'icaoCode',
        explanation:
          'The 4-character ICAO identifier. US airports start with K (CONUS), PA (Alaska), or PH (Hawaii). Use this for all API calls.',
      },
      {
        field: 'elevationFt',
        explanation:
          'Field elevation in feet MSL (mean sea level). Combined with temperature and pressure, this is used to calculate density altitude.',
      },
      {
        field: 'facilityType',
        explanation:
          'Type of facility: AIRPORT, HELIPORT, SEAPLANE BASE, ULTRALIGHT, GLIDERPORT, or BALLOONPORT.',
      },
      {
        field: 'towered',
        explanation:
          'Whether the airport has an active control tower. Towered airports require radio communication; untowered airports use CTAF procedures.',
      },
      {
        field: 'fuelTypes',
        explanation:
          'Available fuel: 100LL (avgas for piston aircraft), JET-A (turbine fuel). Some airports offer both, some neither.',
      },
    ],
  },

  E6b_GetCrosswindByAirport: {
    example: `{
  "stationId": "KJFK",
  "windDirDegrees": 310,
  "windSpeedKt": 12,
  "windGustKt": null,
  "runways": [
    {
      "runwayId": "04L/22R",
      "headwind04L": -7.1,
      "crosswind04L": 9.7,
      "headwind22R": 7.1,
      "crosswind22R": -9.7
    }
  ]
}`,
    annotations: [
      {
        field: 'headwind04L',
        explanation:
          'Headwind component in knots for runway 04L. Positive means headwind (favorable), negative means tailwind (unfavorable). Tailwinds increase landing distance.',
      },
      {
        field: 'crosswind04L',
        explanation:
          'Crosswind component in knots for runway 04L. Positive means wind from the right, negative from the left. Compare against your aircraft\'s demonstrated crosswind limit.',
      },
      {
        field: 'runwayId',
        explanation:
          'Runway pair designation. The two numbers are the reciprocal headings (e.g., 04 and 22 differ by 180 degrees). L/R/C indicate parallel runways.',
      },
    ],
  },

  E6b_CalculateDensityAltitude: {
    example: `{
  "fieldElevationFt": 748,
  "pressureAltitudeFt": 738,
  "densityAltitudeFt": 2215,
  "temperatureCelsius": 30,
  "standardTempCelsius": 13.1,
  "tempDeviationCelsius": 16.9,
  "altimeterInHg": 29.92
}`,
    annotations: [
      {
        field: 'densityAltitudeFt',
        explanation:
          'The effective altitude for aircraft performance. In this example, the air at 748 ft elevation performs like air at 2,215 ft on a standard day — expect reduced climb, longer takeoff roll, and lower engine power.',
      },
      {
        field: 'pressureAltitudeFt',
        explanation:
          'Field elevation corrected for non-standard pressure. This is what your altimeter reads when set to 29.92 inHg.',
      },
      {
        field: 'tempDeviationCelsius',
        explanation:
          'How much warmer (positive) or cooler (negative) than standard temperature for this altitude. Large positive deviations significantly degrade performance.',
      },
      {
        field: 'standardTempCelsius',
        explanation:
          'The standard (ISA) temperature for this elevation. Standard sea-level temp is 15°C, decreasing 2°C per 1,000 ft.',
      },
    ],
  },

  Notam_GetNotamsByAirport: {
    example: `{
  "data": [
    {
      "notamNumber": "01/234",
      "facilityDesignator": "JFK",
      "classification": "RWY",
      "text": "RWY 04R/22L CLSD",
      "effectiveStart": "2026-01-10T00:00:00Z",
      "effectiveEnd": "2026-02-15T23:59:00Z",
      "isActive": true
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false
  }
}`,
    annotations: [
      {
        field: 'classification',
        explanation:
          'NOTAM category: RWY (runway), TWY (taxiway), AD (aerodrome), OBST (obstacle), NAV (navigation aid), COM (communications), SVC (service), AIRSPACE, or OTHER.',
      },
      {
        field: 'text',
        explanation:
          'The NOTAM text in abbreviated format. CLSD = closed, NA = not available, U/S = unserviceable. See FAA NOTAM contractions for the full list.',
      },
      {
        field: 'effectiveStart / effectiveEnd',
        explanation:
          'The time window the NOTAM is in effect. NOTAMs with no effectiveEnd are permanent until further notice (PERM).',
      },
      {
        field: 'isActive',
        explanation:
          'Whether the NOTAM is currently active based on the effective date range. Use this to filter out future or expired NOTAMs.',
      },
    ],
  },

  Airspace_GetByClasses: {
    example: `{
  "data": [
    {
      "name": "NEW YORK CLASS B",
      "airspaceClass": "B",
      "lowerAltFtMsl": 0,
      "upperAltFtMsl": 7000,
      "boundary": {
        "type": "Polygon",
        "coordinates": [[ [-74.2, 40.4], [-73.5, 40.4], [-73.5, 40.9], [-74.2, 40.9], [-74.2, 40.4] ]]
      }
    }
  ]
}`,
    annotations: [
      {
        field: 'airspaceClass',
        explanation:
          'Airspace classification: B (busiest airports, clearance required), C (radar service, contact required), D (control tower), E (general controlled). Each has different VFR entry requirements.',
      },
      {
        field: 'lowerAltFtMsl / upperAltFtMsl',
        explanation:
          'The vertical extent of this airspace shelf in feet MSL. Class B airspace typically has multiple shelves at different altitudes (like an upside-down wedding cake).',
      },
      {
        field: 'boundary',
        explanation:
          'GeoJSON Polygon describing the horizontal boundary. Render directly on web maps using Leaflet, Mapbox GL, or Google Maps Data Layer.',
      },
    ],
  },

  Runway_GetRunwaysByAirport: {
    example: `{
  "data": [
    {
      "runwayId": "04L/22R",
      "lengthFt": 8400,
      "widthFt": 200,
      "surfaceType": "ASPH-CONC",
      "surfaceCondition": "GOOD",
      "headingTrue04L": 42.3,
      "headingTrue22R": 222.3,
      "lightingEdge": "HIGH",
      "ilsType04L": "ILS/DME",
      "ilsType22R": null
    }
  ]
}`,
    annotations: [
      {
        field: 'lengthFt / widthFt',
        explanation:
          'Runway physical dimensions in feet. Compare against your aircraft\'s required takeoff and landing distance (adjusted for density altitude and conditions).',
      },
      {
        field: 'surfaceType',
        explanation:
          'Runway surface material: ASPH (asphalt), CONC (concrete), TURF (grass), GRVL (gravel), DIRT, WATER. Some aircraft cannot operate on unpaved surfaces.',
      },
      {
        field: 'ilsType04L',
        explanation:
          'Instrument approach type for this runway end. ILS = Instrument Landing System, providing both lateral and vertical guidance for approaches in poor weather.',
      },
      {
        field: 'headingTrue04L',
        explanation:
          'True heading of the runway end in degrees. The runway number is approximately the magnetic heading divided by 10.',
      },
    ],
  },
}

export function getResponseAnnotations(
  operationId: string,
): AnnotatedResponseData | undefined {
  return RESPONSE_ANNOTATIONS[operationId]
}
