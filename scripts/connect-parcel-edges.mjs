import * as turf from '@turf/turf';

// Fill only gaps inside the traced outer contour. Gap triangles are attached to
// existing parcels through shared edges; no parcel ID or red sample corner is added.
export function connectParcelEdges(records, coeff, envelope) {
  const [[a, b, c], [d, e, f]] = coeff,
    det = a * e - b * d;
  const toPixel = ([lng, lat]) =>
    [(e * (lng - c) - b * (lat - f)) / det, (-d * (lng - c) + a * (lat - f)) / det].map(
      (v) => Math.round(v * 1e7) / 1e7,
    );
  const toGeo = ([x, y]) => [a * x + b * y + c, d * x + e * y + f];
  const polygons = records.map((r) =>
    turf.polygon(r.geometry.coordinates.map((ring) => ring.map(toPixel))),
  );
  const sampleRing = polygons[0].geometry.coordinates[0];
  const perimeter = envelope.flatMap((p) =>
    p[0] === 397 && p[1] === 1000
      ? [sampleRing[0]]
      : p[0] === 328 && p[1] === 951
        ? [sampleRing[1], sampleRing[2]]
        : [p],
  );
  const outer = turf.polygon([[...perimeter, perimeter[0]]]);
  const occupied = turf.union(turf.featureCollection(polygons));
  const extent = turf.union(turf.featureCollection([outer, occupied]));
  const gaps = turf.difference(turf.featureCollection([extent, occupied]));
  if (!gaps) return;
  const triangles = turf.flatten(turf.tesselate(gaps)).features.filter((p) => {
    const [a, b, c] = p.geometry.coordinates[0];
    return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2 > 1e-7;
  });
  const edges = (p) => p.geometry.coordinates.flatMap((r) => r.slice(1).map((q, i) => [r[i], q]));
  const overlap = ([p, q], [r, s]) => {
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      length = Math.hypot(dx, dy);
    if (length < 1e-7) return 0;
    const cross = (v) => Math.abs(dx * (v[1] - p[1]) - dy * (v[0] - p[0])) / length;
    if (cross(r) > 1e-5 || cross(s) > 1e-5) return 0;
    const dot = (v) => ((v[0] - p[0]) * dx + (v[1] - p[1]) * dy) / length;
    return Math.max(
      0,
      Math.min(length, Math.max(dot(r), dot(s))) - Math.max(0, Math.min(dot(r), dot(s))),
    );
  };
  const te = triangles.map(edges),
    pe = polygons.map(edges);
  const owners = triangles.map(() => -1),
    cost = triangles.map(() => Infinity),
    done = new Set();
  const centers = triangles.map((p) => {
    const ring = p.geometry.coordinates[0].slice(0, -1);
    return [
      ring.reduce((s, p) => s + p[0], 0) / ring.length,
      ring.reduce((s, p) => s + p[1], 0) / ring.length,
    ];
  });
  for (let i = 0; i < triangles.length; i++) {
    let best = 1e-5;
    for (let j = 1; j < polygons.length; j++) {
      const shared = te[i].reduce(
        (sum, edge) => sum + pe[j].reduce((s, border) => s + overlap(edge, border), 0),
        0,
      );
      if (shared > best) {
        best = shared;
        owners[i] = j;
        cost[i] = 0;
      }
    }
  }
  const neighbours = triangles.map(() => []);
  for (let i = 0; i < triangles.length; i++)
    for (let j = i + 1; j < triangles.length; j++)
      if (te[i].some((x) => te[j].some((y) => overlap(x, y) > 1e-5))) {
        neighbours[i].push(j);
        neighbours[j].push(i);
      }
  for (let n = 0; n < triangles.length; n++) {
    let current = -1;
    for (let i = 0; i < triangles.length; i++)
      if (!done.has(i) && Number.isFinite(cost[i]) && (current < 0 || cost[i] < cost[current]))
        current = i;
    if (current < 0) {
      console.log(
        'Unattached',
        JSON.stringify(triangles.filter((_, i) => !done.has(i)).map((p) => p.geometry.coordinates)),
      );
      throw Error('A gap triangle cannot attach to an existing parcel.');
    }
    done.add(current);
    for (const next of neighbours[current]) {
      const distance =
        cost[current] +
        Math.hypot(centers[next][0] - centers[current][0], centers[next][1] - centers[current][1]);
      if (distance < cost[next]) {
        cost[next] = distance;
        owners[next] = owners[current];
      }
    }
  }
  for (let i = 1; i < records.length; i++) {
    const pieces = [polygons[i], ...triangles.filter((_, j) => owners[j] === i)];
    const merged = pieces.length > 1 ? turf.union(turf.featureCollection(pieces)) : pieces[0];
    if (merged.geometry.type !== 'Polygon') throw Error('Parcel split after joining: ' + i);
    records[i].geometry = {
      type: 'Polygon',
      coordinates: merged.geometry.coordinates.map((r) => r.map(toGeo)),
    };
    const sampleVertices = records[0].geometry.coordinates[0];
    records[i].geometry.coordinates = records[i].geometry.coordinates.map((r) =>
      r.map(
        (point) =>
          sampleVertices.find((v) => Math.hypot(v[0] - point[0], v[1] - point[1]) < 1e-9) ?? point,
      ),
    );
    const finalOverlap = turf.intersect(
      turf.featureCollection([
        turf.feature(records[i].geometry),
        turf.feature(records[0].geometry),
      ]),
    );
    if (finalOverlap) {
      const clipped = turf.difference(
        turf.featureCollection([
          turf.feature(records[i].geometry),
          turf.feature(records[0].geometry),
        ]),
      );
      if (!clipped || clipped.geometry.type !== 'Polygon')
        throw Error('Invalid sample boundary join');
      records[i].geometry = clipped.geometry;
    }
    const shape = turf.feature(records[i].geometry),
      point = turf.pointOnFeature(shape).geometry.coordinates;
    records[i].lng = point[0];
    records[i].lat = point[1];
    records[i].estimatedAreaM2 = turf.area(shape);
    records[i].googleMaps = `https://www.google.com/maps?q=${point[1]},${point[0]}`;
    records[i].note =
      'Phác theo ảnh và nối kín cạnh chung với các thửa liền kề. Tọa độ, diện tích, số thửa và chủ hộ là gợi ý, chưa xác minh.';
  }
  console.log(
    'Joined',
    triangles.length,
    'gap triangles into the existing',
    records.length,
    'parcels.',
  );
}
