/**
 * Registry of the apps that are reachable on their own URL, without going
 * through /member. One source of truth for three consumers:
 *
 *   - App.jsx            — decides which /:tool paths are allowed to render
 *   - UtilityPublicPage  — per-tool metadata and which gate to apply
 *   - scripts/generate-seo.mjs — static HTML + sitemap entries per tool
 *
 * Before this existed the allowed-path list was hardcoded in App.jsx and drifted
 * out of sync with the tools UtilityPublicPage could actually render.
 *
 * gate:
 *   "open"   — no account needed at all.
 *   "level"  — playable straight away; unlocking further levels needs a signed-in
 *              student account. Games keep their first levels free so the page
 *              still works as a landing page for someone arriving from search.
 *   "result" — usable straight away; producing a saved/exportable result needs a
 *              signed-in account whose student verification has been approved
 *              (bio.status is neither "pending" nor "rejected").
 */

export const PUBLIC_TOOLS = {
  banhocduong: {
    gate: "result",
    title: "Bạn Học Đường — Trợ Lý Học Tập | Hugo Studio",
    description:
      "Không gian hỗ trợ học tập của Hugo Studio với công cụ hỏi đáp, gợi ý cách học và tiện ích dành cho học sinh, sinh viên.",
    heading: "Bạn Học Đường",
    summary:
      "Trợ lý học tập: hỏi đáp bài vở, gợi ý cách học và theo dõi tiến độ. Dùng thử ngay, không cần tài khoản.",
  },
  therapy: {
    gate: "result",
    aliases: ["psychology"],
    title: "HugoPSY — Không Gian Trò Chuyện Và Theo Dõi Cảm Xúc",
    description:
      "HugoPSY là không gian trò chuyện, ghi nhận cảm xúc và thực hành tự chăm sóc tinh thần trong hệ sinh thái Hugo Studio.",
    heading: "HugoPSY",
    summary:
      "Không gian trò chuyện và ghi nhận cảm xúc, thiết kế để dễ bắt đầu. Trò chuyện được ngay; lưu nhật ký cảm xúc thì cần tài khoản đã xác minh.",
  },
  radio: {
    gate: "open",
    title: "Hugo Radio — Nhạc Lofi Cho Học Tập Và Thư Giãn",
    description:
      "Nghe nhạc lofi và các chương trình âm thanh của Hugo Radio khi học tập, làm việc hoặc nghỉ ngơi.",
    heading: "Hugo Radio",
    summary: "Nhạc lofi cho giờ học và giờ nghỉ. Mở là nghe, không cần đăng nhập.",
  },
  aura: {
    gate: "result",
    title: "Aura AI — Tạo Hình Nền Năng Lượng | Hugo Studio",
    description:
      "Khám phá Aura AI, tiện ích tạo hình nền theo màu sắc, cảm xúc và phong cách cá nhân trong Hugo Studio.",
    heading: "Aura AI",
    summary:
      "Tạo hình nền theo màu sắc và cảm xúc của bạn. Xem thử thoải mái; tải về bản của mình thì cần tài khoản đã xác minh.",
  },
  arcade: {
    gate: "level",
    title: "Hugo Arcade — Game Nhẹ Chơi Ngay Trên Trình Duyệt",
    description:
      "Kho game nhẹ của Hugo Studio: cờ vua 3D, 2048, Snake, xếp hình và nhiều thử thách khác, chơi trực tiếp trên trình duyệt.",
    heading: "Hugo Arcade",
    summary:
      "Game nhẹ chạy thẳng trên trình duyệt, không cài đặt. Chơi ngay được; mở màn mới thì cần tài khoản sinh viên.",
  },
  ide: {
    gate: "open",
    title: "Hugo Web IDE — Viết Và Chạy Code Trên Trình Duyệt",
    description:
      "Trình soạn thảo code chạy trực tiếp trên trình duyệt: viết HTML, CSS, JavaScript và xem kết quả ngay, không cần cài đặt.",
    heading: "Hugo Web IDE",
    summary: "Viết và chạy code ngay trên trình duyệt, không cần cài gì. Dùng tự do.",
  },
};

/** Canonical slugs, plus the aliases that resolve to the same tool. */
export const PUBLIC_TOOL_SLUGS = Object.entries(PUBLIC_TOOLS).flatMap(([slug, tool]) => [
  slug,
  ...(tool.aliases ?? []),
]);

/** Resolve a slug (or alias) to its canonical entry; undefined when unknown. */
export function resolvePublicTool(slug) {
  if (PUBLIC_TOOLS[slug]) return { slug, ...PUBLIC_TOOLS[slug] };
  const found = Object.entries(PUBLIC_TOOLS).find(([, tool]) => tool.aliases?.includes(slug));
  return found ? { slug: found[0], ...found[1] } : undefined;
}

/** True when `pathname` is one of the standalone app URLs. */
export function isPublicToolPath(pathname) {
  return PUBLIC_TOOL_SLUGS.includes(String(pathname).replace(/^\/+|\/+$/g, ""));
}

// ponytail: a plain object beats a schema here — the list changes when a tool
// ships, which is rare, and every consumer already validates its own slug.
