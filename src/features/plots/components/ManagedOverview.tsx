import type { Plot } from '../types';
import { Card } from './shared';
import PlotMiniMap from './PlotMiniMap';
import PlantingZoneCard from './PlantingZoneCard';
import InlineField from './InlineField';
import { useI18n } from '../../../lib/i18n';
import { number } from '../../../lib/format';
import { download } from '../utils/format';
export default function ManagedOverview({
  plot,
  save,
}: {
  plot: Plot;
  save: (field: string, value: string) => Promise<void>;
}) {
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const rows = [
    [vi ? 'Chủ hộ' : 'Household owner', plot.owner.name, 'owner.name'],
    [vi ? 'SĐT' : 'Phone', plot.owner.phone, 'owner.phone'],
    [vi ? 'Đại diện vùng' : 'Zone representative', plot.cooperative.name, 'cooperative.name'],
  ] as const;
  const corners = plot.geometry.type === 'Polygon' ? plot.geometry.coordinates[0].length - 1 : 1;
  return (
    <>
      <div className="pp-two-col">
        <Card title={vi ? 'Thông tin thửa' : 'Parcel information'}>
          <dl className="space-y-3">
            {[
              [
                vi ? 'Số thửa / Số tờ' : 'Parcel / Sheet',
                `${plot.source!.parcelNumber} / ${plot.source!.sheetNumber}`,
              ],
              [vi ? 'Vùng trồng' : 'Planting zone', plot.zoneName[lang]],
              [vi ? 'Xã / Tỉnh' : 'Commune / Province', `${plot.commune} / ${plot.province}`],
              [
                vi ? 'Địa chỉ' : 'Address',
                `Ấp ${1 + (plot.source!.sourceRow % 5)}, xã ${plot.commune}, tỉnh ${plot.province}`,
              ],
              [vi ? 'Diện tích' : 'Area', number(plot.areaGisHa, lang, 4) + ' ha'],
              [
                'Lat / Lng',
                `${number(plot.centroid.lat, lang, 7)} / ${number(plot.centroid.lng, lang, 7)}`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="break-words font-semibold">{value}</dd>
              </div>
            ))}
            {rows.map(([label, value, field]) => (
              <InlineField key={field} label={label} value={value} onSave={(v) => save(field, v)} />
            ))}
          </dl>
        </Card>
        <PlantingZoneCard plot={plot} editable />
      </div>
      <Card title={vi ? 'Ranh giới thửa' : 'Parcel boundary'}>
        <PlotMiniMap plot={plot} />
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            className="pp-primary inline-flex"
            href={plot.source!.googleMaps}
            target="_blank"
            rel="noreferrer"
          >
            Google Maps ↗
          </a>
          <button
            onClick={() =>
              download(
                `${plot.pdi}.geojson`,
                JSON.stringify(
                  {
                    type: 'Feature',
                    properties: {
                      pdi: plot.pdi,
                      puc_code: plot.officialZoneCode!.code,
                      estimatedAreaHa: plot.areaGisHa,
                      sheet: plot.source!.sheetNumber,
                      parcel: plot.source!.parcelNumber,
                      owner: plot.owner.name,
                      boundaryEstimated: !['MP-0001', 'MP-1001'].includes(plot.pdi),
                      sourceLocation: [plot.centroid.lng, plot.centroid.lat],
                    },
                    geometry: plot.geometry,
                  },
                  null,
                  2,
                ),
                'application/geo+json',
              )
            }
          >
            GeoJSON
          </button>
        </div>
        <p className="mt-3 text-sm">
          {vi
            ? `Ranh giới thửa ${plot.source!.parcelNumber}, tờ ${plot.source!.sheetNumber} · Diện tích ${number(plot.areaGisHa, lang, 4)} ha · ${corners} điểm góc`
            : `Parcel ${plot.source!.parcelNumber}, sheet ${plot.source!.sheetNumber} · ${number(plot.areaGisHa, lang, 4)} ha · ${corners} corners`}
        </p>
      </Card>
    </>
  );
}
