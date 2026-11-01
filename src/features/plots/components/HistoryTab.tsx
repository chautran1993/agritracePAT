import TableScroll from '../../../components/TableScroll';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { Plot, Doc } from '../types';
import { usePlotText } from '../i18n';
import { date, number, text } from '../utils/format';
import { Card, Chip } from './shared';
import PlotMiniMap from './PlotMiniMap';
export default function HistoryTab({ plot }: { plot: Plot }) {
  const { t, lang } = usePlotText(),
    [version, setVersion] = useState(2),
    [doc, setDoc] = useState<Doc | null>(null);
  return (
    <>
      <Card title={lang === 'vi' ? 'Mã nội bộ' : 'Internal ID'}>
        <p>{plot.pdi}</p>
      </Card>
      <div className="pp-two-col">
        <Card title={t('versions')}>
          <div className="pp-versions">
            {plot.versions.map((v, i) => (
              <button
                key={v.at}
                className={version === i ? 'selected' : ''}
                onClick={() => setVersion(i)}
              >
                <small>
                  {date(v.at, lang)} · {v.season}
                </small>
                <h3>
                  {i === 2 ? t('current') : t(v.change === 'Tạo mới' ? 'created' : 'boundaryEdit')}
                </h3>
                <p>
                  {number(v.areaHa, lang, 2)} ha · {v.by}
                </p>
              </button>
            ))}
          </div>
        </Card>
        <Card
          title={`${t('versions')} · ${number(plot.versions[version].areaHa - plot.areaGisHa, lang, 3)} ha`}
        >
          <PlotMiniMap
            key={version}
            plot={plot}
            oldGeometry={version === 2 ? undefined : plot.versions[version].geometry}
          />
          <div className="pp-chips pp-space">
            <Chip>{t('current')}</Chip>
            <Chip tone="gold">{t('old')}</Chip>
          </div>
        </Card>
      </div>
      <Card title={t('documents')}>
        <div className="pp-docs">
          {plot.documents.map((d) => (
            <div key={d.id} id={`document-${d.id}`}>
              <FileText size={24} />
              <span>
                <b>{text(d.title, lang)}</b>
                <small>
                  {date(d.date, lang)} · {d.size}
                </small>
              </span>
              <button onClick={() => setDoc(d)}>{t('previewDoc')} ↗</button>
            </div>
          ))}
        </div>
      </Card>
      <Card title={t('audit')}>
        <TableScroll>
          <table>
            <thead>
              <tr>
                {['date', 'by', 'change', 'area'].map((k) => (
                  <th key={k}>{t(k as 'date')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plot.versions.map((v, i) => (
                <tr key={v.at}>
                  <td>{date(v.at, lang)}</td>
                  <td>{v.by}</td>
                  <td>
                    {i === 2
                      ? t('current')
                      : t(v.change === 'Tạo mới' ? 'created' : 'boundaryEdit')}
                  </td>
                  <td>{number(v.areaHa, lang, 2)} ha</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </Card>
      {doc && (
        <div role="presentation" className="pp-modal" onClick={() => setDoc(null)}>
          <Card>
            <button onClick={() => setDoc(null)}>{t('close')} ×</button>
            <h3>{text(doc.title, lang)}</h3>
            <p>{text(doc.body, lang)}</p>
            <code>{plot.pdi}</code>
            <small>{date(doc.date, lang)}</small>
          </Card>
        </div>
      )}
    </>
  );
}
