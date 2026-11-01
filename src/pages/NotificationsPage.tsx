import NotificationList from '../components/NotificationList';
import { useI18n } from '../lib/i18n';
import { useNotifications } from '../lib/notifications';
import { number } from '../lib/format';
export default function NotificationsPage() {
  const { t, lang } = useI18n(),
    { unreadCount } = useNotifications();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-rice-950">{t.notifications}</h1>
      <p className="text-sm text-slate-600">
        {number(unreadCount, lang, 0)} {t.unread}
      </p>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="sr-only">{lang === 'vi' ? 'Tất cả thông báo' : 'All notifications'}</h2>
        <NotificationList />
      </section>
    </div>
  );
}
