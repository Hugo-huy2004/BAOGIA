/**
 * webShareTargetHandler.js
 * Quản lý tiếp nhận hình ảnh chia sẻ trực tiếp từ Thư viện ảnh điện thoại vào PWA.
 */

export const WebShareTargetHandler = {
  initShareListener(onImageReceived) {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Lắng nghe sự kiện truyền File từ Service Worker khi người dùng Share từ Thư viện ảnh
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.action === "SHARED_IMAGE" && event.data.file) {
        console.log("WebShareTargetHandler: Đã tiếp nhận ảnh từ Thư viện hệ điều hành!");
        onImageReceived?.(event.data.file);
      }
    });
  }
};
