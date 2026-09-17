import { useMemo } from "react";
import OptimizedInput from "../common/OptimizedInput";
import OptimizedTextarea from "../common/OptimizedTextarea";
import { SocialMonochromeIcon } from "../../utils/socialBrandHelper";
import {
  detectSocialPlatform,
  SUPPORTED_PLATFORMS
} from "../../utils/socialBrandConstants";
import {
  Trash2,
  Plus,
  MessageCircle,
  Sparkles,
  Edit3,
  Star
} from "lucide-react";

export default function LinksSubTab({
  formData,
  setFormData,
  newLinkLabel,
  setNewLinkLabel,
  newLinkUrl,
  setNewLinkUrl,
  handleLinkInputKeyDown,
  addSocialLink,
  removeSocialLink,
  handleFieldChange,
  bioTextareaRef,
  bio,
  handleSave,
  showToast,
  t
}) {
  const links = useMemo(() => (Array.isArray(formData.links) ? formData.links : []), [formData.links]);

  // Kiểm tra liên kết Zalo hiện tại
  const rawPhone = formData.phone || bio?.phone || "";
  // Làm sạch chuỗi số điện thoại
  const cleanPhone = rawPhone.replace(/[^\d+]/g, "").replace(/^\+84/, "0");
  const hasZaloLink = links.some(
    (l) => (l.url && l.url.includes("zalo.me")) || (l.label && l.label.toLowerCase() === "zalo")
  );

  // Toggle Zalo
  const handleToggleZalo = (enabled) => {
    if (enabled) {
      if (!cleanPhone) {
        showToast?.("Vui lòng cập nhật Số điện thoại ở mục Hồ sơ trước khi bật Zalo", "warning");
        return;
      }
      const zaloUrl = `https://zalo.me/${cleanPhone}`;
      // Gỡ link zalo cũ nếu có và thêm link mới
      const filtered = links.filter(
        (l) => !(l.url && l.url.includes("zalo.me")) && !(l.label && l.label.toLowerCase() === "zalo")
      );
      const updatedLinks = [...filtered, { label: "Zalo", url: zaloUrl }];
      const newData = { ...formData, links: updatedLinks };
      setFormData(newData);
      handleSave?.(null, newData);
      showToast?.(`Đã liên kết Zalo thành công với số ${cleanPhone}`, "success");
    } else {
      const updatedLinks = links.filter(
        (l) => !(l.url && l.url.includes("zalo.me")) && !(l.label && l.label.toLowerCase() === "zalo")
      );
      const newData = { ...formData, links: updatedLinks };
      setFormData(newData);
      handleSave?.(null, newData);
      showToast?.("Đã hủy liên kết Zalo", "success");
    }
  };

  // Khi người dùng chọn platform từ danh sách hỗ trợ
  const handleSelectPlatform = (platformId) => {
    const platform = SUPPORTED_PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return;
    setNewLinkLabel(platform.name);
    if (!newLinkUrl) {
      setNewLinkUrl(platform.prefix);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* ── 1. KẾT NỐI NHANH ZALO (TỰ ĐỘNG TẠO LINK CHAT) ── */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="size-3.5 text-primary" />
            Liên kết nhanh Zalo
          </h3>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Tự động theo SĐT
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-border/60 shadow-sm p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center text-foreground shrink-0 border border-border/50">
              <SocialMonochromeIcon platform="zalo" className="size-5 text-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Nhắn tin Zalo trực tiếp
                {cleanPhone && (
                  <span className="text-xs font-mono font-normal opacity-70">({cleanPhone})</span>
                )}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cleanPhone
                  ? `Khách truy cập sẽ mở trực tiếp cuộc trò chuyện tại zalo.me/${cleanPhone}`
                  : "Chưa có số điện thoại. Hãy bổ sung SĐT ở Hồ sơ để kích hoạt."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={hasZaloLink}
              onChange={(e) => handleToggleZalo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>

      {/* ── 2. CÁC NỀN TẢNG MẠNG XÃ HỘI ĐƯỢC HỖ TRỢ ── */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            {t("memberPortal.links.title", "Liên kết mạng xã hội")}
          </h3>
          <span className="text-[10px] font-semibold text-muted-foreground/70">
            {t("memberPortal.links.autoSave", "Tự động lưu khi thêm/xóa")}
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-border/60 shadow-sm p-4 space-y-4">
          
          {/* Danh sách liên kết hiện tại */}
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map((link, idx) => {
                const platform = detectSocialPlatform(link.label, link.url);
                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border/50 text-xs transition-all hover:border-border"
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-foreground shrink-0 border border-border/40 shadow-2xs">
                        <SocialMonochromeIcon platform={platform} className="size-4 text-foreground" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-foreground mr-1.5">
                          {link.label || "Liên kết"}:
                        </span>
                        <span className="text-muted-foreground truncate text-[11.5px] font-mono">
                          {link.url}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(idx)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Xóa liên kết"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-border/80 rounded-xl">
              <p className="text-xs italic text-muted-foreground">
                {t("memberPortal.links.empty", "Chưa có liên kết mạng xã hội nào.")}
              </p>
            </div>
          )}

          {/* Chọn nhanh nền tảng được hỗ trợ */}
          <div className="pt-2 border-t border-border/60 space-y-2.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Chọn nhanh ứng dụng được hỗ trợ:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_PLATFORMS.filter((p) => p.id !== "zalo").map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => handleSelectPlatform(plat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    newLinkLabel.toLowerCase() === plat.name.toLowerCase()
                      ? "bg-primary text-white border-primary"
                      : "bg-muted/40 hover:bg-muted text-foreground border-border/50"
                  }`}
                >
                  <SocialMonochromeIcon platform={plat.id} className="size-3.5" />
                  <span>{plat.name}</span>
                </button>
              ))}
            </div>

            {/* Form nhập nhãn và URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-0.5">
                  Ứng dụng / Tên hiển thị
                </label>
                <OptimizedInput
                  type="text"
                  value={newLinkLabel}
                  onKeyDown={handleLinkInputKeyDown}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Ví dụ: Facebook, Instagram, TikTok..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase pl-0.5">
                  Địa chỉ URL
                </label>
                <OptimizedInput
                  type="text"
                  value={newLinkUrl}
                  onKeyDown={handleLinkInputKeyDown}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewLinkUrl(val);
                    // Tự động đoán label nếu chưa có
                    if (!newLinkLabel) {
                      const detected = detectSocialPlatform("", val);
                      const matched = SUPPORTED_PLATFORMS.find((p) => p.id === detected);
                      if (matched) setNewLinkLabel(matched.name);
                    }
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addSocialLink}
              className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-1"
            >
              <Plus className="size-3.5" />
              <span>{t("memberPortal.links.addLink", "Thêm liên kết")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. TIỂU SỬ VÀ SỞ THÍCH ── */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
          {t("memberPortal.other.title", "Thông tin bổ sung")}
        </h3>
        <div className="bg-white dark:bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden divide-y divide-border/40">
          {/* Sở thích */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground bg-muted shrink-0 border border-border/40">
              <Star className="size-4" />
            </div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 shrink-0">
              {t("memberPortal.other.hobbies", "Sở thích")}
            </label>
            <OptimizedInput
              type="text"
              name="hobbies"
              value={formData.hobbies || ""}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.other.placeholderHobbies", "Ví dụ: Âm nhạc, nhiếp ảnh, thể thao...")}
              className="w-full bg-transparent text-foreground placeholder-muted-foreground/60 focus:outline-none text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Giới thiệu / Bio */}
          <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 px-4 py-3 min-h-[70px]">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground bg-muted shrink-0 border border-border/40">
                <Edit3 className="size-4" />
              </div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 shrink-0">
                {t("memberPortal.other.desc", "Giới thiệu")}
              </label>
            </div>
            <div className="flex-grow flex flex-col w-full">
              <OptimizedTextarea
                ref={bioTextareaRef}
                name="bio"
                value={formData.bio || ""}
                onChange={handleFieldChange}
                placeholder={t("memberPortal.other.placeholderDesc", "Viết vài dòng giới thiệu bản thân...")}
                className="w-full bg-transparent text-foreground placeholder-muted-foreground/60 focus:outline-none text-xs sm:text-sm font-semibold resize-none leading-relaxed mt-1 md:mt-0 overflow-hidden"
              />
              <div className="flex justify-end text-[10px] font-bold text-muted-foreground mt-1 select-none pr-2">
                {t("memberPortal.other.wordCount", {
                  count: formData.bio ? formData.bio.trim().split(/\s+/).filter(Boolean).length : 0,
                  limit: 110,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
