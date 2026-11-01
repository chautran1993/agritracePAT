import fs from 'node:fs';
import * as turf from '@turf/turf';
const base = JSON.parse(fs.readFileSync('src/data/baseConnectedParcels.json', 'utf8'));
const candidates = JSON.parse(fs.readFileSync('src/data/additionalImageOutlines.json', 'utf8'));
const records = structuredClone(base.records),
  coeff = base.affineCoefficients;
const toGeo = ([x, y]) => coeff.map(([a, b, c]) => a * x + b * y + c);
let occupied = turf.union(turf.featureCollection(records.map((r) => turf.feature(r.geometry))));
const rejected = { covered: 0, small: 0, split: 0, invalid: 0 };
// Prefer parcels away from image controls/edges; identical parcels in other pans
// are removed by coverage, then every accepted polygon is clipped to free space.
candidates.sort((a, b) => {
  const quality = (r) => {
    const p = r.pixelOutline;
    const xs = p.map((v) => v[0]),
      ys = p.map((v) => v[1]);
    return Math.min(...xs, 2048 - Math.max(...xs), ...ys, 1107 - Math.max(...ys));
  };
  return quality(b) - quality(a) || a.imageIndex - b.imageIndex;
});
for (const item of candidates) {
  const ring = item.referenceOutline.map(toGeo);
  ring.push(ring[0]);
  let shape = turf.polygon([ring]);
  const original = turf.area(shape);
  if (original < 1000 || turf.kinks(shape).features.length) {
    rejected.invalid++;
    continue;
  }
  const overlap = turf.intersect(turf.featureCollection([shape, occupied]));
  if (overlap && turf.area(overlap) / original > 0.35) {
    rejected.covered++;
    continue;
  }
  // Recover the centre of the few-pixel raster strokes, then keep only free land.
  shape = turf.buffer(shape, 0.0016, { units: 'kilometers', steps: 1 });
  let remaining = turf.difference(turf.featureCollection([shape, occupied]));
  if (!remaining) {
    rejected.covered++;
    continue;
  }
  if (remaining.geometry.type === 'MultiPolygon') {
    const parts = remaining.geometry.coordinates
      .map((c) => turf.polygon(c))
      .sort((a, b) => turf.area(b) - turf.area(a));
    if (parts.slice(1).reduce((s, p) => s + turf.area(p), 0) > original * 0.03) {
      rejected.split++;
      continue;
    }
    remaining = parts[0];
  }
  if (turf.area(remaining) < 1200 || turf.area(remaining) / original < 0.5) {
    rejected.small++;
    continue;
  }
  if (remaining.geometry.coordinates.length > 1 || turf.kinks(remaining).features.length) {
    rejected.invalid++;
    continue;
  }
  const [lng, lat] = turf.pointOnFeature(remaining).geometry.coordinates,
    index = records.length;
  records.push({
    sourceRow: index + 1,
    parcelNumber: String(1000 + index - 40),
    sheetNumber: String(item.imageIndex + 3),
    included: true,
    lng,
    lat,
    estimatedAreaM2: turf.area(remaining),
    reportedAreaM2: null,
    commune: 'Chưa xác định',
    imageBatch: item.imageIndex + 1,
    note: 'Đường bao ước tính từ ảnh bổ sung; đã loại phần trùng với 41 thửa gốc và ảnh giao nhau. Tờ, thửa và chủ hộ là gợi ý, chưa xác minh.',
    landUse: 'Chưa xác định',
    googleMaps: `https://www.google.com/maps?q=${lat},${lng}`,
    geometry: remaining.geometry,
    boundaryEstimated: true,
    imageOutlineIndex: 40 + candidates.indexOf(item),
    referenceImage: item.image,
  });
  occupied = turf.union(turf.featureCollection([occupied, remaining]));
}
fs.writeFileSync(
  'src/data/generatedParcels.json',
  JSON.stringify(
    {
      ...base,
      source:
        '41 connected parcels preserved unchanged; additional visible parcels from five registered screenshots, with occupied geometry removed',
      baseParcelCount: 41,
      additionalImages: 5,
      records,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    total: records.length,
    added: records.length - 41,
    areaHa: records.reduce((s, p) => s + p.estimatedAreaM2 / 10000, 0),
    rejected,
  }),
);
