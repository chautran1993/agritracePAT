import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  MapPin,
  Sprout,
  Leaf,
  Wheat,
  Wind,
  PackageCheck,
  Truck,
  QrCode,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { number, date } from '../lib/format';
import { traceBatch, traceTitles as titles } from '../data/traceability';
import { Badge } from '../components/Badge';
const icons = [MapPin, Sprout, Leaf, Wheat, Wind, PackageCheck, Truck];
export default function TraceabilityPage() {
  const { lang } = useI18n();
  if (!traceBatch())
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">
          {lang === 'vi' ? 'Hành trình truy xuất' : 'Traceability journey'}
        </h1>
        <p>
          {lang === 'vi'
            ? 'File thửa mẫu chưa có mùa vụ, nhật ký hoặc lô hàng. Chưa có dữ liệu truy xuất.'
            : 'The sample parcel has no season, farm log or batch records. Traceability is not yet available.'}
        </p>
      </div>
    );
  return <TraceabilityContent />;
}
function TraceabilityContent() {
  const { lang, setLang } = useI18n(),
    vi = lang === 'vi';
  const batch = traceBatch()!;
  const { plot, season, steps } = batch;
  const [active, setActive] = useState(3),
    [publicView, setPublicView] = useState(false),
    [qr, setQr] = useState('');
  const url = `${window.location.origin}/trace/plots/${encodeURIComponent(plot.pdi)}/${encodeURIComponent(batch.code)}`;
  useEffect(() => {
    let alive = true;
    void QRCode.toDataURL(url, { width: 180, margin: 2 })
      .then((data) => {
        if (alive) setQr(data);
      })
      .catch(() => {
        if (alive) setQr('');
      });
    return () => {
      alive = false;
    };
  }, [url]);
  const status = (completed: boolean) =>
    completed ? (vi ? 'Đã hoàn thành' : 'Completed') : vi ? 'Dự kiến' : 'Planned';
  const detail = (i: number) =>
    [
      `${plot.zoneName[lang]} · ${number(plot.areaGisHa, lang, 2)} ha`,
      `${season.variety} · ${number(season.seedRateKgHa, lang, 0)} kg/ha`,
      `${number(batch.verifiedLogs, lang, 0)} ${vi ? 'nhật ký GPS xác thực' : 'GPS verified logs'}`,
      `${number(batch.yieldT, lang, 2)} ${vi ? 'tấn' : 't'} · ${season.harvest ? (vi ? 'Thực thu' : 'Actual yield') : vi ? 'Sản lượng dự kiến' : 'Expected yield'}`,
      batch.mill,
      `${number(batch.qrIssued, lang, 0)}/${number(batch.qrQuota, lang, 0)} QR`,
      `${batch.code} · ${batch.destination}`,
    ][i];
  const location = (i: number) =>
    i < 4 ? plot.name[lang] : i < 6 ? batch.mill : batch.destination;
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge tone="green">{vi ? 'Đang hoạt động' : 'Active'}</Badge>
          <h1 className="mt-3 text-2xl font-bold text-rice-950">
            {vi ? 'Hành trình truy xuất' : 'Traceability journey'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {plot.name[lang]} · {season.variety} · {plot.pdi}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              onClick={() => setPublicView(value)}
              className={`rounded-md px-3 py-2 text-xs font-bold ${publicView === value ? 'bg-rice-900 text-white' : 'text-slate-600'}`}
            >
              {value
                ? vi
                  ? 'Trang công khai'
                  : 'Public page'
                : vi
                  ? 'Quản trị lô hàng'
                  : 'Batch management'}
            </button>
          ))}
        </div>
      </div>
      {publicView ? (
        <div className="mx-auto w-full max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <button
            data-testid="language-toggle"
            onClick={() => setLang(vi ? 'en' : 'vi')}
            className="rounded bg-rice-900 px-3 py-2 text-white"
          >
            {lang.toUpperCase()}
          </button>
          <h2 className="text-xl font-bold">
            {season.variety} · {batch.code}
          </h2>
          <p>{plot.name[lang]}</p>
          <p>
            {plot.owner.name} · {plot.cooperative.name}
          </p>
          {steps.map((step, i) => (
            <div key={step.kind} className="border-t border-slate-200 py-3">
              <b>{titles[lang][i]}</b>
              <p>
                {date(step.date, lang)} · {status(step.completed)}
              </p>
              <p>{detail(i)}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="font-mono text-xl font-bold text-rice-900">{batch.code}</h2>
              <div className="mt-7 overflow-x-auto pb-3">
                <div className="flex min-w-[980px]">
                  {steps.map((step, i) => {
                    const Icon = icons[i];
                    return (
                      <button
                        key={step.kind}
                        onClick={() => setActive(i)}
                        aria-pressed={active === i}
                        className="relative flex w-[140px] shrink-0 flex-col items-center text-center"
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${step.completed ? 'bg-rice-700 text-white' : 'bg-slate-100 text-slate-700'} ${active === i ? 'ring-2 ring-rice-900 ring-offset-2' : ''}`}
                        >
                          {step.completed ? <Check size={17} /> : <Icon size={17} />}
                        </span>
                        <b className="mt-3 text-xs">{titles[lang][i]}</b>
                        <span className="mt-1 text-xs text-slate-600">{date(step.date, lang)}</span>
                        <span className="mt-1 text-xs font-bold text-slate-700">
                          {status(step.completed)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-rice-50 p-4 text-sm">
                <h3 className="font-bold">
                  {titles[lang][active]} · {status(steps[active].completed)}
                </h3>
                <p className="mt-2">{location(active)}</p>
                <p>{active === 1 ? plot.owner.name : plot.cooperative.name}</p>
                <p>{detail(active)}</p>
              </div>
            </section>
            <aside className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-card">
              <h2 className="flex items-center gap-2 font-bold">
                <QrCode size={18} />
                {vi ? 'Mã QR truy xuất' : 'Traceability QR'}
              </h2>
              {qr ? (
                <img src={qr} alt={`QR ${batch.code}`} className="mx-auto mt-5 h-40 w-40" />
              ) : (
                <div role="status" className="mx-auto mt-5 h-40 w-40">
                  {vi ? 'Đang tạo QR…' : 'Generating QR…'}
                </div>
              )}
              <p className="mt-5 text-sm text-slate-600">
                {vi ? 'Số QR đã phát hành / dự kiến' : 'QR codes issued / planned'}
              </p>
              <b>
                {number(batch.qrIssued, lang, 0)} / {number(batch.qrQuota, lang, 0)}
              </b>
              <a href={url} className="mt-4 block text-sm font-bold text-rice-700">
                {vi ? 'Xem trang công khai' : 'View public page'}
              </a>
            </aside>
          </div>
          <section className="rounded-xl border border-slate-200 bg-white shadow-card">
            <h2 className="border-b border-slate-100 p-5 font-bold">
              {vi ? 'Hành trình lô hàng' : 'Batch journey'}
            </h2>
            {steps.map((step, i) => (
              <button
                key={step.kind}
                onClick={() => setActive(i)}
                className="grid w-full gap-3 border-b border-slate-100 p-4 text-left text-sm sm:grid-cols-2 xl:grid-cols-4"
              >
                <span>
                  <b>{titles[lang][i]}</b>
                  <span className="block">{date(step.date, lang)}</span>
                </span>
                <span>{location(i)}</span>
                <span>{detail(i)}</span>
                <span className="font-bold text-slate-700">{status(step.completed)}</span>
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
