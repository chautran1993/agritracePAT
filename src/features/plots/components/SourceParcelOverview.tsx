import type { Plot } from '../types';
import { useI18n } from '../../../lib/i18n';
import { number, download } from '../utils/format';
import { Card, Chip } from './shared';
import PlotMiniMap from './PlotMiniMap';

export default function SourceParcelOverview({ plot }: { plot: Plot }) {
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const source = plot.source!;
  const sampleId = plot.zoneId === 'VT002' ? 'MP-1001' : 'MP-0001';
  const rows = [
    [vi ? 'Mã nội bộ' : 'Internal ID', plot.pdi],
    [vi ? 'Số thửa' : 'Parcel number', source.parcelNumber],
    [vi ? 'Số tờ' : 'Sheet number', source.sheetNumber],
    [vi ? 'Vùng trồng' : 'Planting zone', plot.zoneName[lang]],
    [vi ? 'Xã' : 'Commune', plot.commune],
    [vi ? 'Tỉnh' : 'Province', plot.province],

    [vi ? 'Diện tích ước tính' : 'Estimated area', `${number(plot.areaDeclaredHa, lang, 4)} ha`],
    [vi ? 'Chủ hộ đề xuất (mẫu)' : 'Suggested household (sample)', plot.owner.name],
    ['Lat / Lng', `${number(plot.centroid.lat, lang, 7)} / ${number(plot.centroid.lng, lang, 7)}`],
  ];
  return (
    <div className="pp-two-col">
      <Card title={vi ? 'Ranh giới ước tính' : 'Estimated boundary'}>
        <PlotMiniMap plot={plot} />
        <p className="mt-3 text-sm text-slate-700">
          {vi
            ? `Thửa ${sampleId} giữ nguyên các góc được cung cấp. Các thửa còn lại phác theo ảnh và nối kín cạnh chung; chưa phải ranh địa chính.`
            : `${sampleId} retains the supplied corners. Surrounding boundaries follow screenshots with connected shared edges; they are not surveyed.`}
        </p>
        <a
          className="pp-primary mt-3 inline-flex"
          href={source.googleMaps}
          target="_blank"
          rel="noreferrer"
        >
          Google Maps ↗
        </a>
        <button
          className="ml-3"
          onClick={() =>
            download(
              `${plot.pdi}.geojson`,
              JSON.stringify(
                {
                  type: 'Feature',
                  properties: {
                    pdi: plot.pdi,
                    estimatedAreaHa: plot.areaDeclaredHa,
                    sourceRow: source.sourceRow,
                    boundaryEstimated: !['MP-0001', 'MP-1001'].includes(plot.pdi),
                    boundaryMethod: ['MP-0001', 'MP-1001'].includes(plot.pdi)
                      ? 'user-provided corners'
                      : 'visible screenshot outline, affine georeferencing',
                    sheet: source.sheetNumber,
                    parcel: source.parcelNumber,
                    suggestedOwner: plot.owner.name,
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
      </Card>
      <Card title={vi ? 'Thông tin thửa' : 'Parcel information'}>
        <Chip tone="gold">
          {vi ? 'Tên chủ hộ là gợi ý, chưa xác minh' : 'Suggested household name, unverified'}
        </Chip>
        <dl className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-600">{label}</dt>
              <dd className="break-words text-sm font-semibold text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        <details className="mt-4">
          <summary className="cursor-pointer py-2">
            {vi ? 'Tọa độ các góc (Lat / Long)' : 'Corner coordinates (Lat / Long)'}
          </summary>
          <ol className="space-y-1 text-sm">
            {plot.geometry.type === 'Polygon' &&
              plot.geometry.coordinates[0].slice(0, -1).map(([lng, lat], i) => (
                <li key={i}>
                  {i + 1}. {number(lat, lang, 7)} / {number(lng, lang, 7)}
                </li>
              ))}
          </ol>
        </details>
        {source.note && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{source.note}</p>
        )}
      </Card>
    </div>
  );
}
