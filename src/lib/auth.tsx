import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import ModalDrawer from '../components/ModalDrawer';
import { useI18n } from './i18n';
import { number } from './format';
export const SESSION_KEY = 'agritrace_session';
export const IDLE_MS = 30 * 60 * 1000;
export const WARNING_MS = 60 * 1000;
export const demoAccounts = ['quanly', 'htx', 'kythuat', 'doanhnghiep'] as const;
export type Role = (typeof demoAccounts)[number];
export type Session = { username: Role; role: Role; lastActivityAt: number };
export type Account = { name: string; avatar: string; passwordHash?: string };
const ACCOUNT_KEY = 'agritrace_accounts';
const defaults: Record<Role, Account> = {
  quanly: { name: 'Nguyễn Thanh', avatar: '' },
  htx: { name: 'Trần Minh An', avatar: '' },
  kythuat: { name: 'Lê Minh Tâm', avatar: '' },
  doanhnghiep: { name: 'Phạm Thu Hà', avatar: '' },
};
export function validSession(value: unknown, now = Date.now()): value is Session {
  if (!value || typeof value !== 'object') return false;
  const s = value as Session;
  return (
    demoAccounts.includes(s.username) &&
    demoAccounts.includes(s.role) &&
    Number.isFinite(s.lastActivityAt) &&
    s.lastActivityAt <= now &&
    now - s.lastActivityAt < IDLE_MS
  );
}
export function returnPath(value: unknown) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/^\/login(?:[/?#]|$)/.test(value)
    ? value
    : '/dashboard';
}
function loadSession() {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (validSession(value)) return value;
  } catch {
    /* Invalid mock sessions are treated as signed out. */
  }
  sessionStorage.removeItem(SESSION_KEY);
  return null;
}
function loadAccounts(): Record<Role, Account> {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ACCOUNT_KEY) ?? '{}') as Partial<
      Record<Role, Account>
    >;
    return Object.fromEntries(
      demoAccounts.map((id) => [id, { ...defaults[id], ...saved[id] }]),
    ) as Record<Role, Account>;
  } catch {
    return defaults;
  }
}
async function hash(password: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}
type AuthValue = {
  session: Session | null;
  account: Account | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changeRole: (role: Role) => void;
  updateAccount: (name: string, avatar: string) => void;
  changePassword: (current: string, next: string) => Promise<boolean>;
  idleWarning: boolean;
  remainingSeconds: number;
  renew: () => void;
};
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession),
    [accounts, setAccounts] = useState(loadAccounts),
    [idleWarning, setIdleWarning] = useState(false),
    [remainingSeconds, setRemainingSeconds] = useState(60);
  const activity = useRef(session?.lastActivityAt ?? 0),
    warning = useRef(false),
    renewTimer = useRef<() => void>(() => {}),
    lastApiRenew = useRef(0);
  const logout = useCallback(() => {
    void fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' }).catch(() => {});
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('agritrace_api_authenticated');
    sessionStorage.removeItem('agritrace_user');
    localStorage.removeItem('agritrace_user');
    setSession(null);
    warning.current = false;
    setIdleWarning(false);
  }, []);
  useEffect(() => {
    if (!session?.username) return;
    let alive = true;
    void fetch('/api/session', { credentials: 'same-origin' })
      .then((response) => {
        if (
          alive &&
          response.status === 401 &&
          response.headers.get('Content-Type')?.includes('application/json')
        )
          logout();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [session?.username, logout]);
  const saveAccounts = useCallback((username: Role, patch: Partial<Account>) => {
    setAccounts((previous) => {
      const next = { ...previous, [username]: { ...previous[username], ...patch } };
      sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const login = async (username: string, password: string) => {
    if (!demoAccounts.includes(username as Role)) return false;
    const id = username as Role;
    let serverAuthenticated = false;
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.headers.get('Content-Type')?.includes('application/json')) {
        if (!response.ok) return false;
        serverAuthenticated = true;
      }
    } catch {
      if (!import.meta.env.DEV) return false;
    }
    if (
      !serverAuthenticated &&
      (await hash(password)) !== (accounts[id].passwordHash ?? (await hash('demo123')))
    )
      return false;
    if (serverAuthenticated) sessionStorage.setItem('agritrace_api_authenticated', 'true');
    const next: Session = { username: id, role: id, lastActivityAt: Date.now() };
    activity.current = next.lastActivityAt;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    sessionStorage.setItem('agritrace_role', id);
    localStorage.removeItem('agritrace_user');
    setSession(next);
    warning.current = false;
    setIdleWarning(false);
    return true;
  };
  useEffect(() => {
    if (!session) return;
    let warningTimer: ReturnType<typeof setTimeout>, expiryTimer: ReturnType<typeof setTimeout>;
    activity.current = session.lastActivityAt;
    const schedule = () => {
      clearTimeout(warningTimer);
      clearTimeout(expiryTimer);
      const left = IDLE_MS - (Date.now() - activity.current);
      if (left <= 0) {
        logout();
        return;
      }
      warningTimer = setTimeout(
        () => {
          warning.current = true;
          setRemainingSeconds(
            Math.max(0, Math.ceil((activity.current + IDLE_MS - Date.now()) / 1000)),
          );
          setIdleWarning(true);
        },
        Math.max(0, left - WARNING_MS),
      );
      expiryTimer = setTimeout(logout, left);
    };
    const renew = () => {
      activity.current = Date.now();
      warning.current = false;
      setIdleWarning(false);
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...session, lastActivityAt: activity.current }),
      );
      schedule();
      if (Date.now() - lastApiRenew.current > 60000) {
        lastApiRenew.current = Date.now();
        void fetch('/api/session', { method: 'PUT', credentials: 'same-origin' }).catch(() => {});
      }
    };
    renewTimer.current = renew;
    const onActivity = () => {
      if (Date.now() - activity.current >= IDLE_MS) {
        logout();
        return;
      }
      if (!warning.current && Date.now() - activity.current >= 1000) renew();
    };
    const checkExpiry = () => {
      if (Date.now() - activity.current >= IDLE_MS) logout();
      else schedule();
    };
    const events = [
      'pointerdown',
      'pointermove',
      'keydown',
      'scroll',
      'touchstart',
      'wheel',
      'input',
    ] as const;
    events.forEach((event) =>
      window.addEventListener(event, onActivity, { capture: true, passive: true }),
    );
    document.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('focus', checkExpiry);
    schedule();
    return () => {
      clearTimeout(warningTimer);
      clearTimeout(expiryTimer);
      events.forEach((event) => window.removeEventListener(event, onActivity, true));
      document.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('focus', checkExpiry);
      renewTimer.current = () => {};
    };
  }, [session, logout]);
  useEffect(() => {
    if (!idleWarning) return;
    const timer = setInterval(
      () =>
        setRemainingSeconds(
          Math.max(0, Math.ceil((activity.current + IDLE_MS - Date.now()) / 1000)),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [idleWarning]);
  const changeRole = (role: Role) => {
    if (!session) return;
    const next = { ...session, role, lastActivityAt: Date.now() };
    activity.current = next.lastActivityAt;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    sessionStorage.setItem('agritrace_role', role);
    localStorage.setItem('agritrace_role', role);
    setSession(next);
  };
  const updateAccount = (name: string, avatar: string) => {
    if (session) saveAccounts(session.username, { name: name.trim(), avatar });
  };
  const changePassword = async (current: string, next: string) => {
    if (
      !session ||
      next.length < 8 ||
      !/[A-Za-z]/.test(next) ||
      !/\d/.test(next) ||
      current === next
    )
      return false;
    if (sessionStorage.getItem('agritrace_api_authenticated') === 'true') {
      try {
        const response = await fetch('/api/account/password', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current, next }),
        });
        return response.ok;
      } catch {
        return false;
      }
    }
    const account = accounts[session.username];
    if ((await hash(current)) !== (account.passwordHash ?? (await hash('demo123')))) return false;
    saveAccounts(session.username, { passwordHash: await hash(next) });
    return true;
  };
  return (
    <AuthContext.Provider
      value={{
        session,
        account: session ? accounts[session.username] : null,
        login,
        logout,
        changeRole,
        updateAccount,
        changePassword,
        idleWarning,
        remainingSeconds,
        renew: () => renewTimer.current(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth(),
    location = useLocation();
  return session ? (
    <>{children}</>
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search + location.hash }}
    />
  );
}
export function SessionWarning() {
  const { idleWarning, remainingSeconds, renew, logout } = useAuth(),
    { lang } = useI18n(),
    vi = lang === 'vi';
  return (
    <ModalDrawer
      open={idleWarning}
      onClose={renew}
      id="session-warning"
      title={vi ? 'Phiên đăng nhập sắp hết hạn' : 'Session expiring'}
      className="session-warning"
    >
      <div className="space-y-4 p-5">
        <p role="status">
          {vi ? 'Bạn sẽ tự động đăng xuất sau' : 'You will be signed out in'}{' '}
          {number(remainingSeconds, lang, 0)}{' '}
          {vi ? 'giây nếu không tiếp tục làm việc.' : 'seconds unless you continue working.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={renew} className="rounded-lg bg-rice-900 px-4 py-3 text-white">
            {vi ? 'Tiếp tục làm việc' : 'Continue session'}
          </button>
          <button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-3">
            {vi ? 'Đăng xuất' : 'Sign out'}
          </button>
        </div>
      </div>
    </ModalDrawer>
  );
}
