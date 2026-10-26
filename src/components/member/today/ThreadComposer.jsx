import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { notify } from "../../../lib/notify";
import { sensory } from "../../../lib/sensory";
import { todayPostsApi } from "../../../services/api/modules/todayFeedApi";
import { Avatar, CLAMP } from "./ThreadPost";

const POLL_HOURS = [1, 6, 24, 72, 168];
const LIST_LINE = /^(\s*)([-•*]|\d+[.)])\s+(.*)$/;

/**
 * Màn soạn bài toàn màn hình như Threads. Chỉ chữ — định dạng lưu dạng dấu
 * (**đậm**, *nghiêng*…) để bài vẫn đọc được ở bất cứ đâu, RichText vẽ lại.
 * `editing`: sửa bài cũ (bình chọn đã đăng thì không sửa được).
 */
export default function ThreadComposer({ me, parentKey = null, replyTo = "", editing = null, onClose, onDone }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [text, setText] = useState(editing?.text || "");
  const [poll, setPoll] = useState(null);
  const [busy, setBusy] = useState(false);
  // Chỉ bài gốc mới chọn được ai xem; hồi đáp theo phạm vi của bài gốc.
  const topLevel = editing ? !editing.parentKey : !parentKey;
  const [audience, setAudience] = useState(editing?.private ? "private" : "public");

  useEffect(() => {
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Textarea cao theo chữ — viết dài bao nhiêu cũng thấy hết, trang tự cuộn.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const edit = (fn) => {
    const el = ref.current;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const [next, caretStart, caretEnd] = fn(value, s, e);
    setText(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caretStart, caretEnd); });
  };

  const wrap = (mark) => edit((v, s, e) => [v.slice(0, s) + mark + v.slice(s, e) + mark + v.slice(e), s + mark.length, e + mark.length]);
  const upper = () => edit((v, s, e) => [v.slice(0, s) + v.slice(s, e).toLocaleUpperCase() + v.slice(e), s, e]);

  // Bật/tắt gạch đầu dòng (hoặc đánh số) cho mọi dòng nằm trong vùng chọn.
  const list = (numbered) => edit((v, s, e) => {
    const start = v.lastIndexOf("\n", s - 1) + 1;
    const endIdx = v.indexOf("\n", e);
    const end = endIdx === -1 ? v.length : endIdx;
    const lines = v.slice(start, end).split("\n");
    const has = lines.every((l) => (numbered ? /^\d+[.)]\s/ : /^[-•]\s/).test(l));
    const next = lines.map((l, i) => {
      const bare = l.replace(/^(\d+[.)]|[-•])\s+/, "");
      return has ? bare : `${numbered ? `${i + 1}.` : "•"} ${bare}`;
    }).join("\n");
    return [v.slice(0, start) + next + v.slice(end), start, start + next.length];
  });

  // Enter trong danh sách: tự thêm dấu dòng kế; Enter trên dòng trống thì thoát danh sách.
  const onKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    const el = event.currentTarget;
    const { selectionStart: s, value } = el;
    const start = value.lastIndexOf("\n", s - 1) + 1;
    const match = value.slice(start, s).match(LIST_LINE);
    if (!match) return;
    event.preventDefault();
    const [, indent, mark, rest] = match;
    if (!rest.trim()) {
      edit((v) => [v.slice(0, start) + v.slice(s), start, start]);
      return;
    }
    const nextMark = /\d/.test(mark) ? `${parseInt(mark, 10) + 1}${mark.slice(-1)}` : mark;
    const insert = `\n${indent}${nextMark} `;
    edit((v) => [v.slice(0, s) + insert + v.slice(el.selectionEnd), s + insert.length, s + insert.length]);
  };

  const canPost = !busy && (text.trim() || (poll && poll.options.filter((o) => o.trim()).length >= 2));

  const submit = async () => {
    if (!canPost) return;
    setBusy(true);
    try {
      const res = editing
        ? await todayPostsApi.edit(editing.key, text, topLevel ? audience : undefined)
        : await todayPostsApi.create({ text, parentKey, audience, poll: poll && { options: poll.options, hours: poll.hours } });
      sensory.success();
      notify.success(t(editing ? "memberPortal.threads.saved" : "memberPortal.threads.published"));
      onDone?.(res.post);
    } catch (error) {
      notify.error(error.message || t("memberPortal.threads.error"));
      setBusy(false);
    }
  };

  const tools = [
    ["format_bold", t("memberPortal.threads.tools.bold"), () => wrap("**")],
    ["format_italic", t("memberPortal.threads.tools.italic"), () => wrap("*")],
    ["strikethrough_s", t("memberPortal.threads.tools.strike"), () => wrap("~~")],
    ["ink_highlighter", t("memberPortal.threads.tools.highlight"), () => wrap("==")],
    ["match_case", t("memberPortal.threads.tools.upper"), upper],
    ["format_list_bulleted", t("memberPortal.threads.tools.bullet"), () => list(false)],
    ["format_list_numbered", t("memberPortal.threads.tools.numbered"), () => list(true)],
  ];
  if (!editing && !parentKey) {
    tools.push(["ballot", t("memberPortal.threads.tools.poll"), () => setPoll((p) => (p ? null : { options: ["", ""], hours: 24 }))]);
  }

  const setOption = (i, value) => setPoll((p) => ({ ...p, options: p.options.map((o, j) => (j === i ? value : o)) }));

  // Portal ra body: khung portal có transform (view transition) làm `fixed` kẹt
  // trong khung, và thanh tab (z-[120]) đè lên nút Đăng.
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-background" role="dialog" aria-modal="true">
      <header className="flex items-center justify-between border-b border-border px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} className="min-h-[44px] text-[16px] text-foreground">{t("memberPortal.threads.cancel")}</button>
        <h2 className="text-[16px] font-bold text-foreground">
          {editing ? t("memberPortal.threads.editTitle") : parentKey ? t("memberPortal.threads.replyTitle") : t("memberPortal.threads.newThread")}
        </h2>
        <span className="w-12" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex gap-3">
          <Avatar author={me} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-foreground">{me?.name}</p>
            {replyTo && <p className="text-[13px] text-muted-foreground">{t("memberPortal.threads.replyTo", { name: replyTo })}</p>}
            {topLevel && (
              <button
                type="button"
                onClick={() => setAudience((a) => (a === "public" ? "private" : "public"))}
                aria-label={t("memberPortal.threads.audience.label")}
                className="mt-1 inline-flex min-h-[32px] items-center gap-1 rounded-full bg-muted px-3 text-[13px] font-semibold text-foreground"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{audience === "public" ? "public" : "lock"}</span>
                {t(`memberPortal.threads.audience.${audience}`)}
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">swap_horiz</span>
              </button>
            )}
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={parentKey ? t("memberPortal.threads.replyPlaceholder") : t("memberPortal.threads.placeholder")}
              className="mt-1 w-full resize-none overflow-hidden bg-transparent text-[16px] leading-[1.45] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            {poll && (
              <div className="mt-2 space-y-2">
                {poll.options.map((option, i) => (
                  <input
                    key={i}
                    value={option}
                    maxLength={80}
                    onChange={(e) => setOption(i, e.target.value)}
                    placeholder={t("memberPortal.threads.poll.option", { n: i + 1 })}
                    className="h-11 w-full rounded-xl border border-border bg-transparent px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
                  />
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  {poll.options.length < 4 && (
                    <button type="button" onClick={() => setPoll((p) => ({ ...p, options: [...p.options, ""] }))} className="min-h-[36px] rounded-full bg-muted px-3.5 text-[14px] font-semibold text-foreground">
                      {t("memberPortal.threads.poll.add")}
                    </button>
                  )}
                  <select
                    value={poll.hours}
                    onChange={(e) => setPoll((p) => ({ ...p, hours: Number(e.target.value) }))}
                    aria-label={t("memberPortal.threads.poll.duration")}
                    className="min-h-[36px] rounded-full bg-muted px-3 text-[14px] font-semibold text-foreground"
                  >
                    {POLL_HOURS.map((h) => <option key={h} value={h}>{t(`memberPortal.threads.poll.h${h}`)}</option>)}
                  </select>
                </div>
              </div>
            )}

            {text.length > CLAMP && (
              <p className="mt-2 text-[13px] text-muted-foreground">{t("memberPortal.threads.longHint", { count: text.length })}</p>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-border px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        <div className="flex items-center gap-1">
          <div className="flex min-w-0 flex-1 overflow-x-auto">
            {tools.map(([icon, label, run]) => (
              <button
                key={icon}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={run}
                aria-label={label}
                title={label}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted ${icon === "ballot" && poll ? "text-foreground" : ""}`}
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{icon}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!canPost}
            className="min-h-[40px] shrink-0 rounded-full bg-foreground px-5 text-[15px] font-bold text-background disabled:opacity-40"
          >
            {editing ? t("memberPortal.threads.save") : t("memberPortal.threads.post")}
          </button>
        </div>
      </footer>
    </div>,
    document.body,
  );
}
