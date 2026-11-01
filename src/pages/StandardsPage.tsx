import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, FileText, ChevronRight } from 'lucide-react';
import {
  standards,
  publishStandard,
  standardGroup,
  matchesStandard,
} from '../features/standards/data/standards';
import { markets, sourcedCell, sourcedRows } from '../features/standards/data/marketMatrix';
import { useI18n } from '../lib/i18n';
import { number, year } from '../lib/format';
import TableScroll from '../components/TableScroll';
import Tabs from '../components/Tabs';
export default function StandardsPage() {
  const { lang, t } = useI18n(),
    vi = lang === 'vi',
    [params, setParams] = useSearchParams();
  const tab = ['intl', 'good', 'market'].includes(params.get('tab') ?? '')
    ? params.get('tab')!
    : 'intl';
  const [query, setQuery] = useState('');
  const titles = {
    intl: vi ? 'Tiêu chuẩn quốc tế' : 'International standards',
    good: vi ? 'Thực hành tốt' : 'Good practices',
    market: vi ? 'Ma trận thị trường' : 'Market matrix',
  };
  const list = standards.flatMap((raw) => {
    const s = publishStandard(raw);
    return s && standardGroup(s.id) === tab && matchesStandard(s, query) ? [s] : [];
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-rice-950">{t.standards}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {vi
              ? 'Tra cứu tiêu chuẩn và căn cứ pháp lý có nguồn tham khảo.'
              : 'Browse standards and legal bases with source references.'}
          </p>
        </div>
        {tab !== 'market' && (
          <label className="relative block w-full lg:w-80">
            <span className="sr-only">
              {vi ? 'Tìm theo mã, tên hoặc cơ quan' : 'Search by code, name or issuer'}
            </span>
            <Search className="absolute left-3 top-3 text-slate-600" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={vi ? 'Tìm kiếm tiêu chuẩn…' : 'Search standards…'}
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm"
            />
          </label>
        )}
      </div>
      <Tabs
        id="standards"
        label={t.standards}
        items={Object.entries(titles).map(([id, label]) => ({ id, label }))}
        active={tab}
        onChange={(id) => {
          const next = new URLSearchParams(params);
          next.set('tab', id);
          setParams(next, { replace: true });
        }}
      >
        {tab !== 'market' ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {list.map((s) => (
                <article
                  key={s.id}
                  className="min-w-0 break-words rounded-xl border border-slate-200 bg-white p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rice-100 text-rice-900">
                      <FileText size={19} />
                    </span>
                    {(s.editionLabel !== undefined || s.year !== undefined) && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {s.editionLabel ?? year(s.year!, lang)}
                      </span>
                    )}
                  </div>
                  <p className="mt-4 font-mono text-sm font-semibold text-rice-900">{s.code}</p>
                  <h2 className="mt-2 text-lg font-bold">{vi ? s.nameVi : s.nameEn}</h2>
                  {s.issuer.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                      {s.issuer.map((i) => (
                        <li key={i.role + i.name}>{vi ? i.name : (i.nameEn ?? i.name)}</li>
                      ))}
                    </ul>
                  )}
                  {(vi ? s.scopeVi : s.scopeEn) && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {vi ? s.scopeVi : s.scopeEn}
                    </p>
                  )}
                  {s.id === 'srp' && s.structure && s.requirementCount && (
                    <p className="mt-4 text-sm text-slate-600">
                      {number(s.structure.length, lang, 0)} {vi ? 'chủ đề' : 'themes'} ·{' '}
                      {number(s.requirementCount.value, lang, 0)} {vi ? 'yêu cầu' : 'requirements'}
                    </p>
                  )}
                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <Link
                      to={`/standards/${s.id}`}
                      aria-label={`${vi ? 'Xem chi tiết' : 'View details'}: ${s.code}`}
                      className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-rice-900"
                    >
                      {vi ? 'Xem chi tiết' : 'View details'}
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {list.length === 0 && (
              <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-600">
                {vi ? 'Không có tiêu chuẩn phù hợp.' : 'No matching standards.'}
              </p>
            )}
          </>
        ) : (
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-card">
            <h2 className="p-5 text-lg font-bold">
              {vi ? 'So sánh yêu cầu theo thị trường' : 'Requirements by market'}
            </h2>
            <TableScroll>
              <table className="w-full min-w-[850px] text-left">
                <caption className="sr-only">{titles.market}</caption>
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      {vi ? 'Yêu cầu' : 'Requirement'}
                    </th>
                    {markets.map((m) => (
                      <th key={m} scope="col" className="px-4 py-3">
                        {
                          {
                            CN: vi ? 'Trung Quốc' : 'China',
                            EU: 'EU',
                            US: vi ? 'Mỹ' : 'US',
                            HALAL: 'Halal',
                          }[m]
                        }
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sourcedRows().map((row) => (
                    <tr key={row.id}>
                      <th scope="row" className="px-4 py-4">
                        {vi ? row.labelVi : row.labelEn}
                      </th>
                      {markets.map((m) => {
                        const cell = sourcedCell(row.cells[m]);
                        return (
                          <td key={m} data-market={m} className="px-4 py-4 align-top">
                            {cell && (
                              <div className="space-y-2">
                                <span className="inline-flex whitespace-nowrap rounded-full bg-rice-100 px-2 py-1 font-semibold text-rice-900">
                                  {vi
                                    ? cell.level
                                    : {
                                        'Bắt buộc': 'Mandatory',
                                        'Khuyến nghị': 'Recommended',
                                        'Không yêu cầu': 'Not required',
                                      }[cell.level]}
                                </span>
                                <a
                                  href={cell.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative block text-sm leading-6 text-rice-900 underline underline-offset-2"
                                >
                                  {cell.legalBasis}
                                  <span className="sr-only">
                                    {vi ? ' (mở tab mới)' : ' (opens in a new tab)'}
                                  </span>
                                </a>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <p className="border-t border-slate-200 p-5 text-sm leading-6 text-slate-700">
              {vi
                ? 'Chỉ hiển thị yêu cầu có căn cứ pháp lý đã xác minh. Cần xác nhận lại theo mã HS, nước nhập khẩu và nhà nhập khẩu.'
                : 'Only requirements with verified legal bases are shown. Reconfirm for the HS code, importing country and importer.'}
            </p>
          </section>
        )}
      </Tabs>
    </div>
  );
}
