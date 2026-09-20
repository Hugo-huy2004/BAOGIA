import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IosApp, NavBar, Scroll, Segmented, TabBar } from "../../demos/iosKit";
import useDarkScheme from "./useDarkScheme";
import { appPalette } from "./appPalette";

/**
 * HugoOS — khung ứng dụng dùng chung.
 *
 * Trước đây mỗi app trong portal tự dựng chrome riêng: HugoKit dùng iosKit,
 * Cinema tự vẽ tab bar, Supporter thì không có gì cả. Cùng một portal mà mỗi
 * app một cỡ chữ, một kiểu nút quay lại, một cách chừa safe-area — đó là gốc
 * của cảm giác "UI yếu", không phải thiếu hiệu ứng.
 *
 * AppFrame khoá lại một bộ chrome duy nhất cho mọi app: nav bar tiêu đề lớn,
 * nút quay lại chung, vùng cuộn, tab bar dưới. App chỉ còn khai báo tab và nội
 * dung. Muốn thêm tính năng thì thêm một tab, không phải dựng lại điều hướng.
 *
 * ponytail: dựng trên iosKit sẵn có thay vì đẻ bộ component thứ hai. Nếu sau
 * này portal đổi sang ngôn ngữ thiết kế khác, sửa iosKit là cả HugoOS đổi theo.
 *
 * ── ĐA HÌNH THÁI (desktop / mobile / PWA / app native) ──────────────────────
 * Khung này vốn chỉ đúng cho bề ngang điện thoại: nội dung `px-4` trải hết chiều
 * ngang, nên trên màn desktop một dòng chữ dài 2000px và mọi thẻ bị kéo dẹt —
 * đó là gốc của "app chưa tương thích đa dạng hình thái", không phải thiếu hiệu
 * ứng. Sửa ở ĐÂY thì mọi app ngồi trong khung đều có desktop, không phải đi vá
 * Tailwind trong từng app.
 *
 * Cách làm: bó nội dung vào một cột giữa rộng `contentMaxWidth` (mặc định 900px
 * — tầm dài dòng còn đọc được), căn giữa. Điện thoại không đổi gì vì màn hẹp hơn
 * mức bó. Nav bar và tab bar bó theo cùng con số để ba tầng thẳng hàng.
 *
 * `wide` cho app cần tràn viền thật (bảng rộng, canvas game) tự bỏ giới hạn.
 */

