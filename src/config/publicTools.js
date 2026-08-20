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
 *   "demo"   — guests get 3 demo uses per day (client counter for pure-client
 *              tools, per-IP counter on the server for file endpoints); signing
 *              in lifts the limit.
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
    title: "HugoPSY — Phương Pháp Thư Giãn Và Tự Chăm Sóc",
    description:
      "Khám phá các bài thở, thư giãn, viết cảm xúc và hoạt động tự chăm sóc tinh thần trong HugoPSY.",
    heading: "HugoPSY",
    summary:
      "Xem danh sách phương pháp tự chăm sóc; đăng nhập tài khoản đã xác minh để mở bài tập và lưu tiến độ.",
  },
  radio: {
    gate: "open",
    title: "Hugo Radio — Nhạc Lofi Cho Học Tập Và Thư Giãn",
    description:
      "Nghe nhạc lofi và các chương trình âm thanh của Hugo Radio khi học tập, làm việc hoặc nghỉ ngơi.",
    heading: "Hugo Radio",
    summary: "Nghe thử các kênh tin tức, âm nhạc và lofi trong 15 phút. Đăng nhập Google để lưu đài, đồng bộ thời lượng và mở trải nghiệm thành viên.",
  },
  aura: {
    gate: "result",
    title: "HugoAura — Pomodoro Và Nhạc Lofi Tập Trung | Hugo Studio",
    description:
      "HugoAura kết hợp đồng hồ Pomodoro và nhạc lofi để hỗ trợ học tập, làm việc và nghỉ ngơi có nhịp điệu.",
    heading: "HugoAura Focus & Lofi",
    summary:
      "Bắt đầu phiên Pomodoro miễn phí. Xác thực hoặc đăng ký để lưu nhịp tập trung, đồng bộ thiết bị và trải nghiệm đầy đủ.",
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
  hugokit: {
    gate: "demo",
    aliases: ["handle"],
    title: "HugoKit — Giải Nén ZIP, Nén Ảnh Video, Tạo QR Online | Hugo Studio",
    description:
      "Bộ công cụ xử lý file trên trình duyệt: giải nén ZIP online, nén ảnh JPG/PNG/WebP, nén video và tạo mã QR, chữ ký email.",
    heading: "HugoKit",
    summary:
      "Giải nén ZIP, nén ảnh/video, tạo mã QR và chữ ký email ngay trên web. Khách được 3 lượt demo mỗi ngày; đăng nhập để dùng không giới hạn.",
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
