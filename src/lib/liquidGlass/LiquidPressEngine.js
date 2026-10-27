/**
 * Liquid Glass — cảm giác bấm kiểu iOS 26/27 cho MỌI nút trong app.
 *
 * App có hơn 900 thẻ <button> rải trong 200 tệp, không qua một component chung.
 * Sửa từng nút là không làm nổi và sẽ lệch nhau, nên đây là MỘT bộ máy gắn ở
 * gốc tài liệu, nghe sự kiện theo kiểu uỷ quyền (delegation):
 *
 *   - Nút nhỏ (icon, chip) phồng lên khi chạm, nút lớn lún xuống nhẹ — đúng cách
 *     điều khiển kính của iOS phản hồi theo kích thước.
 *   - Một đốm sáng đi theo ngón tay trên mặt nút (một lớp phủ duy nhất cho cả app,
 *     không chèn gì vào trong nút nên không đụng ::before/::after có sẵn).
 *   - Thả tay thì nảy về bằng lò xo thật (đường cong tính từ độ cứng/giảm chấn).
 *
 * Hoạt hình chạy bằng Web Animations API trên thuộc tính `scale` riêng lẻ, nên
 * cộng dồn với `transform` sẵn có của nút (ví dụ nút căn giữa bằng translate)
 * và không bị các khai báo `transition` của từng nút ghi đè.
 *
 * Tắt cho một vùng: thêm `data-lg-off` vào phần tử cha (bàn cờ, tay cầm game…).
 */

const TARGET = [
  "button:not(:disabled)",
  "[role='button']:not([aria-disabled='true'])",
  "[role='tab']",
  "[role='switch']",
  "[role='menuitem']",
  "summary",
  "a.lg-press",
].join(",");

const MOVE_CANCEL_PX = 10;
const SMALL_CONTROL_PX = 120;

/** Đường cong lò xo thật → chuỗi `linear()` cho CSS/WAAPI. */
class SpringCurve {
  constructor({ stiffness = 300, damping = 22, mass = 1 } = {}) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
  }

  /** Mô phỏng tới khi lò xo yên, trả { easing, duration } để dùng với element.animate(). */
  toEasing(samples = 48) {
    const supportsLinear = typeof CSS !== "undefined" && CSS.supports?.("animation-timing-function", "linear(0, 1)");
    if (!supportsLinear) return { easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", duration: 480 };

    const dt = 1 / 240;
    let position = 0;
    let velocity = 0;
    let time = 0;
    const points = [];
    // Lò xo kéo vị trí từ 0 tới 1; dừng khi đã gần như đứng yên.
    while (time < 2.5) {
      const force = -this.stiffness * (position - 1) - this.damping * velocity;
      velocity += (force / this.mass) * dt;
      position += velocity * dt;
      time += dt;
      points.push([time, position]);
      if (Math.abs(position - 1) < 0.001 && Math.abs(velocity) < 0.01) break;
    }
    const step = Math.max(1, Math.floor(points.length / samples));
    const stops = points.filter((_, index) => index % step === 0).map(([, value]) => value.toFixed(4));
    stops.push("1");
    return { easing: `linear(0, ${stops.join(", ")})`, duration: Math.round(time * 1000) };
  }
}

/** Một lớp phủ duy nhất vẽ đốm sáng trên nút đang được chạm. */
class LiquidHighlight {
  constructor() {
    this.node = null;
    this.target = null;
  }

  ensureNode() {
    if (this.node) return this.node;
    const node = document.createElement("div");
    node.className = "lg-press-highlight";
    node.setAttribute("aria-hidden", "true");
    document.body.appendChild(node);
    this.node = node;
    return node;
  }

  show(target, clientX, clientY, scale = 1) {
    const node = this.ensureNode();
    const box = target.getBoundingClientRect();
    this.target = target;
    this.box = box;
    node.style.left = `${box.left}px`;
    node.style.top = `${box.top}px`;
    node.style.width = `${box.width}px`;
    node.style.height = `${box.height}px`;
    node.style.borderRadius = getComputedStyle(target).borderRadius || "9999px";
    // Phồng/lún cùng nút để đốm sáng không lệch khỏi mặt kính.
    node.style.scale = String(scale);
    this.move(clientX, clientY);
    node.dataset.on = "true";
  }

