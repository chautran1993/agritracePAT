import type { Plot } from '../types';
import { usePlotText } from '../i18n';
import { number } from '../utils/format';
import { categoryLabel } from '../../../map/i18n';
import { logbookScore, overallScore } from '../utils/compliance';
import { Chip } from './shared';
export default function KpiStrip({ plot }: { plot: Plot }) {
  const { t, lang } = usePlotText(),
    s = plot.currentSeason;
  return (
    <div className="pp-kpis">
      {[
        [
          t('area'),
          `${number(plot.areaGisHa, lang, 2)} ha`,
          `${t('declared')}: ${number(plot.areaDeclaredHa, lang, 2)} ha`,
        ],
        [t('seed'), categoryLabel(s.variety, lang), s.seedBatch.grade],
        [
          t('stage'),
          categoryLabel(s.stage, lang),
          `${number(s.das, lang, 0)} / ${number(s.varietyDays, lang, 0)} ${t('dayUnit')}`,
        ],
        [t('logScore'), `${number(logbookScore(s), lang, 0)}%`, t('plan')],
        [
          t('marketScore'),
          `${number(overallScore(plot), lang, 0)} / ${number(100, lang, 0)}`,
          t('policyNote'),
        ],
        [t('yield'), `${number(s.expectedYieldT, lang, 2)} t`, t('expectedHarvest')],
      ].map(([label, value, sub], i) => (
        <div className="pp-card" key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
          <span>{sub}</span>
          {i === 0 && (
            <Chip tone={Math.abs(plot.areaDiffPct) > 5 ? 'gold' : 'green'}>
              {number(plot.areaDiffPct, lang)}%
            </Chip>
          )}
          {i === 2 && (
            <div className="pp-mini-progress">
              {[0, 20, 40, 70].map((d) => (
                <i key={d} className={s.das >= d ? 'done' : ''} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
