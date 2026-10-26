import { useState } from "react";
import { API_BASE } from "../../config/apiBase";
import { notify } from "../../lib/notify";
import { BioIconButton, BioRow, BioSection, bioInputClass } from "./bioEditorKit";

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
    notify.success(t("memberPortal.bioPreview.copySuccess"));
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
    const ok = await notify.confirm({
      title: t("bioStudio.design.unlinkTitle", "Huỷ liên kết tên miền riêng?"),
      message: bio?.customDomain,
      danger: true,
    });
    if (!ok) return;
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

  const current = AVAILABLE_THEMES.find((x) => x.id === currentTemplate);

  return (
    <div className="space-y-7">
      <BioSection
        title={t("bioStudio.design.themeTitle", "Giao diện trang")}
        aside={current?.vietnameseTitle}
        hint={current ? current.desc : t("bioStudio.design.themeHint", "Chạm một mẫu để áp dụng và lưu ngay.")}
      >
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
          {AVAILABLE_THEMES.map((theme) => {
            const on = currentTemplate === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={on}
                onClick={() => !on && handleSelectTheme(theme)}
                className={`relative min-w-0 overflow-hidden rounded-xl border text-left transition-transform active:scale-[0.98] ${
                  on ? "border-primary ring-2 ring-primary" : "border-border/60"
                }`}
              >
                <span className="block aspect-[16/10] w-full overflow-hidden bg-muted">
                  {theme.bgPreview ? (
                    <img src={theme.bgPreview} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : theme.isStudio ? (
                    <span className="grid h-full w-full place-items-center bg-[#030712] font-mono text-[11px] font-bold tracking-[0.18em] text-cyan-300">HUGO STUDIO</span>
                  ) : (
                    <span className="grid h-full w-full place-items-center border-b-2 border-black bg-amber-200 text-[11px] font-black tracking-widest text-black">BRUTALISM</span>
                  )}
                </span>
                <span className="flex min-h-[44px] items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-[14px] font-semibold text-foreground">{theme.vietnameseTitle}</span>
                  {on && <span className="material-symbols-outlined shrink-0 text-[20px] text-primary [font-variation-settings:'FILL'_1]" aria-hidden="true">check_circle</span>}
                </span>
              </button>
            );
          })}
        </div>
      </BioSection>

      <BioSection title={t("bioStudio.design.linkTitle", "Đường dẫn")}>
        {[["short", shortBioUrl], ["full", primaryBioUrl]].map(([type, url]) => (
          <BioRow
            key={type}
            icon={type === "short" ? "link" : "language"}
            title={url.replace(/^https?:\/\//, "")}
            detail={type === "short" ? t("bioStudio.design.shortLink", "Đường dẫn ngắn") : t("bioStudio.design.fullLink", "Đường dẫn đầy đủ")}
            href={url}
            trailing={
              <span className="-mr-2">
                <BioIconButton
                  icon={copiedLink === type ? "check" : "content_copy"}
                  label={t("memberPortal.bioPreview.copyLinkAria")}
                  onClick={() => copyToClipboard(url, type)}
                />
              </span>
            }
          />
        ))}
      </BioSection>

      <BioSection
        title={t("bioStudio.design.domainTitle", "Tên miền riêng")}
        aside={bio?.customDomain ? t("bioStudio.design.domainOn", "Đang liên kết") : t("bioStudio.design.domainOff", "Chưa kích hoạt")}
      >
        <form onSubmit={handleSaveCustomDomain}>
          <input
            type="text"
            inputMode="url"
            autoCapitalize="none"
            value={customDomainInput}
            onChange={(e) => setCustomDomainInput(e.target.value)}
            aria-label={t("bioStudio.design.domainTitle", "Tên miền riêng")}
            placeholder="bio.tenmien.vn"
            className={`${bioInputClass} font-mono`}
          />
          <div className="flex gap-2 border-t border-border/50 p-3">
            {bio?.customDomain && (
              <button
                type="button"
                onClick={handleRemoveCustomDomain}
                disabled={savingDomain}
                className="h-11 flex-1 rounded-xl bg-destructive/10 text-[15px] font-semibold text-destructive disabled:opacity-40"
              >
                {t("bioStudio.design.unlink", "Huỷ liên kết")}
              </button>
            )}
            <button
              type="submit"
              disabled={savingDomain || !customDomainInput.trim()}
              className="h-11 flex-[2] rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-40"
            >
              {savingDomain ? t("bioStudio.design.saving", "Đang lưu…") : t("bioStudio.design.saveDomain", "Lưu tên miền")}
            </button>
          </div>
        </form>
        <details className="group border-t border-border/50">
          <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between px-4 text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
            {t("bioStudio.design.dnsTitle", "Cách trỏ DNS")}
            <span className="material-symbols-outlined text-[20px] text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
          </summary>
          <dl className="space-y-3 px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">
            <div>
              <dt className="font-semibold text-foreground">CNAME</dt>
              <dd>Host <code className="font-mono text-foreground">bio</code> → <code className="break-all font-mono text-foreground">cname.hugowishpax.studio</code></dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">A</dt>
              <dd>{t("bioStudio.design.dnsA", "Host @ trỏ về địa chỉ IP máy chủ Hugo Studio (dùng cho tên miền gốc).")}</dd>
            </div>
            <dd>{t("bioStudio.design.dnsAfter", "Trỏ xong, tên miền tự kích hoạt kèm chứng chỉ bảo mật.")}</dd>
          </dl>
        </details>
      </BioSection>
    </div>
  );
}
