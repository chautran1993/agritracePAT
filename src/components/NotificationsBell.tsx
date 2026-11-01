import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../lib/notifications';
import { useI18n } from '../lib/i18n';
import { number } from '../lib/format';
import HeaderPopover from './HeaderPopover';
import NotificationList from './NotificationList';
export default function NotificationsBell() {
  const { unreadCount } = useNotifications(),
    { t, lang } = useI18n(),
    navigate = useNavigate();
  return (
    <HeaderPopover
      id="notifications-popover"
      label={`${t.notifications}: ${number(unreadCount, lang, 0)} ${t.unread}`}
      trigger={
        <>
          <Bell size={19} />
          {unreadCount > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-xs font-bold text-white"
            >
              {number(unreadCount, lang, 0)}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <>
          <h2 className="mb-3 font-bold">{t.notifications}</h2>
          <NotificationList compact onSelect={close} />
          <button
            onClick={() => {
              close();
              navigate('/notifications');
            }}
            className="mt-3 w-full rounded-lg border-t border-slate-200 px-3 py-3 text-sm font-bold text-rice-900"
          >
            {lang === 'vi' ? 'Xem tất cả' : 'View all'}
          </button>
        </>
      )}
    </HeaderPopover>
  );
}
