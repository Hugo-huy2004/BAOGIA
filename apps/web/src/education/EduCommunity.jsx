import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { notify } from "../lib/notify";
import { API_BASE } from "../config/apiBase";
import { PersonaAvatar } from "./EduPersona";
import { useEduText } from "./eduText";
import AnimIcon from "../components/icons/animated/AnimIcon";
import { detectLang, translatePost } from "./postTranslate";

/**
 * Cộng đồng học thuật Education Hugo (/community) — bảng riêng trên chính API Today
 * (`?board=edu`): cùng model, kiểm duyệt, bình luận, lượt thích. Tác giả hiện bằng Persona.
 *
 * Hugo chỉ lưu CHỮ và URL. Preview dựng hoàn toàn ở trình duyệt từ URL đầu tiên của bài —
 * không upload, không proxy, không gọi API GitHub, không tải Open Graph. Nguồn ngoài hỏng
 * thì bài vẫn còn chữ và liên kết thường.
 */
const API = `${API_BASE}/today/posts`;
const BOARD = "board=edu";
const MAX_TEXT = 5000;
const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

async function call(path, options = {}) {
  const response = await fetch(`${API}${path}${path.includes("?") ? "&" : "?"}${BOARD}`, {
    credentials: "include",
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: response.status });
  return data;
}

/** Loại preview suy ra từ chính URL; null nếu không phải http(s). */
function linkPreview(raw) {
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (!/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  if (host === "github.com" && parts.length >= 2) return { kind: "github", url: url.href, owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  const yt = host === "youtu.be" ? parts[0]
    : /(^|\.)youtube\.com$/.test(host) ? (url.searchParams.get("v") || (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null))
      : null;
  if (yt && /^[\w-]{11}$/.test(yt)) return { kind: "youtube", url: url.href, id: yt };
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) return { kind: "image", url: url.href };
  return { kind: "link", url: url.href, host, path: url.pathname === "/" ? "" : decodeURIComponent(url.pathname) };
}

const LINK = { target: "_blank", rel: "noopener noreferrer ugc nofollow" };

/** Chữ thường + URL thành liên kết (React tự thoát HTML, không dùng innerHTML). */
function RichText({ text }) {
  const out = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    out.push(text.slice(last, match.index));
    out.push(<a key={match.index} href={match[0]} {...LINK}>{match[0]}</a>);
    last = match.index + match[0].length;
  }
  out.push(text.slice(last));
  return <p className="comm-text">{out}</p>;
}

function Preview({ link }) {
  const { t } = useEduText();
  const [play, setPlay] = useState(false);
  const [broken, setBroken] = useState(false);
  if (broken) return null; // nguồn ngoài lỗi/bị xoá: bài vẫn còn chữ + liên kết
  if (link.kind === "github") {
    return (
      <a className="comm-card" href={link.url} {...LINK}>
        <span className="comm-card-icon"><AnimIcon name="github" /></span>
        <span><b>{link.owner}/{link.repo}</b><small>github.com · {t("community.repo")}</small></span>
      </a>
    );
  }
  if (link.kind === "youtube") {
    return play ? (
      <div className="comm-media is-video">
        <iframe src={`https://www.youtube-nocookie.com/embed/${link.id}?autoplay=1`} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    ) : (
      <button type="button" className="comm-media is-video" onClick={() => setPlay(true)} aria-label={t("community.play")}>
        <img src={`https://i.ytimg.com/vi/${link.id}/hqdefault.jpg`} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
        <span className="comm-play"><AnimIcon name="play" size={40} /></span>
      </button>
    );
  }
  if (link.kind === "image") {
    return (
      <a className="comm-media" href={link.url} {...LINK}>
        <img src={link.url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      </a>
    );
  }
  return (
    <a className="comm-card" href={link.url} {...LINK}>
      <span className="comm-card-icon"><AnimIcon name="link" /></span>
      <span><b>{link.host}</b>{link.path && <small>{link.path}</small>}</span>
    </a>
  );
}

function ago(date, lang) {
  const s = (new Date(date) - Date.now()) / 1000;
  const fmt = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  for (const [unit, size] of [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]]) {
    if (Math.abs(s) >= size) return fmt.format(Math.round(s / size), unit);
  }
  return fmt.format(0, "minute");
}

