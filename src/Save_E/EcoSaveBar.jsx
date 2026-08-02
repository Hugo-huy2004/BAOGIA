import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isSaved, saveArticle, removeSaved } from "./ecoStore";

// Thanh "giữ lại bài này" nằm trên trình đọc.
//
// Không sửa TodayArticleReader (component dùng chung với chế độ thường) — lấy
// dữ liệu bài từ đúng bộ nhớ đệm react-query mà trình đọc đang dùng, nên bấm
// Giữ lại KHÔNG phát sinh thêm một lượt gọi mạng nào.
//
// CHỈ giữ chữ, bỏ ảnh: một bài toàn văn khoảng 5–15 KB, cùng bài kèm ảnh là
// vài trăm KB. Đọc lại bài đã giữ là 0 byte qua mạng.
export default function EcoSaveBar({ articleId }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(() => isSaved(articleId));
  const [failed, setFailed] = useState(false);

  const collect = () => {
    let item = null;
    for (const [, feed] of queryClient.getQueriesData({ queryKey: ["today-feed"] })) {
      const hit = feed?.items?.find((entry) => entry.id === articleId);
      if (hit) { item = hit; break; }
    }
    const [, detail] = queryClient.getQueriesData({ queryKey: ["today-article", articleId] })[0] || [];
    const article = detail?.article || item;
    if (!article) return null;

    const blocks = detail?.content?.blocks
      || detail?.content?.paragraphs?.map((text) => ({ type: "text", text }))
      || [];
    return {
      id: articleId,
      title: article.title,
      source: article.source,
      url: article.url,
      publishedAt: article.publishedAt,
      points: detail?.summary?.points || (article.description ? [article.description] : []),
      paragraphs: blocks.filter((block) => block.type !== "image" && block.text).map((block) => block.text),
    };
  };

  const toggle = () => {
    if (saved) {
      removeSaved(articleId);
      setSaved(false);
      return;
    }
    const article = collect();
    if (!article) { setFailed(true); return; }
    const ok = saveArticle(article);
    setSaved(ok);
    setFailed(!ok);
  };

  return (
    <div className="save-e-savebar">
      <button type="button" className="save-e-chip" aria-pressed={saved} onClick={toggle}>
        <span className="material-symbols-outlined" aria-hidden="true">
          {saved ? "recycling" : "bookmark_add"}
        </span>
        {saved ? "Đã giữ lại — đọc offline được" : "Giữ lại để đọc offline"}
      </button>
      {failed ? <small>Bộ nhớ máy đã đầy, xoá bớt bài trong tab Đọc lại.</small> : null}
    </div>
  );
}
