import { plantingZones } from '../data/plantingZones';
import { plotProfiles } from '../features/plots/mock/plotProfiles';
import { RequireAuth, useAuth, type Role } from '../lib/auth';
import { NotificationsProvider } from '../lib/notifications';
import NotificationsBell from '../components/NotificationsBell';
import AccountMenu from '../components/AccountMenu';
import GlobalPlotSearch from '../features/plots/components/GlobalPlotSearch';
import ModalDrawer from '../components/ModalDrawer';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Leaf,
  Menu,
  Search,
  LayoutDashboard,
  MapPinned,
  Sprout,
  LandPlot,
  BookOpenCheck,
  Tractor,
  Route,
  RadioTower,
  Footprints,
  UsersRound,
  ScrollText,
} from 'lucide-react';
import { navGroups, roleAccess, useI18n } from '../lib/i18n';
const icons: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  map: MapPinned,
  zones: Sprout,
  plots: LandPlot,
  standards: BookOpenCheck,
  farming: Tractor,
  traceability: Route,
  iot: RadioTower,
  carbon: Footprints,
  users: UsersRound,
  audit: ScrollText,
};
export default function AppLayout() {
  const { session } = useAuth();
  return (
    <RequireAuth>
      {session && (
        <NotificationsProvider key={session.username}>
          <LayoutContent />
        </NotificationsProvider>
      )}
    </RequireAuth>
  );
}
function LayoutContent() {
  const { session, changeRole } = useAuth();
  const role = session!.role;
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const close = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  const [collapsed, setCollapsed] = useState(false);
  const { lang, setLang, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const regionParams = new URLSearchParams(location.search);
  const profile = plotProfiles.find(
    (p) => p.pdi === (regionParams.get('focus') ?? location.pathname.split('/')[2]),
  );
  const selectedRegion =
    plantingZones.find((z) => z.id === (regionParams.get('zone') ?? profile?.zoneId)) ??
    plantingZones[0];
  const regionSelection = (
    <label className="block min-w-0">
      <span className="sr-only">{lang === 'vi' ? 'Vùng trồng' : 'Planting zone'}</span>
      <select
        aria-label={lang === 'vi' ? 'Vùng trồng' : 'Planting zone'}
        className="max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
        value={selectedRegion.id}
        onChange={(e) => {
          setMobileOpen(false);
          navigate('/map?zone=' + e.target.value);
        }}
      >
        {plantingZones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.id} · {z.commune} · {z.province}
          </option>
        ))}
      </select>
    </label>
  );

  const groups = useMemo(
    () =>
      navGroups
        .map((g) => ({ ...g, items: g.items.filter((i) => roleAccess[role]?.includes(i.key)) }))
        .filter((g) => g.items.length),
    [role],
  );
  const current = location.pathname.startsWith('/account/password')
    ? 'password'
    : location.pathname.startsWith('/account')
      ? 'account'
      : location.pathname === '/notifications'
        ? 'notifications'
        : location.pathname.startsWith('/standards')
          ? 'standards'
          : location.pathname.startsWith('/plots')
            ? 'plots'
            : navGroups
                .flatMap<(typeof navGroups)[number]['items'][number]>((g) => g.items)
                .find((i) => i.path === location.pathname)?.key || 'dashboard';
  const switchRole = (r: Role) => {
    changeRole(r);
    navigate('/dashboard');
  };
  const navigation = (compact: boolean) => (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rice-900 text-white">
          <Leaf size={22} />
        </div>
        {!compact && (
          <div>
            <div className="font-bold text-rice-900">AgriTrace</div>
            <div className="text-xs text-slate-600">Portal</div>
          </div>
        )}
      </div>
      <nav
        aria-label={lang === 'vi' ? 'Điều hướng chính' : 'Main navigation'}
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {groups.map((g) => (
          <div key={g.label}>
            <div
              className={`mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-600 ${compact ? 'text-center' : ''}`}
            >
              {!compact &&
                (g.label === 'overview'
                  ? t.overviewGroup
                  : g.label === 'zones'
                    ? t.zonesGroup
                    : g.label === 'standards'
                      ? t.standardsGroup
                      : g.label === 'traceability'
                        ? t.traceabilityGroup
                        : g.label === 'monitoring'
                          ? t.monitoringGroup
                          : t.adminGroup)}
            </div>
            {g.items.map((i) => {
              const I = icons[i.key];
              return (
                <NavLink
                  key={i.path}
                  to={i.path}
                  onClick={() => setMobileOpen(false)}
                  title={compact ? t[i.key as keyof typeof t] : undefined}
                  className={({ isActive }) =>
                    `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-rice-100 text-rice-900' : 'text-slate-600 hover:bg-slate-50 hover:text-rice-900'} ${compact ? 'justify-center' : ''}`
                  }
                >
                  <I size={18} />
                  {!compact && t[i.key as keyof typeof t]}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={compact ? t.expandNavigation : t.collapseNavigation}
        aria-expanded={!compact}
        className="m-3 hidden lg:flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600"
      >
        {compact ? (
          <ChevronRight size={18} />
        ) : (
          <>
            <ChevronLeft size={18} />
            <span className="ml-2 text-xs">{t.collapse}</span>
          </>
        )}
      </button>
    </>
  );
  return (
    <div className="min-h-screen bg-canvas text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col lg:flex border-r border-slate-200 bg-white transition-all ${collapsed ? 'w-[76px]' : 'w-[260px]'}`}
      >
        {navigation(collapsed)}
      </aside>
      <ModalDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="AgriTrace"
        id="mobile-navigation"
        className="navigation-drawer"
      >
        <div className="space-y-3 border-b p-4">
          {regionSelection}
          <GlobalPlotSearch />
        </div>
        {navigation(false)}
      </ModalDrawer>
      <div
        className={`${collapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'} app-shell ml-0 min-w-0 min-h-screen transition-all`}
      >
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 gap-2 px-4 lg:px-7 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t.openNavigation}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="shrink-0 rounded p-2 text-slate-600 lg:hidden"
            >
              <Menu />
            </button>
            <div className="truncate text-sm text-slate-600">
              AgriTrace <span className="mx-2">/</span>
              <span className="font-semibold text-slate-700">{t[current as keyof typeof t]}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <div className="hidden max-w-[250px] lg:block">{regionSelection}</div>
            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-2.5 text-slate-600" size={16} />
              <GlobalPlotSearch />
            </div>
            <NotificationsBell />
            <button
              data-testid="language-toggle"
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold"
            >
              <Globe2 size={15} />
              {lang.toUpperCase()}
            </button>
            <AccountMenu switchRole={switchRole} />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="app-content min-w-0 p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
