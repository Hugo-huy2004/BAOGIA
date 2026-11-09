import { useEffect } from "react";

// Baloo 2 + Xanh Mono (trang đối tác) và Bricolage Grotesque + Nunito (trang
// chủ, theo portfolio) chỉ dùng ở vài trang, nên nạp tại chỗ thay vì nhét vào
// index.html cho mọi trang cùng gánh.
const SERVICES_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Xanh+Mono:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Nunito:wght@300;400;600;700;800;900&display=swap";

export function useServicesFonts() {
  useEffect(() => {
    if (document.getElementById("services-fonts")) return;
    const link = document.createElement("link");
    link.id = "services-fonts";
    link.rel = "stylesheet";
    link.href = SERVICES_FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}
