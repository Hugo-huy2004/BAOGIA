// Short tap-feedback vibration for a more "real" tactile feel on interactive
// taps. Silently no-ops where unsupported — note iOS Safari/WebKit (including
// installed PWAs) has never implemented the Vibration API, so this only has
// an effect on Android; it's still wired up everywhere since it costs nothing
// where it's unsupported.
export function triggerHaptic(durationMs = 10) {
  try {
    navigator.vibrate?.(durationMs);
  } catch (_) {}
}

// Game-interaction haptics — paired 1:1 with the playGameX() sound effects in
// audio.js so every swipe/tap/placement in HugoArcade also buzzes the phone,
// not just real <button> taps (the board/grid itself isn't a <button>, so the
// delegated listener below never sees it).
export const hapticMove = () => triggerHaptic(8);
export const hapticSelect = () => triggerHaptic(10);
export const hapticMerge = () => triggerHaptic(16);
export const hapticWin = () => { try { navigator.vibrate?.([20, 40, 20, 40, 30]); } catch (_) {} };
export const hapticLose = () => triggerHaptic(60);

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
