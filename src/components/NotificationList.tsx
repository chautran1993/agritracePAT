import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type Notification } from '../lib/notifications';
import { useI18n } from '../lib/i18n';
import { dateTime } from '../lib/format';
export default function NotificationList({
  compact = false,
  onSelect,
}: {
  compact?: boolean;
  onSelect?: () => void;
}) {
  const { notifications, markRead } = useNotifications(),
    { lang } = useI18n(),
    navigate = useNavigate();
  const [filter, setFilter] = useState('all'),
    vi = lang === 'vi';
  const filtered = notifications.filter(
    (n) => filter === 'all' || (filter === 'read' ? n.read : !n.read),
  );
  const visible = compact ? filtered.slice(0, 5) : filtered;
  const select = (notice: Notification) => {
    markRead(notice.id);
    onSelect?.();
    navigate(notice.href);
  };
  return (
    <div>
      <label className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span>{vi ? 'Lọc thông báo' : 'Filter notifications'}</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <option value="all">{vi ? 'Tất cả' : 'All'}</option>
          <option value="unread">{vi ? 'Chưa đọc' : 'Unread'}</option>
          <option value="read">{vi ? 'Đã đọc' : 'Read'}</option>
        </select>
      </label>
      <div
        className={
          compact ? 'max-h-[min(50dvh,420px)] overflow-y-auto' : 'max-h-[70dvh] overflow-y-auto'
        }
        role="region"
        aria-label={vi ? 'Danh sách thông báo' : 'Notification list'}
      >
        <ul className="divide-y divide-slate-200">
          {visible.map((n) => (
            <li key={n.id}>
              <button
                data-testid={`notification-${n.id}`}
                onClick={() => select(n)}
                className={`block w-full rounded-lg p-3 text-left text-sm hover:bg-slate-50 ${n.read ? 'text-slate-600' : 'bg-rice-50 text-slate-900'}`}
              >
                <span className={`block ${n.read ? 'font-normal' : 'font-bold'}`}>
                  {n.title[lang]}
                </span>
                <span className="mt-1 block text-slate-600">{n.body[lang]}</span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <time dateTime={n.receivedAt}>{dateTime(n.receivedAt, lang)}</time>
                  <span>{n.read ? (vi ? 'Đã đọc' : 'Read') : vi ? 'Chưa đọc' : 'Unread'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {!visible.length && (
          <p role="status" className="p-4 text-sm text-slate-600">
            {vi ? 'Không có thông báo phù hợp.' : 'No matching notifications.'}
          </p>
        )}
      </div>
    </div>
  );
}
