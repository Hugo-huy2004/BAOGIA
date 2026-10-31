import { useEffect, useState } from "react";

/**
 * Portal đổi theme bằng class `dark` trên <html> (xem App.jsx), còn iosKit nhận
 * theme qua prop `scheme`. Hook này bắc cầu giữa hai bên cho mọi app HugoOS.
 */
export default function useDarkScheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
