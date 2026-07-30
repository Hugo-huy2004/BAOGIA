import { signedJoy, timeAgo } from "./notificationModel";

const DIRECTION_ICON = { in: "arrow_downward", out: "arrow_upward" };

/** Chữ cái đầu của tên, dùng khi người đó không có ảnh. */
const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();

/**
 * Một dòng thông báo.
 *
 * Giao dịch thì vòng tròn bên trái mang mũi tên hướng tiền (xuống = vào ví,
 * lên = ra khỏi ví) và số JOY nằm bên phải. Thông báo thường thì vòng tròn
 * mang icon theo loại và bên phải chỉ có thời gian.
 */
export default function NotificationRow({ item, onOpen, onDismiss }) {
  const isMoney = item.direction !== "none";

  return (
    <div className="hgn-row" data-unread={!item.read}>
      <span className="hgn-dir" data-dir={item.direction}>
        <span className="material-symbols-outlined text-[19px]">
          {DIRECTION_ICON[item.direction] || item.icon || "notifications"}
        </span>
        {item.counterparty && (
          <span className="hgn-dir-avatar" aria-hidden="true">{initial(item.counterparty)}</span>
        )}
      </span>

      <button
        type="button"
        onClick={() => onOpen?.(item)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="hgn-ink text-[14.5px] font-semibold leading-snug">{item.title}</p>

        {item.message && (
          <p className="hgn-dim mt-0.5 line-clamp-2 text-[13px] leading-snug">{item.message}</p>
        )}

        {/* Số liệu là field riêng, không phải chữ bóc từ câu ra. */}
        {(item.balanceAfter != null || item.refCode) && (
          <span className="hgn-dim mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px]">
            {item.balanceAfter != null && (
              <span>Số dư {Number(item.balanceAfter).toLocaleString("vi-VN")} JOY</span>
            )}
            {item.refCode && <span className="font-mono">{item.refCode}</span>}
          </span>
        )}
      </button>

      <span className="flex shrink-0 flex-col items-end gap-1 pl-1">
        {isMoney && (
          <span className="hgn-amount" data-dir={item.direction}>{signedJoy(item.amount)}</span>
        )}
        <span className="hgn-dim text-[11.5px]">{timeAgo(item.at)}</span>
        {item.dismissible && (
          <button
            type="button"
            onClick={() => onDismiss?.(item)}
            aria-label={`Xoá thông báo: ${item.title}`}
            className="hgn-dim -mr-1 flex h-8 w-8 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </span>
    </div>
  );
}
