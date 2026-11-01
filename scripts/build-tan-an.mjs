import fs from 'node:fs';
import * as t from '@turf/turf';
import concaveman from 'concaveman';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const sample = JSON.parse(fs.readFileSync('src/data/tanAnSample.json', 'utf8')),
  image = JSON.parse(fs.readFileSync('src/data/tanAnImageOutlines.json', 'utf8'));
function solve(matrix, values) {
  const a = matrix.map((r, i) => [...r, values[i]]);
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let j = i + 1; j < 3; j++) if (Math.abs(a[j][i]) > Math.abs(a[pivot][i])) pivot = j;
    [a[i], a[pivot]] = [a[pivot], a[i]];
    const d = a[i][i];
    for (let k = i; k < 4; k++) a[i][k] /= d;
    for (let j = 0; j < 3; j++)
      if (j !== i) {
        const m = a[j][i];
        for (let k = i; k < 4; k++) a[j][k] -= m * a[i][k];
      }
  }
  return a.map((r) => r[3]);
}
const rows = image.samplePixelCorners.map(([x, y]) => [x, y, 1]);
const matrix = [0, 1, 2].map((i) =>
  [0, 1, 2].map((j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
);
const coeff = [0, 1].map((axis) =>
  solve(
    matrix,
    [0, 1, 2].map((j) =>
      rows.reduce(
        (s, r, i) => s + r[j] * sample.geometry.coordinates[0][image.sampleCornerIndices[i]][axis],
        0,
      ),
    ),
  ),
);
const geo = ([x, y]) => coeff.map(([a, b, c]) => a * x + b * y + c);
const [[a, b, c], [d, e, f]] = coeff,
  det = a * e - b * d;
const pixel = ([lng, lat]) => [
  (e * (lng - c) - b * (lat - f)) / det,
  (-d * (lng - c) + a * (lat - f)) / det,
];
const records = [];
function add(shape, item) {
  const index = records.length,
    [lng, lat] = t.pointOnFeature(shape).geometry.coordinates;
  records.push({
    sourceRow: 1001 + index,
    parcelNumber: index === 0 ? '2380' : String(2380 + index),
    sheetNumber: '55',
    included: true,
    lng,
    lat,
    estimatedAreaM2: t.area(shape),
    reportedAreaM2: index === 0 ? sample.reportedAreaM2 : null,
    commune: 'Tân An',
    imageBatch: item?.imageIndex + 1 || 0,
    note:
      index === 0
        ? 'Thửa mẫu 2380, tờ 55: giữ nguyên 5 góc được cung cấp. Diện tích ghi nhận 3.735 m²; diện tích hình học được tính từ tọa độ.'
        : 'Đường bao phác theo ảnh vùng Tân An. Tờ, số thửa và chủ hộ là gợi ý, chưa xác minh.',
    landUse: 'LUC',
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    geometry: shape.geometry,
    boundaryEstimated: index !== 0,
    imageOutlineIndex: index === 0 ? null : index - 1,
  });
}
add(t.feature(sample.geometry));
let occupied = t.feature(sample.geometry);
for (const item of image.outlines) {
  if (item.referenceOutline.some(([x, y]) => y + 0.8 * x < 418)) continue;
  const ring = item.referenceOutline.map(geo);
  ring.push(ring[0]);
  let shape = t.polygon([ring]);
  if (t.kinks(shape).features.length) continue;
  const original = t.area(shape),
    overlap = t.intersect(t.featureCollection([shape, occupied]));
  if (overlap && t.area(overlap) / original > 0.35) continue;
  shape = t.buffer(shape, 0.0006, { units: 'kilometers', steps: 1 });
  let free = t.difference(t.featureCollection([shape, occupied]));
  if (
    !free ||
    free.geometry.type !== 'Polygon' ||
    free.geometry.coordinates.length > 1 ||
    t.area(free) < 140
  )
    continue;
  add(free, item);
  occupied = t.union(t.featureCollection([occupied, free]));
}
const source = {
  source: 'Tân An, Vĩnh Long: exact supplied sample and image-traced estimates',
  affineCoefficients: coeff,
  zoneId: 'VT002',
  topologySource:
    'Tân An parcels traced from three registered screenshots and joined along shared edges',
  topologyNote:
    'Vùng Tân An, Vĩnh Long: đường bao ước tính từ ảnh, đã nối cạnh chung; tờ/thửa và chủ hộ là gợi ý, chưa xác minh.',
  records,
  perimeter: concaveman(
    records.flatMap((r) => r.geometry.coordinates[0].slice(0, -1).map(pixel)),
    2,
    15,
  ),
};
fs.writeFileSync('.tmp-analysis/join-request.json', JSON.stringify(source));
const py = path.join(
  os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
);
execFileSync(py, ['-X', 'utf8', 'scripts/join-parcel-topology.py'], { stdio: 'inherit' });
const out = JSON.parse(fs.readFileSync('.tmp-analysis/join-result.json', 'utf8'));
occupied = t.feature(out.records[0].geometry);
for (let i = 1; i < out.records.length; i++) {
  const r = out.records[i];
  let p = t.feature(r.geometry),
    o = t.intersect(t.featureCollection([p, occupied]));
  if (o && t.area(o) > 0) p = t.difference(t.featureCollection([p, occupied]));
  if (!p || p.geometry.type !== 'Polygon') throw Error('Invalid joined parcel');
  r.geometry = p.geometry;
  r.estimatedAreaM2 = t.area(p);
  const [lng, lat] = t.pointOnFeature(p).geometry.coordinates;
  r.lng = lng;
  r.lat = lat;
  r.googleMaps = `https://www.google.com/maps?q=${lat},${lng}`;
  occupied = t.union(t.featureCollection([occupied, p]));
}
fs.writeFileSync('src/data/tanAnParcels.json', JSON.stringify(out, null, 2));
console.log({
  count: out.records.length,
  areaHa: out.records.reduce((s, r) => s + r.estimatedAreaM2 / 10000, 0),
  sampleArea: t.area(t.feature(sample.geometry)),
  type: occupied.geometry.type,
});
