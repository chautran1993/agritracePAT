import { number } from '../../lib/format';
import { issuedLabel } from '../../data/agritrace';
import { useMapText } from '../i18n';
import type { Plot } from '../mock/generatePlots';
export default function KpiStrip({ plots }: { plots: Plot[] }) {
  const { t, lang } = useMapText();
  const values = [
    [t.zones, number(new Set(plots.map((p) => p.properties.zoneId)).size, lang, 0)],
    [t.plots, number(plots.length, lang, 0)],
    [
      t.totalArea,
      `${number(
        plots.reduce((s, p) => s + p.properties.areaHa, 0),
        lang,
        2,
      )} ha`,
    ],
    [
      t.issued,
      issuedLabel(
        plots.filter((p) => p.properties.codeStatus === 'Đã cấp mã').length,
        plots.length,
        lang,
      ),
    ],
  ];
  return (
    <div className="gis-glass gis-kpis">
      {values.map(([label, value]) => (
        <div key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
