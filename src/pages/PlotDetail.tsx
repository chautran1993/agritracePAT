import { householdForPlot } from '../data/owners';
const profileOwner = householdForPlot('T015');
import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FlaskConical,
  Leaf,
  MapPin,
  Pencil,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { useI18n } from '../lib/i18n';
const events = [
  [
    '12/10/2026 · 06:45',
    'Rút nước AWD đợt 1',
    profileOwner.name,
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=160&q=70',
  ],
  [
    '08/10/2026 · 07:20',
    'Phun thuốc sinh học phòng sâu cuốn lá',
    'KTV Trần Minh Tâm',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=160&q=70',
  ],
  [
    '28/09/2026 · 08:10',
    'Bón phân đợt 1',
    profileOwner.name,
    'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=160&q=70',
  ],
  [
    '18/08/2026 · 06:30',
    'Gieo sạ 70 kg/ha',
    'HTX Lúa Xanh Tân Mỹ',
    'https://images.unsplash.com/photo-1536055690188-6d7a3d1f4a56?auto=format&fit=crop&w=160&q=70',
  ],
  [
    '15/08/2026 · 16:00',
    'Xử lý rơm rạ vi sinh',
    'HTX Lúa Xanh Tân Mỹ',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=160&q=70',
  ],
  [
    '12/08/2026 · 08:00',
    'Làm đất',
    profileOwner.name,
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=160&q=70',
  ],
];
const stages = ['Gieo sạ', 'Đẻ nhánh', 'Làm đòng – Trổ', 'Chín – Thu hoạch'];
export default function PlotDetail() {
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const nav = useNavigate();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(
      '10.552418, 105.607832\n10.552905, 105.608214\n10.552661, 105.608825\n10.552186, 105.608433',
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const t = vi
    ? {
        back: 'Quay lại danh mục',
        edit: 'Chỉnh sửa',
        pdf: 'Xuất PDF',
        map: 'Xem trên bản đồ',
        preview: 'Đang hoạt động',
        mapTitle: 'Bản đồ thửa ruộng',
        coords: 'Tọa độ ranh giới',
        ready: 'Sẵn sàng EUDR',
        area: 'Diện tích đo GIS',
        owner: 'Chủ hộ & HTX',
        household: 'Chủ hộ',
        coop: 'Hợp tác xã',
        season: 'Mùa vụ hiện tại',
        variety: 'Giống',
        sowing: 'Ngày sạ',
        nss: 'NSS hiện tại',
        stage: 'Giai đoạn sinh trưởng',
        soil: 'Baseline đất',
        normal: 'Trong ngưỡng bình thường',
        timeline: 'Nhật ký hoạt động',
        verified: 'Đã xác thực GPS',
        copy: 'Sao chép',
        copied: 'Đã sao chép',
      }
    : {
        back: 'Back to catalog',
        edit: 'Edit',
        pdf: 'Export PDF',
        map: 'View on map',
        preview: 'Đang hoạt động',
        mapTitle: 'Plot map',
        coords: 'Boundary coordinates',
        ready: 'EUDR ready',
        area: 'GIS measured area',
        owner: 'Household & cooperative',
        household: 'Household',
        coop: 'Cooperative',
        season: 'Current season',
        variety: 'Variety',
        sowing: 'Sowing date',
        nss: 'Current NSS',
        stage: 'Growth stage',
        soil: 'Soil baseline',
        normal: 'Within normal range',
        timeline: 'Activity timeline',
        verified: 'GPS verified',
        copy: 'Copy',
        copied: 'Copied',
      };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => nav('/plots')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600"
        >
          <ArrowLeft size={15} />
          {t.back}
        </button>
        <Badge tone="amber">{t.preview}</Badge>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-rice-100 px-2 py-1 font-mono text-xs font-bold text-rice-900">
              VN-66-04-12-HTX01-T015
            </span>
            <Badge tone="green">Đã cấp mã</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-rice-950">Ruộng bờ kênh lớn</h1>
          <p className="mt-1 text-sm text-slate-600">VT001 · Xã Tân Mỹ, Đồng Tháp</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">
            <Pencil size={14} />
            {t.edit}
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">
            <Download size={14} />
            {t.pdf}
          </button>
          <button
            onClick={() => nav('/map')}
            className="flex items-center gap-2 rounded-lg bg-rice-900 px-3 py-2 text-xs font-bold text-white"
          >
            <MapPin size={14} />
            {t.map}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <h2 className="font-bold">{t.mapTitle}</h2>
            <div
              className="relative mt-4 h-64 overflow-hidden rounded-xl bg-[#dcebd9]"
              style={{
                backgroundImage:
                  'linear-gradient(30deg,transparent 48%,#abcba8 49%,#abcba8 50%,transparent 51%),linear-gradient(120deg,transparent 48%,#c9dec5 49%,#c9dec5 50%,transparent 51%)',
                backgroundSize: '55px 44px',
              }}
            >
              <svg viewBox="0 0 420 260" className="h-full w-full">
                <path
                  d="M0 220 C80 160 120 245 190 190 S320 170 420 215"
                  fill="none"
                  stroke="#83afd0"
                  strokeWidth="14"
                  strokeOpacity=".5"
                />
                <polygon
                  points="108,48 275,62 325,179 149,199"
                  fill="#4CAF50"
                  fillOpacity=".72"
                  stroke="#1F5130"
                  strokeWidth="4"
                />
                <text x="180" y="130" fontSize="12" fontWeight="700" fill="#12341F">
                  T015 · 0,5 ha
                </text>
              </svg>
              <div className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-xs font-bold text-rice-900">
                VT001 · Đã cấp mã
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-600">{t.area}</div>
                <div className="mt-1 text-2xl font-bold text-rice-900">0,50 ha</div>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-rice-100 px-2 py-1.5 text-xs font-bold text-rice-900">
                <CheckCircle2 size={13} />
                {t.ready}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{t.coords}</h2>
              <button
                onClick={copy}
                className="flex items-center gap-1 text-xs font-bold text-rice-700"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? t.copied : t.copy}
              </button>
            </div>
            <pre className="mt-3 rounded-lg bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-600">
              10.552418, 105.607832{`\n`}10.552905, 105.608214{`\n`}10.552661, 105.608825{`\n`}
              10.552186, 105.608433
            </pre>
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <UserRound size={18} className="text-rice-700" />
              <h2 className="font-bold">{t.owner}</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-600">{t.household}</div>
                <b className="mt-1 block text-sm">{profileOwner.name}</b>
                <span className="text-xs text-slate-600">{profileOwner.id}</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-600">{t.coop}</div>
                <b className="mt-1 block text-sm">HTX Lúa Xanh Tân Mỹ</b>
                <span className="text-xs text-slate-600">HTX01</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-rice-700" />
              <h2 className="font-bold">{t.season}</h2>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <small>{t.variety}</small>
                <b className="block text-sm">OM5451</b>
              </div>
              <div>
                <small>{t.sowing}</small>
                <b className="block text-sm">18/08/2026</b>
              </div>
              <div>
                <small>{t.nss}</small>
                <b className="block text-sm">56 ngày</b>
              </div>
            </div>
            <div className="mt-5 flex justify-between text-xs">
              <b>{t.stage}</b>
              <b className="text-rice-700">{stages[2]}</b>
            </div>
            <div className="mt-2 h-2 rounded bg-slate-100">
              <div className="h-2 w-[58%] rounded bg-rice-500" />
            </div>
            <div className="mt-2 grid grid-cols-4 text-xs text-slate-600">
              {stages.map((s, i) => (
                <span key={s} className={i <= 2 ? 'font-bold text-rice-700' : ''}>
                  {s.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <FlaskConical size={18} className="text-rice-700" />
              <h2 className="font-bold">{t.soil}</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ['pH', '6,2'],
                ['EC', '0,31 dS/m'],
                ['SOM', '2,8 %'],
                ['N-P-K', '0,16–18–145'],
                ['C/N', '12,4'],
                ['Mẫu', '05/08/2026'],
              ].map(([a, b]) => (
                <div key={a} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex justify-between text-xs text-slate-600">
                    {a}
                    <span className="h-2 w-2 rounded-full bg-rice-500" />
                  </div>
                  <b className="mt-1 block text-sm">{b}</b>
                  <span className="text-xs text-rice-700">{t.normal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{t.timeline}</h2>
            <Badge tone="green">6 hoạt động</Badge>
          </div>
          <div className="relative mt-5 pl-6">
            {' '}
            <div className="absolute bottom-3 left-[9px] top-2 w-px bg-slate-200" />
            {events.map((e) => (
              <div key={e[0]} className="relative pb-5 last:pb-0">
                <span className="absolute -left-6 top-0 flex h-[19px] w-[19px] items-center justify-center rounded-full border-4 border-white bg-rice-700 text-white">
                  <Check size={10} />
                </span>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex gap-3">
                    <img src={e[3]} alt="" className="h-14 w-16 shrink-0 rounded-md object-cover" />
                    <div>
                      <div className="text-xs text-slate-600">{e[0]}</div>
                      <b className="mt-1 block text-xs leading-5">{e[1]}</b>
                      <span className="text-xs text-slate-600">{e[2]}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-rice-700">
                    <CheckCircle2 size={12} />
                    {t.verified}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
