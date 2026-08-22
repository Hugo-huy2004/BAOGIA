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
  largeTitle = true,
  scrollKey,
  className = "",
  contentClassName = "px-4",
  children,
}) {
  const { t } = useTranslation();
  const dark = useDarkScheme();
  const [scrolled, setScrolled] = useState(false);
  const palette = useMemo(() => appPalette(appId, dark), [appId, dark]);

  // Đổi tab thì cuộn về đầu — nếu không, tab mới mở ra ở giữa trang vì vùng
  // cuộn dùng chung. `scrollKey` cho app tự ép cuộn lên khi đổi màn con.
  useEffect(() => {
    setScrolled(false);
  }, [tab, scrollKey]);

  return (
    <IosApp
      scheme={dark ? "dark" : "light"}
      accent={palette.accent}
      vars={palette.vars}
      className={`relative ${className}`}
    >
      <div style={{ paddingTop: "max(4px, env(safe-area-inset-top, 0px))" }} className="shrink-0">
        <NavBar
          scrolled={scrolled}
          large={largeTitle}
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

      {/* TabBar của iosKit đã có sẵn 20px đệm dưới cho khung điện thoại giả ở
          trang Dịch vụ. Ở PWA thật chỉ bù thêm phần safe-area vượt quá 20px,
          không cộng dồn hai lớp. */}
      {tabs?.length > 1 && (
        <div className="shrink-0" style={{ paddingBottom: "max(0px, calc(env(safe-area-inset-bottom, 0px) - 20px))" }}>
          <TabBar items={tabs} value={tab} onChange={onTabChange} />
        </div>
      )}
    </IosApp>
  );
}
