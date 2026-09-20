import { useSyncExternalStore } from "react";
import {
  JOY_DENOMS, DEFAULT_DENOM, denomKey,
} from "../../shared/joyCurrency";
import { localeForLanguage } from "../i18n/languages";

/**
 * Lớp hiển thị JOY của toàn app.
 *
 * QUY TẮC: giao diện thành viên KHÔNG bao giờ in số JOY gốc kèm chữ "JOY". Mọi
 * số tiền đi qua đây và ra bằng ĐƠN VỊ CỦA TÀI KHOẢN (`Bio.joyDenom`) — ví, cửa
 * hàng, nhiệm vụ, chuyển JOY, thông báo, tài liệu. Chữ "JOY" chỉ còn được dùng
 * làm TÊN sản phẩm ("Ví JOY", "JOYlater") chứ không làm đơn vị của một con số.
 *
 * Ngược lại, JOY gốc vẫn là đơn vị TÍNH TOÁN duy nhất: mọi giá, mọi phép trừ ví,
 * mọi bản ghi server đều bằng JOY gốc (xem shared/joyCurrency.js). Ở đây chỉ đổi
 * cách viết ra màn hình, không đổi giá trị — nên đừng bao giờ đưa số đã qua
 * `joyValue()` ngược vào một phép tính hay một request.
 *
 * Đơn vị được nhớ trong localStorage để lần mở sau hiện đúng ngay từ khung hình
 * đầu, không chờ `/bio` trả về rồi mới nhảy số.
 */
const LEGACY_LS_KEY = "joy_denom";
const LS_KEY = (subject) => `joy_denom:${subject}`;
const normalizeSubject = (subject) => String(subject || "").trim().toLowerCase();

// Chỉ nhận lại đơn vị đã lưu khi nó THẬT SỰ là một đơn vị hợp lệ — tài khoản
// chưa chọn thì không có gì để nhớ cả.
const readStored = (subject) => {
  const normalized = normalizeSubject(subject);
  if (!normalized) return '';
  try {
    const saved = localStorage.getItem(LS_KEY(normalized));
    return saved && JOY_DENOMS[denomKey(saved)] && saved === denomKey(saved) ? saved : '';
  } catch {
    return '';
  }
};

// `active` rỗng = TÀI KHOẢN CHƯA CHỌN ĐƠN VỊ. Khi đó vẫn phải định dạng được số
// (để màn onboarding và mọi khung sườn không vỡ), nhưng `chosen` là false để
// giao diện biết mà từ chối cho tiêu tiền — hệ thống không được tự quyết hộ
// người dùng đơn vị nào rồi hiển thị như thể họ đã chọn.
// Không đọc khoá dùng chung của bản cũ: nó có thể thuộc về người đăng nhập
// trước trên cùng thiết bị. Chỉ nạp cache sau khi biết đúng tài khoản.
let active = '';
let activeSubject = '';
let i18nRef = null;
const listeners = new Set();
let revision = 0;

const publish = () => {
  revision += 1;
  listeners.forEach((fn) => fn());
};

/** Chọn phạm vi cá nhân hoá trước khi hồ sơ server tải xong. */
export function selectJoyAccount(subject) {
  const nextSubject = normalizeSubject(subject);
  if (nextSubject === activeSubject) return;
  activeSubject = nextSubject;
  active = readStored(nextSubject);
  try { localStorage.removeItem(LEGACY_LS_KEY); } catch { /* private mode */ }
  publish();
}

/** Đơn vị của tài khoản đang đăng nhập. Gọi khi `/bio` về. */
export function setJoyDenom(value, subject = activeSubject) {
  const nextSubject = normalizeSubject(subject);
  if (nextSubject && nextSubject !== activeSubject) activeSubject = nextSubject;
  const next = JOY_DENOMS[value] ? value : '';
  if (next === active && !nextSubject) return;
  active = next;
  try {
    if (activeSubject && next) localStorage.setItem(LS_KEY(activeSubject), next);
    else if (activeSubject) localStorage.removeItem(LS_KEY(activeSubject));
  } catch { /* private mode */ }
  publish();
}

/** Tài khoản đã thật sự chọn đơn vị chưa. `false` = chưa được hỏi. */
export const joyDenomChosen = () => Boolean(active);

/** Đơn vị dùng để ĐỊNH DẠNG; chưa chọn thì tạm lấy mặc định cho khỏi vỡ. */
const formatting = () => active || DEFAULT_DENOM;

export const joyDenom = () => "JOY";
export const joyCode = () => "JOY";
export const joyName = () => "JOY";

