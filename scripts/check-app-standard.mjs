/**
 * "Đạt tiêu chuẩn App riêng iOS" — đo được, không cảm tính.
 *
 * Vì sao cần bộ này: "app chưa hoàn chỉnh" là nhận xét không ai kiểm lại được,
 * nên mỗi lần sửa lại tranh luận từ đầu. Ở đây tiêu chuẩn là danh sách tiêu chí
 * máy đọc được, và mỗi app hoặc ĐÃ ĐẠT (bị khoá lại, hồi quy là đỏ) hoặc còn
 * trong danh sách việc.
 *
 * Luật: app có tên trong CERTIFIED phải đạt MỌI tiêu chí, nếu không bộ này đỏ.
 * App chưa certify chỉ bị liệt kê — để thấy còn bao nhiêu việc, không chặn CI.
 *
 * Chạy: npm run check:app-standard
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { FULLSCREEN_APP_IDS } from "../shared/appRegistry.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEMBER = path.join(ROOT, "src/components/member");

/**
 * App đã đưa về chuẩn. Thêm tên vào đây SAU khi nó đạt hết tiêu chí — từ đó về
 * sau ai làm hỏng một tiêu chí là bộ này đỏ.
 */
const CERTIFIED = {
  friends: "20/09/2026 — 4 màn có địa chỉ thật (bản cũ chỉ đọc ?view= một lần lúc khởi tạo nên back của máy nhảy ra khỏi app), chữ lên sàn 13px ở cả JSX lẫn CSS, mr-10 đoán tay → CLOSE_BUTTON_RESERVE. Giữ hình thái bản đồ toàn màn (ngoại lệ có lý do)",
  hugoKit: "20/09/2026 — địa chỉ riêng cho từng công cụ, hai khung trên màn rộng, ranh giới lỗi, large title",
  profile: "20/09/2026 — chuyển SubUtilityHeader → AppFrame (nút cài PWA vào khe actions), window.confirm → notify.confirm, cỡ chữ lên sàn 13px",
  aura: "20/09/2026 — chuyển SubUtilityHeader → AppFrame (app cuối dùng header đó, nhờ vậy xoá được nó), tên lấy từ catalog \"Tập Trung\" thay chuỗi marketing 2 dòng, nhãn preset bỏ truncate 8,5px, thêm vòng quay báo nhạc đang nạp (bấm phát trên mạng chậm vốn im lặng vài giây)",
  bio: "20/09/2026 — gộp HAI chrome trùng nhau (header desktop + thanh cố định dưới đáy mobile, cùng hiện tên+link+nút chép/mở) về AppFrame; dải segmented tự dựng thành tabs của khung; 3 mục soạn thảo có địa chỉ riêng",
  radio: "20/09/2026 — gộp BA header tự dựng (PWA/desktop/mobile) về AppFrame, gỡ điều hướng 5 trang chết + cặp prop radioPage của portal, cỡ chữ lên sàn 13px",
  wallet: "20/09/2026 — dựng phần Giao dịch gần đây (bộ lọc + biên lai vốn không có đường mở), LazyBoundary dùng chung, bỏ emoji, chữ mặt sau thẻ 7,5px → 11px; chuyển sang AppFrame với wideNav=\"segmented\" để GIỮ dải phân đoạn macOS vốn đã đúng",
  vocab: "20/09/2026 — 8 emoji → Material Symbols, 89 chỗ chữ <13px lên 13px (chữ Hán cần cỡ lớn hơn chữ Latin mới đọc được); sidebar desktop có sẵn nhờ AppFrame. CÒN NỢ: 2.386 dòng trong MỘT file, cần tách — bộ kiểm không đo cấu trúc mã",
};

/**
 * Ngoại lệ CÓ LÝ DO, khoá theo "tiêu chí @ đường dẫn".
 *
 * Trước khi thêm một dòng vào đây, hỏi: đây là thiết kế có chủ ý, hay chỉ là chỗ
 * chưa muốn sửa? Nếu là chỗ chưa muốn sửa thì đừng thêm — hãy sửa.
 */
