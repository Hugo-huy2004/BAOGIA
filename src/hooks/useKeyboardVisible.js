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
