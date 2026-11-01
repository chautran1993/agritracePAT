import { expect, it } from 'vitest';
import { generateProfiles } from '../features/plots/mock/plotProfiles';
import { refreshDerivedProfile } from './derivedProfile';
it('derives the current stage from the Vietnam calendar instead of a stored snapshot', () => {
  const plot = generateProfiles('2026-10-27')[0];
  refreshDerivedProfile(plot, '2026-11-14');
  expect(plot.currentSeason.stage).toBe('Chuẩn bị gieo sạ');
  refreshDerivedProfile(plot, '2026-12-30');
  expect(plot.currentSeason.das).toBe(45);
  expect(plot.currentSeason.stage).toBe('Đẻ nhánh');
  plot.currentSeason.yieldPerHaT = 6.4;
  refreshDerivedProfile(plot, '2026-12-30');
  expect(plot.currentSeason.expectedYieldT).toBeCloseTo(plot.areaGisHa * 6.4, 10);
});
