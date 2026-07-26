// Cầu nối giữa bảng màu CSS của từng game (`.arcade-game--<id>` trong
// game-intro.css) và các engine vẽ bằng canvas.
//
// Canvas không đọc được CSS custom property, nên phải lấy ra một lần bằng
// getComputedStyle rồi truyền vào vòng vẽ. Nhờ vậy bàn chơi và màn giới thiệu
// dùng CHUNG một nguồn màu — sửa palette ở CSS là bàn chơi đổi theo.

const FALLBACK = {
  bg: "#080a14",
  ink: "#f5f7ff",
  muted: "#8f9bc4",
  accent: "#22d3ee",
};

// Chỉ nhận đúng dạng hex. Trước đây chỉ cắt lát theo độ dài, nên một giá trị
// như "rgba(0,0,0,.2)" (đúng dạng của --intro-soft) lọt qua và sinh ra
// "rgba(NaN, 186, NaN, .5)" — canvas nhận màu hỏng và vẽ ra khoảng trống.
function parseHex(hex) {
  const value = String(hex).trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return [0, 1, 2].map((i) => parseInt(value[i] + value[i], 16));
  }
  if (/^[0-9a-f]{6}$/i.test(value) || /^[0-9a-f]{8}$/i.test(value)) {
    return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  }
  return null;
}

/** Màu bất kỳ (hex) + độ mờ → chuỗi rgba dùng được cho canvas. */
export function withAlpha(color, alpha) {
  const rgb = parseHex(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * Làm sáng (amount > 0) hoặc tối đi (amount < 0) một màu hex.
 * amount tính theo tỉ lệ, ví dụ 0.2 = sáng thêm 20% quãng còn lại tới trắng.
 */
export function shade(color, amount) {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const mix = (channel) => {
    const target = amount >= 0 ? 255 : 0;
    const next = Math.round(channel + (target - channel) * Math.abs(amount));
    return Math.max(0, Math.min(255, next));
  };
  return `#${rgb.map((c) => mix(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Độ sáng tương đối 0–1, dùng để quyết định nền sáng hay tối. */
export function luminance(color) {
  const rgb = parseHex(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Đọc bảng màu của game đang chạy từ phần tử canvas (kế thừa biến CSS từ
 * `.arcade-game--<id>`). Trả về fallback tối nếu game render ngoài shell.
 *
 * `isLight` quyết định engine dùng quầng sáng (nền tối) hay viền đậm (nền
 * sáng) — quầng neon trên nền pastel gần như tàng hình.
 */
export function readGamePalette(element) {
  const palette = { ...FALLBACK };
  try {
    const styles = getComputedStyle(element);
    const read = (name, fallback) => {
      const value = styles.getPropertyValue(name).trim();
      return value && parseHex(value) ? value : fallback;
    };
    palette.bg = read("--intro-bg", FALLBACK.bg);
    palette.ink = read("--intro-ink", FALLBACK.ink);
    palette.muted = read("--intro-muted", FALLBACK.muted);
    palette.accent = read("--intro-accent", FALLBACK.accent);
  } catch {
    /* SSR hoặc môi trường không có DOM — dùng fallback */
  }

  palette.isLight = luminance(palette.bg) > 0.4;
  // Đường lưới và viền luôn lấy theo mực chữ nên tự đảo cùng nền.
  palette.grid = withAlpha(palette.ink, palette.isLight ? 0.1 : 0.07);
  palette.outline = withAlpha(palette.ink, palette.isLight ? 0.85 : 0.35);
  return palette;
}
