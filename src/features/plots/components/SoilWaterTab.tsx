import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from 'recharts';
import type { Plot } from '../types';
import { usePlotText } from '../i18n';
import { date, dayDiff, number } from '../utils/format';
import { Card } from './shared';
import SoilMetricBar from './SoilMetricBar';
export default function SoilWaterTab({ plot }: { plot: Plot }) {
  const { t, lang } = usePlotText(),
    b = plot.soilBaseline,
    s = plot.currentSeason;
  const pillars = [
    {
      key: 'chemistry',
      metrics: [
        ['pH', b.chemistry.pH, '', 5.5, 6.5],
        ['N', b.chemistry.nAvailKgHa, 'kg/ha', 50, 100],
        ['P', b.chemistry.pAvailKgHa, 'kg/ha', 15, 35],
        ['K', b.chemistry.kAvailKgHa, 'kg/ha', 100, 180],
        ['Ca', b.chemistry.ca, 'cmol/kg', 4, 10],
        ['Mg', b.chemistry.mg, 'cmol/kg', 1, 4],
        ['Base saturation', b.chemistry.baseSatPct, '%', 50, 80],
      ],
    },
    {
      key: 'acidity',
      metrics: [
        ['EC', b.chemistry.ecDsM, 'dS/m', 0, 2],
        ['Al / H saturation', b.acidity.alHSatPct, '%', 0, 15],
      ],
    },
    {
      key: 'carbon',
      metrics: [
        ['SOC', b.carbon.socPct, '%', 1.5, 3],
        ['SOM', b.carbon.somPct, '%', 2.5, 5],
        ['C/N', b.carbon.cnRatio, '', 10, 16],
      ],
    },
    {
      key: 'physics',
      metrics: [
        ['Clay', b.physics.clayPct, '%', 30, 50],
        ['Silt', b.physics.siltPct, '%', 25, 45],
        ['Sand', b.physics.sandPct, '%', 10, 30],
        ['Bulk density', b.physics.bulkDensity, 'g/cm³', 1, 1.4],
        ['AWC', b.physics.awcMm, 'mm', 100, 180],
      ],
    },
    {
      key: 'biology',
      metrics: [
        ['Microbial biomass', b.biology.microbialBiomassMgCKg, 'mg C/kg', 200, 400],
        ['Microbial activity', b.biology.microbialActivityMgNKg, 'mg N/kg', 15, 35],
        ['Fungi / bacteria', b.biology.fungiBacteriaRatio, '', 0.5, 1.2],
      ],
    },
  ];
  const radar = pillars.map((p) => ({
    name: t(p.key as 'chemistry'),
    value: Math.round(
      p.metrics.reduce((sum, m) => {
        const value = m[1] as number,
          min = m[3] as number,
          max = m[4] as number;
        return (
          sum +
          (value >= min && value <= max
            ? 100
            : Math.max(
                0,
                100 -
                  (Math.min(Math.abs(value - min), Math.abs(value - max)) /
                    Math.max(max - min, 0.1)) *
                    100,
              ))
        );
      }, 0) / p.metrics.length,
    ),
  }));
  const logWater = s.logs
    .filter((l) => l.waterLevelCm !== undefined)
    .map((l) => ({ das: dayDiff(l.date, s.sowingDate), level: l.waterLevelCm! }))
    .sort((a, b) => a.das - b.das);
  const water = plot.iotStationId
    ? Array.from({ length: Math.max(1, s.das + 1) }, (_, das) => ({
        das,
        level: Math.round((-5 + 10 * Math.sin(das / 4)) * 10) / 10,
      }))
    : logWater;
  let run = 0;
  const flooded = water.reduce((best, p) => {
    run = p.level > 0 ? run + 1 : 0;
    return Math.max(best, run);
  }, 0);
  const dryingEvents = water.filter(
    (p, i) => p.level < 0 && (i === 0 || water[i - 1].level >= 0),
  ).length;
  return (
    <>
      <Card title={t('soilBaseline')}>
        <div className="pp-row">
          <b>{b.lab}</b>
          <span>{date(b.sampledAt, lang)}</span>
          <button onClick={() => window.location.assign(`?tab=history&evidence=document-soil`)}>
            {t('soilReport')} →
          </button>
        </div>
      </Card>
      <div className="pp-soil-grid">
        {pillars.map((p) => (
          <Card title={t(p.key as 'chemistry')} key={p.key}>
            {p.metrics.map(([label, value, unit, min, max]) => (
              <SoilMetricBar
                key={label}
                label={
                  lang === 'vi'
                    ? (
                        {
                          'Base saturation': 'Độ bão hòa bazơ',
                          'Al / H saturation': 'Độ bão hòa Al/H',
                          Clay: 'Sét',
                          Silt: 'Thịt',
                          Sand: 'Cát',
                          'Bulk density': 'Dung trọng',
                          'Microbial biomass': 'Sinh khối vi sinh',
                          'Microbial activity': 'Hoạt tính vi sinh',
                          'Fungi / bacteria': 'Nấm / vi khuẩn',
                        } as Record<string, string>
                      )[label as string] || String(label)
                    : String(label)
                }
                value={Number(value)}
                unit={String(unit)}
                min={Number(min)}
                max={Number(max)}
              />
            ))}
          </Card>
        ))}
      </div>
      <div className="pp-two-col">
        <Card title={t('soilHealth')}>
          <div className="pp-chart">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Radar dataKey="value" stroke="#1F5130" fill="#2E9E4F" fillOpacity={0.25} />
                <Tooltip formatter={(value) => number(Number(value), lang, 2)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <small>{t('policyNote')}</small>
        </Card>
        <Card id="water" title={t('waterLevel')}>
          <small>
            {t(plot.iotStationId ? 'sourceIoT' : 'sourceLogs')}
            {plot.iotStationId ? ` · ${plot.iotStationId}` : ''}
          </small>
          <div className="pp-chart">
            <ResponsiveContainer>
              <LineChart data={water}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="das"
                  domain={[0, s.varietyDays]}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => number(Number(value), lang, 2)}
                  domain={[-20, 10]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => number(Number(value), lang, 2)} />
                <ReferenceArea y1={-15} y2={5} fill="#2E9E4F" fillOpacity={0.08} />
                <ReferenceArea
                  x1={s.varietyDays - 15}
                  x2={s.varietyDays - 7}
                  fill="#E0A526"
                  fillOpacity={0.12}
                />
                <Line type="monotone" dataKey="level" stroke="#2B7BB9" dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <small>
            {t('awd')} · {t('drainTarget')}
          </small>
          <div className="pp-three-col pp-space">
            {[
              [t('minimum'), number(Math.min(...water.map((p) => p.level)), lang, 2) + ' cm'],
              [t('maximum'), number(Math.max(...water.map((p) => p.level)), lang, 2) + ' cm'],
              [t('dryEvents'), number(dryingEvents, lang, 0)],
            ].map(([name, v]) => (
              <div key={name}>
                <small>{name}</small>
                <h3>{v}</h3>
              </div>
            ))}
          </div>
          <small>
            {t('floodDays')}: {number(flooded, lang, 0)}
          </small>
        </Card>
      </div>
    </>
  );
}
