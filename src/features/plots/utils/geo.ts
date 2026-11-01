import * as turf from '@turf/turf';
import type { Polygon, Point } from 'geojson';
export function validPolygon(geometry: Polygon | Point): geometry is Polygon {
  try {
    if (geometry.type !== 'Polygon') return false;
    const ring = geometry.coordinates[0];
    return (
      ring.length >= 4 &&
      ring[0][0] === ring.at(-1)?.[0] &&
      ring[0][1] === ring.at(-1)?.[1] &&
      turf.area(turf.polygon(geometry.coordinates)) > 0 &&
      turf.kinks(turf.polygon(geometry.coordinates)).features.length === 0
    );
  } catch {
    return false;
  }
}
export function verifyGps(
  geometry: Polygon | Point,
  gps: { lat: number; lng: number; accuracyM: number },
  toleranceM = 15,
) {
  if (!validPolygon(geometry) || gps.accuracyM > 15 || gps.accuracyM < 0) return false;
  const buffer = turf.buffer(turf.polygon(geometry.coordinates), toleranceM, { units: 'meters' });
  return !!buffer && turf.booleanPointInPolygon(turf.point([gps.lng, gps.lat]), buffer);
}
