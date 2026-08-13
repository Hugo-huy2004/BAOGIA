import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IosApp, NavBar, Scroll, ListGroup, ListRow } from "../../demos/iosKit";
import BackButton from "../shared/BackButton";

/**
 * HugoKit — hộp công cụ duy nhất, gộp HugoHelpdesk (QR + chữ ký email) và
 * HugoHandle (link bảo mật + xử lý tệp).
 *
 * Trước đây là hai app rời, mỗi app lại là một thanh pill chọn công cụ, còn
 * "Xử lý tệp" bên trong lại có thêm một thanh pill nữa: ba tầng điều hướng cho
 * bốn công cụ. Ở đây phẳng lại đúng kiểu Cài đặt của iOS — một danh sách, chạm
 * vào là mở thẳng công cụ, thoát bằng nút quay lại.
 *
 * ponytail: dựng bằng iosKit (bộ list/nav/nút chuẩn iOS đã có sẵn trong repo)
 * thay vì đẻ thêm một bộ component nữa. Đổi sang tokens riêng nếu app cần khác
 * bảng màu hệ thống.
 */
const TOOLS = [
  { id: "qr", icon: "qr_code_2", titleKey: "utilities.qrCode.title", descKey: "utilities.qrCode.desc" },
  { id: "signature", icon: "draw", titleKey: "utilities.signature.title", descKey: "utilities.signature.desc" },
  { id: "links", icon: "lock", titleKey: "utilities.secretLink.title", descKey: "utilities.secretLink.desc" },
  { id: "files", icon: "folder_zip", titleKey: "utilities.fileTools.title", descKey: "utilities.fileTools.desc" },
];

const VIEWS = {
  qr: lazy(() => import("./QrTool")),
  signature: lazy(() => import("./SignatureTool")),
  links: lazy(() => import("./LinksTool")),
  files: lazy(() => import("./FilesTool")),
};

/** Portal đổi theme bằng class `dark` trên <html> (xem App.jsx). */
function useDarkScheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export default function HugoKitApp({ bio, publicLink, showToast, onBack, setFormData, handleSave }) {
  const { t } = useTranslation();
  const dark = useDarkScheme();
  const [toolId, setToolId] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const tool = TOOLS.find((item) => item.id === toolId) || null;
  const View = tool ? VIEWS[tool.id] : null;

  const openTool = (id) => {
    setToolId(id);
    setScrolled(false);
  };

  return (
    <IosApp
      scheme={dark ? "dark" : "light"}
      accent="hsl(var(--primary))"
      className="relative"
    >
      <div style={{ paddingTop: "max(4px, env(safe-area-inset-top, 0px))" }} className="shrink-0">
        <NavBar
          scrolled={scrolled}
          large={!tool}
          title={tool ? t(tool.titleKey) : "HugoKit"}
          left={(
            <BackButton
              onClick={tool ? () => openTool(null) : onBack}
              label={t("utilities.library.back", "Quay lại")}
            />
          )}
        />
      </div>

      <Scroll onScrolledChange={setScrolled} className="px-4">
        <div style={{ paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))" }}>
          {!tool ? (
            <ListGroup footer={t("utilities.fileTools.compress.privacyNote")}>
              {TOOLS.map((item, index) => (
                <ListRow
                  key={item.id}
                  icon={item.icon}
                  title={t(item.titleKey)}
                  chevron
                  last={index === TOOLS.length - 1}
                  onClick={() => openTool(item.id)}
                />
              ))}
            </ListGroup>
          ) : (
            <>
              <p className="px-1 pb-4 text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
                {t(tool.descKey)}
              </p>
              <Suspense fallback={<ToolSkeleton />}>
                <View
                  bio={bio}
                  publicLink={publicLink}
                  showToast={showToast}
                  setFormData={setFormData}
                  handleSave={handleSave}
                />
              </Suspense>
            </>
          )}
        </div>
      </Scroll>
    </IosApp>
  );
}

function ToolSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-[120px] animate-pulse rounded-[12px]" style={{ background: "var(--ios-fill)" }} />
      <div className="h-[180px] animate-pulse rounded-[12px]" style={{ background: "var(--ios-fill)" }} />
    </div>
  );
}
