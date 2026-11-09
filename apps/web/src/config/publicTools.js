/**
 * Registry of the apps that are reachable on their own URL, without going
 * through /member. One source of truth for three consumers:
 *
 *   - App.jsx            — decides which /:tool paths are allowed to render
 *   - UtilityPublicPage  — per-tool metadata and which gate to apply
 *   - scripts/generate-seo.mjs — static HTML + sitemap entries per tool
 *
 * gate:
 *   "open"   — no account needed at all.
 *   "result" — usable straight away; producing a saved/exportable result needs a
 *              signed-in account whose student verification has been approved
 *              (bio.status is neither "pending" nor "rejected").
 */

export const PUBLIC_TOOLS = {
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
};

/** Canonical slugs, plus the aliases that resolve to the same tool. */
const PUBLIC_TOOL_SLUGS = Object.entries(PUBLIC_TOOLS).flatMap(([slug, tool]) => [
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
 * second segment to survive a reload (`/radio/<đài>` is a real address, not a
 * typo) — matching the whole path sent those straight to /introduction.
 */
export function isPublicToolPath(pathname) {
  const [slug] = String(pathname).replace(/^\/+|\/+$/g, "").split("/");
  return PUBLIC_TOOL_SLUGS.includes(slug);
}

// ponytail: a plain object beats a schema here — the list changes when a tool
// ships, which is rare, and every consumer already validates its own slug.
