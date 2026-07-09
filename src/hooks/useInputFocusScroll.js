import { useEffect } from "react";

/**
 * useInputFocusScroll
 *
 * Fixes the classic mobile bug where focusing an input causes the virtual
 * keyboard to open, the browser scrolls the nearest scroll container up to
 * reveal the input — but then a React re-render (e.g. from useKeyboardInset
 * updating state) causes a layout recalculation that resets the scroll
 * position, putting the keyboard right on top of the input.
 *
 * Strategy:
 *   1. On `focusin`, save the focused element.
 *   2. Wait 350 ms — enough time for the OS keyboard animation to complete
 *      AND for any React state updates triggered by the keyboard resize to
 *      settle.
 *   3. If the same element is still focused, call scrollIntoView with
 *      block:'nearest' so the element is scrolled back into view without
 *      disrupting the user's position in the parent scroller.
 *
 * Only active on touch-capable devices (mobile/tablet). No-ops on desktop.
 * Safe to mount globally (once, in <App>).
 */
export function useInputFocusScroll() {
  useEffect(() => {
    // Only run on touch devices — desktops don't have virtual keyboards.
    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    let timeoutId = null;
    let lastFocused = null;

    const onFocusIn = (e) => {
      const el = e.target;
      const tag = el.tagName;

      // Only handle actual text-entry elements.
      if (
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        tag !== "SELECT"
      )
        return;

      // Skip inputs that don't trigger a keyboard (buttons, checkboxes, etc.)
      const inputType = (el.type || "").toLowerCase();
      const noKeyboardTypes = new Set([
        "button", "submit", "reset", "checkbox", "radio",
        "range", "color", "file", "hidden", "image",
      ]);
      if (noKeyboardTypes.has(inputType)) return;

      lastFocused = el;
      clearTimeout(timeoutId);

      // Delay must be longer than:
      //   - OS keyboard animation (~250–300 ms on iOS, ~150–200 ms on Android)
      //   - React re-render cycle triggered by visualViewport resize
      // 380 ms covers both comfortably without feeling laggy.
      timeoutId = setTimeout(() => {
        // Only act if the element is still focused (user hasn't moved on).
        if (document.activeElement === lastFocused && lastFocused) {
          lastFocused.scrollIntoView({
            block: "nearest",    // minimal scroll — just enough to show it
            inline: "nearest",
            behavior: "smooth",
          });
        }
      }, 380);
    };

    const onFocusOut = () => {
      clearTimeout(timeoutId);
      lastFocused = null;
    };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
    };
  }, []);
}
