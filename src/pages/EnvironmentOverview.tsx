import { useI18n } from '../lib/i18n';
import { number } from '../lib/format';
import { environmentReadings } from '../data/environmentReadings';
import TableScroll from '../components/TableScroll';
export default function EnvironmentOverview() {
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const average = (key: 'ph' | 'ec' | 'salinity' | 'temperature') =>
    environmentReadings.reduce((s, r) => s + r[key], 0) / environmentReadings.length;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{vi ? 'Giám sát IoT' : 'IoT monitoring'}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['pH', average('ph'), ''],
          ['EC', average('ec'), ' dS/m'],
          [vi ? 'Độ mặn' : 'Salinity', average('salinity'), ' ‰'],
          [vi ? 'Nhiệt độ' : 'Temperature', average('temperature'), ' °C'],
        ].map(([label, value, unit]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4">
            <h2 className="text-sm">{label}</h2>
            <p className="mt-2 text-xl font-bold">
              {number(Number(value), lang, 2)}
              {unit}
            </p>
          </div>
        ))}
      </div>
      <TableScroll>
        <table className="w-full bg-white text-sm">
          <thead>
            <tr>
              {[
                vi ? 'Thửa' : 'Parcel',
                'pH',
                'EC (dS/m)',
                vi ? 'Độ mặn (‰)' : 'Salinity (‰)',
                vi ? 'Mực nước (cm)' : 'Water (cm)',
              ].map((h) => (
                <th key={h} className="p-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {environmentReadings.map((r) => (
              <tr key={r.pdi} className="border-t">
                <td className="p-3">{r.name[lang]}</td>
                {[r.ph, r.ec, r.salinity, r.waterCm].map((v, i) => (
                  <td key={i} className="p-3">
                    {number(v, lang, 2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
