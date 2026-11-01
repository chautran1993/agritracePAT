import { number } from '../utils/format';
import { usePlotText } from '../i18n';
export default function SoilMetricBar({
  label,
  value,
  unit,
  min,
  max,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
}) {
  const { lang, t } = usePlotText(),
    ok = value >= min && value <= max,
    total = max * 1.5;
  return (
    <div className="pp-soil-metric">
      <div>
        <span>{label}</span>
        <b className={ok ? 'pp-green' : 'pp-gold'}>
          {number(value, lang, 2)} {unit}
        </b>
      </div>
      <div className="pp-range">
        <i style={{ left: `${(min / total) * 100}%`, width: `${((max - min) / total) * 100}%` }} />
        <span style={{ left: `${Math.min(100, (value / total) * 100)}%` }} />
      </div>
      <small>
        {t('optimal')}: {number(min, lang)}–{number(max, lang)} {unit}
      </small>
    </div>
  );
}
