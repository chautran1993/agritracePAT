import * as turf from '@turf/turf';
import type { Polygon } from 'geojson';
import tanHung from './generatedParcels.json';
import tanAn from './tanAnParcels.json';
const coverage = [
  { province: 'Tây Ninh', provinceCode: '80', commune: 'Tân Hưng', records: tanHung.records },
  { province: 'Vĩnh Long', provinceCode: '86', commune: 'Tân An', records: tanAn.records },
].map((zone) => ({
  ...zone,
  features: zone.records.map((r) => {
    const polygon = turf.polygon((r.geometry as Polygon).coordinates);
    return { polygon, bbox: turf.bbox(polygon) };
  }),
}));
// Local spatial lookup of the two supplied growing areas; no coordinate is sent to third parties.
// Deliberately rejects points outside this coverage instead of inventing administrative boundaries.
export function resolveAdministrativeArea(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Invalid coordinates');
  const point = turf.point([lng, lat]);
  const zone = coverage.find((z) =>
    z.features.some(
      ({ polygon, bbox: b }) =>
        lng >= b[0] &&
        lng <= b[2] &&
        lat >= b[1] &&
        lat <= b[3] &&
        turf.booleanPointInPolygon(point, polygon),
    ),
  );
  if (!zone) throw new Error('Coordinates outside the configured growing areas');
  return { province: zone.province, provinceCode: zone.provinceCode, commune: zone.commune };
}
