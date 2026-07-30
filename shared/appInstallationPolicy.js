export const REQUIRED_APP_IDS = Object.freeze([
  'store',
  'bio',
  'ide',
  'hugoso',
  'team',
  'psychology',
  'radio',
  'helpdesk',
  'handle',
  'info',
  'joy_wallet',
  'map',
]);

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

  canInstall(appId) {
    return Boolean(appId) && this.isOptional(appId);
  }

  canUninstall(appId) {
    return Boolean(appId) && this.isOptional(appId);
  }

  normalizeInstalled(appIds = []) {
    const requested = Array.isArray(appIds) ? appIds.filter(Boolean) : [];
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
