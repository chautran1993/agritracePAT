import { plantingZones } from '../../data/plantingZones';
import { resolveAdministrativeArea } from '../../data/geography';
import tanAn from '../../data/tanAnParcels.json';
import { householdForPlot } from '../../data/owners';
import * as turf from '@turf/turf';
import type { Feature, Polygon, Point } from 'geojson';
import source from '../../data/generatedParcels.json';

export const statuses = ['Đã cấp mã', 'Đang đăng ký', 'Chưa đăng ký', 'Tạm dừng', 'Đã thu hồi'];
export const varieties = ['ST25'];
export const stages = ['Chuẩn bị gieo sạ'];
export type PlotProps = {
  id: string;
  pdi: string;
  owner: string;
  areaHa: number;
  variety: string;
  stage: string;
  codeStatus: string;
  zoneId: string;
  sourceRow: number;
  sourceParcelNumber: string;
  sheetNumber: string;
  commune: string;
  province: string;
  zoneName: string;
  zoneNameEn: string;
  imageBatch: number;
  note: string;
  landUse: string;
  googleMaps: string;
  boundaryEstimated: boolean;
  sourceLng: number;
  sourceLat: number;
};
export type Plot = Feature<Polygon | Point, PlotProps>;
export const parcelSource = {
  ...source,
  records: [
    ...source.records.map((r) => ({ ...r, zoneId: 'VT001' })),
    ...tanAn.records.map((r) => ({ ...r, zoneId: 'VT002' })),
  ],
};
export function generatePlots() {
  const records = parcelSource.records.filter((r) => r.included);
  const plots: Plot[] = records.map((r) => {
    const id = 'T' + String(r.sourceRow).padStart(3, '0');
    const zone = plantingZones.find((z) => z.id === r.zoneId)!;
    const address = resolveAdministrativeArea(r.lat, r.lng);
    return {
      type: 'Feature',
      geometry: r.geometry as Polygon,
      properties: {
        id,
        pdi: 'MP-' + String(r.sourceRow).padStart(4, '0'),
        owner: householdForPlot(id).name,
        areaHa: r.estimatedAreaM2 / 10000,
        variety: varieties[0],
        stage: stages[0],
        codeStatus: statuses[0],
        zoneId: r.zoneId,
        zoneName: zone.name,
        zoneNameEn: zone.nameEn,
        province: address.province,
        sourceRow: r.sourceRow,
        sourceParcelNumber: r.parcelNumber,
        sheetNumber: r.sheetNumber,
        commune: address.commune,
        imageBatch: r.imageBatch,
        note: r.note,
        landUse: r.landUse === 'Chưa xác định' ? 'Đất trồng lúa' : r.landUse,
        googleMaps: r.googleMaps,
        boundaryEstimated: r.boundaryEstimated,
        sourceLng: r.lng,
        sourceLat: r.lat,
      },
    };
  });
  const collection = turf.featureCollection(plots);
  // This rectangle only sets the camera extent. It is never displayed as a cadastral boundary.
  const boundary = turf.bboxPolygon(turf.bbox(collection));
  const zones = plantingZones.map((z) => {
    const members = plots.filter((p) => p.properties.zoneId === z.id);
    return {
      ...turf.center(turf.featureCollection(members)),
      properties: {
        id: z.id,
        name: z.name,
        areaHa: members.reduce((s, p) => s + p.properties.areaHa, 0),
      },
    };
  });
  const stations: Feature<Point, { id: string; online: boolean }>[] = [];
  const alerts: Feature<Point, { id: string }>[] = [];
  return {
    boundary,
    canals: turf.featureCollection<import('geojson').LineString>([]),
    plots: collection,
    zones: turf.featureCollection(zones),
    stations,
    alerts,
  };
}
export const mapData = generatePlots();
export const mapCenter = turf.center(mapData.boundary).geometry.coordinates;
