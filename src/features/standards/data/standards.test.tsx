import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  standards,
  urls,
  verifiedField,
  publishStandard,
  matchesStandard,
  type Standard,
} from './standards';
import { marketRows, sourcedRows, sourcedCell } from './marketMatrix';
import StandardDetailPage from '../StandardDetailPage';
import { I18nContext } from '../../../lib/i18n';
import { year } from '../../../lib/format';
describe('Evidence-backed standards', () => {
  it.each(standards)(
    '$id has declared sources for every populated field and no legacy requirement count',
    (s) => {
      expect(s.sources.length).toBeGreaterThan(0);
      const sources = new Set(s.sources.map((source) => source.url));
      for (const key of Object.keys(s).filter((key) => !['sources', 'fieldSources'].includes(key)))
        expect(sources.has(s.fieldSources[key]), `${s.id}.${key}`).toBe(true);
      for (const source of s.sources) {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(s).not.toHaveProperty('req');
      if (s.status) expect(sources.has(s.status.sourceUrl)).toBe(true);
      for (const item of [...s.issuer, ...(s.keyFacts ?? []), ...(s.structure ?? [])])
        expect(sources.has(item.sourceUrl)).toBe(true);
    },
  );
  it('keeps unverified fields absent, and only SRP has an evidenced requirement count', () => {
    expect(standards.find((s) => s.id === 'vietgap')!.status).toBeUndefined();
    expect(standards.find((s) => s.id === 'codex-rice')!.editionLabel).toBeUndefined();
    expect(standards.filter((s) => s.requirementCount).map((s) => s.id)).toEqual(['srp']);
    const srp = standards.find((s) => s.id === 'srp')!;
    expect(srp.requirementCount).toEqual({ value: 41, sourceUrl: urls.srp });
    expect(srp.structure).toHaveLength(8);
  });
  it('does not publish a field or nested assertion after its source is removed', () => {
    const srp = structuredClone(standards.find((s) => s.id === 'srp')!);
    delete srp.fieldSources.editionLabel;
    expect(verifiedField(srp, 'editionLabel')).toBeUndefined();
    expect(publishStandard(srp)!.editionLabel).toBeUndefined();
    srp.status!.sourceUrl = '';
    srp.keyFacts!.forEach((f) => (f.sourceUrl = ''));
    srp.structure!.forEach((f) => (f.sourceUrl = ''));
    const visible = publishStandard(srp)!;
    expect(visible.status).toBeUndefined();
    expect(visible.keyFacts).toBeUndefined();
    expect(visible.structure).toBeUndefined();
    delete srp.fieldSources.nameVi;
    expect(publishStandard(srp)).toBeUndefined();
  });
  it('searches codes, both names and agencies without Vietnamese accents', () => {
    const vietgap = standards.find((s) => s.id === 'vietgap')!;
    expect(matchesStandard(vietgap, 'thuc hanh nong nghiep tot')).toBe(true);
    expect(matchesStandard(vietgap, 'CUC TRONG TROT')).toBe(true);
    expect(matchesStandard(vietgap, '11892')).toBe(true);
    expect(matchesStandard(vietgap, 'crop production')).toBe(true);
    expect(matchesStandard(vietgap, 'unrelated')).toBe(false);
  });
  it('contains only the three verified legal cells and leaves other markets unasserted', () => {
    expect(marketRows.flatMap((row) => Object.values(row.cells))).toHaveLength(3);
    for (const row of marketRows) {
      for (const cell of Object.values(row.cells)) {
        expect(cell.legalBasis).toBeTruthy();
        expect(cell.sourceUrl).toMatch(/^https:\/\//);
        expect(cell.level).toBe('Bắt buộc');
      }
      expect(row.cells.CN).toBeUndefined();
      expect(row.cells.HALAL).toBeUndefined();
    }
    expect(
      sourcedCell({ level: 'Bắt buộc', legalBasis: 'unsupported', sourceUrl: '' }),
    ).toBeUndefined();
    expect(
      sourcedRows([{ id: 'unsupported', labelVi: 'Unknown', labelEn: 'Unknown', cells: {} }]),
    ).toEqual([]);
  });
  it.each(['vi', 'en'] as const)(
    'omits empty sections and formats year without thousands grouping (%s)',
    (lang) => {
      const html = renderToStaticMarkup(
        <I18nContext.Provider value={{ lang, setLang: () => {} }}>
          <MemoryRouter initialEntries={['/standards/vietgap']}>
            <Routes>
              <Route path="/standards/:id" element={<StandardDetailPage />} />
            </Routes>
          </MemoryRouter>
        </I18nContext.Provider>,
      );
      const text = html.replace(/<[^>]*>/g, '');
      expect(text).not.toContain(lang === 'vi' ? 'Cấu trúc' : 'Structure');
      expect(text).not.toContain(lang === 'vi' ? 'Trạng thái' : 'Status');
      expect(text).not.toContain(
        lang === 'vi' ? 'Liên quan tới dữ liệu hệ thống' : 'Relevance to platform data',
      );
      expect(html).not.toMatch(/<dd[^>]*>\s*[—0]\s*<\/dd>/);
      expect(year(2017, lang)).toBe('2017');
    },
  );
  it('handles missing optional structures without creating zero-value placeholders', () => {
    const s = { ...standards[0], structure: [], keyFacts: [] } satisfies Standard;
    expect(publishStandard(s)!.structure).toBeUndefined();
    expect(publishStandard(s)!.keyFacts).toBeUndefined();
  });
});
