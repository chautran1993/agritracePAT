import { useI18n } from '../lib/i18n';
import { lazy, Suspense } from 'react';
const MapView = lazy(() => import('../map/MapView'));
export default function MapPage() {
  const { t } = useI18n();
  return (
    <>
      <h1 className="sr-only">{t.map}</h1>
      <Suspense
        fallback={<div className="h-[calc(100vh-136px)] animate-pulse rounded-xl bg-rice-100" />}
      >
        <MapView />
      </Suspense>
    </>
  );
}
