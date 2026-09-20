import { Component, lazy, Suspense, useMemo, useState } from "react";
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
//
// `route` + `onRouteChange` — công cụ đang mở, lấy từ URL
// (/member/utilities/handle/<toolId>). Có hai prop này thì mỗi màn có địa chỉ
// riêng: tải lại trang, bấm back của máy, dán link cho người khác đều đúng màn.
// Bản public /hugokit không truyền, nên vẫn còn state nội bộ làm dự phòng —
// trang đó chỉ có một địa chỉ nên không có gì để đồng bộ.
export default function HugoKitApp({ bio, publicLink, showToast, onBack, setFormData, handleSave, guardTool, route, onRouteChange }) {
  const { t } = useTranslation();
  const routed = typeof onRouteChange === "function";
  const [localToolId, setLocalToolId] = useState(null);
  const [query, setQuery] = useState("");
  // Chụp lại lúc mount: nếu đọc trực tiếp mỗi lần render thì mở một công cụ là
  // hàng "vừa dùng" nhảy chỗ ngay dưới ngón tay khi quay lại.
  const [recent] = useState(() => recentIds("handle", 3));

  // URL là nguồn sự thật khi có điều hướng; một `route` lạ (link gõ sai) rơi về
  // danh sách chứ không dựng màn trắng.
  const rawToolId = routed ? route : localToolId;
  const toolId = VIEWS[rawToolId] ? rawToolId : null;
  const tool = TOOLS.find((item) => item.id === toolId) || null;
  const View = tool ? VIEWS[tool.id] : null;

  const openTool = (id) => {
    if (id && guardTool && !guardTool(id)) return;
    if (id) trackOpen("handle", id);
    if (routed) onRouteChange(id || "home");
    else setLocalToolId(id);
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

  // ── HAI KHUNG TRÊN MÀN RỘNG (danh sách + chi tiết), MỘT KHUNG TRÊN ĐIỆN THOẠI ─
  // Làm bằng CSS thuần chứ không hỏi media query bằng JS: không có lần render đầu
  // đoán sai bề ngang, không nhảy layout khi kéo cửa sổ, và bản in/PWA cũng đúng.
  // Điện thoại giữ y nguyên hành vi cũ (danh sách HOẶC chi tiết); từ `lg` trở lên
  // danh sách luôn nằm bên trái nên đổi công cụ không phải quay ra quay vào.
  const listPane = (
    <div className={`${tool ? "hidden lg:block" : "block"} space-y-6`}>
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
  );

  return (
    <AppFrame
      appId="handle"
      title={tool ? t(tool.titleKey) : "HugoKit"}
      subtitle={tool ? undefined : t("kit.subtitle")}
      largeTitle={!tool}
      onBack={tool ? () => openTool(null) : onBack}
      scrollKey={toolId || ""}
      // Rộng hơn mặc định 900px vì ở đây có hai khung cạnh nhau.
      contentMaxWidth="1120px"
    >
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {listPane}

        {/* Khung chi tiết. Trên điện thoại chỉ hiện khi đã chọn công cụ; trên màn
            rộng luôn có mặt, chưa chọn gì thì mời chọn thay vì để trống hoác. */}
        <div className={tool ? "block" : "hidden lg:block"}>
      {tool ? (
        <>
          <p className="px-1 pb-4 text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
            {t(tool.descKey)}
          </p>
          {/* Suspense chỉ lo lúc ĐANG tải. Chunk tải THẤT BẠI (mất mạng giữa
              đường, hoặc bản deploy mới xoá chunk cũ khi tab đang mở) thì lỗi
              vọt lên và làm trắng cả portal — nên phải có cả ranh giới lỗi,
              kèm đường thoát về danh sách. */}
          <ToolBoundary
            key={tool.id}
            onReset={() => openTool(null)}
            retryLabel={t("kit.backToList", "Về danh sách công cụ")}
            message={t("kit.loadFailed", "Không tải được công cụ này. Kiểm tra kết nối rồi thử lại.")}
          >
            <Suspense fallback={<ToolSkeleton />}>
              <View
                bio={bio}
                publicLink={publicLink}
                showToast={showToast}
                setFormData={setFormData}
                handleSave={handleSave}
              />
            </Suspense>
          </ToolBoundary>
        </>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
          <span className="material-symbols-outlined text-[40px]" style={{ color: "var(--ios-label-2)" }}>
            handyman
          </span>
          <p className="mt-3 text-[15px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
            {t("kit.pickATool", "Chọn một công cụ ở danh sách bên cạnh để bắt đầu.")}
          </p>
        </div>
      )}
        </div>
      </div>
    </AppFrame>
  );
}

/**
 * Ranh giới lỗi cho MỘT công cụ.
 *
 * Phải là class: React chưa có hook nào bắt được lỗi render của cây con.
 * `key={tool.id}` ở chỗ gọi khiến đổi công cụ là dựng lại instance mới, nên một
 * công cụ lỗi không khoá luôn công cụ tiếp theo.
 */
class ToolBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Ghi ra console thôi: đây là lỗi tải chunk của client, không phải sự cố
    // máy chủ, và HugoKit chạy được cả khi chưa đăng nhập (bản public) nên
    // không có kênh báo lỗi nào chắc chắn tồn tại ở đây.
    console.error("[HugoKit] công cụ lỗi:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="px-1 py-10 text-center">
        <span className="material-symbols-outlined text-[32px]" style={{ color: "var(--ios-label-2)" }}>
          cloud_off
        </span>
        <p className="mt-2 text-[15px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
          {this.props.message}
        </p>
        <button
          type="button"
          onClick={this.props.onReset}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full px-5 text-[15px] font-semibold"
          style={{ background: "var(--ios-fill)", color: "var(--ax)" }}
        >
          {this.props.retryLabel}
        </button>
      </div>
    );
  }
}

function ToolSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-[120px] animate-pulse rounded-[12px]" style={{ background: "var(--ios-fill)" }} />
      <div className="h-[180px] animate-pulse rounded-[12px]" style={{ background: "var(--ios-fill)" }} />
    </div>
  );
}
