import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ListGroup, ListRow, Sheet } from "../../demos/iosKit";

const MAX_LINKS = 5;
const newId = () => Math.random().toString(36).slice(2, 8);
const inputClass = "w-full border-0 bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-[var(--ios-label-3)] focus:ring-0";

/**
 * Link bảo mật: liên kết chuyển tiếp yêu cầu mật khẩu, tối đa 5 cái.
 *
 * Danh sách và biểu mẫu tách hẳn ra hai lớp — trước đây cùng một khối bị đổi
 * qua lại bằng cờ `isEditing` nên đang sửa dở là mất luôn danh sách.
 */
export default function LinksTool({ bio, showToast, setFormData, handleSave }) {
  const { t } = useTranslation();
  const links = bio?.secretLinks || [];

  const [draft, setDraft] = useState(null); // { id?, title, url, password }

  const persist = (updated) => {
    const next = { ...bio, secretLinks: updated };
    setFormData(next);
    handleSave?.(null, next);
    setDraft(null);
  };

  const save = () => {
    if (!draft.url.trim() || !draft.password.trim()) {
      showToast?.(t("utilities.secretLink.toastValidation"), "warning");
      return;
    }
    const url = /^https?:\/\//i.test(draft.url.trim()) ? draft.url.trim() : `https://${draft.url.trim()}`;
    const title = draft.title.trim() || t("utilities.secretLink.title");

    persist(draft.id
      ? links.map((link) => (link.id === draft.id ? { ...link, title, url, password: draft.password.trim() } : link))
      : [...links, { id: newId(), title, url, password: draft.password.trim(), visits: 0 }]);
  };

  const copy = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${bio?.slug}/${id}`);
    showToast?.(t("utilities.secretLink.copiedToast"), "success");
  };

  const openNew = () => {
    if (links.length >= MAX_LINKS) {
      showToast?.(t("utilities.secretLink.toastLimit"), "warning");
      return;
    }
    setDraft({ title: "", url: "", password: "" });
  };

  return (
    <div className="space-y-5">
      <ListGroup
        header={t("utilities.secretLink.listTitle")}
        footer={t("utilities.secretLink.infoDesc")}
      >
        {links.length === 0 ? (
          <ListRow title={t("utilities.secretLink.emptyList")} last />
        ) : (
          links.map((link, index) => (
            <ListRow
              key={link.id}
              icon="lock"
              title={link.title || `${t("utilities.secretLink.title")} ${index + 1}`}
              subtitle={link.url}
              value={t("utilities.secretLink.visitsCount", { count: link.visits || 0 })}
              chevron
              last={index === links.length - 1}
              onClick={() => setDraft({ id: link.id, title: link.title || "", url: link.url, password: link.password })}
            />
          ))
        )}
      </ListGroup>

      <Button full onClick={openNew} disabled={links.length >= MAX_LINKS}>
        <span className="material-symbols-outlined text-[20px]">add</span>
        {t("utilities.secretLink.btnAdd")} ({links.length}/{MAX_LINKS})
      </Button>

      <Sheet
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? t("utilities.secretLink.btnUpdate") : t("utilities.secretLink.btnCreate")}
        action={<Button full size="lg" onClick={save}>{draft?.id ? t("utilities.secretLink.btnUpdate") : t("utilities.secretLink.btnCreate")}</Button>}
      >
        {draft && (
          <div className="space-y-5 pt-2">
            <ListGroup>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder={t("utilities.secretLink.placeholders.title")}
                className={`${inputClass} border-b-[0.5px] border-[var(--ios-sep)]`}
              />
              <input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder={t("utilities.secretLink.placeholders.url")}
                inputMode="url"
                className={`${inputClass} border-b-[0.5px] border-[var(--ios-sep)]`}
              />
              <input
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                placeholder={t("utilities.secretLink.placeholders.password")}
                className={inputClass}
              />
            </ListGroup>

            {draft.id && (
              <ListGroup>
                <ListRow
                  icon="content_copy"
                  title={t("utilities.secretLink.btnCopy")}
                  onClick={() => copy(draft.id)}
                />
                <ListRow
                  title={t("utilities.secretLink.btnDelete")}
                  danger
                  last
                  onClick={() => persist(links.filter((link) => link.id !== draft.id))}
                />
              </ListGroup>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
