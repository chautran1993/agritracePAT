import { AuthProvider, RequireAuth, SessionWarning } from './lib/auth';
import SkipLink from './components/SkipLink';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import AppLayout from './layouts/AppLayout';
import PageSkeleton from './components/PageSkeleton';
const AccountPage = React.lazy(() => import('./pages/AccountPage'));
const PasswordPage = React.lazy(() => import('./pages/PasswordPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const ZonesPage = React.lazy(() => import('./pages/ZonesPage'));
const PlotRegistryPage = React.lazy(() => import('./features/plots/PlotRegistryPage'));
const PlotProfilePage = React.lazy(() => import('./features/plots/PlotProfilePage'));
const PlotPublicTracePage = React.lazy(() => import('./features/plots/PlotPublicTracePage'));
const StandardDetailPage = React.lazy(() => import('./features/standards/StandardDetailPage'));
const StandardsPage = React.lazy(() => import('./pages/StandardsPage'));
const FarmingPage = React.lazy(() => import('./pages/FarmingPage'));
const TraceabilityPage = React.lazy(() => import('./pages/TraceabilityPage'));
const IoTPage = React.lazy(() => import('./pages/IoTPage'));
const CarbonPage = React.lazy(() => import('./pages/CarbonPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const PlaceholderPage = React.lazy(() => import('./pages/PlaceholderPage'));
const Login = React.lazy(() => import('./pages/Login'));
const RoleSelection = React.lazy(() => import('./pages/RoleSelection'));
import { I18nProvider } from './lib/i18n';
function page(element: React.ReactNode) {
  return <React.Suspense fallback={<PageSkeleton />}>{element}</React.Suspense>;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <SessionWarning />
          <SkipLink />
          <Routes>
            <Route path="/" element={page(<Login />)} />
            <Route path="/login" element={page(<Login />)} />
            <Route
              path="/role-selection"
              element={<RequireAuth>{page(<RoleSelection />)}</RequireAuth>}
            />
            <Route
              path="/trace/plots/:pdi/:batch"
              element={
                <React.Suspense fallback={<PageSkeleton />}>
                  <PlotPublicTracePage />
                </React.Suspense>
              }
            />
            <Route element={<AppLayout />}>
              <Route path="/account" element={page(<AccountPage />)} />
              <Route path="/account/password" element={page(<PasswordPage />)} />
              <Route path="/notifications" element={page(<NotificationsPage />)} />
              <Route path="/dashboard" element={page(<Dashboard />)} />
              <Route path="/map" element={page(<MapPage />)} />
              <Route path="/zones" element={page(<ZonesPage />)} />
              <Route
                path="/plots"
                element={
                  <React.Suspense fallback={<PageSkeleton />}>
                    <PlotRegistryPage />
                  </React.Suspense>
                }
              />
              <Route
                path="/plots/:pdi"
                element={
                  <React.Suspense fallback={<PageSkeleton />}>
                    <PlotProfilePage />
                  </React.Suspense>
                }
              />
              <Route path="/standards" element={page(<StandardsPage />)} />
              <Route path="/standards/:id" element={page(<StandardDetailPage />)} />
              <Route path="/farming" element={page(<FarmingPage />)} />
              <Route path="/traceability" element={page(<TraceabilityPage />)} />
              <Route path="/iot" element={page(<IoTPage />)} />
              <Route path="/carbon" element={page(<CarbonPage />)} />
              <Route path="/users" element={page(<AdminPage initialTab="users" />)} />
              <Route path="/audit" element={page(<AdminPage initialTab="logs" />)} />
              <Route path="*" element={page(<PlaceholderPage />)} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>,
);
