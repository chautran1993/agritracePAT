import PlotReport from './components/PlotReport';
import EditableRecordPanel from './components/EditableRecordPanel';
import ManagedOverview from './components/ManagedOverview';
import Tabs from '../../components/Tabs';
import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { usePlotProfile } from './hooks/usePlotProfile';
import { usePlotText } from './i18n';
import { Card } from './components/shared';
import PlotHeader from './components/PlotHeader';
import KpiStrip from './components/KpiStrip';
import SourceParcelOverview from './components/SourceParcelOverview';
import SeasonTab from './components/SeasonTab';
import LogbookTab from './components/LogbookTab';
import SoilWaterTab from './components/SoilWaterTab';
import PestTab from './components/PestTab';
import ComplianceTab from './components/ComplianceTab';
import HarvestTab from './components/HarvestTab';
import HistoryTab from './components/HistoryTab';
import './profile.css';
const tabs = [
  'overview',
  'season',
  'logbook',
  'soil',
  'pests',
  'compliance',
  'harvest',
  'history',
] as const;
export default function PlotProfilePage() {
  const { pdi } = useParams(),
    { plot, loading, save } = usePlotProfile(pdi),
    { t, lang } = usePlotText(),
    [params, setParams] = useSearchParams(),
    root = useRef<HTMLDivElement>(null);
  const tab = tabs.includes(params.get('tab') as (typeof tabs)[number])
    ? params.get('tab')!
    : 'overview';
  const jump = (next: string, evidence?: string) => {
    const update = new URLSearchParams(params);
    update.set('tab', next);
    if (evidence) update.set('evidence', evidence);
    else update.delete('evidence');
    setParams(update);
  };
  useEffect(() => {
    const evidence = params.get('evidence');
    if (!evidence || loading) return;
    const timer = setTimeout(
      () =>
        document.getElementById(evidence)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      150,
    );
    return () => clearTimeout(timer);
  }, [tab, params, loading]);
  if (loading)
    return (
      <div aria-label={t('loading')} className="pp-skeleton">
        <div />
        <div />
        <div />
        <span>{t('loading')}</span>
      </div>
    );
  if (!plot)
    return (
      <Card>
        <h1>{t('notFound')}</h1>
        <p>{pdi}</p>
        <Link to="/map">← {t('backMap')}</Link>
      </Card>
    );
  const content = {
    overview: <ManagedOverview plot={plot} save={save} />,
    season: <SeasonTab plot={plot} jump={jump} />,
    logbook: <LogbookTab plot={plot} />,
    soil: <SoilWaterTab plot={plot} />,
    pests: <PestTab plot={plot} />,
    compliance: <ComplianceTab plot={plot} jump={jump} />,
    harvest: <HarvestTab plot={plot} />,
    history: <HistoryTab plot={plot} />,
  };
  return (
    <div ref={root} className="plot-profile">
      <PlotHeader plot={plot} />
      {!plot.sourceOnly && <KpiStrip plot={plot} />}
      <Tabs
        id="plot"
        label={t('passport')}
        items={tabs.map((key) => ({ id: key, label: t(key) }))}
        active={tab as (typeof tabs)[number]}
        onChange={jump}
        className="pp-tabs"
      >
        <div className="pp-tab-content">
          <EditableRecordPanel plot={plot} tab={tab} save={save} />
          {plot.sourceOnly ? (
            tab === 'overview' ? (
              <SourceParcelOverview plot={plot} />
            ) : (
              <Card>
                <p>
                  {lang === 'vi'
                    ? 'File nguồn chưa có dữ liệu cho mục này.'
                    : 'This information is not in the source workbook.'}
                </p>
              </Card>
            )
          ) : (
            content[tab as keyof typeof content]
          )}
        </div>
      </Tabs>
      <PlotReport plot={plot} />
    </div>
  );
}
