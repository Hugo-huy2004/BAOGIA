import { useEffect } from "react";

/**
 * Kính khúc xạ thật (WebGL, @ybouane/liquidglass) cho một bề mặt nổi.
 *
 * Thư viện chụp các anh em của phần tử rồi khúc xạ ảnh đó, nên `ref` phải là
 * con TRỰC TIẾP của khung chứa nội dung. `scrollSelector` là vùng cuộn trong
 * khung đó: cuộn xong thì chụp lại. Không nạp được (máy yếu, không WebGL, giảm
 * chuyển động) thì phần tử giữ nguyên kính CSS `.lg-glass` — không ai thấy lỗi.
 * ponytail: chỉ dùng cho thanh nổi; mỗi lần cuộn là một lần chụp DOM, đừng gắn cho thẻ trong danh sách.
 */
export function useLiquidGlass(ref, config, scrollSelector) {
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const el = ref.current;
    const root = el?.parentElement;
    if (!root || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;

    let instance = null;
    let cancelled = false;
    let timer = null;
    const scroller = scrollSelector ? root.querySelector(scrollSelector) : null;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => instance?.markChanged(scroller), 120);
    };

    const start = setTimeout(async () => {
      try {
        const { LiquidGlass } = await import("@ybouane/liquidglass");
        if (cancelled || el.parentElement !== root) return;
        el.dataset.config = configJson;
        const glass = await LiquidGlass.init({ root, glassElements: [el] });
        if (cancelled) { glass.destroy(); return; }
        instance = glass;
        scroller?.addEventListener("scroll", onScroll, { passive: true });
      } catch {
        // Giữ kính CSS.
      }
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(start);
      clearTimeout(timer);
      scroller?.removeEventListener("scroll", onScroll);
      try { instance?.destroy(); } catch { /* đã gỡ */ }
    };
  }, [ref, configJson, scrollSelector]);
}
