import assert from 'node:assert/strict';
import * as turf from '@turf/turf';
import { mapData } from './generatePlots';
assert(mapData.plots.features.length > 41);
for (const p of mapData.plots.features) {
  assert.equal(p.geometry.type, 'Polygon');
  assert(Math.abs(turf.area(p) / 10000 - p.properties.areaHa) < 1e-8);
}
console.log('PASS: 41 parcel boundaries with geometry-derived areas.');
