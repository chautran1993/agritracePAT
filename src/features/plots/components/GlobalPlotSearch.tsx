import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plots } from '../../../data/mock';
import { useI18n } from '../../../lib/i18n';
export default function GlobalPlotSearch() {
  const { lang, t } = useI18n(),
    [query, setQuery] = useState(''),
    [open, setOpen] = useState(false),
    nav = useNavigate();
  const results = query.trim()
    ? plots
        .filter((p) =>
          `${p.pdi} ${p.id} ${p.owner}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        )
        .slice(0, 7)
    : [];
  const go = (pdi: string) => {
    setOpen(false);
    setQuery('');
    nav(`/plots/${encodeURIComponent(pdi)}`);
  };
  return (
    <div className="relative">
      <input
        aria-label={t.search}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && results[0]) go(results[0].pdi);
        }}
        placeholder={t.search}
        className="w-full lg:w-52 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none"
      />
      {open && query.trim() && (
        <div className="absolute right-0 top-11 z-50 w-full lg:w-80 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {results.length ? (
            results.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(p.pdi)}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-rice-100"
              >
                <b className="block text-xs text-rice-900">
                  {p.id} · {p.owner}
                </b>
                <small className="font-mono text-xs text-slate-600">{p.pdi}</small>
              </button>
            ))
          ) : (
            <p className="p-3 text-xs text-slate-600">
              {lang === 'vi' ? 'Không tìm thấy thửa ruộng' : 'Plot not found'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