  move(clientX, clientY) {
    if (!this.node || !this.box) return;
    this.node.style.setProperty("--lg-x", `${clientX - this.box.left}px`);
    this.node.style.setProperty("--lg-y", `${clientY - this.box.top}px`);
  }

  hide() {
    if (this.node) delete this.node.dataset.on;
    this.target = null;
  }
}

export class LiquidPressEngine {
  constructor({ root = typeof document !== "undefined" ? document : null } = {}) {
    this.root = root;
    this.highlight = new LiquidHighlight();
    this.active = null;
    this.release = new SpringCurve({ stiffness: 420, damping: 16 }).toEasing();
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  start() {
    if (!this.root || this.started) return this;
    this.started = true;
    this.root.addEventListener("pointerdown", this.onDown, { passive: true, capture: true });
    this.root.addEventListener("pointermove", this.onMove, { passive: true, capture: true });
    this.root.addEventListener("pointerup", this.onUp, { passive: true, capture: true });
    this.root.addEventListener("pointercancel", this.onCancel, { passive: true, capture: true });
    window.addEventListener("scroll", this.onCancel, { passive: true, capture: true });
    return this;
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.root.removeEventListener("pointerdown", this.onDown, { capture: true });
    this.root.removeEventListener("pointermove", this.onMove, { capture: true });
    this.root.removeEventListener("pointerup", this.onUp, { capture: true });
    this.root.removeEventListener("pointercancel", this.onCancel, { capture: true });
    window.removeEventListener("scroll", this.onCancel, { capture: true });
  }

  static reducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }

  /** Nút nào được nhận hiệu ứng, và nhận kiểu gì. */
  resolve(eventTarget) {
    const element = eventTarget?.closest?.(TARGET);
    if (!element || element.closest("[data-lg-off]")) return null;
    const box = element.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return null;
    // Vùng chạm phủ gần hết màn (nền mờ đóng sheet…) không phải "nút" để phồng.
    if (box.width * box.height > window.innerWidth * window.innerHeight * 0.4) return null;
    const small = Math.max(box.width, box.height) <= SMALL_CONTROL_PX;
    // Nút đã tự co bằng `active:scale-*` của Tailwind: chỉ thêm ánh sáng, không co thêm.
    const ownScale = /(^|\s)active:scale-/.test(element.className?.baseVal ?? element.className ?? "");
    return { element, pressedScale: ownScale ? null : small ? 1.08 : 0.97 };
  }

  onDown(event) {
    if (event.button !== 0 || this.active) return;
    const hit = this.resolve(event.target);
    if (!hit) return;
    const { element, pressedScale } = hit;
    this.active = { ...hit, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    const animate = pressedScale && !LiquidPressEngine.reducedMotion();
    this.highlight.show(element, event.clientX, event.clientY, animate ? pressedScale : 1);
    if (animate) {
      element.getAnimations?.().forEach((animation) => animation.id === "lg-press" && animation.cancel());
      const animation = element.animate(
        { scale: ["1", String(pressedScale)] },
        { duration: 220, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)", fill: "forwards" },
      );
      animation.id = "lg-press";
      this.active.animation = animation;
    }
  }

  onMove(event) {
    const active = this.active;
    if (!active || event.pointerId !== active.pointerId) return;
    if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > MOVE_CANCEL_PX) {
      this.finish(false);
      return;
    }
    this.highlight.move(event.clientX, event.clientY);
  }

  onUp(event) {
    if (!this.active || event.pointerId !== this.active.pointerId) return;
    this.finish(true);
  }

  onCancel() {
    if (this.active) this.finish(false);
  }

  /** Thả tay: nảy về bằng lò xo; bị huỷ (cuộn, kéo) thì về êm, không nảy. */
  finish(bounce) {
    const { element, animation } = this.active;
    this.active = null;
    this.highlight.hide();
    if (!animation) return;
    const from = getComputedStyle(element).scale;
    animation.cancel();
    if (!from || from === "none" || from === "1") return;
    const back = element.animate(
      { scale: [from, "1"] },
      bounce ? { duration: this.release.duration, easing: this.release.easing } : { duration: 160, easing: "ease-out" },
    );
    back.id = "lg-press";
  }
}

export const liquidPress = new LiquidPressEngine();
