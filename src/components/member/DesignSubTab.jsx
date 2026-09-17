import { useState } from "react";
import { API_BASE } from "../../config/apiBase";
import { Copy, ExternalLink, Globe, Check, Link as LinkIcon, Sparkles, CheckCircle2 } from "lucide-react";

// 6 THEMES CHUẨN ĐƯỢC ĐỊNH KIỂU BỞI CÁC FILE CSS ĐỘC LẬP (HOÀN TOÀN MIỄN PHÍ)
const AVAILABLE_THEMES = [
  {
    id: "edu",
    title: "Edu Art 2D",
    vietnameseTitle: "Edu Theme",
    desc: "Nền giáo dục 2D vẽ tay nghệ thuật (bút chì, sổ tay, thước kẻ), ấm áp, thanh lịch và tri thức.",
    icon: "school",
    free: true,
    badgeText: "Mới • Miễn phí",
    colorClass: "text-orange-500",
    bgPreview: "/themes/bg-edu.png",
  },
  {
    id: "workspace",
    title: "WorkSpace Joy",
    vietnameseTitle: "WorkSpace",
    desc: "Nền icon mặt cười 2D pastel tươi vui, tích cực, kết nối cộng đồng sáng tạo.",
    icon: "sentiment_satisfied",
    free: true,
    badgeText: "Mới • Miễn phí",
    colorClass: "text-sky-500",
    bgPreview: "/themes/bg-workspace.png",
  },
  {
    id: "sunset",
    title: "Sunset Ocean Art",
    vietnameseTitle: "Sunset",
    desc: "Nền mặt trời art 2D hoàng hôn trên biển và cánh chim trời, thẻ kính mờ cao cấp.",
    icon: "wb_sunny",
    free: true,
    badgeText: "Mới • Miễn phí",
    colorClass: "text-rose-500",
    bgPreview: "/themes/bg-sunset.png",
  },
  {
    id: "brutalism",
    title: "Neo Brutalism",
    vietnameseTitle: "Đột Phá Cá Tính",
    desc: "Viền đen dày 3px, đổ bóng góc 90 độ sắc cạnh, phong cách poster typography đường phố.",
    icon: "bolt",
    free: true,
    badgeText: "Cá tính • Miễn phí",
    colorClass: "text-amber-500",
    bgPreview: null,
    isBrutalist: true,
  },
  {
    id: "creative",
    title: "Creative Wave",
    vietnameseTitle: "Creative Theme",
    desc: "Nền những dải sóng màu sắc rực rỡ sáng tạo đa sắc, phong cách Pop-Art đương đại.",
    icon: "palette",
    free: true,
    badgeText: "Mới • Miễn phí",
    colorClass: "text-pink-500",
    bgPreview: "/themes/bg-creative.png",
  },
  {
    id: "studio",
    title: "Hugo Studio Signature",
    vietnameseTitle: "Hugo Studio",
    desc: "Ngôn ngữ thị giác điện ảnh độc bản từ trang Introduction: hào quang Aura đa sắc, hạt phim 35mm, spotlight ảo ảnh và film scroll.",
    icon: "sparkles",
    free: true,
    badgeText: "Độc bản • Miễn phí",
    colorClass: "text-cyan-400",
    bgPreview: null,
    isStudio: true,
  },
];

