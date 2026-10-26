import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTodayFeed } from "../../hooks/useTodayFeed";
import { languageCode } from "../../i18n/languages";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/api/core/authSession";
import { todayPostsApi } from "../../services/api/modules/todayFeedApi";
import ThreadPost, { Avatar } from "./today/ThreadPost";
import ThreadComposer from "./today/ThreadComposer";

/**
 * Today làm lại 100% theo kiểu Threads (26/10/2026): một dòng bài duy nhất,
 * bài báo đóng vai một tài khoản đăng bài, thành viên tự đăng bài chữ, thả tim,
 * bình luận. Bấm vào bài/bình luận là vào sâu trang chi tiết `?post=<key>`.
 */

const PAGE = 15;
const FILTERS = ["all", "members", "news"];

// Logo toà soạn: favicon của từng báo, tải một lần vào public/image/publishers
// (cùng nguồn — ảnh Google/DDG không có CORS nên lớp kính chụp trang báo lỗi
// liên tục). Thêm báo mới vào studentNewsService thì thả thêm `<domain>.png`.
const PUBLISHERS = new Set([
  "catholicnewsagency.com", "dantri.com.vn", "dcctvn.org", "energy.gov", "gpcantho.com", "hdgmvietnam.com", "nasa.gov", "news.cn", "npr.org", "nsf.gov", "nytimes.com", "people.com.cn", "tgpsaigon.net", "thanhnien.vn", "theconversation.com", "tntt.vn", "tonggiaophanhanoi.org", "tuoitre.vn", "vietnamnet.vn", "vnexpress.net", "xinhuanet.com",
]);
const publisherLogo = (url) => {
  let host = "";
  try { host = new URL(url).hostname; } catch { return ""; }
  for (let parts = host.split("."); parts.length >= 2; parts = parts.slice(1)) {
    if (PUBLISHERS.has(parts.join("."))) return `/image/publishers/${parts.join(".")}.png`;
  }
  return "";
};

// Bài báo xếp chung hàng đợi với bài thành viên, mới nhất lên đầu. Giờ đăng của
// báo không bao giờ được vượt lúc tải bản tin (`cap`): báo không rõ ngày xuống
// đáy, báo ghi giờ tương lai (lệch múi giờ) không chen lên trên bài vừa đăng.
const articlePost = (article, stat, cap = Date.now()) => ({
  key: `a:${article.id}`,
  article,
  author: { name: article.source || "Hugo Today", news: true, avatar: publisherLogo(article.url) },
  text: `**${article.title}**${article.description ? `\n${article.description}` : ""}`,
  createdAt: new Date(Math.min(new Date(article.publishedAt || 0).getTime() || 0, cap)).toISOString(),
  likeCount: stat?.likeCount || 0,
  liked: Boolean(stat?.liked),
  replyCount: stat?.replyCount || 0,
});

