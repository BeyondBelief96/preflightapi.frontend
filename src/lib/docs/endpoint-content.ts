export interface EndpointTip {
  title: string
  body: string
  variant: 'tip' | 'note' | 'warning'
}

export interface EndpointContent {
  useCase?: string
  aviationContext?: string
  tips?: Array<EndpointTip>
}

const ENDPOINT_CONTENT: Record<string, EndpointContent> = {
  Metar_GetMetarByIcao: {
    useCase:
      'Fetch the latest surface weather observation for a single airport — ideal for flight status displays, pre-flight briefings, and go/no-go decision tools.',
    aviationContext:
      'A METAR (Meteorological Aerodrome Report) is a standardized weather observation issued every hour (or more often when conditions change significantly). It includes wind, visibility, cloud layers, temperature, and barometric pressure — the core data pilots check before every flight.',
    tips: [
      {
        title: 'Check flightCategory first',
        body: 'The flightCategory field (VFR, MVFR, IFR, LIFR) gives you a quick go/no-go indicator without parsing the raw METAR string yourself.',
        variant: 'tip',
      },
      {
        title: 'Null windGustKt means no gusts',
        body: 'When windGustKt is null, conditions are steady — gusts are only reported when the wind speed varies significantly.',
        variant: 'note',
      },
      {
        title: 'METARs can be up to 60 minutes old',
        body: 'Standard METARs are issued hourly. Between updates the observation may not reflect current conditions, especially during rapidly changing weather.',
        variant: 'warning',
      },
    ],
  },

  Metar_GetMetarsByIcaoCodes: {
    useCase:
      'Fetch METARs for multiple airports in a single request — perfect for multi-airport dashboards, route weather overviews, and regional monitoring.',
    aviationContext:
      'Batch METAR lookups let you compare conditions across a route or region without making multiple API calls. Pass up to 40 ICAO codes in a comma-separated list.',
    tips: [
      {
        title: 'Airports with no recent METAR are omitted',
        body: 'If an airport does not have a current METAR observation (e.g., uncontrolled field with no AWOS), it will be missing from the response array rather than returning an error.',
        variant: 'note',
      },
    ],
  },

  Metar_GetMetarsByState: {
    useCase:
      'Get all current METARs for a US state — useful for statewide weather maps, regional weather dashboards, and coverage analysis.',
    aviationContext:
      'State-based queries return observations from every reporting station in the state, including small airports with Automated Weather Observing Systems (AWOS/ASOS).',
  },

  Taf_GetTafByIcao: {
    useCase:
      'Retrieve the terminal forecast for a single airport — essential for flight planning, showing expected conditions over the next 24–30 hours.',
    aviationContext:
      'A TAF (Terminal Aerodrome Forecast) is a weather forecast specific to a 5-nautical-mile radius around an airport. Unlike METARs (which report current conditions), TAFs predict future conditions in time-group blocks. TAFs are typically issued 4 times per day.',
    tips: [
      {
        title: 'Parse the forecast groups for time ranges',
        body: 'Each TAF contains multiple forecast groups (BECMG, TEMPO, FM) that indicate when conditions are expected to change. The forecastGroup array is pre-parsed for you.',
        variant: 'tip',
      },
      {
        title: 'Not all airports have TAFs',
        body: 'Only airports with control towers or significant traffic typically issue TAFs. Smaller uncontrolled fields generally do not.',
        variant: 'note',
      },
    ],
  },

  Taf_GetTafsByIcaoCodes: {
    useCase:
      'Fetch TAFs for multiple airports at once — ideal for comparing forecasts along a planned route or monitoring destination alternates.',
  },

  Airport_SearchAirports: {
    useCase:
      'Search airports by name, city, ICAO/IATA code, or state — powers autocomplete search bars, airport lookup features, and discovery interfaces.',
    aviationContext:
      'US airports are identified by ICAO codes (4-letter, e.g., KJFK) or FAA LIDs (3-character, e.g., JFK). This endpoint searches across both, plus city names and facility names.',
    tips: [
      {
        title: 'Use the query parameter for fuzzy search',
        body: 'The query parameter searches across the airport name, city, state, and identifiers simultaneously. You don\'t need to know which field matches.',
        variant: 'tip',
      },
      {
        title: 'Results are paginated',
        body: 'For broad searches (e.g., all airports in a state), use the cursor parameter to page through results. Default page size is 100.',
        variant: 'note',
      },
    ],
  },

  Airport_GetAirportByIcao: {
    useCase:
      'Get full details for a single airport by ICAO code — includes location, elevation, facility type, ownership, fuel availability, and more.',
    aviationContext:
      'ICAO codes for US airports start with K (e.g., KJFK, KLAX). Alaskan airports start with PA, Hawaiian with PH. This is different from the 3-letter IATA codes used in commercial travel.',
    tips: [
      {
        title: 'FAA LIDs also work',
        body: 'You can pass a 3-character FAA location identifier (e.g., JFK) in addition to the 4-character ICAO code (e.g., KJFK). Both resolve to the same airport.',
        variant: 'tip',
      },
    ],
  },

  Airport_SearchAirportsNearby: {
    useCase:
      'Find airports within a radius of a point — useful for diversion planning, "nearest airport" features, and geospatial analysis.',
    aviationContext:
      'The radius is specified in nautical miles (NM), the standard unit of distance in aviation. 1 NM = 1.852 km = 1.151 statute miles.',
    tips: [
      {
        title: 'Combine with METAR data',
        body: 'After finding nearby airports, fetch their METARs with the batch endpoint to quickly compare weather at potential diversion fields.',
        variant: 'tip',
      },
    ],
  },

  Airport_GetAirportsByIcaoCodes: {
    useCase:
      'Fetch details for multiple airports in a single call — efficient for route-based displays showing all airports along a flight path.',
  },

  Runway_GetRunwaysByAirport: {
    useCase:
      'Get all runways for an airport including dimensions, surface type, and lighting — critical for crosswind calculations and landing performance checks.',
    aviationContext:
      'Runway numbers correspond to their magnetic heading divided by 10 (e.g., runway 27 is roughly 270 degrees magnetic). Parallel runways get L/C/R suffixes (Left, Center, Right).',
    tips: [
      {
        title: 'Use runway heading with the crosswind calculator',
        body: 'Feed the runway heading to the E6B crosswind endpoint along with METAR wind data to get crosswind and headwind components for each runway.',
        variant: 'tip',
      },
    ],
  },

  E6b_GetCrosswindByAirport: {
    useCase:
      'Calculate crosswind and headwind components for all runways at an airport using live wind data — the most common E6B calculation for go/no-go decisions.',
    aviationContext:
      'Crosswind limits vary by aircraft type and pilot certification. Student pilots typically have 10-15 kt crosswind limits, while transport category aircraft may handle 30+ kts. This endpoint uses current METAR wind data automatically.',
    tips: [
      {
        title: 'Gust factor is included',
        body: 'When gusts are reported in the METAR, the response includes crosswind components for both steady wind and gusts — use the gust value for conservative planning.',
        variant: 'tip',
      },
      {
        title: 'Returns results for all runways',
        body: 'The response includes crosswind calculations for every runway at the airport, so you can quickly identify the most favorable runway for landing.',
        variant: 'note',
      },
    ],
  },

  E6b_CalculateDensityAltitude: {
    useCase:
      'Calculate density altitude from field elevation, altimeter setting, and temperature — essential for aircraft performance calculations, especially at hot/high airports.',
    aviationContext:
      'Density altitude is the altitude at which the air density matches standard atmosphere conditions. High density altitude means thinner air, which reduces engine power, propeller efficiency, and wing lift. On a hot day at a high-elevation airport, density altitude can be thousands of feet above field elevation.',
    tips: [
      {
        title: 'Hot + high = reduced performance',
        body: 'If density altitude exceeds your aircraft\'s POH limits, consider reducing payload or waiting for cooler temperatures. Many accidents occur from attempting takeoffs at high density altitude.',
        variant: 'warning',
      },
    ],
  },

  Notam_GetNotamsByAirport: {
    useCase:
      'Retrieve active NOTAMs for an airport — critical for pre-flight planning to know about closed runways, taxiway construction, lighting outages, and airspace restrictions.',
    aviationContext:
      'A NOTAM (Notice to Air Missions) is an official notice containing information essential to flight operations that is not otherwise available through standard publications. Pilots are legally required to check NOTAMs before every flight.',
    tips: [
      {
        title: 'Filter by classification for relevance',
        body: 'NOTAMs include everything from major runway closures to minor lighting changes. Check the classification field to prioritize safety-critical notices.',
        variant: 'tip',
      },
      {
        title: 'NOTAMs have effective date ranges',
        body: 'Each NOTAM has effectiveStart and effectiveEnd timestamps. Some are permanent (no end date), while others are temporary. Always check the time range against your planned flight time.',
        variant: 'note',
      },
    ],
  },

  Airspace_GetByClasses: {
    useCase:
      'Query airspace boundaries by class (B, C, D, E) within a geographic area — essential for route planning and airspace awareness applications.',
    aviationContext:
      'US airspace is divided into controlled classes: Class A (above FL180), Class B (major airports like JFK, LAX), Class C (busy airports with radar), Class D (airports with control towers), and Class E (general controlled airspace). VFR pilots need clearance to enter B and C airspace.',
    tips: [
      {
        title: 'Boundaries are returned as GeoJSON',
        body: 'The boundary field contains GeoJSON polygons you can render directly on a map using Leaflet, Mapbox, or Google Maps.',
        variant: 'tip',
      },
    ],
  },

  Navlog_CalculateNavlog: {
    useCase:
      'Generate a complete navigation log for a multi-leg flight — calculates headings, groundspeed, fuel burn, ETEs, and wind corrections using real winds aloft data.',
    aviationContext:
      'A navigation log (navlog) is the flight plan document pilots prepare before cross-country flights. It accounts for wind at cruise altitude to calculate magnetic headings, fuel requirements, and estimated times en route. This endpoint automates what student pilots do by hand with an E6B flight computer.',
    tips: [
      {
        title: 'Provide accurate performance data',
        body: 'The accuracy of the navlog depends on realistic aircraft performance numbers (TAS, fuel burn, climb/descent rates). Use values from your aircraft\'s POH, not estimates.',
        variant: 'warning',
      },
      {
        title: 'Mark refueling stops',
        body: 'Set isRefuelingStop: true on waypoints where you plan to refuel. The fuel calculations will account for fuel added at those stops.',
        variant: 'tip',
      },
    ],
  },
}

export function getEndpointContent(
  operationId: string,
): EndpointContent | undefined {
  return ENDPOINT_CONTENT[operationId]
}
