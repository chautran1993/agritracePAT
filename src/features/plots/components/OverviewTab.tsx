import { Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Copy, Download } from 'lucide-react';
import type { Plot } from '../types';
import { usePlotText } from '../i18n';
import { date, number, text, download } from '../utils/format';
import { validPolygon } from '../utils/geo';
import { phiViolations } from '../utils/compliance';
import { Card, Chip } from './shared';
import PlotMiniMap from './PlotMiniMap';
import { categoryLabel } from '../../../map/i18n';
export default function OverviewTab({
  plot,
  jump,
  printOnly = false,
}: {
  plot: Plot;
  jump: (tab: string, evidence?: string) => void;
  printOnly?: boolean;
}) {
  const { t, lang } = usePlotText(),
    s = plot.currentSeason,
    geo = JSON.stringify(
      { type: 'Feature', properties: { pdi: plot.pdi }, geometry: plot.geometry },
      null,
      2,
    ),
    phi = phiViolations(plot),
    coordinates =
      plot.geometry.type === 'Polygon' ? plot.geometry.coordinates[0] : [plot.geometry.coordinates];
  return (
    <div className="pp-two-col">
      <div>
        <Card id="geometry" title={t('viewMap')}>
          {printOnly ? (
            <div className="pp-print-geometry">
              <svg viewBox="0 0 300 170">
                <polygon
                  points={coordinates
                    .map(([lng, lat]) => {
                      const ring = coordinates,
                        xs = ring.map((c) => c[0]),
                        ys = ring.map((c) => c[1]);
                      return `${20 + ((lng - Math.min(...xs)) / (Math.max(...xs) - Math.min(...xs))) * 260},${150 - ((lat - Math.min(...ys)) / (Math.max(...ys) - Math.min(...ys))) * 130}`;
                    })
                    .join(' ')}
                  fill="#e8f3e9"
                  stroke="#1F5130"
                  strokeWidth="2"
                />
              </svg>
            </div>
          ) : (
            <PlotMiniMap plot={plot} />
          )}
          <div className="pp-row pp-space">
            <Chip tone={validPolygon(plot.geometry) ? 'green' : 'red'}>
              <CheckCircle2 size={13} />
              {t(validPolygon(plot.geometry) ? 'eudr' : 'invalid')}
            </Chip>
            <span>
              {t('level')}: <b>{number(plot.elevationDiffCm, lang)} cm</b>
            </span>
          </div>
          <small>{t('levelTarget')}</small>
          <details className="pp-coordinates">
            <summary>{t('coords')}</summary>
            <ol>
              {coordinates.map(([lng, lat], i) => (
                <li key={i}>
                  {number(lat, lang, 6)}, {number(lng, lang, 6)}
                </li>
              ))}
            </ol>
          </details>
          <div className="pp-row">
            <button onClick={() => navigator.clipboard.writeText(geo)}>
              <Copy size={14} />
              {t('geoCopy')}
            </button>
            <button
              onClick={() => download(`${plot.shortCode}.geojson`, geo, 'application/geo+json')}
            >
              <Download size={14} />
              {t('geoDownload')}
            </button>
          </div>
        </Card>
        <Card title={t('alerts')}>
          {s.logs
            .filter((l) => l.deviation)
            .map((l) => (
              <button className="pp-alert gold" key={l.id} onClick={() => jump('logbook', l.id)}>
                <AlertTriangle size={16} />
                {text(l.deviation!, lang)}
              </button>
            ))}
          {s.logs
            .filter((l) => !l.gpsVerified)
            .map((l) => (
              <button className="pp-alert gold" key={l.id} onClick={() => jump('logbook', l.id)}>
                <AlertTriangle size={16} />
                {t('gpsFail')} · {date(l.date, lang)}
              </button>
            ))}
          {s.pests
            .filter((p) => p.status !== 'Đã khống chế')
            .map((p) => (
              <button className="pp-alert red" key={p.id} onClick={() => jump('pests', p.id)}>
                <AlertTriangle size={16} />
                {text(p.name, lang)} · {t('pestOpen')}
              </button>
            ))}
          <button
            className={`pp-alert ${phi.length ? 'red' : 'blue'}`}
            onClick={() => jump('pests', 'phi')}
          >
            <AlertTriangle size={16} />
            {t(phi.length ? 'phiWarning' : 'phiPending')} · {t('expectedHarvest')}:{' '}
            {date(s.expectedHarvestDate, lang)}
          </button>
          {plot.iotStationId === 'IoT-02' && (
            <Link className="pp-alert red" to="/iot">
              IoT-02 · {t('offline')}
            </Link>
          )}
        </Card>
      </div>
      <div>
        <Card title={t('owner')}>
          <div className="pp-person">
            <span>
              {plot.owner.name
                .split(' ')
                .slice(-2)
                .map((n) => n[0])
                .join('')}
            </span>
            <div>
              <h3>{plot.owner.name}</h3>
              <small>{plot.owner.householdId}</small>
            </div>
            <Chip>{t('verified')}</Chip>
          </div>
          <dl>
            <dt>{t('phone')}</dt>
            <dd>{plot.owner.phone}</dd>
            <dt>{t('joined')}</dt>
            <dd>{date(plot.owner.joinedAt, lang)}</dd>
            <dt>HTX</dt>
            <dd>
              {plot.cooperative.name} · {plot.cooperative.id}
            </dd>
          </dl>
        </Card>
        <Card id="zone-code" title={t('official')}>
          <small>{t('internal')}</small>
          <code className="pp-code-block">{plot.pdi}</code>
          {plot.officialZoneCode ? (
            <>
              <Chip>{plot.officialZoneCode.code}</Chip>
              <dl>
                <dt>{t('issuedBy')}</dt>
                <dd>{plot.officialZoneCode.issuedBy}</dd>
                <dt>{t('issuedAt')}</dt>
                <dd>{date(plot.officialZoneCode.issuedAt, lang)}</dd>
              </dl>
              <div className="pp-chips">
                {plot.officialZoneCode.markets.map((m) => (
                  <Chip key={m} tone="blue">
                    {m}
                  </Chip>
                ))}
              </div>
            </>
          ) : (
            <>
              <Chip tone="gold">{t('notIssued')}</Chip>
              <p className="pp-space">
                {t('readiness')} · 11/15 {t('criteria')}
              </p>
              <progress max={15} value={11} />
              <Link to="/zones">{t('registry')} →</Link>
            </>
          )}
        </Card>
        <Card title={t('season')}>
          <dl>
            <dt>{t('season')}</dt>
            <dd>{text(s.name, lang)}</dd>
            <dt>{t('seed')}</dt>
            <dd>
              {categoryLabel(s.variety, lang)} · {s.seedBatch.grade}
            </dd>
            <dt>{t('days')}</dt>
            <dd>{number(s.das, lang, 0)}</dd>
            <dt>{t('stage')}</dt>
            <dd>{categoryLabel(s.stage, lang)}</dd>
            <dt>{t('expectedHarvest')}</dt>
            <dd>{date(s.expectedHarvestDate, lang)}</dd>
          </dl>
          <button onClick={() => jump('season')}>{t('season')} →</button>
        </Card>
      </div>
    </div>
  );
}
