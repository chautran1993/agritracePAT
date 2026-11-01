import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { plotProfiles } from '../features/plots/mock/plotProfiles';
export type Notification = {
  id: string;
  title: { vi: string; en: string };
  body: { vi: string; en: string };
  href: string;
  receivedAt: string;
  read: boolean;
};
function demoNotifications(now = Date.now()): Omit<Notification, 'read'>[] {
  const plot = plotProfiles[0];

  const topics = [
    {
      vi: 'Dữ liệu thửa đất Tân Hưng mới',
      en: 'New Tan Hung parcel records',
      bodyVi: 'Đã cập nhật hồ sơ thửa ruộng và thông tin chủ hộ.',
      bodyEn: 'Parcel records and household information have been updated.',
      href: '/plots',
    },
    {
      vi: `Xem hồ sơ ${plot.name.vi}`,
      en: `View ${plot.name.en}`,
      bodyVi: `Hồ sơ GIS và mùa vụ của ${plot.shortCode}.`,
      bodyEn: `GIS and season records for ${plot.shortCode}.`,
      href: `/plots/${plot.pdi}`,
    },
    {
      vi: 'Kiểm tra mã số thửa ruộng',
      en: 'Review parcel registration',
      bodyVi: 'Xem trạng thái cấp mã trong danh mục vùng trồng.',
      bodyEn: 'Review registration status in the planting-zone catalog.',
      href: '/zones',
    },
    {
      vi: 'Xem dữ liệu bản đồ số',
      en: 'Review digital map records',
      bodyVi: 'Ranh giới và diện tích GIS của các thửa ruộng.',
      bodyEn: 'Parcel boundaries and GIS areas.',
      href: '/map',
    },
    {
      vi: 'Xem hành trình lô hàng',
      en: 'Review batch traceability',
      bodyVi: 'Các mốc thực hiện và dự kiến từ hồ sơ nguồn.',
      bodyEn: 'Recorded and planned milestones from the source profile.',
      href: '/traceability',
    },
    {
      vi: 'Rà soát tiêu chuẩn áp dụng',
      en: 'Review applicable standards',
      bodyVi: 'Thư viện yêu cầu và hướng dẫn tuân thủ.',
      bodyEn: 'Requirements and compliance guidance library.',
      href: '/standards',
    },
    {
      vi: 'Xem quy trình canh tác',
      en: 'Review farming procedures',
      bodyVi: 'Hướng dẫn theo từng giai đoạn mùa vụ.',
      bodyEn: 'Guidance for each growth stage.',
      href: '/farming',
    },
    {
      vi: 'Tổng hợp dữ liệu vùng trồng',
      en: 'Planting-zone overview',
      bodyVi: 'Xem số liệu tổng hợp trên Dashboard.',
      bodyEn: 'View aggregated records on the dashboard.',
      href: '/dashboard',
    },
    {
      vi: 'Rà soát dữ liệu Carbon MRV',
      en: 'Review Carbon MRV records',
      bodyVi: 'Mở màn hình theo dõi Carbon MRV.',
      bodyEn: 'Open Carbon MRV monitoring.',
      href: '/carbon',
    },
    {
      vi: 'Tra cứu hồ sơ thửa ruộng',
      en: 'Search parcel records',
      bodyVi: 'Tìm kiếm theo chủ hộ, mã PDI hoặc vùng.',
      bodyEn: 'Search by owner, PDI or planting zone.',
      href: '/plots',
    },
    {
      vi: 'Xem lại chú giải bản đồ',
      en: 'Review map legend',
      bodyVi: 'Diện tích và trạng thái đăng ký theo dữ liệu GIS.',
      bodyEn: 'Areas and registration status from GIS records.',
      href: '/map',
    },
    {
      vi: 'Xem nhật ký mùa vụ',
      en: 'Review season logbook',
      bodyVi: `Nhật ký canh tác của ${plot.name.vi}.`,
      bodyEn: `Farming logs for ${plot.name.en}.`,
      href: `/plots/${plot.pdi}`,
    },
  ];
  return topics.map((topic, index) => ({
    id: `notice-${index + 1}`,
    title: { vi: topic.vi, en: topic.en },
    body: { vi: topic.bodyVi, en: topic.bodyEn },
    href: topic.href,
    receivedAt: new Date(
      now - (index < 5 ? (index * 25 + 5) * 60_000 : (index - 3) * 86_400_000),
    ).toISOString(),
  }));
}
type NotificationsValue = {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
};
const Context = createContext<NotificationsValue | null>(null);
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const key = `agritrace_notifications_${session!.username}`;
  const [notices] = useState(() => {
    const stored = Number(sessionStorage.getItem(`${key}_received`));
    const epoch = stored > 0 && Number.isFinite(stored) ? stored : Date.now();
    sessionStorage.setItem(`${key}_received`, String(epoch));
    return demoNotifications(epoch);
  });
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      if (Array.isArray(saved)) return saved.filter((id): id is string => typeof id === 'string');
    } catch {
      /* Use the initial demo read state if storage is invalid. */
    }
    return notices.slice(3).map((n) => n.id);
  });
  const notifications = useMemo(
    () =>
      notices
        .map((n) => ({ ...n, read: readIds.includes(n.id) }))
        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    [notices, readIds],
  );
  const markRead = (id: string) => {
    setReadIds((previous) => {
      const next = previous.includes(id) ? previous : [...previous, id];
      sessionStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };
  return (
    <Context.Provider
      value={{ notifications, unreadCount: notifications.filter((n) => !n.read).length, markRead }}
    >
      {children}
    </Context.Provider>
  );
}
export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error('NotificationsProvider is required');
  return value;
}