/** JOY gốc → SỐ (không kèm mã). Chỉ có 1 đơn vị JOY duy nhất. */
export const joyValue = (joy) => {
  const parsed = Number(joy);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

/** Số người dùng gõ → số JOY (làm tròn). */
export const joyToRaw = (amount) => {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

const currentLocale = () => localeForLanguage(
  i18nRef?.resolvedLanguage || i18nRef?.language || "vi",
);

/**
 * VẠN — đơn vị đếm của người Việt xưa, bằng 10.000.
 *
 * Người Văn Lang không đếm theo nghìn như cách viết số phương Tây mà theo VẠN
 * (萬): mười nghìn là một vạn, mười vạn là một ức. Lối đếm ấy còn nguyên trong
 * tiếng Việt tới tận bây giờ — "muôn vàn", "vạn sự", "vạn tuế" — nhưng đã biến
 * mất khỏi mọi con số trên màn hình.
 *
 * Đưa nó trở lại ở đây là có chủ ý: mỗi lần Quý thành viên nhìn vào ngân khố
 * của mình là một lần gặp lại cách tổ tiên đếm của cải.
 *
 * Áp cho TIẾNG VIỆT và TIẾNG TRUNG. Tiếng Trung đếm theo 万 là lối bản địa của
 * chính nó, không phải mượn — viết 190.895 thành 19万895 mới là cách một người
 * Hoa đọc số. Riêng bản tiếng Anh giữ nguyên lối đếm theo nghìn: người đọc
 * tiếng Anh không có ký ức nào về "vạn", với họ nó chỉ là một con số khó đọc.
 */
export const VAN = 10000;

/**
 * 190.895 → "19 vạn 895" (vi) hoặc "19万895" (zh).
 * Dưới một vạn thì giữ nguyên số.
 */
export function toVan(amount, locale, lang = "vi") {
  const n = Math.abs(Math.round(Number(amount) || 0));
  const sign = Number(amount) < 0 ? "−" : "";
  if (n < VAN) return sign + n.toLocaleString(locale);

  const van = Math.floor(n / VAN);
  const rest = n % VAN;
  // Phần lẻ KHÔNG đệm số 0: "19 vạn 895" chứ không phải "19 vạn 0895". Người
  // đọc tiếng Việt đọc thành "mười chín vạn tám trăm chín mươi lăm", ở đó số 0
  // dẫn đầu không tồn tại.
  // Tiếng Trung viết liền không khoảng trắng và không dấu phân nhóm ở phần lẻ:
  // 19万895, không phải "19 万 895".
  if (lang === "zh") {
    return rest ? `${sign}${van}万${rest}` : `${sign}${van}万`;
  }
  return rest
    ? `${sign}${van.toLocaleString(locale)} vạn ${rest.toLocaleString(locale)}`
    : `${sign}${van.toLocaleString(locale)} vạn`;
}

const currentLang = () => String(i18nRef?.resolvedLanguage || i18nRef?.language || "vi");

/** SỐ đã định dạng: vi/zh đếm theo vạn, en theo nghìn. */
export const joyNumber = (joy) => {
  const lang = currentLang();
  // Chữ Nôm là lối viết của tiếng Việt nên đếm y hệt: "19 vạn 895".
  if (lang.startsWith("vi") || lang.startsWith("nom")) return toVan(joyValue(joy), currentLocale());
  if (lang.startsWith("zh")) return toVan(joyValue(joy), currentLocale(), "zh");
  return joyValue(joy).toLocaleString(currentLocale());
};

/** Chuỗi đầy đủ kèm mã đơn vị JOY duy nhất: "1.000 JOY". */
export const joyText = (joy) => `${joyNumber(joy)} JOY`;

/**
 * Tách chuỗi đã định dạng thành các mảnh, đánh dấu đâu là CHỮ ĐƠN VỊ.
 *
 * `joyNumber` phải trả về chuỗi thuần vì nó còn chạy trong i18next
 * (`{{x, joy}}`), trong nhãn cho trình đọc màn hình và trong tin nhắn Telegram —
 * ba nơi không nhận JSX. Nên cỡ chữ không thể quyết định ở đó; hàm này để tầng
 * giao diện dựng lại con số với chữ "vạn" nhỏ hơn.
 */
export function joyParts(joy) {
  const text = joyNumber(joy);
  // Tách quanh "vạn" (Việt) và "万" (Hoa), giữ lại chính dấu tách trong kết quả.
  return text.split(/(\s?vạn\s?|万)/).filter(Boolean).map((chunk) => ({
    text: chunk,
    unit: /vạn|万/.test(chunk),
  }));
}

/**
 * Đăng ký hai bộ định dạng cho i18next:
 *   "{{amount, joy}}"    → 1.000 JOY
 *   "{{amount, joynum}}" → 1.000
 */
export function registerJoyFormat(i18n) {
  i18nRef = i18n;
  i18n.services.formatter?.add("joy", (value) => joyText(value));
  i18n.services.formatter?.add("joynum", (value) => joyNumber(value));
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => revision;

/**
 * Hook cho component: trả về bộ định dạng 1 đơn vị JOY duy nhất của Hugo Studio.
 */
export function useJoy() {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    denom: "JOY",
    chosen: true,
    // `locale` để mọi chỗ định dạng ngày/số theo ĐÚNG ngôn ngữ app đang dùng.
    // Thiếu nó thì nơi gọi phải truyền `undefined` cho toLocaleDateString và rơi
    // về locale của trình duyệt — lệch âm thầm với phần còn lại của app.
    locale: currentLocale(),
    code: "JOY",
    name: "JOY",
    value: joyValue,
    number: joyNumber,
    text: joyText,
    toRaw: joyToRaw,
  };
}
