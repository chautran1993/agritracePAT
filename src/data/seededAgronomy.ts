import type { Season, Group } from '../features/plots/types';
import { addDays, dayDiff, todaySaigon } from '../lib/format';
const bi = (vi: string, en = vi) => ({ vi, en });
export function seededNumber(key: string) {
  let value = 2166136261;
  for (const c of key) value = Math.imul(value ^ c.charCodeAt(0), 16777619);
  return (value >>> 0) / 4294967296;
}
export function createSeason(
  pdi: string,
  area: number,
  owner: string,
  commune: string,
  point: { lat: number; lng: number },
  index: number,
  today = todaySaigon(),
): Season {
  const start = ['2026-11-15', '2026-07-01', '2026-02-20'][index];
  const yieldPerHa = pdi === 'MP-0001' ? 6.2 : 5.8 + seededNumber(pdi) * 1;
  const harvestDate = addDays(start, 102);
  const tasks: [Group, string][] = [
    ['LAM_DAT', 'Làm đất'],
    ['GIEO_SA', 'Gieo sạ'],
    ['NUOC_AWD', 'Theo dõi nước'],
    ['PHAN_BON', 'Bón Urê'],
    ['NUOC_AWD', 'Tưới nước'],
    ['PHAN_BON', 'Bón DAP'],
    ['BVTV', 'Thăm đồng và theo dõi dịch hại'],
    ['PHAN_BON', 'Bón NPK 20-20-15'],
    ['NUOC_AWD', 'Quản lý nước AWD'],
    ['PHAN_BON', 'Bón Kali clorua'],
    ['BVTV', 'Kiểm tra đạo ôn'],
    ['NUOC_AWD', 'Rút nước'],
    ['ROM_RA', 'Chuẩn bị xử lý rơm rạ'],
    ['THU_HOACH', 'Thu hoạch'],
  ];
  const logs = tasks.map(([group, title], i) => ({
    id: `${pdi}-S${index}-L${i}`,
    date: addDays(start, i === 13 ? 102 : Math.max(0, i * 7 - 7)),
    group,
    title: bi(title),
    actor: owner,
    photos: [],
    gps: { ...point, accuracyM: 3 },
    gpsVerified: true,
    syncedOffline: false,
    plannedTaskId: `P${i}`,
    ...(group === 'PHAN_BON'
      ? {
          inputs: [
            {
              name: title.replace('Bón ', ''),
              qty: area * 40,
              unit: 'kg',
              ratePerHa: 40,
              nutrients: { n: 18, p: 8, k: 6 },
            },
          ],
        }
      : {}),
    ...(group === 'NUOC_AWD' ? { waterLevelCm: 3 } : {}),
    ...(group === 'BVTV'
      ? {
          inputs: [
            {
              name: 'Beam 75WP',
              activeIngredient: 'Tricyclazole',
              qty: area * 0.3,
              unit: 'kg',
              ratePerHa: 0.3,
            },
          ],
        }
      : {}),
  }));
  return {
    yieldPerHaT: yieldPerHa,
    traceBatch: {
      code: `LO-2026-${pdi}-S${index}`,
      mill: `Công ty TNHH Lúa gạo ${commune}`,
      destination: 'Hoa Kỳ (USA)',
      packageWeightKg: 5,
      dryingDays: 1,
      packagingDays: 3,
      exportDays: 7,
    },
    id: `${pdi}-S${index}`,
    name: bi(['Vụ Đông Xuân 2026–2027', 'Vụ Hè Thu 2026', 'Vụ Đông Xuân 2025–2026'][index]),
    variety: 'ST25',
    varietyDays: 102,
    seedBatch: {
      code: `ST25-2026-${index + 1}`,
      grade: 'XN',
      supplier: `HTX Nông nghiệp ${commune}`,
      germinationPct: 95,
      purityPct: 98,
      coaUrl: '#seed',
    },
    seedRateKgHa: 100,
    sowingMethod: bi('Sạ hàng'),
    sowingDate: start,
    das: Math.max(0, dayDiff(today, start)),
    stage:
      today < start
        ? 'Chuẩn bị gieo sạ'
        : dayDiff(today, start) < 25
          ? 'Gieo sạ'
          : dayDiff(today, start) < 50
            ? 'Đẻ nhánh'
            : dayDiff(today, start) < 80
              ? 'Làm đòng – Trổ'
              : 'Chín – Thu hoạch',
    expectedHarvestDate: harvestDate,
    expectedYieldT: area * yieldPerHa,
    plan: tasks.map(([group, title], i) => ({
      id: `P${i}`,
      group,
      title: bi(title),
      fromDas: Math.max(0, i * 7 - 7),
      toDas: i === 13 ? 105 : Math.max(3, i * 7 - 4),
    })),
    logs,
    pests: ['Rầy nâu', 'Sâu cuốn lá', 'Đạo ôn', 'Khô vằn'].map((name, i) => ({
      id: `${pdi}-S${index}-D${i}`,
      code: `DH-${i + 1}`,
      name: bi(name),
      detectedAt: addDays(start, 20 + i * 14),
      severity: 1,
      affectedPct: 2 + i,
      photo: '',
      prescription: {
        product: 'Theo dõi đồng ruộng',
        activeIngredient: 'Biện pháp canh tác',
        dose: 'Kiểm tra 2 lần/tuần',
        method: 'Phun tay',
        phiDays: 7,
        approvedBy: 'Trần Thị Lan',
      },
      status: 'Đã khống chế',
    })),
    ...(index > 0
      ? {
          actualYieldT: area * yieldPerHa,
          harvest: {
            date: harvestDate,
            maturityPct: 92,
            yieldT: area * yieldPerHa,
            moisturePct: 22,
            timeToDryerH: 6,
            dryerMoisturePct: 14,
            batchCode: `LO-2026-${pdi}-S${index}`,
            mill: `Công ty TNHH Lúa gạo ${commune}`,
            qrIssued: 90,
            qrQuota: 100,
          },
        }
      : {}),
  };
}
