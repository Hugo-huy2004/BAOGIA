import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ListGroup, ListRow, SearchField } from "../../demos/iosKit";
import AppFrame from "../os/AppFrame";
import { useAppIntent } from "../os/appIntent";
import { recentIds, trackOpen } from "../os/appUsage";

/**
 * HugoKit — hộp công cụ của HugoOS.
 *
 * Trước đây là hai app rời (HugoHelpdesk + HugoHandle), mỗi app một thanh pill
 * chọn công cụ, còn "Xử lý tệp" bên trong lại có thêm một thanh pill nữa: ba
 * tầng điều hướng cho bốn công cụ. Bản đó đã dọn thành một danh sách phẳng.
 *
 * Giờ có tám công cụ, nên danh sách phẳng lại quá dài để liếc một cái là thấy —
 * nhưng câu trả lời KHÔNG phải là thêm tab bar và một trang chủ nữa. Thay vào
 * đó: nhóm theo việc cần làm, một ô tìm kiếm, và một hàng "vừa dùng" để công cụ
 * bạn hay mở tự nổi lên. Vẫn đúng một tầng điều hướng như cũ.
 */
const TOOLS = [
  { id: "qr", icon: "qr_code_2", group: "codes", titleKey: "utilities.qrCode.title", descKey: "utilities.qrCode.desc" },
  { id: "scan", icon: "qr_code_scanner", group: "codes", titleKey: "kit.scan.title", descKey: "kit.scan.desc" },
  { id: "files", icon: "folder_zip", group: "files", titleKey: "utilities.fileTools.title", descKey: "utilities.fileTools.desc" },
  { id: "image", icon: "image", group: "files", titleKey: "kit.image.title", descKey: "kit.image.desc" },
  { id: "text", icon: "text_fields", group: "text", titleKey: "kit.text.title", descKey: "kit.text.desc" },
  { id: "signature", icon: "draw", group: "text", titleKey: "utilities.signature.title", descKey: "utilities.signature.desc" },
  { id: "password", icon: "key", group: "security", titleKey: "kit.password.title", descKey: "kit.password.desc" },
  { id: "links", icon: "lock", group: "security", titleKey: "utilities.secretLink.title", descKey: "utilities.secretLink.desc" },
];

const GROUPS = ["codes", "files", "text", "security"];

const VIEWS = {
  qr: lazy(() => import("./QrTool")),
  scan: lazy(() => import("./ScanTool")),
  files: lazy(() => import("./FilesTool")),
  image: lazy(() => import("./ImageTool")),
  text: lazy(() => import("./TextTool")),
  signature: lazy(() => import("./SignatureTool")),
  password: lazy(() => import("./PasswordTool")),
  links: lazy(() => import("./LinksTool")),
};

// `guardTool(id)` — bản public /hugokit dùng để chặn/đếm demo trước khi mở
// một công cụ; trả false là không mở. Portal thành viên không truyền gì.
export default function HugoKitApp({ bio, publicLink, showToast, onBack, setFormData, handleSave, guardTool }) {
  const { t } = useTranslation();
  const [toolId, setToolId] = useState(null);
  const [query, setQuery] = useState("");
  // Chụp lại lúc mount: nếu đọc trực tiếp mỗi lần render thì mở một công cụ là
  // hàng "vừa dùng" nhảy chỗ ngay dưới ngón tay khi quay lại.
  const [recent] = useState(() => recentIds("handle", 3));

  const tool = TOOLS.find((item) => item.id === toolId) || null;
  const View = tool ? VIEWS[tool.id] : null;

  const openTool = (id) => {
    if (id && guardTool && !guardTool(id)) return;
    if (id) trackOpen("handle", id);
    setToolId(id);
  };

  // Spotlight gõ "QR" là vào thẳng công cụ QR, không dừng ở danh sách HugoKit.
  useAppIntent("handle", (destination) => {
    if (VIEWS[destination]) openTool(destination);
  });

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return null;
    return TOOLS.filter((item) => `${t(item.titleKey)} ${t(item.descKey)}`.toLowerCase().includes(needle));
  }, [query, t]);

  const recentTools = recent.map((id) => TOOLS.find((item) => item.id === id)).filter(Boolean);

  const row = (item, index, list) => (
    <ListRow
      key={item.id}
      icon={item.icon}
      title={t(item.titleKey)}
      subtitle={t(item.descKey)}
      chevron
      last={index === list.length - 1}
      onClick={() => openTool(item.id)}
    />
  );

  return (
    <AppFrame
      appId="handle"
      title={tool ? t(tool.titleKey) : "HugoKit"}
      subtitle={tool ? undefined : t("kit.subtitle")}
      largeTitle={!tool}
      onBack={tool ? () => openTool(null) : onBack}
      scrollKey={toolId || ""}
    >
      {tool ? (
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
      ) : (
        <div className="space-y-6">
          <SearchField value={query} onChange={setQuery} placeholder={t("kit.search")} />

          {matches ? (
            matches.length === 0 ? (
              <p className="px-1 py-8 text-center text-[15px]" style={{ color: "var(--ios-label-2)" }}>
                {t("kit.noResults")}
              </p>
            ) : (
              <ListGroup header={t("kit.results", { count: matches.length })}>
                {matches.map((item, index) => row(item, index, matches))}
              </ListGroup>
            )
          ) : (
            <>
              {recentTools.length > 0 && (
                <ListGroup header={t("os.recent")}>
                  {recentTools.map((item, index) => row(item, index, recentTools))}
                </ListGroup>
              )}

              {GROUPS.map((group) => {
                const items = TOOLS.filter((item) => item.group === group);
                return (
                  <ListGroup key={group} header={t(`kit.groups.${group}`)}>
                    {items.map((item, index) => row(item, index, items))}
                  </ListGroup>
                );
              })}

              <p className="px-1 text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
                {t("kit.privacyNote")}
              </p>
            </>
          )}
        </div>
      )}
    </AppFrame>
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
