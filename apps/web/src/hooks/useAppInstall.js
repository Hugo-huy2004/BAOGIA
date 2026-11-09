import memberService from "../services/classes/MemberService";
import { appInstallationPolicy } from "../../../../packages/shared/appInstallationPolicy";

/**
 * Cài và gỡ ứng dụng — MỘT nơi duy nhất.
 *
 * Hai nơi lưu, phải ghi cùng lúc nếu không icon sẽ "sống lại" sau mỗi lần đồng bộ:
 *   • `hugo_installed_utilities_v2` — app đã cài
 *   • `hugo_home_screen_utilities_v1` — app có icon ngoài màn hình chính
 * Cộng thêm `Bio.installedUtilities/homeScreenUtilities` để cài trên máy này
 * thì máy khác cũng thấy.
 */

export const INSTALLED_APPS_KEY = "hugo_installed_utilities_v2";
export const HOME_SCREEN_APPS_KEY = "hugo_home_screen_utilities_v1";

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

const readInstalledApps = (bio) => appInstallationPolicy.normalizeInstalled([
  ...(Array.isArray(bio?.installedUtilities) ? bio.installedUtilities : []),
  ...readStoredList(INSTALLED_APPS_KEY),
]);

const rawHomeScreen = (bio) => [
  ...(Array.isArray(bio?.homeScreenUtilities) ? bio.homeScreenUtilities : []),
  ...readStoredList(HOME_SCREEN_APPS_KEY),
];

const readHomeScreenApps = (bio, installed = readInstalledApps(bio)) =>
  appInstallationPolicy.normalizeHomeScreen(rawHomeScreen(bio), installed);

/** Đẩy hai danh sách lên server. Hỏng thì im lặng: bản cục bộ vẫn dùng được. */
const persist = (bio, onBioUpdate, installed, homeScreen) => {
  if (!bio?._id || bio._id === "guest") return;
  memberService.updateMemberBio(bio._id, {
    installedUtilities: installed,
    homeScreenUtilities: homeScreen,
  }).then((res) => { if (res?.bio) onBioUpdate?.(res.bio); }).catch(() => {});
};

/** Sự kiện mang theo LUÔN hai danh sách đã tính, người nghe cứ thế dùng. */
const announce = (name, appId, installed, homeScreen) => {
  window.dispatchEvent(new CustomEvent(name, { detail: { appId, installed, homeScreen } }));
};

/** Cài xong: ghi cả hai kho, đẩy lên server, báo cho mọi màn đang mở. */
export function commitInstall(appId, { bio, onBioUpdate, addToHome = true } = {}) {
  const installed = appInstallationPolicy.normalizeInstalled([...readInstalledApps(bio), appId]);
  const current = rawHomeScreen(bio);
  const homeScreen = appInstallationPolicy.normalizeHomeScreen(
    addToHome ? [...current, appId] : current,
    installed,
  );

  writeStoredList(INSTALLED_APPS_KEY, installed);
  writeStoredList(HOME_SCREEN_APPS_KEY, homeScreen);
  persist(bio, onBioUpdate, installed, homeScreen);
  announce("hugo:app-installed", appId, installed, homeScreen);
  return { installed, homeScreen };
}

/** Gỡ: ra khỏi cả hai kho. App bắt buộc thì `canUninstall` chặn từ trước. */
export function commitUninstall(appId, { bio, onBioUpdate } = {}) {
  const installed = readInstalledApps(bio).filter((id) => id !== appId);
  const homeScreen = readHomeScreenApps(bio).filter((id) => id !== appId);

  writeStoredList(INSTALLED_APPS_KEY, installed);
  writeStoredList(HOME_SCREEN_APPS_KEY, homeScreen);
  persist(bio, onBioUpdate, installed, homeScreen);
  announce("hugo:app-uninstalled", appId, installed, homeScreen);
  return { installed, homeScreen };
}
