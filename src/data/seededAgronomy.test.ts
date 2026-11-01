import { it, expect } from 'vitest';
import { generateProfiles } from '../features/plots/mock/plotProfiles';
import { mapData } from '../map/mock/generatePlots';
import { pucPattern } from './puc';
const profiles = generateProfiles('2026-10-27');
it('provides three reproducible seasons with consistent quantities and chronology for every parcel', () => {
  for (const p of profiles) {
    expect(p.is_seeded).toBe(true);
    expect(pucPattern.test(p.officialZoneCode!.code)).toBe(true);
    expect(p.owner.phone.replace(/\s/g, '')).toMatch(/^(03|08|09)\d{8}$/);
    expect(p.seasons).toHaveLength(2);
    for (const s of [p.currentSeason, ...p.seasons]) {
      expect(s.logs.length).toBeGreaterThanOrEqual(12);
      expect(s.logs.length).toBeLessThanOrEqual(18);
      expect(s.pests.length).toBeGreaterThanOrEqual(3);
      expect(s.pests.length).toBeLessThanOrEqual(5);
      expect(s.expectedHarvestDate > s.sowingDate).toBe(true);
      const productivity = s.expectedYieldT / p.areaGisHa;
      expect(productivity).toBeGreaterThanOrEqual(5.8);
      expect(productivity).toBeLessThanOrEqual(6.8);
      if (s.harvest) expect(s.harvest.yieldT).toBeCloseTo(p.areaGisHa * productivity, 10);
    }
  }
  const again = generateProfiles('2026-10-27');
  expect(profiles).toEqual(again);
});
it('preserves geometry and calculates zone totals from member parcels', () => {
  expect(profiles[0].geometry).toEqual(mapData.plots.features[0].geometry);
  expect(profiles[0].currentSeason.expectedYieldT).toBeCloseTo(profiles[0].areaGisHa * 6.2, 10);
  for (const zone of mapData.zones.features) {
    const area = profiles
      .filter((p) => p.zoneId === zone.properties.id)
      .reduce((sum, p) => sum + p.areaGisHa, 0);
    expect(area).toBeCloseTo(
      mapData.plots.features
        .filter((p) => p.properties.zoneId === zone.properties.id)
        .reduce((sum, p) => sum + p.properties.areaHa, 0),
      10,
    );
  }
});
