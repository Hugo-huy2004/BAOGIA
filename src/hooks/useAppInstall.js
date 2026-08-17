import { useState, useCallback, useEffect, useRef } from "react";
import memberService from "../services/classes/MemberService";
import { triggerPWAInstallDirectly } from "../utils/pwaInstallTrigger";
import { appInstallationPolicy } from "../../shared/appInstallationPolicy";

/**
 * Cài và gỡ ứng dụng — MỘT nơi duy nhất.
 *
 * Trước đây việc này có hai bản chép: `MemberUtilitiesDashboard` (cho Thư viện)
 * và `HugoArcadeTab` (cho game), mỗi bản tự ghi localStorage, tự PATCH bio, tự
 * bắn sự kiện, và đã lệch nhau (Arcade không hỏi cài PWA, Thư viện không đụng
 * kho game). Thêm Chợ vào là bản thứ ba, nên gom lại đây.
 *
 * Ba nơi lưu, phải ghi cùng lúc nếu không icon sẽ "sống lại" sau mỗi lần đồng bộ:
 *   • `hugo_installed_utilities_v2` — app đã cài
 *   • `hugo_home_screen_utilities_v1` — app có icon ngoài màn hình chính
 *   • `hugo_arcade_downloaded_v1` — kho riêng của Arcade, lưu id game TRẦN
 *     (không có tiền tố `arcade_`); đây là nơi Arcade coi là sự thật.
 * Cộng thêm `Bio.installedUtilities/homeScreenUtilities` để cài trên máy này
 * thì máy khác cũng thấy.
 */

export const INSTALLED_APPS_KEY = "hugo_installed_utilities_v2";
export const HOME_SCREEN_APPS_KEY = "hugo_home_screen_utilities_v1";
export const ARCADE_DOWNLOADS_KEY = "hugo_arcade_downloaded_v1";

export const readStoredList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeStoredList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* hết quota / chế độ riêng tư: bộ nhớ trong phiên vẫn dùng được */
  }
};

/** `arcade_chess` → `chess`, còn app thường thì null. */
export const gameIdOf = (appId) => (
  String(appId || "").startsWith("arcade_") ? String(appId).slice("arcade_".length) : null
);

/** Kho game của Arcade, quy về dạng appId đầy đủ để trộn với danh sách app. */
export const readDownloadedGameAppIds = () => (
  readStoredList(ARCADE_DOWNLOADS_KEY).map((gameId) => (
    String(gameId).startsWith("arcade_") ? String(gameId) : `arcade_${gameId}`
  ))
);

export const readInstalledApps = (bio) => appInstallationPolicy.normalizeInstalled([
  ...(Array.isArray(bio?.installedUtilities) ? bio.installedUtilities : []),
  ...readStoredList(INSTALLED_APPS_KEY),
  ...readDownloadedGameAppIds(),
]);

const rawHomeScreen = (bio) => [
  ...(Array.isArray(bio?.homeScreenUtilities) ? bio.homeScreenUtilities : []),
  ...readStoredList(HOME_SCREEN_APPS_KEY),
  ...readDownloadedGameAppIds(),
];

export const readHomeScreenApps = (bio, installed = readInstalledApps(bio)) =>
  appInstallationPolicy.normalizeHomeScreen(rawHomeScreen(bio), installed);

/** Đẩy hai danh sách lên server. Hỏng thì im lặng: bản cục bộ vẫn dùng được. */
const persist = (bio, onBioUpdate, installed, homeScreen) => {
  if (!bio?._id || bio._id === "guest") return;
  memberService.updateMemberBio(bio._id, {
    installedUtilities: installed,
    homeScreenUtilities: homeScreen,
  }).then((res) => { if (res?.bio) onBioUpdate?.(res.bio); }).catch(() => {});
};

/**
 * Sự kiện mang theo LUÔN hai danh sách đã tính. Người nghe cứ thế dùng, khỏi
 * tự suy diễn — trước đây `MemberUtilitiesDashboard` nghe thấy id rồi tự ghim
 * lên màn hình chính, nên cài "chỉ vào Thư viện" vẫn mọc ra một icon.
 */
const announce = (name, appId, installed, homeScreen) => {
  window.dispatchEvent(new CustomEvent(name, { detail: { appId, installed, homeScreen } }));
};

