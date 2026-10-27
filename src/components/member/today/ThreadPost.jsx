import { useEffect, useRef, useState } from "react";
import { optimizeCloudinaryUrl } from "../../../utils/imageOptimizer";
import { useTranslation } from "react-i18next";
import { notify } from "../../../lib/notify";
import { sensory } from "../../../lib/sensory";
import { todayPostsApi } from "../../../services/api/modules/todayFeedApi";

/**
 * Một bài trên bảng tin Today kiểu Threads (26/10/2026) — dùng chung cho bài
 * thành viên, bài báo (đóng vai một tài khoản) và lời hồi đáp.
 */

export const CLAMP = 255;
const Icon = ({ name, fill = false, className = "" }) => (
  <span
    className={`material-symbols-outlined text-[22px] leading-none ${className}`}
    style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    aria-hidden="true"
  >
    {name}
  </span>
);

// ── Định dạng chữ: **đậm**, *nghiêng*, ~~gạch~~, ==nổi bật==, link, gạch đầu dòng ──
// ponytail: không lồng định dạng phức tạp; dấu không khớp cặp hiện nguyên văn.
const INLINE = /(\*\*[^*\n]+?\*\*|==[^=\n]+?==|~~[^~\n]+?~~|\*[^*\s][^*\n]*?\*|https?:\/\/[^\s<>]+|www\.[^\s<>]+\.[^\s<>]+)/g;
const TRAIL = /[.,;:!?)\]}'"]+$/;

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith("**")) return <strong key={i} className="font-bold">{inline(part.slice(2, -2))}</strong>;
    if (part.startsWith("==")) return <mark key={i} className="rounded bg-yellow-300/60 px-0.5 text-inherit dark:bg-yellow-400/30">{inline(part.slice(2, -2))}</mark>;
    if (part.startsWith("~~")) return <s key={i}>{inline(part.slice(2, -2))}</s>;
    if (part.startsWith("*")) return <em key={i}>{inline(part.slice(1, -1))}</em>;
    const tail = part.match(TRAIL)?.[0] || "";
    const url = tail ? part.slice(0, -tail.length) : part;
    return (
      <span key={i}>
        <a
          href={url.startsWith("www.") ? `https://${url}` : url}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="break-all text-sky-600 hover:underline dark:text-sky-400"
        >
          {url.replace(/^https?:\/\//, "")}
        </a>
        {tail}
      </span>
    );
  });
}

const BULLET = /^\s*[-•*]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

export function RichText({ text, className = "" }) {
  const blocks = [];
  for (const line of String(text || "").split("\n")) {
    const kind = BULLET.test(line) ? "ul" : NUMBER.test(line) ? "ol" : "p";
    const last = blocks[blocks.length - 1];
    if (kind !== "p" && last?.kind === kind) last.lines.push(line);
    else blocks.push({ kind, lines: [line] });
  }
  return (
    <div className={`whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-foreground ${className}`}>
      {blocks.map((block, i) => {
        if (block.kind === "p") {
          return <p key={i} className="min-h-[1.45em]">{inline(block.lines[0])}</p>;
        }
        const List = block.kind;
        return (
          <List key={i} className={`${List === "ul" ? "list-disc" : "list-decimal"} my-0.5 pl-5`}>
            {block.lines.map((line, j) => <li key={j}>{inline(line.replace(List === "ul" ? BULLET : NUMBER, ""))}</li>)}
          </List>
        );
      })}
    </div>
  );
}

// Cắt ở khoảng trắng gần mốc 255 để khỏi đứt giữa chữ.
function clampText(text) {
  const space = text.lastIndexOf(" ", CLAMP);
  return text.slice(0, space > CLAMP - 40 ? space : CLAMP);
}

function relativeTime(value, language) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language, { style: "narrow", numeric: "auto" });
  for (const [unit, size] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]]) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit);
  }
  return rtf.format(0, "second");
}

