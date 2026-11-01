import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as turf from '@turf/turf';
import concaveman from 'concaveman';
const input = JSON.parse(fs.readFileSync('src/data/parcelEditSource.json', 'utf8'));
const removed = [61, 84],
  records = input.records.filter((r) => !removed.includes(r.sourceRow));
const [[a, b, c], [d, e, f]] = input.affineCoefficients,
  det = a * e - b * d;
const toPixel = ([lng, lat]) => [
  (e * (lng - c) - b * (lat - f)) / det,
  (-d * (lng - c) + a * (lat - f)) / det,
];
const perimeter = concaveman(
  records.flatMap((r) => r.geometry.coordinates[0].slice(0, -1).map(toPixel)),
  2,
  15,
);
fs.mkdirSync('.tmp-analysis', { recursive: true });
fs.writeFileSync(
  '.tmp-analysis/join-request.json',
  JSON.stringify({ ...input, records, perimeter, removedSourceRows: removed }),
);
const bundled = path.join(
  os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
);
const python = process.env.AGRITRACE_PYTHON ?? (fs.existsSync(bundled) ? bundled : 'python');
execFileSync(python, ['-X', 'utf8', 'scripts/join-parcel-topology.py'], { stdio: 'inherit' });
const output = JSON.parse(fs.readFileSync('.tmp-analysis/join-result.json', 'utf8'));
let occupied = turf.feature(output.records[0].geometry);
for (let i = 1; i < output.records.length; i++) {
  const r = output.records[i];
  let shape = turf.feature(r.geometry);
  const overlap = turf.intersect(turf.featureCollection([shape, occupied]));
  if (overlap && turf.area(overlap) > 0) {
    shape = turf.difference(turf.featureCollection([shape, occupied]));
    if (!shape || shape.geometry.type !== 'Polygon')
      throw Error('Final clipping split parcel ' + r.sourceRow);
  }
  r.geometry = shape.geometry;
  r.estimatedAreaM2 = turf.area(shape);
  const [lng, lat] = turf.pointOnFeature(shape).geometry.coordinates;
  r.lng = lng;
  r.lat = lat;
  r.googleMaps = `https://www.google.com/maps?q=${lat},${lng}`;
  occupied = turf.union(turf.featureCollection([occupied, shape]));
}
if (occupied.geometry.type !== 'Polygon')
  throw Error('Remaining parcels must form one connected polygon');
for (const old of input.records.filter((r) => removed.includes(r.sourceRow))) {
  const overlap = turf.intersect(turf.featureCollection([occupied, turf.feature(old.geometry)]));
  if (overlap && turf.area(overlap) > 0.001) throw Error('Removed footprint recreated');
}
fs.writeFileSync('src/data/generatedParcels.json', JSON.stringify(output, null, 2));
console.log({
  count: output.records.length,
  areaHa: output.records.reduce((s, r) => s + r.estimatedAreaM2 / 10000, 0),
});
