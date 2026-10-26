import { useMemo, useState } from "react";
import OptimizedInput from "../common/OptimizedInput";
import OptimizedTextarea from "../common/OptimizedTextarea";
import { notify } from "../../lib/notify";
import { SocialMonochromeIcon } from "../../utils/socialBrandHelper";
import { detectSocialPlatform, SUPPORTED_PLATFORMS } from "../../utils/socialBrandConstants";
import { BioIconButton, BioRow, BioSection, BioToggle, bioInputClass } from "./bioEditorKit";

// Khớp giới hạn ở addSocialLink (MemberPortalPage): Zalo cũng tính là một liên kết.
const MAX_LINKS = 5;
const BIO_WORD_LIMIT = 110;
const isZalo = (link) => (link.url || "").includes("zalo.me") || (link.label || "").toLowerCase() === "zalo";
// zalo.me/<số> chỉ mở được bằng số điện thoại; chuỗi khác (mã Google, mã Zalo) ra trang lỗi.
const PHONE_RE = /^(0\d{9,10}|\+?\d{9,15})$/;

export default function LinksSubTab({
  formData,
  setFormData,
  removeSocialLink,
  handleFieldChange,
  bioTextareaRef,
  bio,
  handleSave,
  t,
}) {
  // Bản nháp giữ tại chỗ: state cũ nằm ở MemberPortalPage nên mỗi phím gõ vẽ lại
  // cả portal, và ô nhập trễ 300ms khiến Enter thêm nhầm giá trị cũ.
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const links = useMemo(() => (Array.isArray(formData.links) ? formData.links : []), [formData.links]);
  const phone = (formData.phone || bio?.phone || "").replace(/[^\d+]/g, "").replace(/^\+84/, "0");
  const phoneValid = PHONE_RE.test(phone);
  const zaloOn = links.some(isZalo);
  const full = links.length >= MAX_LINKS;
  const words = formData.bio ? formData.bio.trim().split(/\s+/).filter(Boolean).length : 0;
  const aboutDirty = (formData.bio || "") !== (bio?.bio || "") || (formData.hobbies || "") !== (bio?.hobbies || "");

  const saveLinks = (next) => {
    const data = { ...formData, links: next };
    setFormData(data);
    handleSave?.(null, data);
  };

  const toggleZalo = (on) => {
    if (on && !phoneValid) {
      notify.warning(t("bioStudio.links.zaloNeedPhone", "Cần một số điện thoại hợp lệ ở mục Hồ sơ trước khi bật Zalo."));
      return;
    }
    if (on && full) {
      notify.warning(t("memberPortal.toast.linkLimit"));
      return;
    }
    const rest = links.filter((l) => !isZalo(l));
    saveLinks(on ? [...rest, { label: "Zalo", url: `https://zalo.me/${phone}` }] : rest);
  };

  const addLink = () => {
    const label = newLinkLabel.trim();
    const url = newLinkUrl.trim();
    if (full || !label || !url || SUPPORTED_PLATFORMS.some((p) => p.prefix === url)) return;
    saveLinks([...links, { label, url: /^[a-z]+:\/\//i.test(url) ? url : `https://${url}` }]);
    setNewLinkLabel("");
    setNewLinkUrl("");
  };
  const onEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLink();
    }
  };

  const confirmRemove = async (idx) => {
    const ok = await notify.confirm({
      title: t("bioStudio.links.removeTitle", "Gỡ liên kết này?"),
      message: links[idx]?.url,
      danger: true,
    });
    if (ok) removeSocialLink(idx);
  };

  const pickPlatform = (platform) => {
    setNewLinkLabel(platform.name);
    if (!newLinkUrl || SUPPORTED_PLATFORMS.some((p) => p.prefix === newLinkUrl)) setNewLinkUrl(platform.prefix);
  };

  return (
    <div className="space-y-7">
      <BioSection
        title={t("bioStudio.links.listTitle", "Liên kết đang hiển thị")}
        aside={`${links.length}/${MAX_LINKS}`}
        hint={t("bioStudio.links.listHint", "Thêm hay gỡ đều tự lưu ngay.")}
      >
        {links.length === 0 ? (
          <p className="px-4 py-6 text-center text-[15px] text-muted-foreground">
            {t("memberPortal.links.empty", "Chưa có liên kết xã hội nào.")}
          </p>
        ) : (
          links.map((link, idx) => (
            <BioRow
              key={`${link.url}-${idx}`}
              icon={<SocialMonochromeIcon platform={detectSocialPlatform(link.label, link.url)} className="size-[18px]" />}
              title={link.label || link.url}
              detail={link.url.replace(/^https?:\/\//, "")}
              trailing={
                <span className="-mr-2 flex shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("bioStudio.links.open", "Mở liên kết")}
                    className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">open_in_new</span>
                  </a>
                  <BioIconButton icon="delete" danger label={t("bioStudio.links.remove", "Gỡ liên kết")} onClick={() => confirmRemove(idx)} />
                </span>
              }
            />
          ))
        )}
      </BioSection>

      <BioSection
        title={t("bioStudio.links.addTitle", "Thêm liên kết")}
        hint={full ? t("memberPortal.toast.linkLimit") : t("bioStudio.links.addHint", "Chọn nền tảng để điền sẵn đầu đường dẫn, hoặc dán thẳng một URL.")}
      >
        <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-3 [scrollbar-width:none]">
          {SUPPORTED_PLATFORMS.filter((p) => p.id !== "zalo").map((p) => {
            const on = newLinkLabel.toLowerCase() === p.name.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPlatform(p)}
                aria-pressed={on}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[14px] font-medium transition-colors ${
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background text-foreground hover:bg-muted"
                }`}
              >
                <SocialMonochromeIcon platform={p.id} className="size-4" />
                {p.name}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/50">
          <input
            type="text"
            value={newLinkLabel}
            onKeyDown={onEnter}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            aria-label={t("bioStudio.links.labelField", "Tên hiển thị")}
            placeholder={t("bioStudio.links.labelField", "Tên hiển thị")}
            className={bioInputClass}
          />
        </div>
        <div className="border-t border-border/50">
          <input
            type="url"
            inputMode="url"
            autoCapitalize="none"
            value={newLinkUrl}
            onKeyDown={onEnter}
            onChange={(e) => {
              const val = e.target.value;
              setNewLinkUrl(val);
              if (!newLinkLabel) {
                const matched = SUPPORTED_PLATFORMS.find((p) => p.id === detectSocialPlatform("", val));
                if (matched) setNewLinkLabel(matched.name);
              }
            }}
            aria-label={t("memberPortal.links.url", "Địa chỉ URL")}
            placeholder="https://"
            className={`${bioInputClass} font-mono text-[15px]`}
          />
        </div>
        <div className="border-t border-border/50 p-3">
          <button
            type="button"
            onClick={addLink}
            disabled={full || !newLinkLabel.trim() || !newLinkUrl.trim()}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
            {t("memberPortal.links.addLink", "Thêm liên kết")}
          </button>
        </div>
      </BioSection>

      <BioSection
        title={t("bioStudio.links.zaloTitle", "Nút nhắn Zalo")}
        hint={phoneValid
          ? t("bioStudio.links.zaloHint", { phone, defaultValue: "Khách bấm vào sẽ mở thẳng cuộc trò chuyện với số {{phone}}." })
          : t("bioStudio.links.zaloNoPhone", "Chưa có số điện thoại hợp lệ ở mục Hồ sơ.")}
      >
        <BioRow
          icon={<SocialMonochromeIcon platform="zalo" className="size-[18px]" />}
          title="Zalo"
          detail={phoneValid ? phone : t("bioStudio.links.zaloOff", "Chưa sẵn sàng")}
          trailing={<BioToggle checked={zaloOn} onChange={toggleZalo} disabled={!zaloOn && !phoneValid} label="Zalo" />}
        />
      </BioSection>

      <BioSection
        title={t("bioStudio.links.aboutTitle", "Giới thiệu")}
        aside={t("memberPortal.other.wordCount", { count: words, limit: BIO_WORD_LIMIT })}
      >
        <OptimizedTextarea
          ref={bioTextareaRef}
          name="bio"
          rows={4}
          value={formData.bio || ""}
          onChange={handleFieldChange}
          aria-label={t("bioStudio.links.aboutTitle", "Giới thiệu")}
          placeholder={t("memberPortal.other.placeholderDesc", "Viết một vài dòng giới thiệu bản thân...")}
          className={`${bioInputClass} min-h-[112px] resize-none leading-relaxed`}
        />
        <div className="flex items-center gap-3 border-t border-border/50 pl-4">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground" aria-hidden="true">interests</span>
          <OptimizedInput
            type="text"
            name="hobbies"
            value={formData.hobbies || ""}
            onChange={handleFieldChange}
            aria-label={t("memberPortal.other.hobbies", "Sở thích")}
            placeholder={t("memberPortal.other.placeholderHobbies", "Sở thích")}
            className={`${bioInputClass} pl-0`}
          />
        </div>
        {aboutDirty && (
          <div className="border-t border-border/50 p-3">
            <button
              type="button"
              onClick={() => handleSave?.()}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">check</span>
              {t("memberPortal.bio.saveChanges")}
            </button>
          </div>
        )}
      </BioSection>
    </div>
  );
}