// Ảnh khác nguồn (Google, Cloudinary) chỉ tải MỘT lần mỗi phiên rồi dùng blob:
// nội bộ. Lớp kính liquidglass chụp lại trang và fetch song song từng <img>
// trước khi đệm của nó kịp có — một avatar lặp ở 20 bài = 20 lượt gọi Google
// cùng lúc → 429. Lỗi cũng được nhớ, để khỏi gọi lại liên tục.
const onceSrc = new Map();
function useOnceSrc(url) {
  const remote = /^https?:/.test(url || "") && !url.startsWith(window.location.origin);
  const [src, setSrc] = useState(remote ? null : url);
  useEffect(() => {
    if (!remote) return setSrc(url);
    if (!onceSrc.has(url)) {
      onceSrc.set(url, fetch(url, { referrerPolicy: "no-referrer" })
        .then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))
        .then((blob) => URL.createObjectURL(blob))
        .catch(() => ""));
    }
    let live = true;
    onceSrc.get(url).then((next) => live && setSrc(next));
    return () => { live = false; };
  }, [url, remote]);
  return src;
}

export function Avatar({ author, size = 36 }) {
  const style = { width: size, height: size };
  const [broken, setBroken] = useState(false);
  const src = useOnceSrc(author?.avatar ? optimizeCloudinaryUrl(author.avatar, size * 3) : "");
  if (src && !broken) {
    return <img src={src} alt="" style={style} onError={() => setBroken(true)} className={`shrink-0 rounded-full object-cover ${author.news ? "border border-border bg-white" : "bg-muted"}`} />;
  }
  return (
    <span style={style} className="grid shrink-0 place-items-center rounded-full bg-muted text-[15px] font-bold uppercase text-foreground">
      {author?.news ? <Icon name="newspaper" className="!text-[18px]" /> : String(author?.name || "?").trim().charAt(0)}
    </span>
  );
}

function Poll({ post }) {
  const { t, i18n } = useTranslation();
  const [poll, setPoll] = useState(post.poll);
  useEffect(() => setPoll(post.poll), [post.poll]);
  const revealed = poll.myVote >= 0 || poll.closed;

  const vote = async (option) => {
    sensory.tap();
    try {
      const res = await todayPostsApi.vote(post.key, option);
      setPoll(res.poll);
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <div className="mt-2.5 space-y-2" onClick={(e) => e.stopPropagation()}>
      {poll.options.map((option, i) => {
        const percent = poll.total ? Math.round((option.count / poll.total) * 100) : 0;
        return revealed ? (
          <div key={i} className="relative overflow-hidden rounded-xl border border-border px-3.5 py-2.5">
            <span className="absolute inset-y-0 left-0 bg-muted" style={{ width: `${percent}%` }} aria-hidden="true" />
            <span className="relative flex items-center justify-between gap-3 text-[15px]">
              <span className={`min-w-0 break-words ${poll.myVote === i ? "font-bold" : ""}`}>
                {option.text}
                {poll.myVote === i && <Icon name="check_circle" fill className="ml-1 !text-[16px] align-[-3px]" />}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{percent}%</span>
            </span>
          </div>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => vote(i)}
            className="block min-h-[44px] w-full rounded-xl border border-border px-3.5 py-2.5 text-left text-[15px] font-semibold text-foreground transition-colors active:bg-muted"
          >
            {option.text}
          </button>
        );
      })}
      <p className="text-[13px] text-muted-foreground">
        {t("memberPortal.threads.poll.votes", { count: poll.total })}
        {" · "}
        {poll.closed
          ? t("memberPortal.threads.poll.closed")
          : t("memberPortal.threads.poll.endsIn", { time: relativeTime(poll.endsAt, i18n.resolvedLanguage) })}
      </p>
    </div>
  );
}

