import { useI18n } from '../../../lib/i18n';
import { useState } from 'react';
import { Copy, MapPin, Printer, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Plot } from '../types';
import { usePlotText } from '../i18n';
import { text } from '../utils/format';
import { Chip } from './shared';
export default function PlotHeader({ plot }: { plot: Plot }) {
  const { t: common } = useI18n();
  const { t, lang } = usePlotText(),
    nav = useNavigate(),
    [copied, setCopied] = useState(false);
  const status = plot.officialZoneCode?.statusValue || 'active';
  const statusLabels = {
    active: lang === 'vi' ? 'Đang hoạt động' : 'Active',
    pending_approval: lang === 'vi' ? 'Đang xét duyệt' : 'Pending approval',
    suspended: lang === 'vi' ? 'Tạm dừng' : 'Suspended',
    revoked: lang === 'vi' ? 'Đã thu hồi' : 'Revoked',
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <nav aria-label={common.breadcrumb} className="pp-breadcrumb">
        <Link to="/zones">{t('zones')}</Link> / <Link to="/zones">{t('registry')}</Link> /{' '}
        <Link to="/zones">{plot.zoneId}</Link> / {plot.shortCode}
      </nav>
      <header className="pp-card pp-header">
        <div>
          <small className="pp-eyebrow">{t('passport')}</small>
          <div className="pp-title">
            <h1>{text(plot.name, lang)}</h1>
            <Chip tone={status === 'active' ? 'green' : 'gold'}>{statusLabels[status]}</Chip>
          </div>
          <button
            aria-label={`${lang === 'vi' ? 'Sao chép mã số vùng trồng' : 'Copy planting zone code'}: ${plot.officialZoneCode?.code}`}
            className="pp-pdi"
            onClick={() => copy(plot.officialZoneCode?.code ?? plot.pdi)}
          >
            <code>{plot.officialZoneCode?.code ?? plot.pdi}</code>
            <Copy size={13} />
            {copied && t('copied')}
          </button>
          <div className="pp-chips">
            <Chip tone="grey">Lúa · {plot.currentSeason.variety}</Chip>
            <Chip tone="grey">{plot.officialZoneCode?.code}</Chip>
            <Chip tone="grey">{plot.currentSeason.name[lang]}</Chip>
          </div>
        </div>
        <div className="pp-actions">
          <button onClick={() => nav(`/map?focus=${encodeURIComponent(plot.pdi)}`)}>
            <MapPin size={15} />
            {t('viewMap')}
          </button>
          <button onClick={() => window.print()}>
            <Printer size={15} />
            {t('print')}
          </button>
          <button onClick={() => copy(window.location.href)}>
            <Share2 size={15} />
            {t('share')}
          </button>
        </div>
      </header>
    </>
  );
}
