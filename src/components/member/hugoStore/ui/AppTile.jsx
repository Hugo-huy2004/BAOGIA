import { useTranslation } from "react-i18next";
import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import { GRADIENTS, moneyUnit, tileAction } from "../storeData";

/**
 * Một ô trong lưới.
 *
 * Chạm vào icon/tên mở trang giới thiệu; chạm vào nút thì làm luôn việc của nút
 * — giống mọi cửa hàng ứng dụng, và nhờ vậy tải một app chỉ tốn một chạm. Hai
 * nút nằm cạnh nhau chứ không lồng nhau: nút trong nút là HTML không hợp lệ và
 * trình đọc màn hình đọc ra thành một mớ.
 */
export default function AppTile({ entry, onOpenDetail, onOpen, onInstall }) {
  const { t } = useTranslation();
  const { app } = entry;
  const action = tileAction(entry);

  const label = {
    installing: `${entry.progress}%`,
    locked: entry.ladder ? moneyUnit(entry.ladder.rent.total) : "",
    install: t("utilities.store.app.install"),
    open: t("utilities.store.app.open"),
  }[action];

  const run = () => {
    if (action === "install") onInstall?.(entry);
    else if (action === "open") onOpen?.(entry);
    else onOpenDetail?.(app.id);
  };

  return (
    <div className="hgs-tile">
      <button
        type="button"
        onClick={() => onOpenDetail?.(app.id)}
        className="flex w-full flex-col items-center gap-1.5"
      >
        <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="large" />
        <span className="hgs-ink line-clamp-2 w-full text-[12px] font-medium leading-tight">
          {app.label}
        </span>
      </button>

      <button
        type="button"
        onClick={run}
        disabled={action === "installing"}
        data-action={action}
        className="hgs-get h-[26px] min-w-0 max-w-full px-3 text-[13px]"
      >
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
