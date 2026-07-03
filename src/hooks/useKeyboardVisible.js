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
// Updates are rAF-batched and sub-pixel noise is ignored so the value doesn't
// jitter (the flaw that sank earlier attempts). Callers should animate the
// offset with a CSS transform + transition, never by changing layout height.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = null;
    const compute = () => {
      raf = null;
      const next = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    };
    const schedule = () => { if (raf == null) raf = requestAnimationFrame(compute); };

    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    compute();
    return () => {
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return inset;
}
