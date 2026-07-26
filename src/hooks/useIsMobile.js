import { useEffect, useState } from "react";

// Width handles phones and tablet split-view; the second clause keeps a phone
// in landscape on the mobile navigation instead of squeezing a desktop
// sidebar into a short touch viewport.
const QUERY = "(max-width: 767px), (max-height: 500px) and (pointer: coarse)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
