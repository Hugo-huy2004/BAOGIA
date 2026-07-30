import NotificationCenter from "./notifications/NotificationCenter";

/**
 * Tab "Thông báo" của portal.
 *
 * Giữ nguyên tên file + chữ ký props vì MemberPortalPage nhập ở hai chỗ; toàn
 * bộ phần vẽ đã chuyển sang `notifications/` (xem NotificationCenter.jsx và
 * notificationModel.js).
 */
export default function MemberHistoryTab({ bio, notifications, onMarkRead, onMarkAllRead, onDismiss }) {
  return (
    <NotificationCenter
      bio={bio}
      notifications={notifications}
      onMarkRead={onMarkRead}
      onMarkAllRead={onMarkAllRead}
      onDismiss={onDismiss}
    />
  );
}
