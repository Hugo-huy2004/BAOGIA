import { useEffect } from "react";
import { cleanEduPrefs } from "../../../../packages/shared/eduPrefs";

const CACHE_KEY = "edu.prefs";
const SOUND_KEY = "coding.sound"; // LessonPlayer đọc khoá này

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
}

/**
 * Áp cài đặt Edu lên trang: chế độ màu, âm thanh trình học. Giữ bản sao trên máy
 * để lần mở sau áp ngay, không nháy sáng→tối trong lúc chờ máy chủ.
 * Trả cỡ chữ để vỏ ngoài gắn lớp.
 */
export function useEduPrefs(serverPrefs) {
  const prefs = serverPrefs ? cleanEduPrefs(serverPrefs) : readCache();

  useEffect(() => {
    if (!prefs) return undefined;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
      localStorage.setItem(SOUND_KEY, prefs.sound ? "on" : "off");
    } catch { /* chỉ mất bản sao trên máy */ }

    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      if (prefs.theme === "system") delete root.dataset.theme;
      else root.dataset.theme = prefs.theme;
      root.classList.toggle("dark", prefs.theme === "dark" || (prefs.theme === "system" && media.matches));
    };
    apply();
    return () => { delete root.dataset.theme; };
  }, [prefs?.theme, prefs?.sound]); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ đổi khi giá trị đổi

  return prefs?.textSize || "md";
}
