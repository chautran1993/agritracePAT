import { number } from '../../lib/format';
import { zoneAreaScale } from '../../data/agritrace';
import { useMapText, categoryLabel } from '../i18n';
import { categories, palettes, fields, type Theme } from '../layers/styles';
import type { Plot } from '../mock/generatePlots';
export default function Legend({
  theme,
  plots,
  overview,
}: {
  theme: Theme;
  plots: Plot[];
  overview: boolean;
}) {
  const { t, lang } = useMapText();
  const scale = zoneAreaScale(plots);
  return (
    <aside className="gis-glass gis-legend">
      <h2>{overview ? t.zones : t[theme]}</h2>
      {overview
        ? (new Set(plots.map((p) => p.properties.zoneId)).size === 1
            ? [
                [
                  '#1F5130',
                  `${number(
                    plots.reduce((sum, p) => sum + p.properties.areaHa, 0),
                    lang,
                    2,
                  )} ha`,
                ],
              ]
            : [
                ['#1F5130', `≥ ${number(scale.high, lang, 2)} ha`],
                ['#4CAF50', `${number(scale.low, lang, 2)}–${number(scale.high, lang, 2)} ha`],
                ['#E0A526', `< ${number(scale.low, lang, 2)} ha`],
              ]
          ).map(([color, label]) => (
            <div key={label}>
              <span className="gis-swatch" style={{ background: color }} />
              {label}
            </div>
          ))
        : categories[theme].map((value, i) => {
            const group = plots.filter((p) => p.properties[fields[theme]] === value);
            return (
              <div key={value}>
                <span className="gis-swatch" style={{ background: palettes[theme][i] }} />
                <span>
                  {categoryLabel(value, lang)}
                  <small>
                    {number(group.length, lang, 0)} {t.plotUnit} ·{' '}
                    {number(
                      group.reduce((s, p) => s + p.properties.areaHa, 0),
                      lang,
                      2,
                    )}{' '}
                    ha
                  </small>
                </span>
              </div>
            );
          })}
    </aside>
  );
}
