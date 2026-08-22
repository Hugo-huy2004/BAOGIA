import { getAppAccent } from "../../../../shared/appRegistry";

/**
 * HugoOS — bảng màu riêng của từng ứng dụng.
 *
 * Trước đây mọi app đều lấy `--primary` của portal làm màu nhấn và để nền của
 * portal lộ ra sau lưng, nên mở app nào cũng ra đúng một màu: app không có bản
 * sắc, và đổi theme portal là đổi màu cả hệ. Ở đây mỗi app tự cầm màu của mình
 * (`tint` trong appRegistry) và tự sơn nền — nền portal không liên quan nữa.
 *
 * ponytail: trộn màu bằng JS thay vì `color-mix()` trong CSS. Custom property
 * nhận giá trị không hỗ trợ vẫn "hợp lệ" cho tới lúc dùng rồi mới hỏng, nên
 * trên Safari cũ sẽ ra nền trong suốt — trộn sẵn thì không có rủi ro đó. Vẫn
 * phẳng và tĩnh: toàn màu đặc, không gradient, không glow.
 */

const toRgb = (hex) => {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};

/** Trộn `hex` vào nền `base` theo tỉ lệ `ratio` (0–1), trả về chuỗi rgb(). */
const mix = (hex, base, ratio, alpha) => {
  const [r, g, b] = toRgb(hex);
  const [br, bg, bb] = toRgb(base);
  const channel = (fg, bgc) => Math.round(fg * ratio + bgc * (1 - ratio));
  const rgb = `${channel(r, br)}, ${channel(g, bg)}, ${channel(b, bb)}`;
  return alpha === undefined ? `rgb(${rgb})` : `rgba(${rgb}, ${alpha})`;
};

/**
 * Token màu cho `IosApp`. Trả về đúng những biến cần đè lên bảng mặc định của
 * iosKit — phần chữ, đường kẻ và fill trung tính vẫn dùng của iosKit.
 */
export function appPalette(appId, dark) {
  const accent = getAppAccent(appId);
  if (dark) {
    return {
      accent,
      vars: {
        "--ios-bg": mix(accent, "#000000", 0.08),
        "--ios-elevated": mix(accent, "#000000", 0.15),
        "--ios-surface": mix(accent, "#000000", 0.15),
        "--ios-surface-2": mix(accent, "#000000", 0.22),
        "--ios-chrome": mix(accent, "#000000", 0.12, 0.88),
      },
    };
  }
  return {
    accent,
    vars: {
      "--ios-bg": mix(accent, "#FFFFFF", 0.08),
      "--ios-elevated": "#FFFFFF",
      "--ios-surface": "#FFFFFF",
      "--ios-surface-2": mix(accent, "#FFFFFF", 0.12),
      "--ios-chrome": mix(accent, "#FFFFFF", 0.05, 0.88),
    },
  };
}