/** Cài xong: ghi cả ba kho, đẩy lên server, báo cho mọi màn đang mở. */
export function commitInstall(appId, { bio, onBioUpdate, addToHome = true } = {}) {
  const installed = appInstallationPolicy.normalizeInstalled([...readInstalledApps(bio), appId]);
  const current = rawHomeScreen(bio);
  const homeScreen = appInstallationPolicy.normalizeHomeScreen(
    addToHome ? [...current, appId] : current,
    installed,
  );

  writeStoredList(INSTALLED_APPS_KEY, installed);
  writeStoredList(HOME_SCREEN_APPS_KEY, homeScreen);

  const gameId = gameIdOf(appId);
  if (gameId) {
    const kho = readStoredList(ARCADE_DOWNLOADS_KEY);
    if (!kho.includes(gameId)) writeStoredList(ARCADE_DOWNLOADS_KEY, [...kho, gameId]);
  }

  persist(bio, onBioUpdate, installed, homeScreen);
  announce("hugo:app-installed", appId, installed, homeScreen);
  return { installed, homeScreen };
}

/** Gỡ: ra khỏi cả ba kho. App bắt buộc thì `canUninstall` chặn từ trước. */
export function commitUninstall(appId, { bio, onBioUpdate } = {}) {
  const installed = readInstalledApps(bio).filter((id) => id !== appId);
  const homeScreen = readHomeScreenApps(bio).filter((id) => id !== appId);

  writeStoredList(INSTALLED_APPS_KEY, installed);
  writeStoredList(HOME_SCREEN_APPS_KEY, homeScreen);

  const gameId = gameIdOf(appId);
  if (gameId) {
    writeStoredList(
      ARCADE_DOWNLOADS_KEY,
      readStoredList(ARCADE_DOWNLOADS_KEY).filter((id) => id !== gameId && id !== appId),
    );
  }

  persist(bio, onBioUpdate, installed, homeScreen);
  announce("hugo:app-uninstalled", appId, installed, homeScreen);
  return { installed, homeScreen };
}

// Thanh tiến trình giả lập — app đã nằm sẵn trong bundle, "tải" ở đây là hành
// động của người dùng chứ không phải một lượt tải mạng. Giữ vì nó cho người ta
// một khoảnh khắc thấy việc mình vừa làm đã xảy ra.
const TICK_MS = 110;
const STEP = () => Math.floor(Math.random() * 16) + 7;

/**
 * @param {object} options
 * @param {object} options.bio            hồ sơ người dùng (cần `_id` để đồng bộ)
 * @param {Function} [options.onBioUpdate] nhận bio mới sau khi server ghi xong
 * @returns {{installed: string[], progress: Record<string, number>,
 *            install: Function, uninstall: Function, isInstalled: Function}}
 */
export function useAppInstall({ bio, onBioUpdate } = {}) {
  const [installed, setInstalled] = useState(() => readInstalledApps(bio));
  const [progress, setProgress] = useState({});
  const timers = useRef({});

  // Màn khác cài/gỡ (Thư viện, Arcade, tab khác) thì màn này phải đổi theo.
  useEffect(() => {
    const sync = (e) => {
      const next = e?.detail?.installed;
      setInstalled(Array.isArray(next) ? next : readInstalledApps(bio));
    };
    window.addEventListener("hugo:app-installed", sync);
    window.addEventListener("hugo:app-uninstalled", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hugo:app-installed", sync);
      window.removeEventListener("hugo:app-uninstalled", sync);
      window.removeEventListener("storage", sync);
    };
  }, [bio]);

  useEffect(() => { setInstalled(readInstalledApps(bio)); }, [bio]);

  useEffect(() => {
    const running = timers.current;
    return () => Object.values(running).forEach(clearInterval);
  }, []);

  const install = useCallback((appId, { addToHome = true, onDone } = {}) => {
    if (!appInstallationPolicy.canInstall(appId)) return;
    if (timers.current[appId]) return;

    // Cài app trong portal cũng là lúc hợp lý để mời cài PWA lên máy.
    triggerPWAInstallDirectly().catch(() => {});
    setProgress((prev) => ({ ...prev, [appId]: 0 }));

    let value = 0;
    timers.current[appId] = setInterval(() => {
      value = Math.min(100, value + STEP());
      setProgress((prev) => ({ ...prev, [appId]: value }));
      if (value < 100) return;

      clearInterval(timers.current[appId]);
      delete timers.current[appId];
      const result = commitInstall(appId, { bio, onBioUpdate, addToHome });
      setInstalled(result.installed);
      setProgress((prev) => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
      onDone?.(result);
    }, TICK_MS);
  }, [bio, onBioUpdate]);

  const uninstall = useCallback((appId) => {
    if (!appInstallationPolicy.canUninstall(appId)) return false;
    setInstalled(commitUninstall(appId, { bio, onBioUpdate }).installed);
    return true;
  }, [bio, onBioUpdate]);

  const isInstalled = useCallback((appId) => installed.includes(appId), [installed]);

  return { installed, progress, install, uninstall, isInstalled };
}