/** Tự nhận diện ngôn ngữ bài; khác ngôn ngữ người đọc thì tự dịch (trên máy nếu được, không thì máy chủ). */
function useTranslation(post, lang) {
  const [state, setState] = useState({ from: null, text: null, original: false, busy: false });
  useEffect(() => {
    let alive = true;
    if (!post.text || post.removed) return undefined;
    detectLang(post.text).then(async (from) => {
      if (!alive) return;
      setState((s) => ({ ...s, from }));
      if (!from || from === lang) return;
      setState((s) => ({ ...s, busy: true }));
      const text = await translatePost(post, from, lang);
      if (alive) setState((s) => ({ ...s, text, busy: false }));
    });
    return () => { alive = false; };
  }, [post.key, post.text, post.removed, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return [state, () => setState((s) => ({ ...s, original: !s.original }))];
}

function Post({ post, onChange, onRemove, open }) {
  const { t, lang } = useEduText();
  const [tr, toggleOriginal] = useTranslation(post, lang);
  const langName = (code) => t(`community.langs.${code}`) === `community.langs.${code}` ? code.toUpperCase() : t(`community.langs.${code}`);
  const shown = tr.text && !tr.original ? tr.text : post.text;
  const link = post.text.match(URL_RE)?.[0];
  const preview = link && linkPreview(link);
  const like = async () => {
    onChange({ ...post, liked: !post.liked, likeCount: post.likeCount + (post.liked ? -1 : 1) });
    try { onChange({ ...post, ...(await call(`/${post.key}/like`, { method: "POST" })) }); } catch { onChange(post); }
  };
  const remove = async () => {
    if (!(await notify.confirm({ title: t("community.deleteAsk") }))) return;
    try { await call(`/${post.key}`, { method: "DELETE" }); onRemove(post.key); } catch (error) { notify.error(error.message); }
  };
  return (
    <article className={`comm-post${post.removed ? " is-removed" : ""}`}>
      <PersonaAvatar avatar={post.author?.persona} name={post.author?.name} size={44} />
      <div className="comm-post-main">
        <header>
          <b className="nick-font">{post.author?.name}</b>
          <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString(lang)}>{ago(post.createdAt, lang)}</time>
          {tr.from && <span className="comm-lang" title={t("community.detected")}>{langName(tr.from)}</span>}
        </header>
        {post.removed && <small className="comm-removed">{t("community.removed")}</small>}
        <RichText text={shown} />
        {tr.busy && <small className="comm-tr is-busy">{t("community.translating")}</small>}
        {tr.text && (
          <button type="button" className="comm-tr" onClick={toggleOriginal}>
            <AnimIcon name="sparkles" size={16} />
            {tr.original ? t("community.showTranslation", { lang: langName(lang) }) : t("community.translatedFrom", { lang: langName(tr.from) })}
          </button>
        )}
        {preview && <Preview link={preview} />}
        <footer>
          <button type="button" className={post.liked ? "is-on" : ""} onClick={like} aria-pressed={post.liked} aria-label={t("community.like")}>
            <AnimIcon name="heart" /><span>{post.likeCount || t("community.like")}</span>
          </button>
          {open && (
            <Link to={`/community/${post.key}`} aria-label={t("community.replies")}>
              <AnimIcon name="message" /><span>{post.replyCount || t("community.replyShort")}</span>
            </Link>
          )}
          {post.mine && (
            <button type="button" onClick={remove} aria-label={t("community.delete")}>
              <AnimIcon name="delete" />
            </button>
          )}
        </footer>
      </div>
    </article>
  );
}

function Composer({ parentKey, onPosted, placeholder }) {
  const { t } = useEduText();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { post } = await call("", { method: "POST", body: JSON.stringify({ text: text.trim(), parentKey, board: "edu" }) });
      setText("");
      onPosted(post);
      if (post.removed) notify.warning(t("community.removed"));
    } catch (error) {
      notify.error(error.message || t("community.failed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="comm-composer" onSubmit={submit}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_TEXT} rows={3} placeholder={placeholder} aria-label={placeholder} />
      <div>
        <small>{t("community.linkHint")}</small>
        <button type="submit" className="edu-btn" disabled={busy || !text.trim()}>{t("community.post")}</button>
      </div>
    </form>
  );
}

function Feed() {
  const { t } = useEduText();
  const [posts, setPosts] = useState(null);
  const [more, setMore] = useState(false);
  const load = useCallback(async (before) => {
    try {
      const data = await call(before ? `?before=${encodeURIComponent(before)}` : "");
      setPosts((current) => (before ? [...(current || []), ...data.posts] : data.posts));
      setMore(data.more);
    } catch {
      setPosts((current) => current || []);
      notify.error(t("community.failed"));
    }
  }, [t]);
  useEffect(() => { load(); }, [load]);
  const update = (next) => setPosts((all) => all.map((p) => (p.key === next.key ? next : p)));
  const remove = (key) => setPosts((all) => all.filter((p) => p.key !== key));

  return (
    <>
      <h1 className="edu-page-title">{t("community.title")}</h1>
      <p className="comm-lead">{t("community.lead")}</p>
      <Composer onPosted={(post) => setPosts((all) => [post, ...(all || [])])} placeholder={t("community.placeholder")} />
      {posts === null ? <p className="comm-empty">{t("common.loading")}…</p>
        : posts.length === 0 ? <p className="comm-empty">{t("community.empty")}</p>
          : posts.map((post) => <Post key={post.key} post={post} onChange={update} onRemove={remove} open />)}
      {more && <button type="button" className="edu-btn is-ghost comm-more" onClick={() => load(posts.at(-1).createdAt)}>{t("community.more")}</button>}
    </>
  );
}

function Thread({ postKey }) {
  const { t } = useEduText();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    call(`/${postKey}`).then((d) => alive && setData(d)).catch(() => alive && setData({ gone: true }));
    return () => { alive = false; };
  }, [postKey]);
  const back = <button type="button" className="comm-back" onClick={() => navigate(data?.post?.parentKey ? `/community/${data.post.parentKey}` : "/community")}><AnimIcon name="back" />{t("community.back")}</button>;
  if (!data) return <>{back}<p className="comm-empty">{t("common.loading")}…</p></>;
  if (data.gone || !data.post) return <>{back}<p className="comm-empty">{t("community.gone")}</p></>;
  const setReply = (next) => setData((d) => ({ ...d, replies: d.replies.map((r) => (r.key === next.key ? next : r)) }));
  return (
    <>
      {back}
      <Post post={data.post} onChange={(post) => setData((d) => ({ ...d, post }))} onRemove={() => navigate("/community")} />
      <Composer parentKey={data.post.key} placeholder={t("community.reply")} onPosted={(post) => setData((d) => ({ ...d, post: { ...d.post, replyCount: d.post.replyCount + 1 }, replies: [...d.replies, post] }))} />
      <div className="comm-replies">
        {data.replies.map((reply) => <Post key={reply.key} post={reply} onChange={setReply} onRemove={(key) => setData((d) => ({ ...d, replies: d.replies.filter((r) => r.key !== key) }))} open />)}
      </div>
    </>
  );
}

export default function EduCommunity() {
  const { postKey } = useParams();
  return <section className="edu-page comm">{postKey ? <Thread postKey={postKey} /> : <Feed />}</section>;
}
