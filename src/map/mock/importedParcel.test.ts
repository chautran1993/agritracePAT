import tanAnBaseline from '../../data/tanAnBaseline112.json';
import tanAnCurrent from '../../data/tanAnParcels.json';
import tanAnSample from '../../data/tanAnSample.json';
import zoneOneSource from '../../data/generatedParcels.json';
import * as turf from '@turf/turf';
import { expect, it } from 'vitest';
import sample from '../../data/sampleParcel.json';
import before from '../../data/parcelEditSource.json';
import { mapData, generatePlots, parcelSource } from './generatePlots';
import { plotProfiles } from '../../features/plots/mock/plotProfiles';
import { householdForPlot } from '../../data/owners';
import { summarize, zones } from '../../data/agritrace';
const removed = [61, 84];
const shapes = mapData.plots.features.map((f) =>
  turf.polygon((f.geometry as import('geojson').Polygon).coordinates),
);
const joined = turf.union(
  turf.featureCollection(
    mapData.plots.features
      .filter((p) => p.properties.zoneId === 'VT001')
      .map((p) => turf.polygon((p.geometry as import('geojson').Polygon).coordinates)),
  ),
)!;
// 0.001 m² is below the screenshot's spatial precision; ignore only numerical
// slivers introduced when projecting the exact red sample into the snapped mesh.
const epsilonArea = 0.001;
it('removes only the two requested parcels and preserves remaining IDs and households', () => {
  const expected = before.records.filter((r) => !removed.includes(r.sourceRow));
  expect(parcelSource.records.filter((r) => r.zoneId === 'VT001').map((r) => r.sourceRow)).toEqual(
    expected.map((r) => r.sourceRow),
  );
  expect(mapData.plots.features.filter((p) => p.properties.zoneId === 'VT001')).toHaveLength(83);
  expect(
    mapData.plots.features.filter((p) => p.properties.zoneId === 'VT001').map((p) => p.geometry),
  ).toEqual(zoneOneSource.records.map((r) => r.geometry));
  expect(mapData.plots.features[0].geometry).toEqual(sample.geometry);
  expect(plotProfiles.map((p) => p.pdi)).not.toContain('MP-0061');
  expect(plotProfiles.map((p) => p.pdi)).not.toContain('MP-0084');
  expected.forEach((record, i) => {
    const code = 'T' + String(record.sourceRow).padStart(3, '0');
    expect(plotProfiles[i].pdi).toBe('MP-' + String(record.sourceRow).padStart(4, '0'));
    expect(plotProfiles[i].owner.name).toBe(householdForPlot(code).name);
    expect(plotProfiles[i].source?.parcelNumber).toBe(record.parcelNumber);
  });
  expect(generatePlots()).toEqual(mapData);
});
it('has valid individually connected boundaries and consistent estimated areas', () => {
  for (let i = 0; i < shapes.length; i++) {
    const f = mapData.plots.features[i],
      p = plotProfiles[i];
    expect(turf.kinks(shapes[i]).features).toHaveLength(0);
    expect(turf.area(shapes[i]) / 10000).toBeCloseTo(f.properties.areaHa, 8);
    expect(
      turf.booleanPointInPolygon(
        turf.point([f.properties.sourceLng, f.properties.sourceLat]),
        shapes[i],
      ),
    ).toBe(true);
    expect(p.owner.idVerified).toBe(false);
  }
  const total = mapData.plots.features.reduce((s, p) => s + p.properties.areaHa, 0);
  expect(summarize().areaHa).toBeCloseTo(total, 8);
  expect(zones.reduce((s, z) => s + z.area, 0)).toBeCloseTo(total, 8);
});
it(
  'joins all remaining parcels without measurable internal gaps or overlaps',
  { timeout: 30000 },
  () => {
    expect(joined.geometry.type).toBe('Polygon');
    if (joined.geometry.type === 'Polygon')
      expect(
        joined.geometry.coordinates.slice(1).reduce((s, r) => s + turf.area(turf.polygon([r])), 0),
      ).toBeLessThan(epsilonArea);
    const boxes = shapes.map((p) => turf.bbox(p));
    for (let i = 0; i < shapes.length; i++)
      for (let j = i + 1; j < shapes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        if (a[0] > b[2] || b[0] > a[2] || a[1] > b[3] || b[1] > a[3]) continue;
        const overlap = turf.intersect(turf.featureCollection([shapes[i], shapes[j]]));
        expect(overlap ? turf.area(overlap) : 0).toBeLessThan(epsilonArea);
      }
  },
);
it('does not fill the removed parcel footprints back in while connecting neighbours', () => {
  for (const old of before.records.filter((r) => removed.includes(r.sourceRow))) {
    const overlap = turf.intersect(
      turf.featureCollection([joined, turf.polygon(old.geometry.coordinates)]),
    );
    expect(overlap ? turf.area(overlap) : 0).toBeLessThan(epsilonArea);
  }
});

it('adds a separate Tan An zone with the exact sample and unique suggested owners', () => {
  const members = mapData.plots.features.filter((p) => p.properties.zoneId === 'VT002');
  expect(members.length).toBeGreaterThan(tanAnBaseline.records.length);
  expect(tanAnCurrent.records.slice(0, tanAnBaseline.records.length)).toEqual(
    tanAnBaseline.records,
  );
  expect(members[0].geometry).toEqual(tanAnSample.geometry);
  expect(members[0].properties).toMatchObject({
    pdi: 'MP-1001',
    sourceParcelNumber: '2380',
    sheetNumber: '55',
    commune: 'Tân An',
    province: 'Vĩnh Long',
  });
  expect(new Set(plotProfiles.map((p) => p.pdi)).size).toBe(plotProfiles.length);
  expect(new Set(plotProfiles.map((p) => p.owner.name)).size).toBe(plotProfiles.length);
  const joined = turf.union(
    turf.featureCollection(
      members.map((p) => turf.polygon((p.geometry as import('geojson').Polygon).coordinates)),
    ),
  )!;
  expect(joined.geometry.type).toBe('Polygon');
  if (joined.geometry.type === 'Polygon')
    expect(
      joined.geometry.coordinates.slice(1).reduce((s, r) => s + turf.area(turf.polygon([r])), 0),
    ).toBeLessThan(0.001);
  expect(zones.find((z) => z.id === 'VT002')?.name).toBe('Vùng trồng lúa ST25 Tân An');
});
