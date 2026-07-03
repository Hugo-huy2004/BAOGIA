import "@testing-library/jest-dom/vitest";

if (!window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = function scrollTo({ top } = {}) {
    if (typeof top === "number") this.scrollTop = top;
  };
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => window.setTimeout(cb, 0);
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
}
