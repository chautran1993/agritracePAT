import { finalizeParcelMesh } from './finalize-parcel-mesh.mjs';
import fs from 'node:fs';
import * as t from '@turf/turf';
import concaveman from 'concaveman';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const baseline = JSON.parse(fs.readFileSync('src/data/tanAnBaseline112.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('src/data/tanAnExtensionImages.json', 'utf8'));
const records = structuredClone(baseline.records),
  fixed = records.length;
const [[a, b, c], [d, e, f]] = baseline.affineCoefficients,
  det = a * e - b * d;
const geo = ([x, y]) => [a * x + b * y + c, d * x + e * y + f],
  pixel = ([lng, lat]) => [
    (e * (lng - c) - b * (lat - f)) / det,
    (-d * (lng - c) + a * (lat - f)) / det,
  ];
let occupied = t.union(t.featureCollection(records.map((r) => t.feature(r.geometry))));
const rejection = { covered: 0, invalid: 0, small: 0 };
for (const item of images.outlines) {
  const ring = item.referenceOutline.map(geo);
  ring.push(ring[0]);
  let shape = t.polygon([ring]);
  if (t.kinks(shape).features.length) {
    rejection.invalid++;
    continue;
  }
  const original = t.area(shape),
    overlap = t.intersect(t.featureCollection([shape, occupied]));
  if (overlap && t.area(overlap) / original > 0.35) {
    rejection.covered++;
    continue;
  }
  shape = t.buffer(shape, 0.0006, { units: 'kilometers', steps: 1 });
  const free = t.difference(t.featureCollection([shape, occupied]));
  if (
    !free ||
    free.geometry.type !== 'Polygon' ||
    free.geometry.coordinates.length > 1 ||
    t.area(free) < 140
  ) {
    rejection.small++;
    continue;
  }
  const id = 1113 + records.length - fixed,
    [lng, lat] = t.pointOnFeature(free).geometry.coordinates;
  records.push({
    sourceRow: id,
    parcelNumber: String(2380 + id - 1001),
    sheetNumber: '55',
    included: true,
    lng,
    lat,
    estimatedAreaM2: t.area(free),
    reportedAreaM2: null,
    commune: 'Tân An',
    imageBatch: 3 + item.imageIndex,
    note: 'Thửa bổ sung từ 5 ảnh mới của Tân An; tọa độ, số thửa và chủ hộ là gợi ý, chưa xác minh.',
    landUse: 'LUC',
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    geometry: free.geometry,
    boundaryEstimated: true,
    imageOutlineIndex: id - 1002,
  });
  occupied = t.union(t.featureCollection([occupied, free]));
}
console.log('Extracted', { added: records.length - fixed, total: records.length, rejection });
const source = {
  ...baseline,
  records,
  fixedParcelCount: fixed,
  skipUnattachedFixedGaps: true,
  extensionImages: 5,
  topologySource:
    'Tân An expanded from five new registered screenshots; original 112 parcels unchanged',
  topologyNote:
    'Thửa bổ sung phác theo ảnh, đã nối cạnh chung và loại phần chồng lấn; tờ/thửa và chủ hộ là gợi ý, chưa xác minh.',
  perimeter: concaveman(
    records.flatMap((r) => r.geometry.coordinates[0].slice(0, -1).map(pixel)),
    2,
    15,
  ),
};
fs.writeFileSync('.tmp-analysis/join-request.json', JSON.stringify(source));
const python = path.join(
  os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
);
execFileSync(python, ['-X', 'utf8', 'scripts/join-parcel-topology.py'], { stdio: 'inherit' });
const out = JSON.parse(fs.readFileSync('.tmp-analysis/join-result.json', 'utf8'));
occupied = t.union(
  t.featureCollection(out.records.slice(0, fixed).map((r) => t.feature(r.geometry))),
);
const fixedVertices = baseline.records.flatMap((r) => r.geometry.coordinates[0]);
const fixedEdges = baseline.records.flatMap((r) =>
  r.geometry.coordinates[0].slice(1).map((p, i) => [r.geometry.coordinates[0][i], p]),
);
function snapToFixed(point) {
  const vertex = fixedVertices.find((v) => Math.hypot(v[0] - point[0], v[1] - point[1]) < 1e-9);
  if (vertex) return vertex;
  let best = 1e-18,
    result = point;
  for (const [a, b] of fixedEdges) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = dx * dx + dy * dy;
    if (!len) continue;
    const u = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / len)),
      q = [a[0] + u * dx, a[1] + u * dy],
      dist = (q[0] - point[0]) ** 2 + (q[1] - point[1]) ** 2;
    if (dist < best) {
      best = dist;
      result = q;
    }
  }
  return result;
}
for (let i = fixed; i < out.records.length; i++) {
  const r = out.records[i];
  r.geometry.coordinates = r.geometry.coordinates.map((ring) => ring.map(snapToFixed));
  let shape = t.cleanCoords(t.feature(r.geometry)),
    overlap = t.intersect(t.featureCollection([shape, occupied]));
  if (overlap && t.area(overlap) > 0) shape = t.difference(t.featureCollection([shape, occupied]));
  if (!shape || shape.geometry.type !== 'Polygon')
    throw Error('Clipping split parcel ' + r.sourceRow);
  r.geometry = shape.geometry;
  r.estimatedAreaM2 = t.area(shape);
  const [lng, lat] = t.pointOnFeature(shape).geometry.coordinates;
  r.lng = lng;
  r.lat = lat;
  r.googleMaps = `https://www.google.com/maps?q=${lat},${lng}`;
  occupied = t.union(t.featureCollection([occupied, shape]));
}
occupied = finalizeParcelMesh(out.records, fixed);
if (JSON.stringify(out.records.slice(0, fixed)) !== JSON.stringify(baseline.records))
  throw Error('Baseline changed');
fs.writeFileSync('src/data/tanAnParcels.json', JSON.stringify(out, null, 2));
console.log({
  total: out.records.length,
  added: out.records.length - fixed,
  areaHa: out.records.reduce((s, r) => s + r.estimatedAreaM2 / 10000, 0),
  unionType: occupied.geometry.type,
  holes:
    occupied.geometry.type === 'Polygon'
      ? occupied.geometry.coordinates.slice(1).map((r) => t.area(t.polygon([r])))
      : null,
});