export default function MemberTodayTab({ bio, onNavigate }) {
  const { t, i18n } = useTranslation();
  const language = languageCode(i18n.resolvedLanguage || i18n.language);
  const [params] = useSearchParams();
  const postKey = params.get("post");
  const queryClient = useQueryClient();
  const [composer, setComposer] = useState(null);
  const session = getMemberSession();
  const me = {
    name: bio?.displayName || session?.displayName || t("memberPortal.navigation.memberFallback"),
    avatar: bio?.avatarUrl || session?.avatarUrl || "",
  };

  const { data: feed, dataUpdatedAt } = useTodayFeed(language, "all");
  const articles = useMemo(() => feed?.items || [], [feed?.items]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["today-posts"] });
    queryClient.invalidateQueries({ queryKey: ["today-thread"] });
    queryClient.invalidateQueries({ queryKey: ["today-stats"] });
  };

  const openPost = (key) => onNavigate(`/member/today?post=${encodeURIComponent(key)}`);
  const reply = (post) => setComposer({ parentKey: post.key, replyTo: post.author?.name });
  const remove = async (post) => {
    const ok = await notify.confirm({
      title: t("memberPortal.threads.deleteTitle"),
      message: t("memberPortal.threads.deleteMessage"),
      confirmText: t("memberPortal.threads.delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await todayPostsApi.remove(post.key);
      notify.success(t("memberPortal.threads.deleted"));
      if (post.key === postKey) onNavigate("/member/today");
      refresh();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const actions = {
    onOpen: openPost,
    onReply: reply,
    onEdit: (post) => setComposer({ editing: post }),
    onDelete: remove,
    onReadArticle: (article) => onNavigate(`/member/today/${article.id}`),
  };

  return (
    <section className="mx-auto w-full max-w-[640px] min-w-0 pb-36 sm:pb-24" aria-labelledby="portal-today-title">
      {postKey ? (
        <ThreadDetail postKey={postKey} language={language} articles={articles} actions={actions} onNavigate={onNavigate} />
      ) : (
        <ThreadFeed articles={articles} fetchedAt={dataUpdatedAt} me={me} actions={actions} onCompose={() => setComposer({})} />
      )}

      {composer && (
        <ThreadComposer
          me={me}
          {...composer}
          onClose={() => setComposer(null)}
          onDone={() => { setComposer(null); refresh(); }}
        />
      )}
    </section>
  );
}

function ThreadFeed({ articles, fetchedAt, me, actions, onCompose }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE);

  const posts = useInfiniteQuery({
    queryKey: ["today-posts"],
    queryFn: ({ pageParam }) => todayPostsApi.feed(pageParam),
    initialPageParam: null,
    getNextPageParam: (last) => (last.more ? last.posts.at(-1)?.createdAt : undefined),
    staleTime: 30_000,
  });

  const keys = useMemo(() => articles.slice(0, 100).map((a) => `a:${a.id}`), [articles]);
  const { data: stats } = useQuery({
    queryKey: ["today-stats", keys.join(",")],
    queryFn: () => todayPostsApi.stats(keys),
    enabled: keys.length > 0,
    staleTime: 30_000,
  });

  const items = useMemo(() => {
    const members = filter === "news" ? [] : (posts.data?.pages || []).flatMap((p) => p.posts);
    const news = filter === "members" ? [] : articles.map((a) => articlePost(a, stats?.stats?.[`a:${a.id}`], fetchedAt || Date.now()));
    return [...members, ...news].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filter, posts.data, articles, stats, fetchedAt]);

  useEffect(() => setVisible(PAGE), [filter]);

  // Cuộn tới cuối: lộ thêm bài đã có, hết thì xin trang bài thành viên kế tiếp.
  const moreRef = useRef(null);
  const { hasNextPage, fetchNextPage, isFetchingNextPage } = posts;
  useEffect(() => {
    const node = moreRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      if (visible < items.length) setVisible((n) => n + PAGE);
      else if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loading = posts.isLoading && !articles.length;

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 pb-2 pt-2">
        <h1 id="portal-today-title" className="text-[28px] font-bold tracking-[-0.02em] text-foreground">{t("memberPortal.threads.title")}</h1>
      </header>

      <div className="flex border-b border-border" role="tablist">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`min-h-[44px] flex-1 border-b-2 text-[15px] font-semibold transition-colors ${filter === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            {t(`memberPortal.threads.filters.${key}`)}
          </button>
        ))}
      </div>

      <button type="button" onClick={onCompose} className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left">
        <Avatar author={me} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foreground">{me.name}</span>
          <span className="block text-[15px] text-muted-foreground">{t("memberPortal.threads.placeholder")}</span>
        </span>
        <span className="shrink-0 rounded-full border border-border px-4 py-1.5 text-[15px] font-semibold text-foreground">{t("memberPortal.threads.post")}</span>
      </button>

      {loading ? (
        <Skeleton />
      ) : posts.isError && !articles.length ? (
        <div className="px-4 py-12 text-center">
          <p className="text-[15px] text-muted-foreground">{t("memberPortal.threads.loadError")}</p>
          <button type="button" onClick={() => posts.refetch()} className="mt-3 min-h-[40px] rounded-full bg-foreground px-5 text-[15px] font-semibold text-background">
            {t("memberPortal.threads.retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-12 text-center text-[15px] text-muted-foreground">{t("memberPortal.threads.empty")}</p>
      ) : (
        <div className="divide-y divide-border">
          {items.slice(0, visible).map((post) => <ThreadPost key={post.key} post={post} {...actions} />)}
        </div>
      )}
      <div ref={moreRef} className="h-px" />
    </>
  );
}

function ThreadDetail({ postKey, language, articles, actions, onNavigate }) {
  const { t } = useTranslation();
  const isArticle = postKey.startsWith("a:");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["today-thread", postKey, language],
    queryFn: () => todayPostsApi.thread(postKey, language),
    staleTime: 15_000,
  });

  const findArticle = (key) => (data?.article && `a:${data.article.id}` === key ? data.article : articles.find((a) => `a:${a.id}` === key));
  const mainArticle = isArticle ? findArticle(postKey) : null;
  const main = isArticle ? (mainArticle ? articlePost(mainArticle, data?.post) : null) : data?.post;
  const parentArticle = main?.parentKey?.startsWith("a:") ? findArticle(main.parentKey) : null;
  const parent = data?.parent || (parentArticle ? articlePost(parentArticle) : null);

  const back = () => (window.history.length > 1 ? window.history.back() : onNavigate("/member/today"));

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/95 px-2 py-1.5 backdrop-blur">
        <button type="button" onClick={back} aria-label={t("memberPortal.threads.back")} className="grid h-11 w-11 place-items-center rounded-full text-foreground active:bg-muted">
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">arrow_back</span>
        </button>
        <h1 id="portal-today-title" className="text-[17px] font-bold text-foreground">{t("memberPortal.threads.thread")}</h1>
      </header>

      {isLoading && !main ? (
        <Skeleton count={2} />
      ) : !main ? (
        <p className="px-4 py-12 text-center text-[15px] text-muted-foreground">
          {isError || !isArticle ? t("memberPortal.threads.gone") : t("memberPortal.threads.articleGone")}
        </p>
      ) : (
        <>
          {parent && <ThreadPost post={parent} line {...actions} />}
          <ThreadPost post={main} full {...actions} />
          <button
            type="button"
            onClick={() => actions.onReply(main)}
            className="flex w-full items-center gap-3 border-y border-border px-4 py-3 text-left text-[15px] text-muted-foreground"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">chat_bubble</span>
            {t("memberPortal.threads.replyTo", { name: main.author?.name })}
          </button>
        </>
      )}

      {data?.replies?.length ? (
        <div className="divide-y divide-border">
          {data.replies.map((post) => <ThreadPost key={post.key} post={post} {...actions} />)}
        </div>
      ) : main && !isLoading ? (
        <p className="px-4 py-10 text-center text-[15px] text-muted-foreground">{t("memberPortal.threads.noReplies")}</p>
      ) : null}
    </>
  );
}

function Skeleton({ count = 4 }) {
  return (
    <div className="divide-y divide-border" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex animate-pulse gap-3 px-4 py-4">
          <span className="h-9 w-9 shrink-0 rounded-full bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-1/3 rounded bg-muted" />
            <span className="block h-3.5 w-full rounded bg-muted" />
            <span className="block h-3.5 w-2/3 rounded bg-muted" />
          </span>
        </div>
      ))}
    </div>
  );
}