const EXCEPTIONS = {
  // Mặt thẻ mô phỏng thẻ ngân hàng thật: "Chủ thẻ", "EXP" là nhãn micro in hoa,
  // thẻ thật in đúng cỡ đó và nâng lên 15px là phá dáng thẻ. Sàn riêng ở đây là
  // 11px — dưới mức đó thì không còn đọc được nữa nên vẫn bị tính là vi phạm.
  // Câu văn đầy đủ trên thẻ (lockHint) đã nâng lên 13px, không nằm trong ngoại lệ.
  "fontFloor@wallet/MetalCard3D.jsx":
    "nhãn micro trên mặt thẻ (Chủ thẻ/EXP) — dáng thẻ ngân hàng thật, sàn riêng 11px",

  // App MỘT MÀN: không có màn con nào để đặt địa chỉ. Bản thân app đã có địa chỉ
  // /member/utilities/<id>. Bắt chúng dựng router chỉ để bộ kiểm xanh là thêm
  // code không ai dùng.
  "address@profile": "hồ sơ là một màn đọc, không có màn con",
  // App BẢN ĐỒ toàn màn: bản đồ phải tràn viền và nằm DƯỚI mọi thứ, điều hướng là
  // topbar nổi + bottom sheet + dock nổi — đúng khuôn Apple dùng cho Find My và
  // Maps. Nhét vào AppFrame (nav kính + cột giữa + tab bar) là phá chính thiết kế
  // đó. Đây là ngoại lệ về HÌNH THÁI, không phải chỗ chưa muốn sửa: friends vẫn
  // phải đạt 9 tiêu chí còn lại, và nó có trong FULLSCREEN_APP_IDS.
  "frame@friends": "app bản đồ toàn màn (Find My / Maps pattern) — nav nổi trên bản đồ, không dùng nav kính của khung",
  "responsive@friends": "bản đồ tự lấp mọi bề ngang; bottom sheet và dock đã là bố cục nổi, không cần cột giữa",

  "address@aura": "một màn duy nhất (đồng hồ Pomodoro + trình phát trên cùng trang), không có màn con để đặt địa chỉ",
  "emptyState@aura": "playlist là hằng số trong mã, không có danh sách nào có thể rỗng — trạng thái rỗng ở đây là màn không bao giờ hiện",

  "address@radio": "một trang cuộn (trình phát + đài + hẹn giờ + thông tin); bộ điều hướng 5 trang cũ là code chết và đã gỡ 20/09",
};

/** Mỗi app: file vỏ + thư mục (nếu có) để quét cả component con. */
const APPS = {
  hugoKit: { entry: "hugoKit/HugoKitApp.jsx", dir: "hugoKit" },
  vocab: { entry: "vocab/HugoVocabApp.jsx", dir: "vocab" },
  wallet: { entry: "wallet/JoyWalletApp.jsx", dir: "wallet" },
  study: { entry: "study/StudyWithHugoApp.jsx", dir: "study" },
  hugoStore: { entry: "hugoStore/HugoStoreTab.jsx", dir: "hugoStore" },
  arcade: { entry: "arcade/HugoArcadeTab.jsx", dir: "arcade" },
  banhocduong: { entry: "banhocduong/BanhocduongTab.jsx", dir: "banhocduong" },
  radio: { entry: "MemberRadioTab.jsx" },
  profile: { entry: "HugoProfileTab.jsx" },
  team: { entry: "HugoTeamTab.jsx" },
  aura: { entry: "MemberAuraTab.jsx" },
  bio: { entry: "BioPreviewTab.jsx" },
  friends: { entry: "FriendsApp.jsx" },
};

