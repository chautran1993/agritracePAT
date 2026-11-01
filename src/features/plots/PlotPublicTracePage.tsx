import { buildTrace, traceTitles } from '../../data/traceability';
import { useParams, Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { plotProfiles } from './mock/plotProfiles';
import { usePlotText } from './i18n';
import { date, number, text } from './utils/format';
import { Card, Chip } from './components/shared';
import './profile.css';
import { useI18n } from '../../lib/i18n';
import { useEffect, useState } from 'react';
import type { Plot } from './types';
export default function PlotPublicTracePage() {
  const [stored, setStored] = useState<Plot | null>(null);
  const { pdi, batch } = useParams(),
    { t, lang } = usePlotText(),
    { setLang } = useI18n(),
    plot = stored ?? plotProfiles.find((p) => p.pdi === pdi),
    season =
      plot &&
      [plot.currentSeason, ...plot.seasons].find(
        (s) => s.harvest?.batchCode === batch || s.traceBatch?.code === batch,
      );
  useEffect(() => {
    let active = true;
    setStored(null);
    if (pdi && batch)
      void fetch(`/api/public-trace/${encodeURIComponent(pdi)}/${encodeURIComponent(batch)}`)
        .then(async (response) => {
          if (response.ok && response.headers.get('Content-Type')?.includes('application/json')) {
            const result = await response.json();
            if (active) setStored(result.plot);
          }
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [pdi, batch]);
  if (!plot || !season)
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="plot-profile"
        style={{ maxWidth: 700, margin: '40px auto' }}
      >
        <Card>
          <button
            data-testid="language-toggle"
            onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          >
            {lang.toUpperCase()}
          </button>
          <h1>{t('notFound')}</h1>
          <Link to="/map">{t('backMap')}</Link>
        </Card>
      </main>
    );
  const journey = buildTrace(plot, season, batch!);
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="plot-profile"
      style={{ maxWidth: 700, margin: '32px auto', padding: 20 }}
    >
      <div className="pp-row pp-space">
        <Leaf color="#1F5130" />
        <b>AgriTrace</b>
        <button data-testid="language-toggle" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
          {lang.toUpperCase()}
        </button>
        <Chip tone="gold">Đang hoạt động</Chip>
      </div>
      <Card>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F5130' }}>
          {season.variety} · {batch}
        </h1>
        <dl>
          <dt>PDI</dt>
          <dd>{plot.pdi}</dd>
          <dt>{t('owner')}</dt>
          <dd>
            {plot.owner.name} · {text(plot.name, lang)}
          </dd>
          <dt>{t('zones')}</dt>
          <dd>
            {plot.zoneId} · {plot.commune}, {plot.province}
          </dd>
          <dt>{t('season')}</dt>
          <dd>{text(season.name, lang)}</dd>
          <dt>{t('sowingDate')}</dt>
          <dd>{date(season.sowingDate, lang)}</dd>
          <dt>
            {t('harvest')} {!season.harvest && (lang === 'vi' ? '(Dự kiến)' : '(Planned)')}
          </dt>
          <dd>{date(season.harvest?.date ?? season.expectedHarvestDate, lang)}</dd>
          <dt>
            {t('yield')} {!season.harvest && (lang === 'vi' ? '(Dự kiến)' : '(Planned)')}
          </dt>
          <dd>{number(season.harvest?.yieldT ?? season.expectedYieldT, lang, 2)} t</dd>
          <dt>{t('moisture')}</dt>
          <dd>
            {season.harvest
              ? `${number(season.harvest.moisturePct, lang)}%`
              : lang === 'vi'
                ? 'Dự kiến'
                : 'Planned'}
          </dd>
          <dt>{t('mill')}</dt>
          <dd>{journey.mill}</dd>
        </dl>
        <div className="pp-journey">
          {journey.steps.map((step, i) => (
            <div key={step.kind}>
              <b>{step.completed ? '✓' : '○'}</b>
              <span>
                {traceTitles[lang][i]} · {date(step.date, lang)} ·{' '}
                {step.completed
                  ? lang === 'vi'
                    ? 'Đã hoàn thành'
                    : 'Completed'
                  : lang === 'vi'
                    ? 'Dự kiến'
                    : 'Planned'}
              </span>
            </div>
          ))}
        </div>
        <p className="pp-disclaimer">{t('policyNote')}</p>
      </Card>
    </main>
  );
}
