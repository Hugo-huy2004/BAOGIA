import { useTranslation } from "react-i18next";
import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import AppArt from "./AppArt";
import { GRADIENTS, moneyUnit, tileAction } from "../storeData";

/**
 * Thẻ lớn nhiều màu ở đầu trang — mảng nội dung bắt mắt nhất của cửa hàng.
 *
 * Nền là chính gradient của app đó, nên mỗi thẻ một màu và cả băng thẻ trông
 * như một dải nhiều màu. Không có ảnh minh hoạ nào bịa ra: hình duy nhất trên
 * thẻ là icon thật của app, phóng lớn.
 *
 * Dòng nhãn trên cùng nói TRẠNG THÁI THẬT (miễn phí / đang dùng thử còn mấy
 * ngày / giá thuê), không phải "Sự kiện đặc biệt" hay "Sắp hết hàng".
 */
export default function HeroCard({ entry, onOpenDetail, onOpen, onInstall }) {
  const { t } = useTranslation();
  const { app } = entry;
  const action = tileAction(entry);

  const label = {
    installing: t("utilities.store.app.installing", { percent: entry.progress }),
    locked: t("utilities.store.app.see"),
    install: t("utilities.store.app.install"),
    open: t("utilities.store.app.open"),
  }[action];

  const run = () => {
    if (action === "install") onInstall?.(entry);
    else if (action === "open") onOpen?.(entry);
    else onOpenDetail?.(app.id);
  };

  return (
    <article className={`hgs-hero bg-gradient-to-br ${GRADIENTS[app.color]}`}>
      <button type="button" onClick={() => onOpenDetail?.(app.id)} className="block w-full text-left">
        <AppArt appId={app.id} />

        <div className="flex items-center gap-3 px-4 pb-1 pt-2">
          <UtilityAppIcon
            app={app}
            gradient=""
            size="large"
            className="hgs-hero-glyph !h-[52px] !w-[52px] !bg-white/20"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-white/75">
              {eyebrow(t, entry)}
            </p>
            <h3 className="truncate text-[20px] font-bold leading-tight tracking-[-0.02em] text-white">
              {app.label}
            </h3>
            <p className="line-clamp-1 text-[13px] leading-snug text-white/80">{app.tagline}</p>
          </div>
        </div>
      </button>

      <div className="px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={run}
          disabled={action === "installing"}
          className="hgs-hero-btn"
        >
          {label}
        </button>
      </div>
    </article>
  );
}

/** Nhãn nhỏ trên tên app — chỉ nói điều đang đúng. */
function eyebrow(t, { ladder, state }) {
  if (!ladder) return t("utilities.store.app.free");
  if (state?.tier === "own") return t("utilities.store.app.owned");
  if (state?.tier === "trial") return t("utilities.store.expiring.trial");
  if (state?.tier === "rent") return t("utilities.store.expiring.rent");
  return moneyUnit(ladder.rent.total);
}
