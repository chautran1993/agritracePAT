import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { standards, publishStandard, verifiedField } from './data/standards';
import { useI18n } from '../../lib/i18n';
import { date, year } from '../../lib/format';
export function SourceLink({ url, lang }: { url: string; lang: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-6 items-center gap-1 text-sm font-semibold text-rice-900 underline underline-offset-2"
    >
      {lang === 'vi' ? 'Nguồn' : 'Source'}
      <ExternalLink aria-label={lang === 'vi' ? 'mở tab mới' : 'opens in a new tab'} size={13} />
    </a>
  );
}
const roleEn = {
  'ban hành': 'Issued by',
  'công bố': 'Published by',
  'đề nghị': 'Proposed by',
  'biên soạn': 'Compiled by',
  'thẩm định': 'Appraised by',
};
export default function StandardDetailPage() {
  const { id } = useParams(),
    { lang, t } = useI18n(),
    vi = lang === 'vi';
  const raw = standards.find((s) => s.id === id),
    s = raw ? publishStandard(raw) : undefined;
  const back = (
    <Link
      to="/standards"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-rice-900"
    >
      <ArrowLeft size={16} />
      {vi ? 'Quay lại thư viện tiêu chuẩn' : 'Back to standards library'}
    </Link>
  );
  if (!s)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-rice-950">
          {vi ? 'Không tìm thấy tiêu chuẩn' : 'Standard not found'}
        </h1>
        {back}
      </div>
    );
  const scope = vi ? s.scopeVi : s.scopeEn,
    related = vi ? s.relevanceToPlatform : s.relevanceToPlatformEn;
  return (
    <div className="mx-auto max-w-5xl space-y-5 break-words">
      <nav
        aria-label={t.breadcrumb}
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-600"
      >
        <Link to="/standards" className="text-rice-900 underline">
          {t.standards}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{s.code}</span>
      </nav>
      {back}
      <div>
        <p className="font-mono text-sm font-semibold text-rice-900">{s.code}</p>
        <h1 className="mt-2 text-2xl font-bold text-rice-950">{vi ? s.nameVi : s.nameEn}</h1>
      </div>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-lg font-bold">{vi ? 'Thông tin chung' : 'General information'}</h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          <dt className="font-semibold">{vi ? 'Mã tiêu chuẩn' : 'Standard code'}</dt>
          <dd>{s.code}</dd>
          <dt className="font-semibold">{vi ? 'Tên tiếng Việt' : 'Vietnamese name'}</dt>
          <dd lang="vi">{s.nameVi}</dd>
          <dt className="font-semibold">{vi ? 'Tên tiếng Anh' : 'English name'}</dt>
          <dd lang="en">{s.nameEn}</dd>
          {s.issuer.map((item) => (
            <div key={item.role + item.name} className="contents">
              <dt className="font-semibold">
                {vi ? item.role[0].toUpperCase() + item.role.slice(1) : roleEn[item.role]}
              </dt>
              <dd className="space-x-2">
                <span>{vi ? item.name : (item.nameEn ?? item.name)}</span>
                <SourceLink url={item.sourceUrl} lang={lang} />
              </dd>
            </div>
          ))}
          {s.editionLabel !== undefined && (
            <>
              <dt className="font-semibold">{vi ? 'Phiên bản' : 'Edition'}</dt>
              <dd>{s.editionLabel}</dd>
            </>
          )}
          {s.year !== undefined && (
            <>
              <dt className="font-semibold">{vi ? 'Năm ban hành' : 'Publication year'}</dt>
              <dd>
                <time dateTime={String(s.year)}>{year(s.year, lang)}</time>
              </dd>
            </>
          )}
          {scope && (
            <>
              <dt className="font-semibold">{vi ? 'Phạm vi' : 'Scope'}</dt>
              <dd>{scope}</dd>
            </>
          )}
          {s.status && (
            <>
              <dt className="font-semibold">{vi ? 'Trạng thái' : 'Status'}</dt>
              <dd>
                <span className="inline-flex whitespace-nowrap rounded-full bg-rice-100 px-3 py-1 font-semibold text-rice-900">
                  {vi ? s.status.label : (s.status.labelEn ?? s.status.label)}
                </span>
                {(vi ? s.status.note : s.status.noteEn) && (
                  <p className="mt-2 leading-6 text-slate-700">
                    {vi ? s.status.note : s.status.noteEn}
                  </p>
                )}
                <SourceLink url={s.status.sourceUrl} lang={lang} />
              </dd>
            </>
          )}
        </dl>
      </section>
      {!!s.structure?.length && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">{vi ? 'Cấu trúc' : 'Structure'}</h2>
          <div className="divide-y divide-slate-200">
            {s.structure.map((section) => (
              <details key={section.title} className="py-2">
                <summary className="cursor-pointer rounded px-2 py-3 text-sm font-semibold">
                  {vi ? section.title : (section.titleEn ?? section.title)}
                </summary>
                <div className="space-y-3 px-3 py-3 text-sm">
                  {!!(vi ? section.items : section.itemsEn)?.length && (
                    <ul className="list-disc space-y-2 pl-5">
                      {(vi ? section.items : section.itemsEn)!.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <SourceLink url={section.sourceUrl} lang={lang} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
      {!!s.keyFacts?.length && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">{vi ? 'Điểm chính' : 'Key facts'}</h2>
          <dl className="divide-y divide-slate-200">
            {s.keyFacts.map((fact) => (
              <div key={fact.label} className="space-y-2 py-4 first:pt-0">
                <dt className="font-semibold">{vi ? fact.label : (fact.labelEn ?? fact.label)}</dt>
                <dd className="space-y-2 text-sm">
                  <p className="leading-6 text-slate-700">
                    {vi ? fact.value : (fact.valueEn ?? fact.value)}
                  </p>
                  <SourceLink url={fact.sourceUrl} lang={lang} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!!related?.length && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">
            {vi ? 'Liên quan tới dữ liệu hệ thống' : 'Relevance to platform data'}
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            {vi
              ? 'Ánh xạ dữ liệu trong AgriTrace theo nguyên tắc truy xuất:'
              : 'AgriTrace data mapping based on traceability principles:'}
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {related.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-3">
            <SourceLink
              url={s.fieldSources[vi ? 'relevanceToPlatform' : 'relevanceToPlatformEn']}
              lang={lang}
            />
          </div>
        </section>
      )}
      {s.sources.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-bold">{vi ? 'Nguồn tham khảo' : 'References'}</h2>
          <ul className="space-y-4 text-sm">
            {s.sources.map((source) => (
              <li key={source.url}>
                <a
                  className="inline-flex items-start gap-2 font-semibold text-rice-900 underline underline-offset-2"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title}
                  <ExternalLink size={15} className="mt-1 shrink-0" />
                  <span className="sr-only">{vi ? '(mở tab mới)' : '(opens in a new tab)'}</span>
                </a>
                <p className="mt-1 text-slate-600">
                  {vi ? 'Ngày truy cập' : 'Accessed'}:{' '}
                  <time dateTime={source.accessedAt}>{date(source.accessedAt, lang)}</time>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {verifiedField(s, 'verifiedAt') && (
        <p className="text-sm text-slate-600">
          {vi ? 'Dữ liệu xác minh ngày' : 'Data verified on'}{' '}
          <time dateTime={s.verifiedAt}>{date(s.verifiedAt, lang)}</time>
        </p>
      )}
    </div>
  );
}
