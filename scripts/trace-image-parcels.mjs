import { connectParcelEdges } from './connect-parcel-edges.mjs';
import fs from 'node:fs';
import * as turf from '@turf/turf';
const sample = JSON.parse(fs.readFileSync('src/data/sampleParcel.json', 'utf8'));
const image = JSON.parse(fs.readFileSync('src/data/imageParcelOutlines.json', 'utf8'));
const points = sample.geometry.coordinates[0];
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
  [0, 1, 2].map((j) => rows.reduce((sum, r) => sum + r[i] * r[j], 0)),
);
const coeff = [0, 1].map((axis) =>
  solve(
    matrix,
    [0, 1, 2].map((j) =>
      rows.reduce((sum, r, i) => sum + r[j] * points[image.sampleCornerIndices[i]][axis], 0),
    ),
  ),
);
const toLngLat = ([x, y]) => coeff.map(([a, b, c]) => a * x + b * y + c);
const records = [];
for (let index = 0; index <= image.outlines.length; index++) {
  let shape =
    index === 0
      ? turf.feature(sample.geometry)
      : turf.polygon([
          [...image.outlines[index - 1].map(toLngLat), toLngLat(image.outlines[index - 1][0])],
        ]);
  const overlap =
    index > 0
      ? turf.intersect(turf.featureCollection([shape, turf.feature(sample.geometry)]))
      : null;
  if (overlap) {
    console.log('sample overlap', index, turf.area(overlap));
    shape = turf.difference(turf.featureCollection([shape, turf.feature(sample.geometry)]));
  }
  if (!shape || shape.geometry.type !== 'Polygon') throw Error('Invalid traced polygon ' + index);
  const [lng, lat] = turf.centerOfMass(shape).geometry.coordinates;
  records.push({
    sourceRow: index + 1,
    parcelNumber: index === 0 ? '17' : String(index + 100),
    sheetNumber: '2',
    included: true,
    lng,
    lat,
    estimatedAreaM2: turf.area(shape),
    reportedAreaM2: index === 0 ? sample.reportedAreaM2 : null,
    commune: 'Chưa xác định',
    imageBatch: 0,
    note:
      index === 0
        ? 'Giữ nguyên 18 góc người dùng cung cấp. Diện tích ghi nhận: 22.832,7 m².'
        : 'Đường bao phác theo lô nhìn thấy trong ảnh; tọa độ nội suy từ thửa đỏ. Số thửa và chủ hộ là gợi ý, chưa xác minh.',
    landUse: 'Chưa xác định',
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    geometry: shape.geometry,
    boundaryEstimated: index !== 0,
    imageOutlineIndex: index === 0 ? null : index - 1,
  });
}
connectParcelEdges(records, coeff, image.connectedEnvelope);
for (let i = 0; i < records.length; i++)
  for (let j = i + 1; j < records.length; j++) {
    const overlap = turf.intersect(
      turf.featureCollection([
        turf.feature(records[i].geometry),
        turf.feature(records[j].geometry),
      ]),
    );
    if (overlap && turf.area(overlap) > 0.001) console.log('OVERLAP', i, j, turf.area(overlap));
  }
fs.writeFileSync(
  'src/data/generatedParcels.json',
  JSON.stringify(
    {
      source:
        'Only complete visible parcels traced from the supplied screenshot; exact red sample boundary preserved',
      referenceImage: 'codex-clipboard-912f1e92-fd9e-402b-9fbb-7a38e52a8858.png',
      affineCoefficients: coeff,
      records,
    },
    null,
    2,
  ),
);
console.log({
  count: records.length,
  areaHa: records.reduce((s, r) => s + r.estimatedAreaM2 / 10000, 0),
});
