import type { Plot, Season } from '../features/plots/types';
import { plotProfiles } from '../features/plots/mock/plotProfiles';
import { addDays, todaySaigon } from '../lib/format';
export function traceBatch(
  code = plotProfiles.flatMap((p) => p.seasons).find((s) => s.traceBatch)?.traceBatch?.code ?? '',
  profiles = plotProfiles,
  today = todaySaigon(),
) {
  const plot = profiles.find((p) =>
    p.seasons.some((s) => s.traceBatch?.code === code || s.harvest?.batchCode === code),
  );
  if (!plot) return undefined;
  const season = plot.seasons.find(
    (s) => s.traceBatch?.code === code || s.harvest?.batchCode === code,
  )!;
  return buildTrace(plot, season, code, today);
}
export function buildTrace(plot: Plot, season: Season, code: string, today = todaySaigon()) {
  const harvest = season.harvest;
  const harvestDate = harvest?.date ?? season.expectedHarvestDate;
  const batch = season.traceBatch;
  const yieldT = harvest?.yieldT ?? season.expectedYieldT;
  const care = season.logs
    .filter((l) => l.date <= today && l.group !== 'THU_HOACH')
    .sort((a, b) => a.date.localeCompare(b.date));
  const sowingEvidence = season.logs.some((l) => l.group === 'GIEO_SA' && l.date <= today);
  const steps = [
    { kind: 'field', date: season.sowingDate, evidence: sowingEvidence },
    { kind: 'sowing', date: season.sowingDate, evidence: sowingEvidence },
    { kind: 'care', date: care.at(-1)?.date ?? season.sowingDate, evidence: care.length > 0 },
    { kind: 'harvest', date: harvestDate, evidence: !!harvest },
    {
      kind: 'drying',
      date: addDays(harvestDate, batch?.dryingDays ?? Math.ceil((harvest?.timeToDryerH ?? 0) / 24)),
      evidence: !!harvest,
    },
    {
      kind: 'packaging',
      date: addDays(harvestDate, batch?.packagingDays ?? 0),
      evidence: !!harvest && harvest.qrIssued > 0,
    },
    { kind: 'export', date: addDays(harvestDate, batch?.exportDays ?? 0), evidence: false },
  ].map((s) => ({ ...s, completed: s.evidence && s.date <= today }));
  return {
    code,
    plot,
    season,
    yieldT,
    mill: batch?.mill ?? harvest?.mill ?? '',
    destination: batch?.destination ?? '',
    qrIssued: harvest?.qrIssued ?? 0,
    qrQuota: harvest?.qrQuota ?? Math.ceil((yieldT * 1000) / (batch?.packageWeightKg ?? 5)),
    verifiedLogs: care.filter((l) => l.gpsVerified).length,
    steps,
  };
}

export const traceTitles = {
  vi: [
    'Vùng trồng',
    'Gieo sạ',
    'Chăm sóc',
    'Thu hoạch',
    'Sấy – Xay xát',
    'Đóng gói QR',
    'Xuất khẩu',
  ],
  en: [
    'Planting zone',
    'Sowing',
    'Crop care',
    'Harvest',
    'Drying & milling',
    'QR packaging',
    'Export',
  ],
};
