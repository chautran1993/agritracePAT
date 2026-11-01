import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import ZonesPage from '../pages/ZonesPage';
import MapKpiStrip from '../map/components/KpiStrip';
import { I18nContext } from '../lib/i18n';
import { mapData } from '../map/mock/generatePlots';
import { generateProfiles } from '../features/plots/mock/plotProfiles';
import { plots, zones, summarize, currentMapPlots, zoneAreaScale } from './agritrace';
import { traceBatch, buildTrace } from './traceability';
import { number, date, todaySaigon } from '../lib/format';
describe('Canonical demo records', () => {
  it.each(['vi', 'en'] as const)(
    'renders identical GIS totals and parcel issuance on all three screens (%s)',
    (lang) => {
      const expected = mapData.plots.features.reduce((sum, p) => sum + p.properties.areaHa, 0);
      const area = `${number(expected, lang, 2)} ha`;
      const issued = mapData.plots.features.filter(
        (p) => p.properties.codeStatus === 'Đã cấp mã',
      ).length;
      const ratio = `${number(issued, lang, 0)}/${number(mapData.plots.features.length, lang, 0)} (${number((issued / mapData.plots.features.length) * 100, lang, 0)}%)`;
      for (const screen of [
        <Dashboard />,
        <ZonesPage />,
        <MapKpiStrip plots={currentMapPlots} />,
      ]) {
        const html = renderToStaticMarkup(
          <I18nContext.Provider value={{ lang, setLang: () => {} }}>
            <MemoryRouter>{screen}</MemoryRouter>
          </I18nContext.Provider>,
        );
        const content = html.replace(/<!--.*?-->/g, '').replace(/<[^>]*>/g, '');
        expect(content).toContain(area);
        expect(content).toContain(ratio);
      }
      expect(summarize().areaHa).toBeCloseTo(expected, 10);
      expect(zones.reduce((sum, z) => sum + z.area, 0)).toBeCloseTo(expected, 10);
      expect(generateProfiles('2026-10-14').reduce((sum, p) => sum + p.areaGisHa, 0)).toBeCloseTo(
        expected,
        10,
      );
    },
  );
  it('keeps filtered totals, household identities, stages and zone names consistent', () => {
    for (const zone of zones) {
      const subset = plots.filter((p) => p.zoneId === zone.id),
        summary = summarize(subset);
      expect(summary.areaHa).toBe(zone.area);
      expect(summary.households).toBe(zone.households);
      for (const p of generateProfiles('2026-10-15').filter((p) => p.zoneId === zone.id))
        expect(p.zoneName.vi).toBe(zone.name);
    }
    const scale = zoneAreaScale(currentMapPlots);
    expect(scale.low).toBeGreaterThanOrEqual(Math.min(...zones.map((z) => z.area)));
    expect(scale.high).toBeLessThanOrEqual(Math.max(...zones.map((z) => z.area)));
    expect(summarize([])).toMatchObject({ areaHa: 0, plots: 0, issuedPct: 0 });
  });
  it('seeds three consistent seasons per parcel', () => {
    expect(traceBatch()?.plot.pdi).toBe('MP-0001');
    expect(traceBatch('LO-2027-001')).toBeUndefined();
    expect(
      generateProfiles().every((p) => p.seasons.length === 2 && p.currentSeason.logs.length >= 12),
    ).toBe(true);
  });
  it.each(['2026-08-01', '2026-10-23', '2027-01-01'])(
    'does not complete future evidence on %s',
    (today) => {
      const plot = generateProfiles()[0];
      const season = {
        ...plot.currentSeason,
        sowingDate: '2026-12-01',
        logs: [],
        expectedHarvestDate: '2027-03-01',
      };
      const journey = buildTrace(plot, season, 'TEST', today);
      for (const step of journey.steps) if (step.date > today) expect(step.completed).toBe(false);
      expect(journey.steps.every((step) => !step.completed)).toBe(true);
    },
  );
  it('uses the Vietnam calendar boundary and localized decimal/date formats', () => {
    expect(todaySaigon(new Date('2026-10-14T16:59:59Z'))).toBe('2026-10-14');
    expect(todaySaigon(new Date('2026-10-14T17:00:00Z'))).toBe('2026-10-15');
    expect(number(66.26, 'vi', 2)).toBe('66,26');
    expect(number(66.26, 'en', 2)).toBe('66.26');
    expect(date('2026-08-28', 'vi')).toBe('28/08/2026');
  });
});
