import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import { hapticSelect } from "../../../utils/haptics";
import NotificationRow from "./NotificationRow";
import { buildFeed, groupByDay } from "./notificationModel";
import "./notification-center.css";

/**
 * Trung tâm thông báo.
 *
 * Bố cục Liquid Glass dùng trực tiếp màu Aura đang chọn của portal.
 *
 * Việc "hiện cái gì" nằm ở `notificationModel.js`; ở đây chỉ vẽ.
 */
export default function NotificationCenter({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  showToast,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Inbox chỉ hiển thị thông báo thực. Lịch sử sửa hồ sơ là một nguồn khác,
  // luôn được coi là đã đọc và từng khiến badge không thể về 0 sau "Đọc hết".
  const feed = useMemo(() => buildFeed(notifications), [notifications]);

  const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(feed, { pageSize: 25 });
  const days = useMemo(() => groupByDay(visibleItems, new Date(), {
    today: t("memberPortal.notificationCenter.days.today"),
    yesterday: t("memberPortal.notificationCenter.days.yesterday"),
    this_week: t("memberPortal.notificationCenter.days.thisWeek"),
    earlier: t("memberPortal.notificationCenter.days.earlier"),
  }), [visibleItems, t]);

  const unread = feed.filter(i => !i.read).length;
  const [markingAll, setMarkingAll] = useState(false);

  const handleOpen = useCallback((item) => {
    hapticSelect();
    if (!item.read && item.id) onMarkRead?.(item.id);
  }, [onMarkRead]);

  const handleAction = useCallback(async (item) => {
    if (!item.actionUrl) return;
    hapticSelect();
    if (!item.read && item.id) await onMarkRead?.(item.id);
    navigate(item.actionUrl);
  }, [navigate, onMarkRead]);

  const handleMarkAll = useCallback(async () => {
    if (markingAll || unread === 0) return;
    hapticSelect();
    setMarkingAll(true);
    const succeeded = await onMarkAllRead?.();
    setMarkingAll(false);
    if (succeeded === false) {
      showToast?.(t("memberPortal.notificationCenter.markAllReadError"), "error");
    }
  }, [markingAll, onMarkAllRead, showToast, t, unread]);

  const handleDismiss = useCallback((item) => {
    if (item.id) onDismiss?.(item.id);
  }, [onDismiss]);

  return (
    <div className="hgn pb-24 text-left">
      {/* Header nhỏ, danh sách là nội dung chính. */}
      <header className="hgn-hero">
        <div className="hgn-hero-copy">
          <span className="hgn-hero-mark" aria-hidden="true">
            <span className="material-symbols-outlined">notifications</span>
            {unread > 0 ? <b>{unread > 99 ? "99+" : unread}</b> : null}
          </span>
          <div className="min-w-0">
            <h1 className="hgn-hero-title">{t("memberPortal.notificationCenter.title")}</h1>
            <p className="hgn-hero-kicker">
              {unread > 0
                ? t("memberPortal.notificationCenter.unreadCount", { count: unread })
                : t("memberPortal.notificationCenter.allCaughtUp")}
            </p>
          </div>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="hgn-hero-btn"
          >
            <span className={`material-symbols-outlined text-[18px] ${markingAll ? "animate-spin" : ""}`}>
              {markingAll ? "progress_activity" : "done_all"}
            </span>
            {markingAll
              ? t("memberPortal.notificationCenter.markingAllRead")
              : t("memberPortal.notificationCenter.markAllRead")}
          </button>
        ) : null}
      </header>

      {feed.length === 0 ? <EmptyState onGo={() => navigate("/member/account")} /> : (
        <div className="hgn-sheet">
          {days.map(day => (
            <section key={day.bucket}>
              <h2 className="hgn-daygroup">{day.label}</h2>
              <div className="hgn-card hgn-divide">
                {day.items.map((item, index) => (
                  <NotificationRow
                    key={item.key}
                    item={item}
                    index={index}
                    onOpen={handleOpen}
                    onAction={handleAction}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </section>
          ))}

          <div ref={sentinelRef} className="h-1" />
          {hasMore && (
            <div className="flex justify-center py-5">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--hgn-accent)] border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Trạng thái rỗng: nói rõ vì sao trống và cho một việc để làm tiếp. */
function EmptyState({ onGo }) {
  const { t } = useTranslation();
  return (
    <div className="hgn-sheet">
      <div className="hgn-card px-6 py-10 text-center">
        <div className="hgn-empty-art">
          <span className="material-symbols-outlined text-[46px]">notifications_active</span>
        </div>
        <h2 className="hgn-ink mt-5 text-[17px] font-bold">
          {t("memberPortal.notificationCenter.emptyTitle")}
        </h2>
        <p className="hgn-dim mx-auto mt-1.5 max-w-[30ch] text-[13.5px] leading-snug">
          {t("memberPortal.notificationCenter.emptyDescription")}
        </p>
        <button type="button" onClick={onGo} className="hgn-btn hgn-btn--quiet mt-5">
          <span className="material-symbols-outlined text-[19px]">toll</span>
          {t("memberPortal.notificationCenter.openWallet")}
        </button>
      </div>
    </div>
  );
}
