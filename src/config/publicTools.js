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
  study: {
    gate: "level",
    aliases: ["hugoso"],
    // Học thật mười bài đầu — đủ đi hết HTML, CSS, JS, SQL và PHP cơ bản — rồi
    // mới phải quyết định. Hằng số nằm ở đây chứ không trong HugoCoderHub: trang
    // công khai chỉ cần con số, import từ hub sẽ kéo cả bộ học vào bundle.
    previewLessons: 10,
    title: "Study with Hugo — Học Lập Trình Web 100 Bài",
    description:
      "Lộ trình 100 bài từ HTML, CSS, JavaScript, SQL đến bảo mật, đồ án full-stack và deploy VPS. Học 10 bài đầu miễn phí, không cần tài khoản.",
    heading: "Study with Hugo",
    summary:
      "Học 10 bài đầu ngay, không cần tài khoản. Đăng nhập và mở gói để đi hết 100 bài và làm đồ án CRUD hoàn chỉnh.",
  },
  support: {
    gate: "demo",
    aliases: ["supporter"],
    title: "Trung Tâm Hỗ Trợ Hugo Studio — Câu Hỏi Thường Gặp",
    description:
      "Hướng dẫn sẵn có về ví JOY, đơn vị tiền, đăng nhập, cài ứng dụng và token; hoặc gửi yêu cầu để quản trị viên liên hệ lại.",
    heading: "Trung Tâm Hỗ Trợ",
    summary:
      "Đọc hướng dẫn không cần tài khoản. Đăng nhập để gửi yêu cầu và theo dõi trả lời của quản trị viên.",
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
    // 65 ký tự là trần của check-seo; bỏ "Online" giữ đủ từ khoá tính năng.
    title: "HugoKit — Giải Nén ZIP, Nén Ảnh Video, Tạo QR | Hugo Studio",
    description:
      "Bộ công cụ xử lý file trên trình duyệt: giải nén ZIP online, nén ảnh JPG/PNG/WebP, nén video và tạo mã QR, chữ ký email.",
    heading: "HugoKit",
    summary:
      "Giải nén ZIP, nén ảnh/video, tạo mã QR và chữ ký email ngay trên web. Khách được 3 lượt demo mỗi ngày; đăng nhập để dùng không giới hạn.",
  },

  // Từng game một URL. `StandaloneGameShell` vốn đã tự chạy độc lập (Arcade và
  // màn hình chính đều dựng nó trực tiếp), nên đây chỉ là thêm đường vào —
  // `game` cho UtilityPublicPage biết dựng ván nào.
  chess: {
    gate: "level",
    game: "chess",
    title: "Cờ Vua 3D Online — Đấu Với Máy | Hugo Studio",
    description:
      "Chơi cờ vua 3D ngay trên trình duyệt với máy nhiều cấp độ, không cần cài đặt. Đăng nhập để lưu kỷ lục và nhận thưởng JOY.",
    heading: "Cờ Vua 3D",
    summary: "Vào ván ngay, không cần tài khoản. Đăng nhập để lưu kỷ lục và nhận thưởng JOY.",
  },
  caro: {
    gate: "level",
    game: "caro",
    title: "Cờ Caro Online — Thắng 5 Quân | Hugo Studio",
    description:
      "Cờ caro 10×10 thắng 5 quân, đấu với máy nhiều cấp độ ngay trên trình duyệt, không cần cài đặt.",
    heading: "Cờ Caro",
    summary: "Vào ván ngay, không cần tài khoản. Đăng nhập để lưu kỷ lục và nhận thưởng JOY.",
  },
  snake: {
    gate: "level",
    game: "snake",
    title: "Rắn Săn Mồi 3D Online | Hugo Studio",
    description:
      "Trò chơi rắn săn mồi bản 3D, độ khó tự tăng theo điểm, chơi thẳng trên trình duyệt không cần cài đặt.",
    heading: "Rắn 3D",
    summary: "Chơi ngay, không cần tài khoản. Đăng nhập để lưu kỷ lục và nhận thưởng JOY.",
  },
  2048: {
    gate: "level",
    game: "2048",
    title: "2048 Online — Trò Chơi Ghép Số | Hugo Studio",
    description:
      "Bản 2048 mở rộng của Hugo Studio: ghép số, giữ chuỗi combo và phá kỷ lục, chơi ngay trên trình duyệt.",
    heading: "2048",
    summary: "Chơi ngay, không cần tài khoản. Đăng nhập để lưu kỷ lục và nhận thưởng JOY.",
  },
  survivor: {
    gate: "level",
    game: "survivor",
    title: "Sinh Tồn Không Gian — Game Bắn Sống Sót | Hugo Studio",
    description:
      "Sống sót giữa không gian sâu: né, bắn và nâng cấp qua từng đợt, chơi thẳng trên trình duyệt không cần cài đặt.",
    heading: "Sinh Tồn Không Gian",
    summary: "Chơi ngay, không cần tài khoản. Đăng nhập để lưu kỷ lục và nhận thưởng JOY.",
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

/**
 * True when `pathname` is one of the standalone app URLs.
 *
 * Only the FIRST segment decides. Apps that navigate inside themselves need a
 * second segment to survive a reload (`/study/lesson7` is a real address, not a
 * typo) — matching the whole path sent those straight to /introduction.
 */
export function isPublicToolPath(pathname) {
  const [slug] = String(pathname).replace(/^\/+|\/+$/g, "").split("/");
  return PUBLIC_TOOL_SLUGS.includes(slug);
}

// ponytail: a plain object beats a schema here — the list changes when a tool
// ships, which is rare, and every consumer already validates its own slug.
