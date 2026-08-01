/**
 * Stand-in for `virtual:pwa-register/react` in native builds.
 *
 * That virtual module only exists while the VitePWA plugin runs, and the native
 * build deliberately drops the plugin. Aliasing to this stub keeps
 * PWAUpdatePrompt compiling untouched; it simply never reports an update,
 * which is correct — store builds update through the store, not a service
 * worker.
 */
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker: () => Promise.resolve(),
  };
}
