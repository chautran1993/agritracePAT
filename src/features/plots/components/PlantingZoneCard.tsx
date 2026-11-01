import type { Plot } from '../types';
import { plotProfiles } from '../mock/plotProfiles';
import { useI18n } from '../../../lib/i18n';
import { number, date } from '../../../lib/format';
import { Card } from './shared';
import { useState } from 'react';
import InlineField from './InlineField';
export default function PlantingZoneCard({
  plot,
  editable = false,
}: {
  plot: Plot;
  editable?: boolean;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const members = plotProfiles.filter((p) => p.zoneId === plot.zoneId);
  const market = plot.officialZoneCode!.code.split('-')[4] || 'USA';
  const status = plot.officialZoneCode!.statusValue || 'active';
  const statusLabels = {
    active: vi ? 'Đang hoạt động' : 'Active',
    pending_approval: vi ? 'Đang xét duyệt' : 'Pending approval',
    suspended: vi ? 'Tạm dừng' : 'Suspended',
    revoked: vi ? 'Đã thu hồi' : 'Revoked',
  };
  const editKeys: Record<string, string> = {
    [vi ? 'Cơ quan cấp' : 'Issuing authority']: 'issued_by',
    [vi ? 'Số văn bản' : 'Document number']: 'issued_doc_no',
    [vi ? 'Ngày cấp' : 'Issue date']: 'issued_date',
  };
  async function saveZone(field: string, value: string) {
    const endpoint = `/api/zones/${plot.zoneId}`;
    const current = await fetch(endpoint, { credentials: 'same-origin' });
    const snapshot = await current.json();
    if (!current.ok) throw new Error(snapshot.error);
    const response = await fetch(endpoint, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value, revision: snapshot.revision }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    window.location.reload();
  }
  async function changeMarket(next: string) {
    setBusy(true);
    setError('');
    try {
      const endpoint = `/api/zones/${plot.zoneId}/market`;
      const current = await fetch(endpoint, { credentials: 'same-origin' });
      const snapshot = await current.json();
      if (!current.ok) throw new Error(snapshot.error);
      const response = await fetch(endpoint, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: next, revision: snapshot.revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu thị trường');
    } finally {
      setBusy(false);
    }
  }
  const rows = [
    [vi ? 'Mã số vùng trồng' : 'Planting zone code', plot.officialZoneCode!.code],
    [vi ? 'Loại cây / Giống' : 'Crop / Variety', 'Lúa (LUA001) / ' + plot.currentSeason.variety],
    [
      vi ? 'Tổng diện tích vùng' : 'Zone area',
      number(
        members.reduce((s, p) => s + p.areaGisHa, 0),
        lang,
        4,
      ) + ' ha',
    ],
    [
      vi ? 'Số hộ tham gia' : 'Households',
      number(new Set(members.map((p) => p.owner.householdId)).size, lang, 0),
    ],
    [
      vi ? 'Thị trường' : 'Market',
      plot.officialZoneCode!.code.endsWith('CHN') ? 'Trung Quốc (CHN)' : 'Hoa Kỳ (USA)',
    ],
    [vi ? 'Cơ quan cấp' : 'Issuing authority', plot.officialZoneCode!.issuedBy],
    [vi ? 'Số văn bản' : 'Document number', plot.officialZoneCode!.issuedDocNo || '125/TB-UBND'],
    [vi ? 'Ngày cấp' : 'Issue date', date(plot.officialZoneCode!.issuedAt, lang)],
    [vi ? 'Trạng thái' : 'Status', statusLabels[status]],
  ];
  return (
    <Card title={vi ? 'Thông tin vùng trồng' : 'Planting zone information'}>
      <dl className="space-y-3">
        {rows.map(([label, value]) =>
          editable && editKeys[label] ? (
            <InlineField
              key={label}
              label={label}
              value={editKeys[label] === 'issued_date' ? plot.officialZoneCode!.issuedAt : value}
              displayValue={value}
              onSave={(value) => saveZone(editKeys[label], value)}
            />
          ) : (
            <div key={label}>
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd className="break-words font-semibold">{value}</dd>
            </div>
          ),
        )}
      </dl>
      {editable && (
        <label className="mt-4 block text-sm">
          {vi ? 'Thị trường xuất khẩu' : 'Export market'}
          <select
            className="mt-2 min-h-11 w-full rounded border p-2 focus-visible:ring-2"
            value={market}
            disabled={busy}
            onChange={(e) => void changeMarket(e.target.value)}
          >
            <option value="USA">{vi ? 'Hoa Kỳ' : 'United States'} (USA)</option>
            <option value="CHN">{vi ? 'Trung Quốc' : 'China'} (CHN)</option>
          </select>
        </label>
      )}
      {editable && (
        <label className="mt-4 block text-sm">
          {vi ? 'Trạng thái mã vùng trồng' : 'Planting zone code status'}
          <select
            className="mt-2 min-h-11 w-full rounded border p-2 focus-visible:ring-2"
            value={status}
            onChange={(e) =>
              void saveZone('status', e.target.value).catch((error) =>
                setError(String(error.message)),
              )
            }
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </Card>
  );
}
