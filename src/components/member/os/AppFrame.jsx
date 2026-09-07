import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IosApp, NavBar, Scroll, TabBar } from "../../demos/iosKit";
import BackButton from "../shared/BackButton";
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
  children,
}) {
  const { t } = useTranslation();
  const dark = useDarkScheme();
  // Vài app cố tình khoá MỘT hệ màu (vd: app học = nền giấy sáng luôn, chữ mực
  // đậm, không lật theo dark mode để chữ Hán không chìm trên thẻ trắng).
  const effectiveDark = forceScheme ? forceScheme === "dark" : dark;
  const [scrolled, setScrolled] = useState(false);
  const palette = useMemo(() => appPalette(appId, effectiveDark), [appId, effectiveDark]);

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
      {/* Lớp NỀN của app (đứng sau nội dung, trên nền giấy) — chỉ khi app truyền vào.
          isolate + z-index âm để nằm dưới nav/nội dung nhưng trên --ios-bg. */}
      {bgLayer ? <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: -10 }} aria-hidden="true">{bgLayer}</div> : null}
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
        <NavBar
          scrolled={scrolled}
          large={false}
          title={title}
          subtitle={subtitle}
          left={onBack ? <BackButton onClick={onBack} label={backLabel || t("utilities.library.back", "Quay lại")} /> : null}
          right={actions}
        />
      </div>

      <Scroll key={`${tab || ""}:${scrollKey || ""}`} onScrolledChange={setScrolled} className={contentClassName}>
        <div style={{ paddingBottom: tabs?.length ? "24px" : "calc(40px + env(safe-area-inset-bottom, 0px))" }}>
          {children}
        </div>
      </Scroll>

      {/* Tab-bar Ở DƯỚI (kiểu app iOS). TabBar tự có nền kính + đệm 20px; chỉ bù
          thêm phần safe-area vượt 20px, không cộng dồn. */}
      {tabs?.length > 1 && (
        <div className="relative z-40 shrink-0" style={{ paddingBottom: "max(0px, calc(env(safe-area-inset-bottom, 0px) - 20px))" }}>
          <TabBar items={tabs} value={tab} onChange={onTabChange} />
        </div>
      )}
    </IosApp>
  );
}
