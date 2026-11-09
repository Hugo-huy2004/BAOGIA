import { useEffect, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../../../pages/public/landing.css";

/**
 * Hiệu ứng cuộn của trang Dịch vụ (/services), 08/11/2026. Trang Giới thiệu (/)
 * là bản chép portfolio ở pages/public/portfolio, có kịch bản riêng.
 *
 * motion lo hiệu ứng VÀO cảnh; GSAP lo mọi thứ BÁM theo cuộn. Hai thư viện
 * không bao giờ cùng ghi transform một phần tử.
 *
 * Cảnh ghim chỉ chạy trên màn rộng; điện thoại cuộn tự nhiên với hiệu ứng nhẹ.
 * Giảm chuyển động: không ghim, không scrub — mọi thứ đứng ở trạng thái cuối.
 */
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Cho trang cuộn bằng cửa sổ thay vì #root (xem html.doc-scroll ở index.css).
 * Đặt làm CON ĐẦU TIÊN của trang: layout effect của nó chạy trước mọi
 * ScrollTrigger của các cảnh phía sau, nên chúng đo đúng khung cuộn.
 */
export function DocScroll() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById("root");
    const y = root?.scrollTop || 0;
    html.classList.add("doc-scroll");
    window.scrollTo(0, y);
    return () => {
      const back = window.scrollY;
      html.classList.remove("doc-scroll");
      if (root) root.scrollTop = back;
      ScrollTrigger.defaults({ scroller: window });
    };
  }, []);
  return null;
}
export const ease = [0.16, 1, 0.3, 1];
const DESKTOP = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";
const PHONE = "(max-width: 899px) and (prefers-reduced-motion: no-preference)";

export const wipe = {
  hidden: { clipPath: "inset(-20% 100% -20% 0)" },
  show: (i) => ({ clipPath: "inset(-20% -5% -20% 0)", transition: { delay: i * 0.18, duration: 1.1, ease } }),
};

export function useStory(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    ScrollTrigger.defaults({ scroller: window }); // trang bật <DocScroll/>: cuộn bằng cửa sổ
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Ba gói: dọc thành ngang; máy lật vào khi khung tới giữa.
      mm.add(DESKTOP, () => {
        const track = root.querySelector(".hs-packs__track");
        const distance = () => track.scrollWidth - window.innerWidth;
        const slide = gsap.to(track, { x: () => -distance(), ease: "none",
          scrollTrigger: { trigger: ".hs-packs", start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(".hs-packs__bar i", { scaleX: self.progress }) } });
        gsap.utils.toArray(".hs-pack", root).forEach((pack) => {
          gsap.from(pack.querySelector(".hs-pack__art"), { rotateY: -38, x: 160, opacity: 0.2, ease: "none",
            scrollTrigger: { trigger: pack, containerAnimation: slide, start: "left 95%", end: "left 35%", scrub: true } });
          gsap.from(pack.querySelectorAll(".hs-pack__copy > *"), { y: 40, opacity: 0, stagger: 0.06, ease: "none",
            scrollTrigger: { trigger: pack, containerAnimation: slide, start: "left 85%", end: "left 45%", scrub: true } });
        });
      });

      // Điện thoại: ba gói xếp chồng — thẻ dính màn, thẻ sau trượt lên đè, thẻ
      // trước lùi lại và tối đi; máy lật vào; tiêu đề mở đầu trôi lên mờ dần.
      mm.add(PHONE, () => {
        gsap.to(".hs-top h1, .hs-top__lede", { yPercent: -25, opacity: 0.25, ease: "none",
          scrollTrigger: { trigger: ".hs-top", start: "top top", end: "bottom top", scrub: true } });
        const packs = gsap.utils.toArray(".hs-pack", root);
        packs.forEach((pack, i) => {
          if (i < packs.length - 1) {
            // Thẻ cao hơn màn vẫn cuộn hết rồi mới dính (top âm = màn − chiều cao thẻ).
            gsap.set(pack, { position: "sticky", top: () => Math.min(72, window.innerHeight - pack.offsetHeight) });
            // Chỉ lùi nhỏ lại, không làm tối: thẻ màu phải luôn sáng (user 09/11).
            gsap.fromTo(pack, { scale: 1 }, { scale: 0.92, ease: "none", transformOrigin: "50% 0",
              scrollTrigger: { trigger: packs[i + 1], start: "top bottom", end: "top 25%", scrub: true } });
          }
          // Chữ không mờ theo cuộn (khách đọc giữa chừng thấy chữ nhạt); chỉ hình sticker bật vào.
          gsap.from(pack.querySelector(".hs-pack__glyph"), { scale: 0.6, rotate: -8, duration: 0.7, ease: "back.out(2.2)",
            scrollTrigger: { trigger: pack, start: "top 80%", toggleActions: "play none none reverse" } });
        });
        return () => gsap.set(packs, { clearProps: "position,top,filter,transform" });
      });

      // Quy trình: sợi chỉ vẽ dần, các bước hiện khi chỉ chạm tới; tiêu đề trồi lên.
      mm.add(`${DESKTOP}, ${PHONE}`, () => {
        gsap.fromTo(".hs-process__thread path", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none",
          scrollTrigger: { trigger: ".hs-process__body", start: "top 70%", end: "bottom 60%", scrub: true } });
        gsap.utils.toArray(".hs-step", root).forEach((step) => {
          gsap.from(step, { x: 60, opacity: 0, clipPath: "inset(0 0 0 100%)", duration: 1, ease: "expo.out",
            scrollTrigger: { trigger: step, start: "top 78%", toggleActions: "play none none reverse" } });
        });
        gsap.utils.toArray(".hs-rise", root).forEach((el) => {
          gsap.from(el, { yPercent: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [rootRef]);
}
