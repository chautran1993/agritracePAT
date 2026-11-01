import type { Plot } from '../types';
import { useI18n } from '../../../lib/i18n';
import { number, date, todaySaigon } from '../../../lib/format';
import PlantingZoneCard from './PlantingZoneCard';
export default function PlotReport({ plot }: { plot: Plot }) {
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const rows = [
    [
      vi ? 'Số thửa / Số tờ' : 'Parcel / Sheet',
      `${plot.source!.parcelNumber} / ${plot.source!.sheetNumber}`,
    ],
    [vi ? 'Vùng trồng' : 'Planting zone', plot.zoneName[lang]],
    [
      vi ? 'Địa chỉ' : 'Address',
      `Ấp ${1 + (plot.source!.sourceRow % 5)}, xã ${plot.commune}, tỉnh ${plot.province}`,
    ],
    [vi ? 'Diện tích' : 'Area', number(plot.areaGisHa, lang, 4) + ' ha'],
    [vi ? 'Chủ hộ' : 'Household owner', plot.owner.name],
    ['SĐT', plot.owner.phone],
    [vi ? 'Đại diện vùng' : 'Zone representative', plot.cooperative.name],
    ['Lat / Lng', `${number(plot.centroid.lat, lang, 7)} / ${number(plot.centroid.lng, lang, 7)}`],
    [vi ? 'Mã nội bộ' : 'Internal ID', plot.pdi],
  ];
  return (
    <div className="pp-print-content">
      <h2>{vi ? 'Thông tin thửa' : 'Parcel information'}</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <PlantingZoneCard plot={plot} />
      {[plot.currentSeason, ...plot.seasons].map((s) => (
        <section key={s.id}>
          <h2>{s.name[lang]}</h2>
          <p>
            {vi ? 'Gieo sạ' : 'Sowing'}: {date(s.sowingDate, lang)} · {vi ? 'Thu hoạch' : 'Harvest'}
            : {date(s.expectedHarvestDate, lang)}
          </p>
          <p>
            {vi ? 'Năng suất' : 'Yield'}: {number(s.expectedYieldT / plot.areaGisHa, lang, 2)} t/ha
            · {vi ? 'Sản lượng' : 'Production'}: {number(s.expectedYieldT, lang, 2)} t
          </p>
          <table>
            <thead>
              <tr>
                <th>{vi ? 'Ngày' : 'Date'}</th>
                <th>{vi ? 'Công việc' : 'Activity'}</th>
                <th>{vi ? 'Người thực hiện' : 'Actor'}</th>
                <th>{vi ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {s.logs.map((l) => (
                <tr key={l.id}>
                  <td>{date(l.date, lang)}</td>
                  <td>{l.title[lang]}</td>
                  <td>{l.actor}</td>
                  <td>
                    {l.date > todaySaigon()
                      ? vi
                        ? 'Dự kiến'
                        : 'Planned'
                      : vi
                        ? 'Đã hoàn thành'
                        : 'Completed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>{vi ? 'Dịch hại' : 'Pests'}</h3>
          <table>
            <thead>
              <tr>
                <th>{vi ? 'Ngày' : 'Date'}</th>
                <th>{vi ? 'Dịch hại' : 'Pest'}</th>
                <th>{vi ? 'Tỷ lệ' : 'Rate'}</th>
              </tr>
            </thead>
            <tbody>
              {s.pests.map((p) => (
                <tr key={p.id}>
                  <td>{date(p.detectedAt, lang)}</td>
                  <td>{p.name[lang]}</td>
                  <td>{number(p.affectedPct, lang, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <h2>{vi ? 'Đất & Nước' : 'Soil & Water'}</h2>
      <p>
        pH: {number(plot.soilBaseline.chemistry.pH, lang, 1)} · EC:{' '}
        {number(plot.soilBaseline.chemistry.ecDsM, lang, 1)} dS/m
      </p>
      <h2>{vi ? 'Tuân thủ & Thị trường' : 'Compliance & Market'}</h2>
      <ul>
        {[
          'Đăng ký cơ sở FDA · gia hạn 2 năm/lần',
          'US Agent',
          'Nhật ký canh tác 3 tháng gần nhất',
          'Kiểm tra dư lượng thuốc BVTV theo EPA tolerance',
        ].map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    </div>
  );
}
