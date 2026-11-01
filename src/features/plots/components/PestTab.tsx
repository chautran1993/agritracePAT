import type { Plot } from '../types';
import { usePlotText } from '../i18n';
import { text, date, number } from '../utils/format';
import {todaySaigon} from '../../../lib/format';
import { phiViolations } from '../utils/compliance';
import { Card, Chip, Empty } from './shared';
export default function PestTab({ plot }: { plot: Plot }) {
  const { t, lang } = usePlotText(),
    violations = phiViolations(plot);
  return (
    <>
      <h2 className="sr-only">{t('pests')}</h2>
      <div id="phi" className={`pp-alert ${violations.length ? 'red' : 'green'}`}>
        {t(violations.length ? 'phiWarning' : 'phiClear')} ·{' '}
        {date(plot.currentSeason.expectedHarvestDate, lang)}
      </div>
      <div className="pp-two-col">
        {plot.currentSeason.pests.map((p) => (
          <Card key={p.id} id={p.id} title={`${p.code} · ${text(p.name, lang)}`}>
            <div className="pp-pest-top">
              {p.photo && <img src={p.photo} alt={t('photo')} />}
              <div>
                <small>
                  {t('detected')}: {date(p.detectedAt, lang)}
                </small>
                <h3>
                  {t('affected')}: {number(p.affectedPct, lang)}%
                </h3>
                <span>
                  {t('severity')}: {p.severity}/3
                </span>
                <div className="pp-severity">
                  {[1, 2, 3].map((n) => (
                    <i key={n} className={n <= p.severity ? 'on' : ''} />
                  ))}
                </div>
              </div>
            </div>
            <h3 className="pp-space">{t('prescription')}</h3>
            <dl>
              <dt>{t('inputs')}</dt>
              <dd>{p.prescription.product}</dd>
              <dt>{t('ingredient')}</dt>
              <dd>{p.prescription.activeIngredient}</dd>
              <dt>{t('rate')}</dt>
              <dd>{p.prescription.dose.replace(/\d+(\.\d+)?/g, (v) => number(Number(v), lang))}</dd>
              <dt>{t('method')}</dt>
              <dd>
                {p.prescription.method === 'Drone'
                  ? 'Drone'
                  : lang === 'vi'
                    ? 'Phun tay'
                    : 'Manual spraying'}
              </dd>
              <dt>{t('phi')}</dt>
              <dd>
                {number(p.prescription.phiDays, lang, 0)} {t('dayUnit')}
              </dd>
              <dt>{t('approved')}</dt>
              <dd>{p.prescription.approvedBy}</dd>
            </dl>
            <div className="pp-chips">
              {p.detectedAt>todaySaigon()?<Chip>{lang==='vi'?'Dự kiến':'Planned'}</Chip>:(['Mới', 'Đang xử lý', 'Đã khống chế'] as const).map((status, i) => (
                <Chip
                  key={status}
                  tone={p.status === status ? (i === 2 ? 'green' : 'gold') : 'grey'}
                >
                  {t((['new', 'treating', 'controlled'] as const)[i])}
                </Chip>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {!plot.currentSeason.pests.length && <Empty>{t('empty')}</Empty>}
    </>
  );
}
