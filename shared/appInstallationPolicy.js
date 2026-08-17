export const REQUIRED_APP_IDS = Object.freeze([
  'store',
  'bio',
  'study',
  'team',
  'psychology',
  'radio',
  'handle',
  'info',
  'joy_wallet',
]);

// Các app đã ngừng hoạt động phải bị lọc cả khỏi dữ liệu cũ trong MongoDB và
// localStorage, nếu không icon "ma" vẫn quay lại sau mỗi lần đồng bộ.
// 'helpdesk' đã gộp vào 'handle' (HugoKit): icon cũ phải biến mất khỏi kho và
// màn hình chính, còn đường dẫn cũ thì vẫn mở HugoKit (xem MemberUtilitiesTab).
export const RETIRED_APP_IDS = Object.freeze(['deco', 'map', 'hugoskin', 'ide', 'hugoso', 'helpdesk']);
const RETIRED_APP_SET = new Set(RETIRED_APP_IDS);

export class AppInstallationPolicy {
  constructor(requiredAppIds = REQUIRED_APP_IDS) {
    this.requiredAppIds = Object.freeze([...new Set(requiredAppIds)]);
    this.requiredSet = new Set(this.requiredAppIds);
  }

  isRequired(appId) {
    return this.requiredSet.has(String(appId || ''));
  }

  isOptional(appId) {
    return !this.isRequired(appId);
  }

  // App đã khai tử vẫn là "optional", nhưng `normalizeInstalled` lọc nó ra —
  // nên nếu chỗ gọi tin vào `canInstall` thì nút Tải bấm xong sẽ không có gì
  // xảy ra. Chặn ngay tại đây để mọi màn cùng hiểu một luật.
  canInstall(appId) {
    return Boolean(appId) && this.isOptional(appId) && !RETIRED_APP_SET.has(String(appId));
  }

  canUninstall(appId) {
    return Boolean(appId) && this.isOptional(appId);
  }

  normalizeInstalled(appIds = []) {
    const requested = Array.isArray(appIds)
      ? appIds.filter((appId) => appId && !RETIRED_APP_SET.has(String(appId)))
      : [];
    return [...new Set([...this.requiredAppIds, ...requested])];
  }

  normalizeHomeScreen(appIds = [], installedAppIds = []) {
    const installed = new Set(this.normalizeInstalled(installedAppIds));
    const requested = Array.isArray(appIds)
      ? appIds.filter((appId) => installed.has(appId))
      : [];
    return [...new Set([...this.requiredAppIds, ...requested])];
  }

  classify(appId) {
    return this.isRequired(appId) ? 'required' : 'optional';
  }
}

export const appInstallationPolicy = new AppInstallationPolicy();
