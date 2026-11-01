import type { Season } from '../types';
import { usePlotText } from '../i18n';
import { date, number } from '../utils/format';
import { stages } from '../../../map/mock/generatePlots';
import { categoryLabel } from '../../../map/i18n';
export default function StageTimeline({ season: s }: { season: Season }) {
  const { t, lang } = usePlotText();
  return (
    <>
      <div className="pp-stage-track">
        {stages.map((stage, i) => (
          <div key={stage} className={s.das >= [0, 20, 40, 70][i] ? 'done' : ''}>
            <b>{categoryLabel(stage, lang)}</b>
            <small>
              {number([0, 20, 40, 70][i], lang, 0)}–
              {number([20, 40, 70, s.varietyDays][i], lang, 0)} DAS
            </small>
          </div>
        ))}
        <span
          className="pp-today"
          style={{ left: `${Math.max(0, Math.min(100, (s.das / s.varietyDays) * 100))}%` }}
        >
          {t('today')} · {number(s.das, lang, 0)}
        </span>
      </div>
      <p className="pp-space">
        {t('expectedHarvest')}: <b>{date(s.expectedHarvestDate, lang)}</b>
      </p>
    </>
  );
}
