import { useEffect, useState } from "react";

const QUERY = "(max-width: 767px)";

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
