export interface SchemaGroup {
  slug: string
  title: string
  description: string
  icon: string
  schemaNames: Array<string>
}

export const SCHEMA_GROUPS: Array<SchemaGroup> = [
  {
    slug: 'weather',
    title: 'Weather',
    description:
      'METARs, TAFs, PIREPs, SIGMETs, and G-AIRMETs — surface observations, forecasts, pilot reports, and weather advisories.',
    icon: 'cloud',
    schemaNames: [
      'MetarDto',
      'MetarQualityControlFlagsDto',
      'MetarSkyConditionDto',
      'PaginatedResponseOfMetarDto',
      'TafDto',
      'TafForecast',
      'TafSkyCondition',
      'TafTurbulenceCondition',
      'TafIcingCondition',
      'TafTemperature',
      'PirepDto',
      'PirepQualityControlFlags',
      'PirepSkyCondition',
      'PirepTurbulenceCondition',
      'PirepIcingCondition',
      'SigmetDto',
      'SigmetAltitude',
      'SigmetHazardDto',
      'GAirmetDto',
      'GAirmetProduct',
      'GAirmetHazardType',
      'GAirmetAltitude',
      'GAirmetFzlAltitude',
      'GAirmetArea',
      'GAirmetPoint',
    ],
  },
  {
    slug: 'airports',
    title: 'Airports',
    description:
      'Airport details, runway data, surface types, lighting, markings, approaches, and controlling objects.',
    icon: 'plane',
    schemaNames: [
      'PaginatedResponseOfAirportDto',
      'AirportDto',
      'RunwayDto',
      'RunwaySurfaceType',
      'RunwaySurfaceTreatment',
      'RunwayEdgeLightIntensity',
      'RunwayEndDto',
      'InstrumentApproachType',
      'RunwayMarkingsType',
      'RunwayMarkingsCondition',
      'VisualGlideSlopeIndicatorType',
      'ApproachLightSystemType',
      'ControllingObjectMarking',
      'PaginatedResponseOfCommunicationFrequencyDto',
      'CommunicationFrequencyDto',
    ],
  },
  {
    slug: 'airspace',
    title: 'Airspace',
    description:
      'Controlled airspace boundaries, special-use airspace, and GeoJSON geometry.',
    icon: 'layers',
    schemaNames: [
      'PaginatedResponseOfAirspaceDto',
      'AirspaceDto',
      'GeoJsonGeometry',
      'PaginatedResponseOfSpecialUseAirspaceDto',
      'SpecialUseAirspaceDto',
    ],
  },
  {
    slug: 'notams',
    title: 'NOTAMs',
    description:
      'Notices to Air Missions — NOTAM data, geometry, properties, translations, and route queries.',
    icon: 'alert-triangle',
    schemaNames: [
      'NotamResponseDto',
      'NotamDto',
      'NotamGeometryDto',
      'NotamPropertiesDto',
      'CoreNotamDataDto',
      'NotamEventDto',
      'NotamDetailDto',
      'NotamTranslationDto',
      'NotamFilterDto',
      'NotamQueryByRouteRequest',
      'RoutePointDto',
    ],
  },
  {
    slug: 'obstacles',
    title: 'Obstacles',
    description:
      'FAA-charted obstacles — positions, heights, lighting, markings, and accuracy classifications.',
    icon: 'triangle-alert',
    schemaNames: [
      'PaginatedResponseOfObstacleDto',
      'ObstacleDto',
      'ObstacleLighting',
      'HorizontalAccuracy',
      'VerticalAccuracy',
      'ObstacleMarking',
      'VerificationStatus',
    ],
  },
  {
    slug: 'documents',
    title: 'Documents',
    description:
      'FAA airport diagram and chart supplement PDF document references.',
    icon: 'file-text',
    schemaNames: [
      'AirportDiagramsResponseDto',
      'AirportDiagramDto',
      'ChartSupplementsResponseDto',
      'ChartSupplementDto',
    ],
  },
  {
    slug: 'e6b',
    title: 'E6B Calculations',
    description:
      'E6B flight computer — crosswind, density altitude, wind triangle, true airspeed, cloud base, and pressure altitude.',
    icon: 'calculator',
    schemaNames: [
      'AirportCrosswindResponseDto',
      'RunwayCrosswindComponentDto',
      'CrosswindCalculationResponseDto',
      'CrosswindCalculationRequestDto',
      'DensityAltitudeResponseDto',
      'DensityAltitudeRequestDto',
      'WindTriangleResponseDto',
      'WindTriangleRequestDto',
      'TrueAirspeedResponseDto',
      'TrueAirspeedRequestDto',
      'CloudBaseResponseDto',
      'CloudBaseRequestDto',
      'PressureAltitudeResponseDto',
      'PressureAltitudeRequestDto',
    ],
  },
  {
    slug: 'navigation',
    title: 'Navigation',
    description:
      'Navigation log, bearing & distance, waypoints, and winds aloft data.',
    icon: 'route',
    schemaNames: [
      'NavlogResponseDto',
      'NavigationLegDto',
      'WaypointDto',
      'WaypointType',
      'NavlogRequestDto',
      'NavlogPerformanceDataDto',
      'BearingAndDistanceResponseDto',
      'BearingAndDistanceRequestDto',
      'WindsAloftDto',
      'WindsAloftSiteDto',
      'WindTempDto',
    ],
  },
  {
    slug: 'common',
    title: 'Common',
    description:
      'Shared types used across all endpoints — pagination metadata and error responses.',
    icon: 'database',
    schemaNames: ['PaginationMetadata', 'ApiErrorResponse'],
  },
]

/** Reverse lookup: schema name → group slug */
export const SCHEMA_TO_GROUP: Record<string, string> = Object.fromEntries(
  SCHEMA_GROUPS.flatMap((g) =>
    g.schemaNames.map((name) => [name, g.slug]),
  ),
)

/** Get a schema group by its slug */
export function getSchemaGroup(slug: string): SchemaGroup | undefined {
  return SCHEMA_GROUPS.find((g) => g.slug === slug)
}
