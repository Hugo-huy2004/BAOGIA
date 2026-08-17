import { useSyncExternalStore } from "react";
import {
  DEFAULT_DENOM, denomKey, denomOf, toDenom, fromDenom, factorOf, setLiveFactors,
} from "../../shared/joyCurrency.js";
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
const LS_KEY = "joy_denom";

const readStored = () => {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? denomKey(saved) : DEFAULT_DENOM;
  } catch {
    return DEFAULT_DENOM;
  }
};

let active = readStored();
let liveRates = null;
let i18nRef = null;
const listeners = new Set();

/** Đơn vị của tài khoản đang đăng nhập. Gọi khi `/bio` về. */
export function setJoyDenom(value) {
  const next = denomKey(value);
  if (next === active) return;
  active = next;
  try { localStorage.setItem(LS_KEY, next); } catch { /* private mode */ }
  listeners.forEach((fn) => fn());
}

/**
 * Nạp bảng tỷ giá ngày (GET /joy/rates). Gọi một lần sau khi đăng nhập; hỏng
 * thì đừng gọi — mọi thứ tự chạy bằng hệ số nền.
 */
export function setJoyRates(rates) {
  setLiveFactors(rates?.factors || null);
  liveRates = rates || null;
  listeners.forEach((fn) => fn());
}

/** Bảng tỷ giá đang dùng (cho màn hình thị trường). `null` khi chưa nạp. */
export const joyRates = () => liveRates;

/** Hệ số đang áp dụng cho đơn vị của tài khoản. */
export const joyFactor = () => factorOf(active);

export const joyDenom = () => active;
export const joyCode = () => denomOf(active).code;
export const joyName = () => denomOf(active).name;

/** JOY gốc → SỐ theo đơn vị tài khoản (không kèm mã). Chỉ để hiển thị. */
export const joyValue = (joy) => toDenom(joy, active).amount;

/** Số người dùng gõ theo đơn vị của họ → JOY gốc, để gửi lên server. */
export const joyToRaw = (amount) => fromDenom(amount, active);

const currentLocale = () => localeForLanguage(
  i18nRef?.resolvedLanguage || i18nRef?.language || "vi",
);

/** SỐ đã định dạng theo ngôn ngữ, KHÔNG kèm mã đơn vị: "24.621.550". */
export const joyNumber = (joy) => joyValue(joy).toLocaleString(currentLocale());

/** Chuỗi đầy đủ kèm mã đơn vị: "24.621.550 JOYmi". */
export const joyText = (joy) => `${joyNumber(joy)} ${joyCode()}`;

/**
 * Đăng ký hai bộ định dạng cho i18next, gọi một lần lúc khởi tạo i18n.
 *
 *   "{{amount, joy}}"    → 24.621.550 JOYmi
 *   "{{amount, joynum}}" → 24.621.550          (khi câu đã có mã đơn vị ở chỗ khác)
 *
 * Nhờ vậy chuỗi dịch chỉ cần bỏ chữ "JOY" đi, còn nơi gọi `t()` vẫn truyền
 * NGUYÊN số JOY gốc như cũ — không có chỗ nào phải tự nhân hệ số, tức là không
 * có chỗ nào nhân sai.
 */
export function registerJoyFormat(i18n) {
  i18nRef = i18n;
  i18n.services.formatter?.add("joy", (value) => joyText(value));
  i18n.services.formatter?.add("joynum", (value) => joyNumber(value));
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => `${active}@${liveRates?.date || ""}`;

/**
 * Hook cho component: trả về bộ định dạng gắn với đơn vị hiện tại và tự vẽ lại
 * khi đơn vị đổi (người dùng vừa xong onboarding chẳng hạn).
 */
export function useJoy() {
  // Mốc thay đổi gộp cả đơn vị lẫn tỷ giá: đổi cái nào cũng phải vẽ lại số tiền.
  const denom = useSyncExternalStore(subscribe, snapshot, snapshot).split("@")[0];
  return {
    denom,
    rates: liveRates,
    code: denomOf(denom).code,
    name: denomOf(denom).name,
    value: joyValue,
    number: joyNumber,
    text: joyText,
    toRaw: joyToRaw,
  };
}
