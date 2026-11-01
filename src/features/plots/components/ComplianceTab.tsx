import { useState } from 'react';
import type { Plot, Market } from '../types';
import { usePlotText } from '../i18n';
import { complianceScore, overallScore } from '../utils/compliance';
import { Card, Ring } from './shared';
import ComplianceChecklist from './ComplianceChecklist';
export default function ComplianceTab({
  plot,
  jump,
}: {
  plot: Plot;
  jump: (tab: string, evidence?: string) => void;
}) {
  const { t, lang } = usePlotText(),
    [market, setMarket] = useState<Market>(
      plot.officialZoneCode?.code.endsWith('-CHN') ? 'CN' : 'US',
    );
  const names = {
    CN: lang === 'vi' ? 'Trung Quốc · GACC' : 'China · GACC',
    EU: 'EU · EUDR',
    US: lang === 'vi' ? 'Mỹ · FSMA/FDA' : 'US · FSMA/FDA',
    HALAL: 'Halal',
  };
  return (
    <>
      <Card title={t('compliance')}>
        <div className="pp-market-rings">
          {(['CN', 'EU', 'US', 'HALAL'] as Market[]).map((m) => (
            <button key={m} className={market === m ? 'selected' : ''} onClick={() => setMarket(m)}>
              <Ring score={complianceScore(plot, m)} label={names[m]} />
            </button>
          ))}
          <Ring score={overallScore(plot)} label={t('complianceOverall')} />
        </div>
        <p className="pp-disclaimer">{t('policyNote')}</p>
      </Card>
      <Card title={names[market]}>
        {market === 'US' && (
          <ul className="mb-4 space-y-2 text-sm">
            <li>Đăng ký cơ sở FDA (Food Facility Registration) · gia hạn 2 năm/lần</li>
            <li>US Agent · Công ty TNHH Lúa gạo {plot.commune}</li>
            <li>Nhật ký canh tác 3 tháng gần nhất</li>
            <li>Kiểm tra dư lượng thuốc BVTV theo ngưỡng EPA tolerance</li>
          </ul>
        )}
        <ComplianceChecklist plot={plot} market={market} jump={jump} />
        <div className="pp-chips pp-space">
          {['FAO', 'Codex', 'VietGAP', 'GlobalG.A.P.'].map((s) => (
            <span className="pp-chip grey" key={s}>
              {s}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
