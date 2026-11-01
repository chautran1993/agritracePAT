import { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Droplets,
  FlaskConical,
  Recycle,
  Sprout,
  Tractor,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { useI18n } from '../lib/i18n';
const stages = [
  ['Gieo sạ', 'Sowing', '0–20 NSS'],
  ['Đẻ nhánh', 'Tillering', '20–40 NSS'],
  ['Làm đòng – Trổ', 'Booting – flowering', '40–70 NSS'],
  ['Chín – Thu hoạch', 'Ripening – harvest', '70+ NSS'],
];
const packages = [
  {
    icon: Droplets,
    vi: 'Quản lý nước',
    en: 'Water management',
    descVi: 'Áp dụng tưới khô – ướt xen kẽ (AWD) để tiết kiệm nước và giảm phát thải.',
    descEn: 'Apply alternate wetting and drying (AWD) to save water and reduce emissions.',
    itemsVi: [
      'Rút nước lần 1: 12–22 NSS',
      'Rút nước lần 2: 28–40 NSS',
      'Mực nước ngập tối đa: 5 cm',
      'Rút cạn trước thu hoạch: 7–15 ngày',
    ],
    itemsEn: [
      'Drain 1: 12–22 days after sowing',
      'Drain 2: 28–40 days after sowing',
      'Maximum flood depth: 5 cm',
      'Final drainage: 7–15 days before harvest',
    ],
  },
  {
    icon: FlaskConical,
    vi: 'Bón phân',
    en: 'Fertilization',
    descVi: 'Bón cân đối theo nhu cầu cây và theo dõi màu lá trước mỗi lần thúc.',
    descEn: 'Balance nutrients to crop needs and check leaf color before each application.',
    itemsVi: [
      'Thúc 1: 7–10 NSS',
      'Thúc 2: 18–22 NSS',
      'Đón đòng: 38–42 NSS',
      'Đạm tổng: theo khuyến cáo đất và giống',
    ],
    itemsEn: [
      'Top dressing 1: 7–10 days',
      'Top dressing 2: 18–22 days',
      'Panicle initiation: 38–42 days',
      'Total nitrogen: based on soil guidance',
    ],
  },
  {
    icon: Sprout,
    vi: 'IPM – dịch hại thường gặp',
    en: 'IPM – common pests',
    descVi: 'Ưu tiên thăm đồng, ngưỡng hành động và biện pháp sinh học trước khi dùng thuốc.',
    descEn: 'Prioritize scouting, action thresholds, and biological controls before pesticides.',
    itemsVi: [
      'Thăm đồng: tối thiểu 2 lần/tuần',
      'Sâu cuốn lá: xử lý khi vượt ngưỡng',
      'Rầy nâu: bảo vệ thiên địch',
      'Thuốc BVTV: đúng 4 đúng',
    ],
    itemsEn: [
      'Field scouting: at least twice weekly',
      'Leaf folder: act above threshold',
      'Brown planthopper: protect beneficials',
      'Pesticides: follow the four rights',
    ],
  },
  {
    icon: Recycle,
    vi: 'Xử lý rơm rạ',
    en: 'Straw management',
    descVi: 'Không đốt rơm rạ; ưu tiên phân hủy tại ruộng và hoàn trả hữu cơ cho đất.',
    descEn: 'Do not burn straw; decompose in-field and return organic matter to the soil.',
    itemsVi: [
      'Không đốt rơm rạ',
      'Phun chế phẩm vi sinh sau thu hoạch',
      'Vùi rơm tối thiểu 10–15 ngày',
      'Giống: ≤70 kg/ha',
    ],
    itemsEn: [
      'No straw burning',
      'Apply microbial product after harvest',
      'Incorporate straw for 10–15 days',
      'Seed rate: ≤70 kg/ha',
    ],
  },
];
export default function FarmingPage() {
  const { lang } = useI18n();
  const vi = lang === 'vi';
  const [stage, setStage] = useState(0);
  const [variety, setVariety] = useState('OM5451');
  const l = vi
    ? {
        title: 'Quy trình canh tác lúa',
        sub: 'Bộ hướng dẫn kỹ thuật theo giống lúa và quy trình phát thải thấp.',
        preview: 'Đang hoạt động',
        variety: 'Giống lúa',
        process: 'Quy trình',
        current: 'Đang xem',
        packages: 'Gói kỹ thuật áp dụng',
        inputs: 'Định mức & đầu vào',
        note: 'NSS = ngày sau sạ. Định mức cần được điều chỉnh theo phân tích đất, điều kiện ruộng và hướng dẫn địa phương.',
      }
    : {
        title: 'Rice farming process',
        sub: 'Technical guidance by rice variety and low-emission production process.',
        preview: 'Đang hoạt động',
        variety: 'Rice variety',
        process: 'Process',
        current: 'Viewing',
        packages: 'Applicable technical packages',
        inputs: 'Inputs & rates',
        note: 'NSS = days after sowing. Rates should be adjusted to soil analysis, field conditions, and local guidance.',
      };
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="amber">{l.preview}</Badge>
          <h1 className="mt-3 text-2xl font-bold text-rice-950">{l.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{l.sub}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <span className="mr-2 text-slate-600">{l.variety}</span>
            <select
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              className="font-bold text-rice-900"
            >
              <option value="OM5451">OM5451 · 95 ngày</option>
              <option value="ST25">ST25 · 105 ngày</option>
            </select>
          </label>
          <label className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <span className="mr-2 text-slate-600">{l.process}</span>
            <select className="font-bold text-rice-900">
              <option>Lúa CLC phát thải thấp – QĐ 1490</option>
            </select>
          </label>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="font-bold">{vi ? 'Tiến độ sinh trưởng' : 'Growth timeline'}</h2>
        <p className="mt-1 text-xs text-slate-600">
          {vi
            ? 'Bấm vào giai đoạn để xem gói kỹ thuật'
            : 'Click a stage to view technical packages'}
        </p>
        <div className="relative mt-7 grid grid-cols-4 gap-2">
          <div className="absolute left-[8%] right-[8%] top-5 h-1 rounded bg-slate-100" />
          <div
            className="absolute left-[8%] top-5 h-1 rounded bg-rice-500 transition-all"
            style={{ width: `${stage * 29}%` }}
          />
          {stages.map((s, i) => (
            <button
              key={s[0]}
              onClick={() => setStage(i)}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-xs font-bold shadow ${i === stage ? 'bg-rice-900 text-white' : i < stage ? 'bg-rice-700 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {i < stage ? <CheckCircle2 size={17} /> : i + 1}
              </span>
              <span
                className={`mt-3 text-xs font-bold ${i === stage ? 'text-rice-900' : 'text-slate-600'}`}
              >
                {vi ? s[0] : s[1]}
              </span>
              <span className="mt-1 text-xs text-slate-600">{s[2]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-full bg-rice-100 px-2.5 py-1 text-xs font-bold text-rice-900">
          {l.current}
        </span>
        <ChevronRight size={15} className="text-slate-600" />
        <b>{vi ? stages[stage][0] : stages[stage][1]}</b>
        <span className="text-xs text-slate-600">· {stages[stage][2]}</span>
      </div>
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold">{l.packages}</h2>
            <p className="mt-1 text-xs text-slate-600">
              {l.variety}: <b className="text-slate-600">{variety}</b> · {stages[stage][2]}
            </p>
          </div>
          <span className="text-xs text-slate-600">4 {vi ? 'gói' : 'packages'}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {packages.map((p) => {
            const I = p.icon;
            return (
              <article
                key={p.vi}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rice-100 text-rice-900">
                    <I size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{vi ? p.vi : p.en}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {vi ? p.descVi : p.descEn}
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <Tractor size={13} />
                    {l.inputs}
                  </div>
                  <ul className="space-y-2">
                    {(vi ? p.itemsVi : p.itemsEn).map((x) => (
                      <li key={x} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rice-500" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
        ⓘ {l.note}
      </div>
    </div>
  );
}
