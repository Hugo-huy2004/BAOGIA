// The Capacitor Haptics plugin, handed over by NativeShell in the store
// builds. Null on the web, where navigator.vibrate is all there is.
let nativeHaptics = null;

/** @param {object} plugin the `@capacitor/haptics` module */
export function setNativeHaptics(plugin) {
  nativeHaptics = plugin;
}

// Short tap-feedback vibration for a more "real" tactile feel on interactive
// taps. Silently no-ops where unsupported — note iOS Safari/WebKit (including
// installed PWAs) has never implemented the Vibration API, so on the web this
// only has an effect on Android; it's still wired up everywhere since it costs
// nothing where it's unsupported. The native builds route through Capacitor
// instead, which is the only way to get a buzz out of iOS.
export function triggerHaptic(durationMs = 10) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    if (nativeHaptics) {
      const { Haptics, ImpactStyle } = nativeHaptics;
      if (Array.isArray(durationMs)) {
        // ponytail: patterns collapse to one buzz — iOS ignores duration
        // anyway. Sequence them with awaited impacts if a pattern ever needs
        // to be distinguishable by feel.
        Haptics.vibrate({ duration: durationMs.reduce((a, b) => a + b, 0) }).catch(() => {});
      } else {
        const style = durationMs <= 10 ? ImpactStyle.Light
          : durationMs <= 30 ? ImpactStyle.Medium
            : ImpactStyle.Heavy;
        Haptics.impact({ style }).catch(() => {});
      }
      return;
    }
    navigator.vibrate?.(durationMs);
  } catch { /* ignore */ }
}

// Game-interaction haptics — paired 1:1 with the playGameX() sound effects in
// audio.js so every swipe/tap/placement in HugoArcade also buzzes the phone,
// not just real <button> taps (the board/grid itself isn't a <button>, so the
// delegated listener below never sees it).
export const hapticMove = () => triggerHaptic(8);
export const hapticSelect = () => triggerHaptic(10);
export const hapticMerge = () => triggerHaptic(16);
export const hapticWin = () => triggerHaptic([20, 40, 20, 40, 30]);
export const hapticLose = () => triggerHaptic(60);
export const hapticPaymentSuccess = () => triggerHaptic([15, 30, 25, 45, 10]);
export const hapticPinTap = () => triggerHaptic(6);
export const hapticQrScan = () => triggerHaptic([10, 20, 10]);

// Delegated, app-wide tap haptic — fires once on pointerdown for any element
// that is or sits inside a clickable control, instead of having to wire
// triggerHaptic() into every individual onClick by hand.
const INTERACTIVE_SELECTOR = 'button, a, [role="button"], [role="tab"], [role="switch"], input[type="checkbox"], input[type="radio"], select, summary';

export function initGlobalHaptics() {
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse") return; // taps only — mouse clicks don't need vibration
    const target = e.target.closest?.(INTERACTIVE_SELECTOR);
    if (!target || target.disabled) return;
    triggerHaptic(8);
  };
  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => document.removeEventListener("pointerdown", onPointerDown);
}
