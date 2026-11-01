import { Link } from 'react-router-dom';
import { useAuth, type Role } from '../lib/auth';
import { roleLabels, useI18n } from '../lib/i18n';
import HeaderPopover from './HeaderPopover';
export default function AccountMenu({ switchRole }: { switchRole: (role: Role) => void }) {
  const { account, session, logout } = useAuth(),
    { lang } = useI18n(),
    vi = lang === 'vi';
  if (!account || !session) return null;
  const initials = account.name
    .split(/\s+/)
    .slice(-2)
    .map((n) => n[0])
    .join('');
  return (
    <HeaderPopover
      id="account-popover"
      label={`${vi ? 'Tài khoản' : 'Account'}: ${account.name}`}
      trigger={
        <>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rice-100 font-bold text-rice-900">
            {account.avatar ? (
              <img src={account.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <span className="hidden max-w-40 text-left xl:block">
            <span className="block truncate text-xs font-semibold">{account.name}</span>
            <span className="block text-xs text-slate-600">{roleLabels[session.role][lang]}</span>
          </span>
        </>
      }
    >
      {(close) => (
        <>
          <div className="space-y-1 border-b border-slate-200 pb-2">
            <Link
              to="/account"
              onClick={close}
              className="block rounded-lg px-3 py-3 text-sm hover:bg-slate-50"
            >
              {vi ? 'Thông tin tài khoản' : 'Account details'}
            </Link>
            <Link
              to="/account/password"
              onClick={close}
              className="block rounded-lg px-3 py-3 text-sm hover:bg-slate-50"
            >
              {vi ? 'Đổi mật khẩu' : 'Change password'}
            </Link>
          </div>
          <h2 className="px-3 py-3 text-sm font-bold">{vi ? 'Đổi vai trò' : 'Switch role'}</h2>
          {Object.entries(roleLabels).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                switchRole(id as Role);
                close();
              }}
              className={`block w-full rounded-lg px-3 py-3 text-left text-sm ${session.role === id ? 'bg-rice-100 font-bold text-rice-900' : 'hover:bg-slate-50'}`}
            >
              {label[lang]}
            </button>
          ))}
          <button
            onClick={() => {
              close();
              logout();
            }}
            className="mt-2 block w-full rounded-lg border-t border-slate-200 px-3 py-3 text-left text-sm font-bold text-red-700"
          >
            {vi ? 'Đăng xuất' : 'Sign out'}
          </button>
        </>
      )}
    </HeaderPopover>
  );
}
