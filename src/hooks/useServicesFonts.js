import { useEffect } from "react";

// Baloo 2 (chữ tròn) + Xanh Mono (chữ đánh máy) chỉ dùng ở trang Dịch vụ và
// Hugo Edu+, nên nạp tại chỗ thay vì nhét vào index.html cho mọi trang cùng gánh.
const SERVICES_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Xanh+Mono:ital@0;1&display=swap";

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
