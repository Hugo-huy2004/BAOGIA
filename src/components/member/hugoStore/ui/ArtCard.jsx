import { useTranslation } from "react-i18next";
import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import AppArt from "./AppArt";
import { GRADIENTS, moneyUnit, tileAction } from "../storeData";

/**
 * Thẻ minh hoạ trong băng cuộn ngang — cỡ trung, nền là gradient của chính app
 * nên mỗi thẻ một màu.
 *
 * Dùng cho băng trò chơi và băng "đang dùng dở". Nút nằm ngay trên thẻ để tải
 * hoặc mở chỉ tốn một chạm; chạm vào phần còn lại thì vào trang giới thiệu.
 */
export default function ArtCard({ entry, note, onOpenDetail, onOpen, onInstall }) {
  const { t } = useTranslation();
  const { app, ladder } = entry;
  const action = tileAction(entry);

  const label = {
    installing: `${entry.progress}%`,
    locked: ladder ? moneyUnit(ladder.rent.total) : "",
    install: t("utilities.store.app.install"),
    open: t("utilities.store.app.open"),
  }[action];

  const run = () => {
    if (action === "install") onInstall?.(entry);
    else if (action === "open") onOpen?.(entry);
    else onOpenDetail?.(app.id);
  };

  return (
    <article className="hgs-art">
      <button
        type="button"
        onClick={() => onOpenDetail?.(app.id)}
        className={`hgs-art-top bg-gradient-to-br ${GRADIENTS[app.color]}`}
      >
        <AppArt appId={app.id} />
        <UtilityAppIcon
          app={app}
          gradient=""
          size="large"
          className="hgs-hero-glyph absolute bottom-2 left-2 !h-[30px] !w-[30px] !bg-white/22"
        />
      </button>

      <div className="px-1 pt-2">
        <p className="hgs-ink line-clamp-1 text-[13.5px] font-semibold">{app.label}</p>
        <p className="hgs-dim line-clamp-1 text-[12px]">{note || app.tagline}</p>
        <button
          type="button"
          onClick={run}
          disabled={action === "installing"}
          data-action={action}
          className="hgs-get mt-2 h-[28px] w-full min-w-0 px-2 text-[13px]"
        >
          <span className="truncate">{label}</span>
        </button>
      </div>
    </article>
  );
}