export default function AppFrame({
  appId,
  title,
  subtitle,
  onBack,
  backLabel,
  tabs,
  tab,
  onTabChange,
  actions,
  scrollKey,
  className = "",
  contentClassName = "px-4",
  forceScheme,
  bgLayer,
  /** Bề ngang tối đa của cột nội dung trên màn rộng. `wide` bỏ hẳn giới hạn. */
  contentMaxWidth = "900px",
  wide = false,
  /**
   * Tiêu đề lớn kiểu iOS (34px, thu lại khi cuộn) cho MÀN CHÍNH của app.
   *
   * HugoKit vốn đã truyền `largeTitle` nhưng AppFrame hardcode `large={false}`,
   * nên prop này chưa bao giờ có tác dụng. Ngoài chuyện mất dáng iOS, chế độ nhỏ
   * vẽ tiêu đề bằng `<span>` — tức app không có `<h1>` nào, sai cả semantics.
   * Mặc định vẫn `false` để app đang chạy không đổi dáng ngoài ý muốn.
   */
  largeTitle = false,
  /**
   * Điều hướng trên MÀN RỘNG: `"segmented"` (dải phân đoạn trong thanh tiêu đề)
   * hay `"sidebar"` (cột dọc bên trái). Không truyền thì tự chọn theo luật của
   * Apple: từ 2–5 màn NGANG HÀNG thì dùng segmented control; nhiều hơn, hoặc có
   * thứ bậc, thì mới dùng sidebar.
   *
   * Vì sao phải có hai kiểu: bản đầu của khung này chỉ có sidebar, và nếu bắt Ví
   * JOY (4 tab ngang hàng, vốn đã có segmented control kiểu macOS tự dựng) đổi
   * sang sidebar thì đó là HẠ CẤP thiết kế để cho khớp một tiêu chí — ngược hẳn
   * mục đích. Điện thoại thì cả hai kiểu đều về thanh tab dưới.
   */
  wideNav,
  children,
}) {
  const { t } = useTranslation();
  const dark = useDarkScheme();
  /*
   * Tiêu đề mặc định lấy TÊN CHUẨN của app trong catalog
   * (`utilities.catalog.<appId>.title`, sinh từ i18n/locales/memberAppTranslations.js
   * — nguồn DUY NHẤT cho tên app, xem quy ước đặt tên app).
   *
   * Vì sao: app tự truyền tiêu đề thì dễ lọt chuỗi marketing dài. HugoAura từng
   * truyền "HugoAura Focus & Lofi Lounge" — ở tiêu đề lớn 34px nó xuống hai dòng
   * và chiếm gần nửa màn điện thoại, trong khi tên chuẩn của app chỉ là
   * "Tập Trung". Lấy từ catalog thì tên trong Home, Thư viện, Chợ và trong app
   * luôn là một, và luôn ngắn.
   */
  const appTitle = title || (appId ? t(`utilities.catalog.${appId}.title`, appId) : "");
  // Vài app cố tình khoá MỘT hệ màu (vd: app học = nền giấy sáng luôn, chữ mực
  // đậm, không lật theo dark mode để chữ Hán không chìm trên thẻ trắng).
  const effectiveDark = forceScheme ? forceScheme === "dark" : dark;
  const [scrolled, setScrolled] = useState(false);
  const palette = useMemo(() => appPalette(appId, effectiveDark), [appId, effectiveDark]);
  // Một cột giữa dùng cho cả ba tầng (nav / nội dung / tab) để chúng thẳng hàng.
  const centered = wide ? "w-full" : "mx-auto w-full";
  const centerStyle = wide ? undefined : { maxWidth: contentMaxWidth };
  // Luật Apple: 2–5 màn ngang hàng → segmented; nhiều hơn → sidebar.
  const wideNavMode = wideNav || ((tabs?.length || 0) <= 5 ? "segmented" : "sidebar");
  const hasTabs = (tabs?.length || 0) > 1;

  // Đổi tab thì cuộn về đầu — nếu không, tab mới mở ra ở giữa trang vì vùng
  // cuộn dùng chung. `scrollKey` cho app tự ép cuộn lên khi đổi màn con.
  useEffect(() => {
    setScrolled(false);
  }, [tab, scrollKey]);

  return (
    <IosApp
      scheme={effectiveDark ? "dark" : "light"}
      accent={palette.accent}
      vars={palette.vars}
      className={`relative ${bgLayer ? "isolate" : ""} ${className}`}
    >
      {/* Lớp NỀN trang trí của app (đứng sau nội dung, trên nền giấy) — chỉ khi
          app truyền vào. isolate + z-index âm để nằm dưới nav/nội dung nhưng trên
          --ios-bg.

          `lg:hidden` — TẮT TRÊN DESKTOP. Nền theme được vẽ cho khung điện thoại:
          kéo lên màn 2000px thì hoạ tiết giãn ra, lặp lại hoặc loang thành mảng
          màu lớn sau nội dung, vừa xấu vừa làm chữ khó đọc. Trên desktop để nền
          phẳng `--ios-bg` (vẫn mang tint riêng của app) là đủ nhận diện. */}
      {bgLayer ? <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden" style={{ zIndex: -10 }} aria-hidden="true">{bgLayer}</div> : null}
      <div
        className="relative z-40 shrink-0 rounded-b-[26px]"
        style={{
          paddingTop: "max(4px, env(safe-area-inset-top, 0px))",
          background: "var(--ios-glass)",
          backdropFilter: "blur(26px) saturate(180%)",
          WebkitBackdropFilter: "blur(26px) saturate(180%)",
          borderBottom: "0.5px solid var(--ios-glass-border)",
          boxShadow: "0 10px 30px rgba(46, 38, 28, 0.08)",
        }}
      >
        <div className={centered} style={centerStyle}>
          <NavBar
            scrolled={scrolled}
            large={largeTitle}
            title={appTitle}
            subtitle={subtitle}
            left={onBack ? (
              /* Nút LÙI MỘT CẤP — khác nút X đỏ "đóng app" mà portal đã gắn cố định
                 ở góc trên-phải (MemberUtilitiesTab). Trước đây AppFrame nhận
                 `onBack` nhưng truyền `left={null}`, nên hàm lùi của app không bao
                 giờ có chỗ bấm: trong HugoVocab có 18 màn con khai `onBack` mà
                 người dùng chỉ còn cách đóng cả app để ra. */
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel || t("common.back", "Quay lại")}
                title={backLabel || t("common.back", "Quay lại")}
                className="-ml-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-opacity active:opacity-50"
                style={{ color: "var(--ax)" }}
              >
                <span className="material-symbols-outlined text-[26px] leading-none">chevron_left</span>
              </button>
            ) : null}
            right={actions ? <div className="mr-10">{actions}</div> : null}
          />

          {/* Dải phân đoạn — CHỈ trên màn rộng. Trên điện thoại điều hướng đã nằm
              ở thanh tab dưới (ngón tay với tới được), giữ cả hai là hai bộ điều
              hướng cho cùng một thứ. */}
          {hasTabs && wideNavMode === "segmented" && (
            /* Segmented control của Apple ÔM THEO NỘI DUNG, không tràn viền.
               Trong app `wide` (ví, radio) cột chứa rộng bằng cả màn, nên nếu để
               nó tự giãn thì trên màn 2000px bốn nhãn dạt ra bốn góc và trông
               như một thanh menu rời rạc. Bó lại + canh trái cho thẳng lề với
               tiêu đề lớn ngay trên nó. */
            <div className="hidden px-3 pb-2.5 lg:block">
              <Segmented
                className="max-w-[520px]"
                items={tabs}
                value={tab}
                onChange={(next) => onTabChange?.(next)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── THÂN APP: SIDEBAR (màn rộng) + VÙNG CUỘN ─────────────────────────
          Trên iPad và Mac, Apple KHÔNG dùng thanh tab dưới — điều hướng nằm ở
          sidebar bên trái, còn thanh tab dưới là dáng iPhone. Trước đây khung này
          chỉ có thanh tab dưới, nên trên desktop nó vừa sai dáng vừa đặt điều
          hướng xa mắt (dưới đáy một màn hình cao 1000px).
          Chuyển bằng CSS thuần: từ `lg` hiện sidebar và ẩn thanh dưới; dưới `lg`
          thì ngược lại. Không hỏi bề ngang bằng JS nên không có lần render đầu
          đoán sai, không nhảy layout khi kéo cửa sổ. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {hasTabs && wideNavMode === "sidebar" && (
          <aside
            className="hidden shrink-0 flex-col gap-0.5 px-3 py-4 lg:flex"
            style={{ width: 232, borderRight: "0.5px solid var(--ios-sep)" }}
            aria-label={appTitle}
          >
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange?.(item.id)}
                  aria-current={active ? "page" : undefined}
                  className="flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 text-left text-[15px] font-semibold transition-colors"
                  style={active
                    ? { background: "var(--ax)", color: "#fff" }
                    : { color: "var(--ios-label)" }}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-1 text-[13px] font-bold"
                      style={active
                        ? { background: "rgba(255,255,255,0.28)", color: "#fff" }
                        : { background: "#FF3B30", color: "#fff" }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>
        )}

        <Scroll key={`${tab || ""}:${scrollKey || ""}`} onScrolledChange={setScrolled} className={contentClassName}>
          <div
            className={centered}
            style={{
              ...centerStyle,
              paddingBottom: tabs?.length ? "24px" : "calc(40px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {children}
          </div>
        </Scroll>
      </div>

      {/* Tab-bar Ở DƯỚI (kiểu app iOS). TabBar tự có nền kính + đệm 20px; chỉ bù
          thêm phần safe-area vượt 20px, không cộng dồn. */}
      {hasTabs && (
        /* Dải kính TRÀN NGANG (đúng kiểu thanh dưới của app), nhưng các nút bó vào
           cùng cột giữa với nội dung — trên desktop nút không dạt ra hai mép màn.
           Nền/viền chuyển lên div này và TabBar dùng `embedded` để khỏi vẽ nền hai
           lần; bù lại phần đệm mà bản embedded bỏ đi (pb-5 pt-2).
           ponytail: vẫn là tab-bar dưới — đúng trên điện thoại và iPad. Muốn desktop
           có thanh phân đoạn trên đầu thì đổi ở ĐÂY, một chỗ cho mọi app. */
        <div
          /* `lg:hidden` — từ lg trở lên điều hướng đã nằm ở sidebar, giữ cả hai
             là hai bộ điều hướng cho cùng một thứ. */
          className="relative z-40 shrink-0 lg:hidden"
          style={{
            paddingBottom: "max(0px, calc(env(safe-area-inset-bottom, 0px) - 20px))",
            background: "var(--ios-glass)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderTop: "0.5px solid var(--ios-glass-border)",
          }}
        >
          <div className={`${centered} pb-5 pt-2`} style={centerStyle}>
            <TabBar items={tabs} value={tab} onChange={onTabChange} embedded />
          </div>
        </div>
      )}
    </IosApp>
  );
}