function Menu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu" className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-muted-foreground active:bg-muted">
        <Icon name="more_horiz" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 min-w-[190px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { setOpen(false); item.run(); }}
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-semibold active:bg-muted [&+&]:border-t [&+&]:border-border/60 ${item.danger ? "text-destructive" : "text-foreground"}`}
            >
              {item.label}
              <Icon name={item.icon} className="!text-[20px]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * `full`: trang chi tiết — hiện trọn bài, chữ to hơn, không cắt 255 ký tự.
 * `line`: vẽ sợi chỉ dưới avatar nối sang bài kế tiếp (bài cha → bài con).
 */
export default function ThreadPost({ post, full = false, line = false, onOpen, onReply, onEdit, onDelete, onReadArticle }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [like, setLike] = useState({ liked: post.liked, count: post.likeCount });
  useEffect(() => setLike({ liked: post.liked, count: post.likeCount }), [post.liked, post.likeCount]);

  const long = !full && !expanded && post.text.length > CLAMP;
  const link = `${window.location.origin}/member/today?post=${encodeURIComponent(post.key)}`;

  const toggleLike = async (e) => {
    e.stopPropagation();
    sensory.tap();
    const prev = like;
    setLike({ liked: !prev.liked, count: prev.count + (prev.liked ? -1 : 1) });
    try {
      const res = await todayPostsApi.like(post.key);
      setLike({ liked: res.liked, count: res.likeCount });
    } catch (error) {
      setLike(prev);
      notify.error(error.message);
    }
  };

  const share = async (e) => {
    e?.stopPropagation();
    try {
      if (navigator.share) await navigator.share({ url: link });
      else {
        await navigator.clipboard.writeText(link);
        notify.success(t("memberPortal.threads.linkCopied"));
      }
    } catch { /* người dùng đóng bảng chia sẻ */ }
  };

  const open = (e) => {
    if (full || e.target.closest("a,button")) return;
    sensory.tap();
    onOpen?.(post.key);
  };

  const menu = post.mine
    ? [
      { label: t("memberPortal.threads.edit"), icon: "edit", run: () => onEdit?.(post) },
      { label: t("memberPortal.threads.delete"), icon: "delete", danger: true, run: () => onDelete?.(post) },
    ]
    : [{ label: t("memberPortal.threads.copyLink"), icon: "link", run: share }];

  return (
    <article onClick={open} className={`flex gap-3 px-4 pt-3 ${line ? "pb-1" : "pb-3"} ${full ? "" : "cursor-pointer"}`}>
      <div className="flex flex-col items-center">
        <Avatar author={post.author} />
        {line && <span className="mt-1.5 w-0.5 flex-1 rounded-full bg-border" aria-hidden="true" />}
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold text-foreground">{post.author?.name}</span>
          {post.author?.news && <Icon name="verified" fill className="!text-[16px] text-sky-500" />}
          <span className="shrink-0 text-[15px] text-muted-foreground">
            {relativeTime(post.createdAt, i18n.resolvedLanguage)}
            {post.editedAt && ` · ${t("memberPortal.threads.edited")}`}
          </span>
          {post.private && (
            <span title={t("memberPortal.threads.audience.private")} className="flex shrink-0">
              <Icon name="lock" className="!text-[15px] text-muted-foreground" />
              <span className="sr-only">{t("memberPortal.threads.audience.private")}</span>
            </span>
          )}
          <span className="ml-auto" />
          {!post.article && <Menu items={menu} />}
        </header>

        {post.removed && (
          <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[14px] text-muted-foreground">
            <Icon name="visibility_off" className="!text-[16px] shrink-0" />
            <span>
              {t("memberPortal.threads.removed")} · {t(`memberPortal.threads.removedReason.${post.removed}`)}
            </span>
          </p>
        )}

        {post.text && (
          <div className="relative mt-0.5">
            <RichText
              text={long ? clampText(post.text) : post.text}
              className={`${full ? "text-[16px]" : ""} ${long ? "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]" : ""}`}
            />
            {long && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(true); }} className="mt-0.5 text-[15px] font-semibold text-muted-foreground">
                {t("memberPortal.threads.seeMore")}
              </button>
            )}
          </div>
        )}

        {post.poll && <Poll post={post} />}

        {post.article && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReadArticle?.(post.article); }}
            className="mt-2.5 flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-left active:bg-muted"
          >
            <Icon name="article" className="text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">{t("memberPortal.threads.readArticle")}</span>
            <Icon name="chevron_right" className="text-muted-foreground" />
          </button>
        )}

        <footer className="-ml-2 mt-1.5 flex items-center text-muted-foreground">
          <button type="button" onClick={toggleLike} aria-label={t("memberPortal.threads.like")} aria-pressed={like.liked} className={`flex min-h-[40px] items-center gap-1 rounded-full px-2 ${like.liked ? "text-rose-500" : ""}`}>
            <Icon name="favorite" fill={like.liked} />
            {like.count > 0 && <span className="text-[14px] tabular-nums">{like.count}</span>}
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onReply?.(post); }} aria-label={t("memberPortal.threads.reply")} className="flex min-h-[40px] items-center gap-1 rounded-full px-2">
            <Icon name="chat_bubble" />
            {post.replyCount > 0 && <span className="text-[14px] tabular-nums">{post.replyCount}</span>}
          </button>
          <button type="button" onClick={share} aria-label={t("memberPortal.threads.share")} className="flex min-h-[40px] items-center rounded-full px-2">
            <Icon name="send" />
          </button>
        </footer>
      </div>
    </article>
  );
}