export default function DesignSubTab({
  formData,
  setFormData,
  t,
  bio,
  onBioUpdate,
  showToast,
  handleSave,
  saving = false,
}) {
  const currentTemplate = formData.theme?.template || "default";
  const slug = bio?.slug || formData?.slug || "member";
  const [customDomainInput, setCustomDomainInput] = useState(bio?.customDomain || "");
  const [savingDomain, setSavingDomain] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  const primaryBioUrl = `https://www.hugowishpax.studio/bio/${slug}`;
  const shortBioUrl = `https://www.hugowishpax.studio/${slug}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    showToast?.("Đã sao chép liên kết vào bộ nhớ tạm", "success");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleSelectTheme = (theme) => {
    const nextTheme = { ...(formData.theme || {}), template: theme.id };
    const newData = {
      ...formData,
      theme: nextTheme,
    };
    setFormData(newData);
    onBioUpdate?.({ ...(bio || {}), theme: nextTheme });
    if (handleSave) {
      handleSave(null, newData);
    }
    showToast?.(`Đã áp dụng và lưu giao diện ${theme.vietnameseTitle}`, "success");
  };

  const handleSaveCustomDomain = async (e) => {
    e.preventDefault();
    setSavingDomain(true);
    try {
      const cleanDomain = customDomainInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const res = await fetch(`${API_BASE}/bios/me/custom-domain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ customDomain: cleanDomain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu tên miền riêng.");

      setCustomDomainInput(data.customDomain || cleanDomain);
      if (onBioUpdate) {
        onBioUpdate({ ...bio, customDomain: data.customDomain || cleanDomain });
      }
      showToast?.(data.message || "Đã cập nhật tên miền riêng thành công!", "success");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setSavingDomain(false);
    }
  };

  const handleRemoveCustomDomain = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy liên kết tên miền riêng này?")) return;
    setSavingDomain(true);
    try {
      const res = await fetch(`${API_BASE}/bios/me/custom-domain`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi hủy tên miền.");

      setCustomDomainInput("");
      if (onBioUpdate) {
        onBioUpdate({ ...bio, customDomain: null });
      }
      showToast?.("Đã hủy liên kết tên miền riêng", "success");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setSavingDomain(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ── 1. BỘ SƯU TẬP GIAO DIỆN (100% MIỄN PHÍ) ── */}
      <div className="space-y-3">
        <div className="space-y-1 pl-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            {t("memberPortal.design.title", "Bộ sưu tập Giao diện Bio")}
          </h3>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Tất cả 6 giao diện được định kiểu riêng bằng file CSS độc lập, tải tức thì và hoàn toàn miễn phí cho mọi thành viên.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AVAILABLE_THEMES.map((theme) => {
            const isSelected = currentTemplate === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme)}
                className={`rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-2 ring-primary text-foreground"
                    : "bg-card hover:bg-card/90 border-border/60 hover:border-border text-foreground/90 shadow-2xs"
                }`}
              >
                {/* Visual Background Thumbnail Banner */}
                <div className="w-full h-16 relative overflow-hidden border-b border-border/40 bg-muted/40">
                  {theme.bgPreview ? (
                    <img
                      src={theme.bgPreview}
                      alt={theme.title}
                      className="w-full h-full object-cover opacity-90 transition-transform duration-300 hover:scale-105"
                    />
                  ) : theme.isStudio ? (
                    <div className="w-full h-full bg-[#030712] border-b border-cyan-500/30 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.25),transparent_70%)]" />
                      <div className="relative z-10 flex items-center gap-1.5 font-mono text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase">
                        <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>HUGO STUDIO</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-amber-200 border-b-2 border-black flex items-center justify-center font-black text-black text-xs uppercase tracking-widest">
                      NEO BRUTALISM
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                      {theme.vietnameseTitle}
                    </h4>
                    <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {theme.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {theme.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {theme.badgeText}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1 px-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" />
            Giao diện được tự động cập nhật ngay lập tức khi bạn chọn
          </span>
          <span className="text-[11px] opacity-70">
            Nút lưu ở các tab khác chỉ dùng cho thông tin cá nhân
          </span>
        </div>
      </div>

      {/* ── 2. CÁ NHÂN HÓA TÊN MIỀN & ĐƯỜNG DẪN BIO (CHUẨN APPLE SETTINGS) ── */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <div className="space-y-1 pl-1">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="size-3.5 text-primary" />
            Cá nhân hóa Tên miền & Đường dẫn
          </h3>
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Dễ dàng chia sẻ hồ sơ qua đường dẫn ngắn hoặc gắn tên miền của riêng bạn để tạo dấu ấn thương hiệu cá nhân.
          </p>
        </div>

        {/* Thẻ Đường dẫn có sẵn */}
        <div className="bg-card/60 border border-border/70 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <LinkIcon className="size-3" /> Đường dẫn Bio ngắn gọn:
              </span>
              <p className="text-sm font-bold text-foreground mt-0.5 select-all font-mono">
                {shortBioUrl}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => copyToClipboard(shortBioUrl, "short")}
                className="px-3 py-1.5 rounded-xl border border-border/70 hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedLink === "short" ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copiedLink === "short" ? "Đã chép" : "Sao chép"}
              </button>
              <a
                href={shortBioUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                Xem ngay <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground">Đường dẫn đầy đủ:</span>
              <p className="text-xs text-muted-foreground/90 font-mono mt-0.5 select-all">
                {primaryBioUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(primaryBioUrl, "full")}
              className="px-2.5 py-1 rounded-lg hover:bg-muted text-[11px] font-medium text-muted-foreground flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              {copiedLink === "full" ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              Sao chép
            </button>
          </div>
        </div>

        {/* Thẻ Cấu hình Tên miền riêng (Custom Domain) */}
        <div className="bg-card/60 border border-border/70 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="size-4 text-primary" /> Tên miền riêng (Custom Domain)
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                bio?.customDomain
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {bio?.customDomain ? "Đang liên kết" : "Chưa kích hoạt"}
            </span>
          </div>

          <form onSubmit={handleSaveCustomDomain} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="ví dụ: bio.tenban.vn hoặc mybrand.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/70 bg-background text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary font-mono placeholder:font-sans"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingDomain || !customDomainInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
                >
                  {savingDomain ? "Đang lưu..." : "Lưu tên miền"}
                </button>
                {bio?.customDomain && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomDomain}
                    disabled={savingDomain}
                    className="px-3 py-2.5 rounded-xl border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-semibold transition-all shrink-0"
                  >
                    Hủy liên kết
                  </button>
                )}
              </div>
            </div>

            {/* Hướng dẫn cấu hình DNS chuẩn Apple Inset */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">
                📌 Hướng dẫn cấu hình DNS tại nhà đăng ký tên miền:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                <div className="p-2 rounded-lg bg-background border border-border/40">
                  <span className="font-bold text-foreground">Bản ghi CNAME (khuyên dùng):</span>
                  <p className="mt-0.5 text-muted-foreground">Host: <span className="text-foreground">@</span> hoặc <span className="text-foreground">bio</span></p>
                  <p className="text-muted-foreground">Giá trị: <span className="text-primary font-bold">cname.hugowishpax.studio</span></p>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border/40">
                  <span className="font-bold text-foreground">Bản ghi A (dành cho root domain):</span>
                  <p className="mt-0.5 text-muted-foreground">Host: <span className="text-foreground">@</span></p>
                  <p className="text-muted-foreground">Trỏ về địa chỉ IP máy chủ Hugo Studio</p>
                </div>
              </div>
              <p className="text-[11px] opacity-75">
                * Sau khi trỏ DNS, tên miền sẽ tự động kích hoạt và kết nối an toàn với máy chủ.
              </p>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
