import TableScroll from '../../../components/TableScroll';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Plot } from '../types';
import { usePlotText } from '../i18n';
import { number, date, text } from '../utils/format';
import { Card, Empty } from './shared';
import { Link } from 'react-router-dom';
export default function HarvestTab({ plot }: { plot: Plot }) {
  const { t, lang } = usePlotText(),
    [qr, setQr] = useState(''),
    past = plot.seasons.filter((s) => s.harvest),
    last = past[0]?.harvest;
  const url = last
    ? `${window.location.origin}/trace/plots/${encodeURIComponent(plot.pdi)}/${encodeURIComponent(last.batchCode)}`
    : '';
  useEffect(() => {
    let active = true;
    if (url)
      QRCode.toDataURL(url, { width: 180, margin: 1 }).then((data) => {
        if (active) setQr(data);
      });
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <>
      <Card title={t('harvest')}>
        <Empty>
          {t('notHarvested')} · {date(plot.currentSeason.expectedHarvestDate, lang)} ·{' '}
          {number(plot.currentSeason.expectedYieldT, lang, 2)} t
        </Empty>
      </Card>
      {plot.currentSeason.traceBatch && (
        <Card title={lang === 'vi' ? 'Lô hàng dự kiến' : 'Planned batch'}>
          <Link to={`/trace/plots/${plot.pdi}/${plot.currentSeason.traceBatch.code}`}>
            {plot.currentSeason.traceBatch.code}
          </Link>
          <p>
            {text(plot.name, lang)} · {date(plot.currentSeason.sowingDate, lang)}
          </p>
        </Card>
      )}
      <Card title={t('previous')}>
        <div className="pp-table-scroll">
          <TableScroll>
            <table>
              <thead>
                <tr>
                  {['season', 'yieldActual', 'maturity', 'moisture', 'dryer', 'mill', 'batch'].map(
                    (k) => (
                      <th key={k}>{t(k as 'season')}</th>
                    ),
                  )}
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {past.map((s) => (
                  <tr key={s.id}>
                    <td>{text(s.name, lang)}</td>
                    <td>{number(s.harvest!.yieldT / plot.areaGisHa, lang, 2)} t/ha</td>
                    <td>{number(s.harvest!.maturityPct, lang)}%</td>
                    <td>{number(s.harvest!.moisturePct, lang)}%</td>
                    <td>{number(s.harvest!.timeToDryerH, lang)} h / ≤24 h</td>
                    <td>{s.harvest!.mill}</td>
                    <td>{s.harvest!.batchCode}</td>
                    <td>
                      {number(s.harvest!.qrIssued, lang, 0)}/{number(s.harvest!.qrQuota, lang, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </div>
      </Card>
      {last && (
        <Card id="batch" title={last.batchCode}>
          <div className="pp-batch">
            <div>
              {qr && <img src={qr} alt="QR" />}
              <small>
                {number(last.qrIssued, lang, 0)}/{number(last.qrQuota, lang, 0)} QR
              </small>
            </div>
            <div>
              <div className="pp-journey">
                {(['field', 'harvestStep', 'transport', 'drying', 'milling', 'pack'] as const).map(
                  (step, i) => (
                    <div key={step}>
                      <b>{i + 1}</b>
                      <span>{t(step)}</span>
                    </div>
                  ),
                )}
              </div>
              <Link
                className="pp-primary"
                to={`/trace/plots/${encodeURIComponent(plot.pdi)}/${encodeURIComponent(last.batchCode)}`}
              >
                {t('publicTrace')} →
              </Link>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
