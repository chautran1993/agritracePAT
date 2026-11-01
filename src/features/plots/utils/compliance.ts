import type { Plot, Market, Season, PlannedTask } from '../types';
import { dayDiff, addDays } from './format';
import { validPolygon, verifyGps } from './geo';
export type Check = { id: string; status: 'pass' | 'fail' | 'na'; tab: string; evidence: string };
// Demonstration policy only; not a legal/certification decision.
export const bannedByMarket: Record<Market, string[]> = {
  CN: ['Paraquat'],
  EU: ['Paraquat', 'Chlorpyrifos'],
  US: ['Paraquat', 'Carbendazim'],
  HALAL: ['Porcine enzyme', 'Porcine gelatin'],
};
export function fertilizerDeviation(season: Season) {
  return season.logs.some(
    (l) => l.group === 'PHAN_BON' && l.inputs?.some((i) => i.name === 'Urê' && i.ratePerHa > 50),
  );
}
export function taskStatus(task: PlannedTask, season: Season) {
  const log = season.logs.find((l) => l.plannedTaskId === task.id);
  if (!log) return 'pending';
  if (log.deviation) return 'deviation';
  const das = dayDiff(log.date, season.sowingDate);
  return das >= task.fromDas && das <= task.toDas ? 'ontime' : 'late';
}
export function logbookScore(season: Season) {
  const due = season.plan.filter((p) => p.toDas <= season.das);
  return due.length
    ? Math.round((100 * due.filter((p) => taskStatus(p, season) === 'ontime').length) / due.length)
    : 100;
}
export function phiViolations(plot: Plot) {
  const s = plot.currentSeason;
  return [
    ...s.logs
      .filter((l) => l.phiDays && addDays(l.date, l.phiDays) > s.expectedHarvestDate)
      .map((l) => l.id),
    ...s.pests
      .filter(
        (p) =>
          p.status !== 'Đã khống chế' &&
          addDays(p.detectedAt, p.prescription.phiDays) > s.expectedHarvestDate,
      )
      .map((p) => p.id),
  ];
}
export function compliance(plot: Plot, market: Market): Check[] {
  const s = plot.currentSeason,
    allGroups = ['LAM_DAT', 'GIEO_SA', 'NUOC_AWD', 'PHAN_BON', 'BVTV', 'ROM_RA'];
  const banned = bannedByMarket[market].map((x) => x.toLowerCase());
  const ingredients = [
    ...s.logs.flatMap((l) => l.inputs?.map((i) => i.activeIngredient || i.name) || []),
    ...s.pests.map((p) => p.prescription.activeIngredient),
  ];
  const tests: [string, boolean | 'na', string, string][] = [
    ['polygon', validPolygon(plot.geometry), 'overview', 'geometry'],
    [
      'official',
      !!plot.officialZoneCode &&
        plot.officialZoneCode.status === 'Đã cấp mã' &&
        plot.officialZoneCode.markets.includes(market),
      'overview',
      'zone-code',
    ],
    [
      'seed',
      s.seedBatch.grade === 'XN' && !!s.seedBatch.coaUrl && s.seedBatch.germinationPct >= 85,
      'season',
      'seed',
    ],
    [
      'logs',
      allGroups.every((g) => s.logs.some((l) => l.group === g)) &&
        s.logs.every((l) => verifyGps(plot.geometry, l.gps)) &&
        !s.logs.some((l) => l.deviation) &&
        !fertilizerDeviation(s),
      'logbook',
      'logs',
    ],
    ['phi', phiViolations(plot).length === 0, 'pests', 'phi'],
    [
      'banned',
      !ingredients.some((a) => banned.some((b) => a.toLowerCase().includes(b))),
      'logbook',
      'inputs',
    ],
    [
      'drainage',
      s.harvest
        ? s.logs.some(
            (l) =>
              l.group === 'NUOC_AWD' &&
              (l.waterLevelCm ?? 0) < 0 &&
              dayDiff(s.harvest!.date, l.date) >= 7 &&
              dayDiff(s.harvest!.date, l.date) <= 15,
          )
        : 'na',
      'soil',
      'water',
    ],
    [
      'straw',
      s.logs.some((l) => l.group === 'ROM_RA') &&
        !s.logs.some((l) => {
          const title = l.title.vi + ' ' + l.title.en;
          return /đốt|burn/i.test(title) && !/không đốt|no burn|not burn/i.test(title);
        }),
      'logbook',
      'straw',
    ],
    [
      'trace',
      s.harvest ? !!s.harvest.batchCode && s.harvest.qrIssued > 0 : 'na',
      'harvest',
      'batch',
    ],
  ];
  return tests.map(([id, value, tab, evidence]) => ({
    id,
    status: plot.sourceOnly || value === 'na' ? 'na' : value ? 'pass' : 'fail',
    tab,
    evidence,
  }));
}
export function complianceScore(plot: Plot, market: Market) {
  const checks = compliance(plot, market).filter((c) => c.status !== 'na');
  return checks.length
    ? Math.round((100 * checks.filter((c) => c.status === 'pass').length) / checks.length)
    : 0;
}
export function overallScore(plot: Plot) {
  return Math.round(
    (['CN', 'EU', 'US', 'HALAL'] as Market[]).reduce((s, m) => s + complianceScore(plot, m), 0) / 4,
  );
}
