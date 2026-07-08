import { useEffect, useState } from "react";

// Mobile on-screen keyboards shrink the visualViewport (not the layout
// viewport), which is exactly what makes `position: fixed` bottom bars jump
// around as the keyboard opens/closes — the fixed element keeps recomputing
// against a viewport that's resizing out from under it. Watching the gap
// between layout height and visualViewport height lets callers just hide
// that fixed bar while the keyboard is up instead of fighting the jitter.
export function useKeyboardVisible(threshold = 150) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const gap = window.innerHeight - vv.height;
      setVisible(gap > threshold);
    };

    vv.addEventListener("resize", handleResize);
    handleResize();
    return () => vv.removeEventListener("resize", handleResize);
  }, [threshold]);

  return visible;
}

// Returns the pixel height the on-screen keyboard currently overlaps the
// bottom of the viewport (0 when hidden). Unlike useKeyboardVisible (a
// boolean), this gives the exact offset so a chat input can be lifted to sit
// flush above the keyboard — the smooth, Viber-like behaviour.
//
// Works on both platforms with one calculation:
//   • Android (interactive-widget=resizes-content): the layout viewport itself
//     shrinks with the keyboard, so vv.height ≈ innerHeight → inset ≈ 0, and the
//     input's normal bottom:0 already sits above the keyboard. No double-lift.
//   • iOS Safari (ignores interactive-widget): layout stays full-height, only
//     the visualViewport shrinks → inset = keyboard height → we lift the input.
//
// The standards-track PWA way: the VirtualKeyboard API. When available
// (Chrome/Edge on Android), the browser exposes the keyboard as a CSS
// environment variable — env(keyboard-inset-height) — updated on the
// COMPOSITOR thread, so a bar positioned with it rides the keyboard animation
// with zero JS and zero jank. We opt in once here; callers then position with
// CSS env() instead of a JS transform.
export const hasVirtualKeyboardAPI =
  typeof navigator !== "undefined" && "virtualKeyboard" in navigator;

export function useVirtualKeyboardOptIn() {
  useEffect(() => {
    if (!hasVirtualKeyboardAPI) return;
    try { navigator.virtualKeyboard.overlaysContent = true; } catch { /* ignore */ }
  }, []);
  return hasVirtualKeyboardAPI;
}

// Updates are rAF-batched and sub-pixel noise is ignored so the value doesn't
// jitter (the flaw that sank earlier attempts). Callers should animate the
// offset with a CSS transform + transition, never by changing layout height.
//
// iOS Safari note: when an input is focused the browser scrolls the page up
// so the input is visible. This sets vv.offsetTop to a non-zero value during
// the animation. We must NOT include vv.offsetTop in the inset calculation —
// it represents page scroll position, not keyboard height. The keyboard height
// is the gap between innerHeight and vv.height only.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = null;
    // Suppress scroll-triggered recomputes for 300 ms after a focus event.
    // On iOS, focusing an input causes the browser to auto-scroll the page,
    // which fires vv "scroll" — but at that moment vv.height hasn't changed yet
    // so we'd incorrectly compute inset = 0 and snap the UI back down.
    let suppressUntil = 0;

    const compute = () => {
      raf = null;
      // Keyboard height = how much the visual viewport shrank vs the layout viewport.
      // DO NOT subtract vv.offsetTop — that's page scroll, not keyboard height.
      const next = Math.max(0, window.innerHeight - vv.height);
      setInset((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    };

    const scheduleResize = () => {
      if (raf == null) raf = requestAnimationFrame(compute);
    };

    const scheduleScroll = () => {
      if (Date.now() < suppressUntil) return;
      if (raf == null) raf = requestAnimationFrame(compute);
    };

    const onFocus = () => { suppressUntil = Date.now() + 300; };

    vv.addEventListener("resize", scheduleResize);
    vv.addEventListener("scroll", scheduleScroll);
    document.addEventListener("focusin", onFocus, true);
    compute();
    return () => {
      vv.removeEventListener("resize", scheduleResize);
      vv.removeEventListener("scroll", scheduleScroll);
      document.removeEventListener("focusin", onFocus, true);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return inset;
}
