
/**
 * HugoOS — mở thẳng một màn hình bên trong app.
 *
 * Spotlight muốn nhảy vào "Supporter → Yêu cầu" chứ không chỉ mở Supporter rồi
 * bỏ người dùng ở trang chủ. Truyền qua prop thì phải nối dây qua 15 chỗ gọi
 * trong MemberUtilitiesTab; ở đây dùng đúng cơ chế sự kiện window mà portal vốn
 * đã dùng (`hugo:fullsheet`, `hugo:open-spotlight`).
 *
 * Ý định được giữ lại trong `pending` vì app tải lười: lúc phát sự kiện thì
 * component còn chưa mount, không có ai nghe. App tiêu thụ nó khi mount.
 */
const EVENT = "hugo:app-intent";
let pending = null;

/** Mở app `appId` tại màn hình `destination`. Người gọi tự lo mở app trước. */
export function openDestination(appId, destination) {
  pending = { appId, destination };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: pending }));
}
