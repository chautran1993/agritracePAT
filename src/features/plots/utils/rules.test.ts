import { describe, it, expect } from 'vitest';
import * as turf from '@turf/turf';
import { generateProfiles } from '../mock/plotProfiles';
import { verifyGps, validPolygon } from './geo';
import { compliance, phiViolations, fertilizerDeviation } from './compliance';
const profiles = generateProfiles('2026-10-23');
describe('source records', () => {
  it('is deterministic for the same date and tracks seeded provenance', () => {
    expect(profiles).toEqual(generateProfiles('2026-10-23'));
    expect(
      profiles.every(
        (p) =>
          p.is_seeded &&
          !p.owner.idVerified &&
          p.currentSeason.logs.length >= 12 &&
          p.seasons.length === 2,
      ),
    ).toBe(true);
  });
  it('does not accept a location point as a verified parcel boundary', () => {
    const p = profiles[0];
    expect(validPolygon(p.geometry)).toBe(true);
    const location = turf.point([p.centroid.lng, p.centroid.lat]).geometry;
    expect(validPolygon(location)).toBe(false);
    expect(verifyGps(location, { ...p.centroid, accuracyM: 5 })).toBe(false);
    expect(compliance(p, 'EU').find((c) => c.id === 'official')?.status).toBe('fail');
  });
});
describe('geometry and evidence rules', () => {
  it('validates polygon closure, self-intersection, accuracy and outside locations', () => {
    const geometry = turf.bboxPolygon([105.65, 10.85, 105.66, 10.86]).geometry;
    expect(validPolygon(geometry)).toBe(true);
    expect(verifyGps(geometry, { lng: 105.655, lat: 10.855, accuracyM: 5 })).toBe(true);
    expect(verifyGps(geometry, { lng: 105.655, lat: 10.855, accuracyM: 20 })).toBe(false);
    expect(verifyGps(geometry, { lng: 106, lat: 11, accuracyM: 5 })).toBe(false);
    geometry.coordinates[0].pop();
    expect(validPolygon(geometry)).toBe(false);
  });
  it('detects fertilizer deviations and pesticide waiting periods in supplied evidence', () => {
    const p = structuredClone(profiles[0]);
    p.sourceOnly = false;
    p.currentSeason.expectedHarvestDate = '2026-11-01';
    p.currentSeason.logs = [
      {
        id: 'test',
        date: '2026-10-30',
        group: 'PHAN_BON',
        title: { vi: 'Bón phân', en: 'Fertilization' },
        actor: 'Test',
        photos: [],
        gps: { ...p.centroid, accuracyM: 5 },
        gpsVerified: false,
        syncedOffline: false,
        phiDays: 14,
        inputs: [{ name: 'Urê', qty: 55, unit: 'kg', ratePerHa: 55 }],
      },
    ];
    expect(fertilizerDeviation(p.currentSeason)).toBe(true);
    expect(phiViolations(p)).toEqual(['test']);
    p.currentSeason.logs[0].inputs![0].ratePerHa = 50;
    expect(fertilizerDeviation(p.currentSeason)).toBe(false);
  });
});
