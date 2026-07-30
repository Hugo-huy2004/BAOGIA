import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import { hapticSelect } from "../../../utils/haptics";
import NotificationRow from "./NotificationRow";
import { buildFeed, applyFilter, availableFilters, groupByDay } from "./notificationModel";
import "./notification-center.css";

/**
 * Trung tâm thông báo.
 *
 * Bố cục theo ảnh mẫu user gửi: mảng màu bo cong ở đỉnh, danh sách là thẻ trắng
 * nhô lên chồng mép mảng màu, mỗi giao dịch có mũi tên hướng tiền + số JOY.
 *
 * Việc "hiện cái gì" nằm ở `notificationModel.js`; ở đây chỉ vẽ.
 */
export default function NotificationCenter({
  bio,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onDismiss,
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  const feed = useMemo(
    () => buildFeed(notifications, bio?.history || []),
    [notifications, bio?.history]
  );

  const chips = useMemo(() => availableFilters(feed), [feed]);
  // Chip đang chọn có thể biến mất (đọc hết thì hết "Chưa đọc") — rơi về "Tất cả"
  // thay vì hiện một danh sách rỗng không lý do.
  const activeFilter = chips.some(c => c.id === filter) ? filter : "all";
  const filtered = useMemo(() => applyFilter(feed, activeFilter), [feed, activeFilter]);

  const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(filtered, { pageSize: 25 });
  const days = useMemo(() => groupByDay(visibleItems), [visibleItems]);

  const unread = feed.filter(i => !i.read).length;

  const handleOpen = useCallback((item) => {
    hapticSelect();
    if (!item.read && item.id) onMarkRead?.(item.id);
    if (item.actionUrl) navigate(item.actionUrl);
  }, [navigate, onMarkRead]);

  const handleDismiss = useCallback((item) => {
    if (item.id) onDismiss?.(item.id);
  }, [onDismiss]);

  return (
    <div className="hgn -mx-[var(--space-page)] pb-24 text-left sm:mx-0 sm:rounded-[28px] sm:overflow-hidden">
      {/* ── Đỉnh trang ────────────────────────────────────────────────────── */}
      <header className="hgn-hero">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="hgn-hero-kicker">
              {unread > 0 ? `${unread} thông báo chưa đọc` : "Bạn đã xem hết"}
            </p>
            <h1 className="hgn-hero-title">Thông báo</h1>
          </div>
          <button
            type="button"
            onClick={() => { hapticSelect(); onMarkAllRead?.(); }}
            disabled={unread === 0}
            className="hgn-hero-btn"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Đọc hết
          </button>
        </div>
      </header>

      {feed.length === 0 ? <EmptyState onGo={() => navigate("/member/joy")} /> : (
        <>
          {/* Chỉ hiện chip khi có nhiều hơn một lựa chọn thật. */}
          {chips.length > 1 && (
            <div className="hgn-rail">
              {chips.map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => { hapticSelect(); setFilter(chip.id); }}
                  aria-pressed={activeFilter === chip.id}
                  className="hgn-chip"
                >
                  <span className="material-symbols-outlined text-[16px]">{chip.icon}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="hgn-sheet">
            {filtered.length === 0 ? (
              <div className="hgn-card p-8 text-center">
                <p className="hgn-ink text-[15px] font-semibold">Không có gì ở mục này</p>
                <p className="hgn-dim mt-0.5 text-[13px]">Chọn một mục khác ở trên nhé.</p>
              </div>
            ) : (
              days.map(day => (
                <section key={day.bucket}>
                  <h2 className="hgn-daygroup">{day.label}</h2>
                  <div className="hgn-card hgn-divide">
                    {day.items.map(item => (
                      <NotificationRow
                        key={item.key}
                        item={item}
                        onOpen={handleOpen}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}

            <div ref={sentinelRef} className="h-1" />
            {hasMore && (
              <div className="flex justify-center py-5">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--hgn-accent)] border-t-transparent" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Trạng thái rỗng: nói rõ vì sao trống và cho một việc để làm tiếp. */
function EmptyState({ onGo }) {
  return (
    <div className="hgn-sheet">
      <div className="hgn-card px-6 py-10 text-center">
        <div className="hgn-empty-art">
          <span className="material-symbols-outlined text-[46px]">notifications_active</span>
        </div>
        <h2 className="hgn-ink mt-5 text-[17px] font-bold">Chưa có thông báo nào</h2>
        <p className="hgn-dim mx-auto mt-1.5 max-w-[30ch] text-[13.5px] leading-snug">
          Mỗi lần bạn nhận hay gửi JOY, mua gói hay có việc cần biết, nó sẽ hiện ở đây.
        </p>
        <button type="button" onClick={onGo} className="hgn-btn hgn-btn--quiet mt-5">
          <span className="material-symbols-outlined text-[19px]">toll</span>
          Mở ví JOY
        </button>
      </div>
    </div>
  );
}
