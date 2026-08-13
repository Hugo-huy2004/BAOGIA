import { signedJoy, timeAgo, tintOf } from "./notificationModel";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../../i18n/languages";

const DIRECTION_ICON = { in: "arrow_downward", out: "arrow_upward" };

/** Chữ cái đầu của tên, dùng khi người đó không có ảnh. */
const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();

/**
 * Một dòng thông báo.
 *
 * Chưa đọc và đã đọc phải nhìn phát biết ngay, nên khác nhau ở BA điểm cùng
 * lúc: chấm tròn màu bên phải, tiêu đề đậm, và vòng icon tô màu đặc. Dòng đã
 * đọc thì icon chuyển sang xám nhạt và cả dòng mờ đi.
 *
 * `index` chỉ dùng để lệch giờ chạy hiệu ứng trôi vào, cho danh sách đổ xuống
 * lần lượt thay vì hiện bụp một lúc.
 */
export default function NotificationRow({ item, index = 0, onOpen, onAction, onDismiss }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "vi";
  const locale = localeForLanguage(language);
  const isMoney = item.direction !== "none";
  const tint = tintOf(item);
  const icon = DIRECTION_ICON[item.direction] || item.icon || "notifications";

  return (
    <div
      className="hgn-row hgn-row-enter"
      data-unread={!item.read}
      style={{ animationDelay: `${Math.min(index, 9) * 45}ms`, "--hgn-row-tint": tint }}
    >
      <span className="hgn-dir" data-dir={item.direction} data-unread={!item.read}>
        <span className="material-symbols-outlined text-[19px]">{icon}</span>
        {item.counterparty && (
          <span className="hgn-dir-avatar" aria-hidden="true">{initial(item.counterparty)}</span>
        )}
      </span>

      {/* Cả dòng là một nút: chạm là đánh dấu đã đọc, có đích thì đi luôn.
          Trước đây còn thêm nút mũi tên riêng nằm dưới nút đóng, xếp dọc thành
          một cột cao gần 100px toàn khoảng trắng. */}
      <button
        type="button"
        onClick={() => (item.actionUrl ? onAction?.(item) : onOpen?.(item))}
        className="hgn-row-copy min-w-0 flex-1 text-left"
      >
        <span className="hgn-row-head">
          <span className="hgn-row-title">{item.title}</span>
          <span className="hgn-row-meta">
            {isMoney && <span className="hgn-amount" data-dir={item.direction}>{signedJoy(item.amount, language)}</span>}
            <span className="hgn-dim text-[11.5px]">{timeAgo(item.at, new Date(), language)}</span>
            {!item.read && <span className="hgn-unread-dot" />}
          </span>
        </span>

        {item.message && (
          <span className="hgn-dim mt-0.5 line-clamp-2 block text-[13px] leading-snug">{item.message}</span>
        )}

        {/* Số liệu là field riêng, không phải chữ bóc từ câu ra. */}
        {(item.balanceAfter != null || item.refCode) && (
          <span className="hgn-dim mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px]">
            {item.balanceAfter != null && (
              <span>
                {t("memberPortal.notificationCenter.balance", {
                  value: Number(item.balanceAfter).toLocaleString(locale),
                })}
              </span>
            )}
            {item.refCode && <span className="font-mono">{item.refCode}</span>}
          </span>
        )}
      </button>

      {item.dismissible && (
        <button
          type="button"
          onClick={() => onDismiss?.(item)}
          aria-label={t("memberPortal.notificationCenter.dismiss", { title: item.title })}
          className="hgn-dismiss"
        >
          <span className="material-symbols-outlined text-[17px]">close</span>
        </button>
      )}
    </div>
  );
}