async function walk(dir, out = []) {
  for (const name of await readdir(dir)) {
    const p = path.join(dir, name);
    if ((await stat(p)).isDirectory()) await walk(p, out);
    else if (/\.(jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * Tiêu chí. Mỗi cái trả `true` là đạt.
 *
 * `entry` = nội dung file vỏ app. `all` = nội dung MỌI file của app nối lại
 * (component con cũng phải đúng chuẩn, không chỉ cái vỏ).
 */
const CRITERIA = [
  {
    id: "frame",
    label: "dùng khung chung AppFrame (một bộ chrome cho mọi app)",
    test: ({ entry, appName }) => Boolean(EXCEPTIONS[`frame@${appName}`])
      || /from\s+["'][^"']*os\/AppFrame["']/.test(entry),
  },
  {
    id: "address",
    label: "mỗi màn có địa chỉ riêng (đọc route từ URL, không giữ trong state)",
    /*
     * Hoặc nhận route/onRouteChange từ portal, hoặc tự đọc useParams/
     * useSearchParams. App CHỈ CÓ MỘT MÀN thì không có gì để đặt địa chỉ —
     * bản thân app đã có địa chỉ `/member/utilities/<id>` rồi; những app đó khai
     * ngoại lệ kèm lý do chứ không bị bắt dựng router rỗng.
     */
    test: ({ entry, appName }) => Boolean(EXCEPTIONS[`address@${appName}`])
      || /\bonRouteChange\b/.test(entry)
      || /useSearchParams|useParams/.test(entry),
  },
  {
    id: "responsive",
    label: "có bố cục cho màn rộng (khung chung, hoặc grid/breakpoint riêng)",
    /*
     * Đo ở FILE VỎ, không phải bình quân cả thư mục.
     *
     * Bản đầu của tiêu chí này lấy số breakpoint chia cho tổng số dòng của mọi
     * file trong app, và nó chấm HugoKit là trượt dù cái vỏ đã có hai khung:
     * tám file công cụ không có breakpoint nào làm loãng tỷ lệ. Nhưng bố cục
     * theo bề ngang màn là việc của cái vỏ — công cụ chỉ đổ nội dung vào khung
     * đã chia sẵn, chúng KHÔNG cần breakpoint riêng.
     *
     * Đạt khi vỏ có một trong hai: layout chia khung theo breakpoint
     * (lg:grid, md:flex…), hoặc đủ dày breakpoint để coi là đã chăm màn rộng.
     */
    test: ({ entry, appName }) => Boolean(EXCEPTIONS[`responsive@${appName}`])
      || /from\s+["'][^"']*os\/AppFrame["']/.test(entry)
      || /\b(sm|md|lg|xl):(grid|flex|block|hidden|col|w-|max-w-)/.test(entry)
      || (entry.match(/\b(sm|md|lg|xl):/g) || []).length >= 6,
  },
  {
    id: "fullscreen",
    label: "app dùng AppFrame phải có trong FULLSCREEN_APP_IDS (PWA độc lập với portal)",
    /*
     * `AppFrame` tự dựng trọn vỏ app. Lồng nó vào vỏ portal là hai lớp chrome
     * chồng nhau: app co lại thành khung hẹp giữa màn, thừa mép nền hai bên, có
     * thanh cuộn thứ hai, nút X đóng app dạt ra rìa. Đây là lỗi đã xảy ra thật
     * với `aura` và `profile` — chuyển sang AppFrame mà quên khai vào danh sách.
     *
     * `appId` đọc thẳng từ prop trong file vỏ, nên không cần bảng ánh xạ thứ hai
     * giữa tên app trong bộ kiểm và id thật.
     */
    test: ({ entry }) => {
      if (!/from\s+["'][^"']*os\/AppFrame["']/.test(entry)) return true;  // không dùng khung thì không áp
      const id = entry.match(/appId=["']([^"']+)["']/)?.[1];
      return Boolean(id) && FULLSCREEN_APP_IDS.includes(id);
    },
  },
  {
    id: "errorBoundary",
    label: "có ranh giới lỗi cho phần tải lazy (chunk lỗi không làm trắng app)",
    // Chỉ đòi khi app CÓ dùng lazy; app không lazy thì không cần.
    test: ({ all }) => !/\blazy\(/.test(all)
      || /getDerivedStateFromError|componentDidCatch|ErrorBoundary|Boundary\b/.test(all),
  },
  {
    id: "loadingState",
    label: "có trạng thái đang tải (skeleton/spinner), không nhảy nội dung",
    /*
     * Nhận cả `animate-spin`, `buffering`, `progress_activity`, `Spinner`.
     *
     * Bản đầu chỉ tìm `Skeleton|animate-pulse|isLoading|loading` nên chấm TRƯỢT
     * cho HugoAura ngay sau khi app đó vừa được thêm vòng quay báo nhạc đang nạp
     * — tức nó đo CÁCH VIẾT chứ không đo có phản hồi hay không. Cùng loại lỗi với
     * tiêu chí cỡ chữ từng bỏ sót `text-xs`.
     */
    test: ({ all }) => /Skeleton|Spinner|animate-pulse|animate-spin|progress_activity|buffering|isLoading|loading\b/i.test(all),
  },
  {
    id: "emptyState",
    label: "có trạng thái rỗng (noResults/empty), không để màn trống hoác",
    test: ({ all, appName }) => Boolean(EXCEPTIONS[`emptyState@${appName}`])
      || /noResults|empty|Empty|chưa có|không có/i.test(all),
  },
  {
    id: "touchTarget",
    label: "vùng bấm ≥44px (không có h-[<44px] trên nút)",
    test: ({ all }) => {
      // Nút khai chiều cao cứng dưới 44px là vùng bấm quá nhỏ trên điện thoại.
      const bad = [...all.matchAll(/\bh-\[(\d+)px\]/g)]
        .map((m) => Number(m[1]))
        .filter((px) => px < 44 && px >= 20);   // <20px gần như luôn là icon/vạch, không phải nút
      return bad.length === 0;
    },
  },
  {
    id: "fontFloor",
    label: "không có chữ ≤12px (nền cỡ chữ đọc được)",
    /*
     * Kiểm THEO TỪNG FILE, không trên chuỗi gộp: có thế mới áp được ngoại lệ cho
     * đúng một file mà không mở cửa cho cả app. File có ngoại lệ vẫn phải giữ
     * sàn 11px — ngoại lệ là "nhỏ hơn 13 được", không phải "nhỏ bao nhiêu cũng được".
     */
    test: ({ files }) => files.every(({ rel, text }) => {
      const excepted = Boolean(EXCEPTIONS[`fontFloor@${rel}`]);
      const floor = excepted ? 11 : 13;
      const sizes = [...text.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)].map((m) => Number(m[1]));
      // `text-xs` của Tailwind = 0.75rem = 12px, y hệt `text-[12px]`, chỉ khác
      // cách viết. Bản đầu của tiêu chí này chỉ bắt dạng ngoặc vuông nên chấm
      // ĐẠT cho file đầy `text-xs` — đo cách viết chứ không đo cỡ chữ thật.
      if (/\btext-xs\b/.test(text)) sizes.push(12);
      return sizes.every((px) => px >= floor);
    }),
  },
  {
    id: "noEmoji",
    label: "không emoji (chỉ Material Symbols đơn sắc)",
    test: ({ all }) => !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(all),
  },
];

let failed = 0;
const rows = [];

for (const [name, spec] of Object.entries(APPS)) {
  const entryPath = path.join(MEMBER, spec.entry);
  let entry;
  try {
    entry = await readFile(entryPath, "utf8");
  } catch {
    console.log(`⚠️  ${name}: không thấy ${spec.entry} — cập nhật APPS trong bộ này`);
    failed++;
    continue;
  }

  // `files` giữ đường dẫn tương đối để tiêu chí nào cần thì áp ngoại lệ theo file.
  let files = [{ rel: spec.entry, text: entry }];
  if (spec.dir) {
    const found = await walk(path.join(MEMBER, spec.dir));
    files = await Promise.all(found.map(async (f) => ({
      rel: path.relative(MEMBER, f),
      text: await readFile(f, "utf8"),
    })));
  }
  const all = files.map((f) => f.text).join("\n");

  const ctx = { entry, all, files, appName: name };
  const results = CRITERIA.map((c) => ({ ...c, ok: c.test(ctx) }));
  const passed = results.filter((r) => r.ok).length;
  const certified = Boolean(CERTIFIED[name]);
  rows.push({ name, passed, total: CRITERIA.length, certified, results });

  if (certified) {
    const misses = results.filter((r) => !r.ok);
    if (misses.length) {
      failed++;
      console.log(`❌ ${name} đã certify nhưng TỤT chuẩn:`);
      for (const m of misses) console.log(`     • ${m.label}`);
    }
  }
}

rows.sort((a, b) => b.passed - a.passed);

console.log("\nTIÊU CHUẨN APP RIÊNG iOS — điểm từng app\n");
console.log(`  ${"app".padEnd(14)}${"đạt".padEnd(8)}trạng thái`);
console.log(`  ${"-".repeat(14)}${"-".repeat(8)}${"-".repeat(28)}`);
for (const r of rows) {
  const mark = r.certified ? "✅ ĐÃ CHUẨN" : r.passed === r.total ? "→ sẵn sàng certify" : "còn việc";
  console.log(`  ${r.name.padEnd(14)}${`${r.passed}/${r.total}`.padEnd(8)}${mark}`);
}

const todo = rows.filter((r) => !r.certified && r.passed < r.total);
if (todo.length) {
  console.log("\nCòn thiếu, theo từng app:\n");
  for (const r of todo) {
    console.log(`  ${r.name}`);
    for (const m of r.results.filter((x) => !x.ok)) console.log(`     • ${m.label}`);
  }
}

console.log(
  failed
    ? `\n❌ ${failed} app đã certify bị tụt chuẩn`
    : `\n✅ ${Object.keys(CERTIFIED).length} app đã certify vẫn đạt chuẩn (${todo.length} app còn trong danh sách việc)`,
);
process.exit(failed ? 1 : 0);
