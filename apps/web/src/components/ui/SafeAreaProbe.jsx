/**
 * SafeAreaProbe.jsx
 *
 * Bảng đo safe-area, chỉ hiện khi URL có `?safearea=1`.
 *
 * Lý do tồn tại: iPhone không mở được console, còn env(safe-area-inset-*) thì
 * Chrome DevTools trên máy tính luôn trả 0 — không có cách nào khác để biết
 * dải trống ở đáy là do inset, do một ô trung gian thấp hơn màn, hay do chính
 * viewport ngắn. Chụp một ảnh bảng này là đủ kết luận.
 *
 * ponytail: công cụ chẩn đoán, xoá được khi hết lỗi bố cục safe-area.
 */

import { useEffect, useState } from "react";

const PROBE_STYLE = {
  position: "fixed",
  top: 0,
  left: 0,
  paddingTop: "env(safe-area-inset-top, 0px)",
  paddingRight: "env(safe-area-inset-right, 0px)",
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
  paddingLeft: "env(safe-area-inset-left, 0px)",
  visibility: "hidden",
  pointerEvents: "none",
};

function rectOf(selector) {
  const el = document.querySelector(selector);
  if (!el) return "—";
  const r = el.getBoundingClientRect();
  return `top ${Math.round(r.top)} · bottom ${Math.round(r.bottom)} · h ${Math.round(r.height)}`;
}

export default function SafeAreaProbe() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    const probe = document.createElement("div");
    Object.assign(probe.style, PROBE_STYLE);
    document.body.appendChild(probe);

    const read = () => {
      const cs = getComputedStyle(probe);
      setReport({
        insets: `T ${cs.paddingTop} · R ${cs.paddingRight} · B ${cs.paddingBottom} · L ${cs.paddingLeft}`,
        viewport: `inner ${window.innerHeight} · client ${document.documentElement.clientHeight} · visual ${Math.round(window.visualViewport?.height || 0)}`,
        display: window.matchMedia("(display-mode: fullscreen)").matches
          ? "fullscreen"
          : window.matchMedia("(display-mode: standalone)").matches
            ? "standalone"
            : "browser",
        standalonePwa: document.documentElement.classList.contains("standalone-pwa"),
        bodyPad: `${getComputedStyle(document.body).paddingTop} / ${getComputedStyle(document.body).paddingBottom}`,
        shell: rectOf(".member-portal-shell"),
        main: rectOf(".portal-mobile-main"),
        content: rectOf(".mobile-portal-content"),
        nav: rectOf(".mobile-portal-nav"),
        navTrack: rectOf(".mobile-portal-nav__track"),
      });
    };

    read();
    const id = window.setInterval(read, 1000);
    return () => {
      window.clearInterval(id);
      probe.remove();
    };
  }, []);

  if (!report) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top, 0px) + 4px)",
        left: 4,
        right: 4,
        zIndex: 99999,
        padding: 10,
        borderRadius: 12,
        background: "rgba(0,0,0,.88)",
        color: "#7CFF9E",
        font: "600 11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
      }}
    >
      {[
        `mode      ${report.display}  |  .standalone-pwa: ${report.standalonePwa}`,
        `insets    ${report.insets}`,
        `viewport  ${report.viewport}`,
        `body pad  ${report.bodyPad}`,
        `shell     ${report.shell}`,
        `main      ${report.main}`,
        `content   ${report.content}`,
        `nav       ${report.nav}`,
        `navTrack  ${report.navTrack}`,
      ].join("\n")}
    </div>
  );
}
