import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import UtilityAppIcon from "./UtilityAppIcon";
import { prefetchChunk } from "../../../utils/chunkPrefetcher";

/**
 * Đầu Trang chủ HugoOS: ngày hôm nay, lời chào theo giờ và hàng "Gần đây".
 *
 * Hàng Gần đây đọc nhật ký mở app (os/appUsage) mà Spotlight vẫn dùng, nên
 * không thêm nguồn dữ liệu nào. Ẩn hẳn khi chưa mở app nào: một hàng rỗng chỉ
 * là khoảng trống có tiêu đề.
 */
const LOCALES = { vi: "vi-VN", en: "en-US", zh: "zh-CN", nom: "vi-VN" };

// Bản dịch đầy đủ nạp sau bản lõi; trong khoảnh khắc đó vẫn phải ra chữ, không ra khoá.
const GREETING_FALLBACK = { morning: "Chào buổi sáng", afternoon: "Chào buổi chiều", evening: "Chào buổi tối", night: "Khuya rồi" };

const partOfDay = (hour) => (hour < 5 ? "night" : hour < 11 ? "morning" : hour < 18 ? "afternoon" : hour < 22 ? "evening" : "night");

function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Căn đúng đầu phút rồi mới chạy theo phút: đồng hồ không lệch tới 59 giây.
    let interval = null;
    const align = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(align);
      if (interval) window.clearInterval(interval);
    };
  }, []);
  return now;
}

export default function HomeHeader({ name }) {
  const { t, i18n } = useTranslation();
  const now = useMinuteClock();
  const locale = LOCALES[i18n.resolvedLanguage] || LOCALES[i18n.language] || "vi-VN";
  const dateLabel = useMemo(
    () => now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }),
    [now, locale],
  );
  // Tên Việt gọi bằng chữ cuối (Nguyễn Văn An → An), tên Tây bằng chữ đầu.
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const vietnamese = ["vi", "nom"].includes(i18n.resolvedLanguage || i18n.language);
  const firstName = vietnamese ? parts.at(-1) : parts[0];
  const greeting = t(`utilities.home.greeting.${partOfDay(now.getHours())}`, GREETING_FALLBACK[partOfDay(now.getHours())]);

  return (
    <header className="hugo-home-header">
      <p className="hugo-home-header__date">{dateLabel}</p>
      <h1 className="hugo-home-header__greeting">
        {greeting}{firstName ? <>, <span>{firstName}</span></> : null}
      </h1>
    </header>
  );
}

export function RecentApps({ apps, gradients, onOpen }) {
  const { t } = useTranslation();
  if (apps.length === 0) return null;
  return (
    <section className="hugo-home-recent" aria-label={t("utilities.home.recent", "Gần đây")}>
      <h2 className="hugo-home-recent__title">{t("utilities.home.recent", "Gần đây")}</h2>
      <ul className="hugo-home-recent__list">
        {apps.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              className="hugo-home-recent__item"
              onPointerEnter={() => prefetchChunk(app.id)}
              onPointerDown={() => prefetchChunk(app.id)}
              onClick={(event) => onOpen(app, event.currentTarget.querySelector(".utility-app-icon"))}
            >
              <UtilityAppIcon app={app} gradient={gradients[app.tint] || gradients.indigo} size="small" />
              <span className="hugo-home-recent__label">{app.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
