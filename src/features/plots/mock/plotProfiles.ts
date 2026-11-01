import { createSeason, seededNumber } from '../../../data/seededAgronomy';
import { mapData } from '../../../map/mock/generatePlots';
import { householdForPlot } from '../../../data/owners';
import type { Plot } from '../types';
const bi = (vi: string, en: string) => ({ vi, en });
export function generateProfiles(_today?: string): Plot[] {
  void _today;
  return mapData.plots.features.map((f) => {
    const p = f.properties,
      owner = householdForPlot(p.id);
    const point = { lat: p.sourceLat, lng: p.sourceLng };
    const season = createSeason(p.pdi, p.areaHa, owner.name, p.commune, point, 0, _today);
    return {
      is_seeded: true,
      sourceOnly: false,
      source: {
        sourceRow: p.sourceRow,
        parcelNumber: p.sourceParcelNumber,
        sheetNumber: p.sheetNumber,
        imageBatch: p.imageBatch,
        note: p.note,
        landUse: p.landUse,
        googleMaps: p.googleMaps,
      },
      pdi: p.pdi,
      shortCode: p.id,
      codeStatus: 'Đã cấp mã',
      name: bi(
        'Thửa ' + p.sourceParcelNumber + ' · Tờ ' + p.sheetNumber,
        'Parcel ' + p.sourceParcelNumber + ' · Sheet ' + p.sheetNumber,
      ),
      zoneId: p.zoneId,
      zoneName: bi(p.zoneName, p.zoneNameEn),
      cooperative: { id: 'HTX-' + p.zoneId, name: 'HTX Nông nghiệp ' + p.commune },
      commune: p.commune,
      district: p.commune,
      province: p.province,
      owner: {
        householdId: owner.id,
        name: owner.name,
        phone:
          p.pdi === 'MP-0001'
            ? '0909 123 456'
            : '09' + String(10000000 + Math.floor(seededNumber(p.pdi) * 89999999)),
        idVerified: false,
        joinedAt: '2026-01-15',
      },
      geometry: f.geometry,
      areaDeclaredHa: p.areaHa,
      areaGisHa: p.areaHa,
      areaDiffPct: 0,
      centroid: point,
      elevationDiffCm: 24,
      currentSeason: season,
      seasons: [1, 2].map((i) =>
        createSeason(p.pdi, p.areaHa, owner.name, p.commune, point, i, _today),
      ),
      officialZoneCode: {
        issuedDocNo: '125/TB-UBND',
        statusValue: 'active',
        code: `${p.zoneId === 'VT001' ? '80' : '86'}-PUC-LUA001-000001-USA`,
        issuedBy: 'UBND xã ' + p.commune,
        issuedAt: '2026-10-15',
        markets: ['US'],
        status: 'Đã cấp mã',
      },
      soilBaseline: {
        sampledAt: '2026-10-10',
        lab: 'Trung tâm Kiểm nghiệm Nông nghiệp',
        samplePoint: point,
        chemistry: {
          pH: 5.6,
          ecDsM: 1.2,
          nAvailKgHa: 24,
          pAvailKgHa: 24,
          kAvailKgHa: 24,
          ca: 24,
          mg: 24,
          baseSatPct: 78,
        },
        acidity: { alHSatPct: 8 },
        carbon: { socPct: 2.1, somPct: 3.6, cnRatio: 12 },
        physics: { clayPct: 45, siltPct: 35, sandPct: 20, bulkDensity: 1.2, awcMm: 150 },
        biology: {
          microbialBiomassMgCKg: 280,
          microbialActivityMgNKg: 32,
          fungiBacteriaRatio: 0.8,
        },
      },
      versions: ['2026-02-20', '2026-07-01', '2026-10-15'].map((at) => ({
        season: at.slice(0, 4),
        change: 'Tạo mới',
        areaHa: p.areaHa,
        by: 'Nguyễn Thanh',
        at,
        geometry: f.geometry,
      })),
      documents: [
        {
          id: 'HS-' + p.pdi,
          type: 'Hồ sơ',
          title: bi('Hồ sơ quản lý thửa ruộng', 'Parcel management record'),
          date: '2026-10-15',
          size: '24 kB',
          body: bi(
            'Hồ sơ canh tác và quản lý ranh giới thửa ' + p.sourceParcelNumber,
            'Parcel cultivation and boundary management record',
          ),
        },
      ],
    };
  });
}
export const plotProfiles = generateProfiles();
