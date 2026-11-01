import * as turf from '@turf/turf';
export function finalizeParcelMesh(records, fixedCount) {
  for (const r of records.slice(fixedCount)) {
    r.geometry.coordinates = r.geometry.coordinates.map((ring) => {
      const cleaned = [];
      for (const point of ring.slice(0, -1))
        if (
          !cleaned.length ||
          Math.hypot(point[0] - cleaned.at(-1)[0], point[1] - cleaned.at(-1)[1]) > 1e-11
        )
          cleaned.push(point);
      if (Math.hypot(cleaned[0][0] - cleaned.at(-1)[0], cleaned[0][1] - cleaned.at(-1)[1]) < 1e-11)
        cleaned.pop();
      return [...cleaned, cleaned[0]];
    });
    r.estimatedAreaM2 = turf.area(turf.feature(r.geometry));
  }
  let occupied = turf.union(turf.featureCollection(records.map((r) => turf.feature(r.geometry))));
  if (occupied.geometry.type !== 'Polygon') throw Error('Parcel mesh disconnected');
  // Close projection slivers only through editable parcels; never change old data.
  for (const ring of occupied.geometry.coordinates.slice(1)) {
    const hole = turf.polygon([ring]),
      area = turf.area(hole);
    if (area < 0.0001 || area > 0.01) continue;
    for (const r of records.slice(fixedCount)) {
      const shape = turf.feature(r.geometry);
      if (!turf.booleanIntersects(shape, hole)) continue;
      const merged = turf.union(turf.featureCollection([shape, hole]));
      if (
        merged.geometry.type === 'Polygon' &&
        turf.kinks(merged).features.length === 0 &&
        turf.area(merged) - turf.area(shape) > area * 0.5
      ) {
        r.geometry = merged.geometry;
        r.estimatedAreaM2 = turf.area(merged);
        break;
      }
    }
  }
  for (const r of records.slice(fixedCount))
    if (turf.kinks(turf.feature(r.geometry)).features.length)
      throw Error('Self-intersection in parcel ' + r.sourceRow);
  return turf.union(turf.featureCollection(records.map((r) => turf.feature(r.geometry))));
}
