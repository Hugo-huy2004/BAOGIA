import { useTranslation } from "react-i18next";
import { useState } from "react";
import { notify } from "../../lib/notify";
import { BioIconButton, BioRow, BioSection, bioInputClass } from "./bioEditorKit";

const COMMON_ICONS = [
  "code", "design_services", "brush", "campaign", "photo_camera",
  "edit_note", "storefront", "school", "support_agent", "rocket_launch",
];

// Mỗi loại một cấu hình: khoá trong formData, các ô bắt buộc, ô nào là "tên".
const KINDS = {
  project: { list: "projects", prefix: "proj_", nameField: "title", required: ["title", "description"], empty: { title: "", description: "", link: "" } },
  service: { list: "services", prefix: "srv_", nameField: "name", required: ["name", "description", "price"], empty: { name: "", description: "", price: "", icon: "design_services" } },
};

/**
 * Dự án & Dịch vụ (làm lại 26/10/2026): hai nhóm danh sách, chạm một mục để
 * sửa, nút xoá luôn hiện (bản cũ chỉ hiện khi rê chuột nên điện thoại không xoá
 * được), thêm/sửa/xoá đều tự lưu như tab Thẻ liên kết.
 */
export default function AchievementsSubTab({ formData, setFormData, handleSave }) {
  const { t } = useTranslation();
  // { kind, id|null, draft } — id null là đang thêm mới.
  const [editing, setEditing] = useState(null);

  const commit = (kind, items) => {
    const data = { ...formData, [KINDS[kind].list]: items };
    setFormData(data);
    handleSave?.(null, data);
  };

  const submit = () => {
    const { kind, id, draft } = editing;
    const cfg = KINDS[kind];
    if (cfg.required.some((f) => !String(draft[f] || "").trim())) {
      notify.warning(t(kind === "project" ? "memberTabs.projects.toastEmpty" : "memberTabs.services.toastEmpty"));
      return;
    }
    const items = formData[cfg.list] || [];
    commit(kind, id
      ? items.map((it) => (it.id === id ? { ...it, ...draft } : it))
      : [...items, { ...draft, id: cfg.prefix + Date.now() }]);
    setEditing(null);
  };

  const remove = async (kind, item) => {
    const ok = await notify.confirm({
      title: t("bioStudio.achievements.removeTitle", "Xoá mục này?"),
      message: item[KINDS[kind].nameField],
      danger: true,
    });
    if (!ok) return;
    commit(kind, (formData[KINDS[kind].list] || []).filter((it) => it.id !== item.id));
    if (editing?.id === item.id) setEditing(null);
  };

  const set = (field) => (e) => setEditing((cur) => ({ ...cur, draft: { ...cur.draft, [field]: e.target.value } }));

  const renderForm = (kind) => {
    const { draft, id } = editing;
    const isProject = kind === "project";
    const ns = isProject ? "memberTabs.projects" : "memberTabs.services";
    const field = (name, placeholder, extra = {}) => (
      <div className="border-t border-border/50 first:border-t-0">
        <input
          value={draft[name] || ""}
          onChange={set(name)}
          aria-label={placeholder}
          placeholder={placeholder}
          className={bioInputClass}
          {...extra}
        />
      </div>
    );
    return (
      <div className="border-t border-border/50 bg-muted/30">
        {field(isProject ? "title" : "name", t(`${ns}.namePlaceholder`))}
        {isProject
          ? field("link", "https://", { type: "url", inputMode: "url", autoCapitalize: "none" })
          : field("price", t(`${ns}.pricePlaceholder`))}
        <div className="border-t border-border/50">
          <textarea
            rows={3}
            value={draft.description || ""}
            onChange={set("description")}
            aria-label={t(`${ns}.descPlaceholder`)}
            placeholder={t(`${ns}.descPlaceholder`)}
            className={`${bioInputClass} resize-none leading-relaxed`}
          />
        </div>
        {!isProject && (
          <div className="flex gap-2 overflow-x-auto border-t border-border/50 px-4 py-3 [scrollbar-width:none]">
            {COMMON_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                aria-pressed={draft.icon === icon}
                aria-label={icon}
                onClick={() => setEditing((cur) => ({ ...cur, draft: { ...cur.draft, icon } }))}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors ${
                  draft.icon === icon ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-background text-muted-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 border-t border-border/50 p-3">
          <button type="button" onClick={() => setEditing(null)} className="h-11 flex-1 rounded-xl bg-muted text-[15px] font-semibold text-foreground">
            {t("memberTabs.achievements.close")}
          </button>
          <button type="button" onClick={submit} className="h-11 flex-[2] rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground">
            {id ? t("bioStudio.achievements.update", "Cập nhật") : t("memberTabs.achievements.addNew")}
          </button>
        </div>
      </div>
    );
  };

  const renderGroup = (kind) => {
    const cfg = KINDS[kind];
    const items = formData[cfg.list] || [];
    const isProject = kind === "project";
    const open = editing?.kind === kind;
    return (
      <BioSection
        key={kind}
        title={t(isProject ? "bioStudio.achievements.projects" : "bioStudio.achievements.services", isProject ? "Dự án" : "Dịch vụ")}
        aside={String(items.length)}
      >
        {items.map((item) =>
          open && editing.id === item.id ? (
            <div key={item.id}>{renderForm(kind)}</div>
          ) : (
            <BioRow
              key={item.id}
              icon={isProject ? "folder_special" : item.icon || "design_services"}
              title={item[cfg.nameField]}
              detail={isProject ? item.description : [item.price, item.description].filter(Boolean).join(" · ")}
              onClick={() => setEditing({ kind, id: item.id, draft: { ...item } })}
              trailing={<span className="-mr-2"><BioIconButton icon="delete" danger label={t(`memberTabs.${isProject ? "projects" : "services"}.deleteBtn`)} onClick={() => remove(kind, item)} /></span>}
            />
          ),
        )}
        {open && !editing.id ? (
          renderForm(kind)
        ) : (
          <BioRow
            icon="add"
            title={t(isProject ? "bioStudio.achievements.addProject" : "bioStudio.achievements.addService", isProject ? "Thêm dự án" : "Thêm dịch vụ")}
            onClick={() => setEditing({ kind, id: null, draft: { ...cfg.empty } })}
          />
        )}
      </BioSection>
    );
  };

  return (
    <div className="space-y-7">
      <p className="px-1 text-[15px] leading-relaxed text-muted-foreground">{t("memberTabs.achievements.desc")}</p>
      {renderGroup("project")}
      {renderGroup("service")}
    </div>
  );
}
