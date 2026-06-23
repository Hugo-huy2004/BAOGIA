import { useEffect, useRef } from "react";

const KEYMAP = {
  ArrowUp: "forward", w: "forward", W: "forward",
  ArrowDown: "back", s: "back", S: "back",
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
};

// Returns a ref (not state) so the per-frame physics loop can read current
// input without forcing a React re-render on every keypress — same mutable
// pattern as the touch buttons below write into.
export function useKeyboardControls() {
  const stateRef = useRef({ forward: false, back: false, left: false, right: false });

  useEffect(() => {
    const handleKey = (down) => (e) => {
      const action = KEYMAP[e.key];
      if (action) stateRef.current[action] = down;
    };
    const onDown = handleKey(true);
    const onUp = handleKey(false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return stateRef;
}
