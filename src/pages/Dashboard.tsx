import SourceDatasetNotice from '../components/SourceDatasetNotice';
import { mapData, varieties, stages, statuses } from '../map/mock/generatePlots';
import { categoryLabel } from '../map/i18n';
import { summarize, issuedLabel } from '../data/agritrace';
import { number, date, todaySaigon } from '../lib/format';
import { lazy, Suspense, useMemo, useState } from 'react';
import { AlertTriangle, Layers3, MapPinned, Sprout, Table2, UsersRound } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { plots, zones } from '../data/mock';
import { useI18n } from '../lib/i18n';
const DashboardMapPreview = lazy(() => import('../map/DashboardMapPreview'));
const statusColors = ['#4CAF50', '#E0A526', '#64748B', '#B45309', '#B91C1C'];
function Kpi({
  icon: Icon,
  label,
  value,
  color,
  onClick,
  ring = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  onClick: () => void;
  ring?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-rice-300"
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          {ring ? (
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#E9EEF0" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#7C5CFC"
                strokeWidth="4"
                strokeDasharray="94.2"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <Icon size={18} />
          )}
        </span>
      </div>
      <div className="mt-4 text-xl font-bold text-slate-800">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-600">{label}</div>
      <div className="mt-2 text-xs text-slate-600">thửa ruộng</div>
    </button>
  );
}
export default function Dashboard() {
  const { lang, t: common } = useI18n();
  const vi = lang === 'vi';
  const nav = useNavigate();
  const [zone, setZone] = useState('all');
  const [variety, setVariety] = useState('all');
  const [season, setSeason] = useState('current');
  const filtered = useMemo(
    () =>
      plots.filter(
        (p) =>
          (zone === 'all' || p.zoneId === zone) && (variety === 'all' || p.variety === variety),
      ),
    [zone, variety],
  );
  const totals = summarize(filtered);
  const digitized = mapData.plots.features.filter(
    (f) => filtered.some((p) => p.pdi === f.properties.pdi) && f.geometry.type === 'Polygon',
  ).length;
  const areaData = varieties.map((v) => ({
    name: v,
    area: filtered.filter((p) => p.variety === v).reduce((sum, p) => sum + p.area, 0),
  }));
  const stageData = stages.map((s) => ({
    name: categoryLabel(s, lang),
    plots: filtered.filter((p) => p.stage === s).length,
  }));
  const warnings = mapData.alerts.map((alert) => ({ id: alert.properties.id }));
  const t = vi
    ? {
        title: 'Tổng quan điều hành',
        sub: `${plots.length} thửa: thuộc vùng Tân Hưng và Tân An, Vĩnh Long. Dữ liệu canh tác được quản lý theo thửa.`,
        area: 'Tổng diện tích ước tính',
        zones: 'Số vùng trồng',
        households: 'Hộ tham gia',
        plots: 'Số thửa ruộng',
        digitized: '% thửa có ranh mô phỏng',
        issued: 'Thửa đã cấp mã số',
        map: 'Bản đồ thửa đất',
        status: 'Trạng thái cấp mã thửa',
        areaChart: 'Diện tích theo giống lúa',
        growth: 'Tiến độ sinh trưởng theo giai đoạn',
        alerts: 'Cảnh báo mới',
        all: 'Tất cả',
        view: 'Xem tất cả',
        high: 'Cao',
        medium: 'Trung bình',
      }
    : {
        title: 'Executive overview',
        sub: `${plots.length} parcels: across Tan Hung and Tan An, Vinh Long. Cultivation records are managed by parcel.`,
        area: 'Total estimated area',
        zones: 'Planting zones',
        households: 'Participating households',
        plots: 'Rice plots',
        digitized: 'Parcels with modeled boundaries',
        issued: 'Coded parcels',
        map: 'Parcel digital map',
        status: 'Parcel code status',
        areaChart: 'Area by rice variety',
        growth: 'Growth progress by stage',
        alerts: 'New alerts',
        all: 'All',
        view: 'View all',
        high: 'High',
        medium: 'Medium',
      };
  return (
    <div className="space-y-5">
      <SourceDatasetNotice />
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="text-xs text-slate-600">{date(todaySaigon(), lang)}</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-rice-950">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.sub}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <select
            aria-label={common.seasonFilter}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          >
            <option value="current">
              {vi ? 'Vụ Đông Xuân 2026–2027' : 'Winter–Spring 2026–2027'}
            </option>
          </select>
          <select
            aria-label={common.zoneFilter}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          >
            <option value="all">
              {t.zones}: {t.all}
            </option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
          <select
            aria-label={common.varietyFilter}
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
          >
            <option value="all">Giống: {t.all}</option>
            {varieties.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi
          icon={Layers3}
          label={`${t.area} (ha)`}
          value={`${number(totals.areaHa, lang, 2)} ha`}
          color="bg-rice-100 text-rice-900"
          onClick={() => nav('/plots?filter=area')}
        />
        <Kpi
          icon={MapPinned}
          label={t.zones}
          value={number(totals.zones, lang, 0)}
          color="bg-emerald-50 text-emerald-700"
          onClick={() => nav('/zones')}
        />
        <Kpi
          icon={UsersRound}
          label={t.households}
          value={number(totals.households, lang, 0)}
          color="bg-blue-50 text-blue-800"
          onClick={() => nav('/plots?filter=households')}
        />
        <Kpi
          icon={Table2}
          label={t.plots}
          value={number(totals.plots, lang, 0)}
          color="bg-amber-50 text-amber-800"
          onClick={() => nav('/plots')}
        />
        <Kpi
          icon={Sprout}
          label={t.digitized}
          value={`${number(filtered.length ? (digitized / filtered.length) * 100 : 0, lang, 0)}%`}
          color="bg-violet-50 text-violet-700"
          onClick={() => nav('/plots?filter=digitized')}
          ring
        />
        <Kpi
          icon={MapPinned}
          label={t.issued}
          value={issuedLabel(totals.issued, totals.plots, lang)}
          color="bg-rice-100 text-rice-900"
          onClick={() => nav('/zones?status=issued')}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-slate-800">{t.map}</h2>
              <p className="mt-1 text-xs text-slate-600">
                {vi
                  ? 'Ảnh vệ tinh · Ranh giới ước tính từ thửa ruộng'
                  : 'Satellite imagery · Parcel boundaries'}
              </p>
            </div>
            <button onClick={() => nav('/map')} className="text-xs font-bold text-rice-700">
              {vi ? 'Mở bản đồ' : 'Open map'} →
            </button>
          </div>
          <Suspense fallback={<div className="mt-4 h-64 animate-pulse rounded-xl bg-rice-100" />}>
            <DashboardMapPreview zone={zone} variety={variety} />
          </Suspense>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-bold text-slate-800">{t.status}</h2>
          <div className="relative mx-auto mt-5 h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totals.statusCounts}
                  innerRadius={58}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {statusColors.map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => number(Number(v), lang, 2)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <b className="text-3xl text-rice-900">{number(totals.plots, lang, 0)}</b>
              <span className="text-xs text-slate-600">{t.plots}</span>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {statuses.map((s, i) => (
              <button
                onClick={() => nav(`/zones?status=${encodeURIComponent(s)}`)}
                key={s}
                className="flex w-full items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: statusColors[i] }}
                  />
                  {categoryLabel(s, lang)}
                </span>
                <b>
                  {number(totals.statusCounts[i].value, lang, 0)} {vi ? 'thửa' : 'parcels'}
                </b>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        <ChartCard
          title={t.areaChart}
          data={areaData}
          dataKey="area"
          color="#4CAF50"
          onClick={(s: string) => nav(`/plots?variety=${encodeURIComponent(s)}`)}
        />
        <ChartCard
          title={t.growth}
          data={stageData}
          dataKey="plots"
          color="#2B7BB9"
          onClick={(s: string) => nav(`/plots?stage=${encodeURIComponent(s)}`)}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">{t.alerts}</h2>
            <Badge tone="red">{number(warnings.length, lang, 0)}</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {warnings.map(({ id }) => (
              <button
                key={id}
                onClick={() => nav('/map')}
                className="flex w-full items-center gap-3 border-b border-slate-100 pb-3 text-left text-sm"
              >
                <AlertTriangle size={16} className="text-amber-800" />
                <span>
                  {vi ? 'Cảnh báo bản đồ' : 'Map alert'} · {id}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => nav('/audit')}
            className="mt-2 w-full border-t border-slate-100 pt-3 text-xs font-bold text-rice-700"
          >
            {t.view} →
          </button>
        </div>
      </div>
    </div>
  );
}
function ChartCard({
  title,
  data,
  dataKey,
  color,
  onClick,
}: {
  title: string;
  data: any[];
  dataKey: string;
  color: string;
  onClick: (x: string) => void;
}) {
  const { lang } = useI18n();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="font-bold text-slate-800">{title}</h2>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} onClick={(s: any) => s?.activeLabel && onClick(s.activeLabel)}>
            <CartesianGrid vertical={false} stroke="#edf1ed" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => number(Number(v), lang, 2)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={(v) => number(Number(v), lang, 2)} />
            <Bar dataKey={dataKey} fill={color} radius={[5, 5, 0, 0]} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
