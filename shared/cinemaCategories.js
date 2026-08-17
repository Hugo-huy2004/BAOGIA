/**
 * Thể loại phim Hugo Cinema — MỘT danh sách duy nhất.
 *
 * Trước đây danh sách này tồn tại ba bản (routes/cinemaRoutes.js,
 * cinemaCatalog.js và phần fallback trong CinemaService), và ba bản đã lệch
 * nhau: chip "Võ Thuật & Hành Động" ở server không có phim nào, còn "Kinh Điển
 * Công Cộng" ở client lại không khớp id nào server trả về. Sync phim ghi
 * `category` theo file này, client vẽ chip theo file này.
 *
 * Nhãn hiển thị không nằm ở đây: client dịch bằng khoá i18n `cinema.cat.<id>`
 * cho đủ 9 ngôn ngữ.
 */
// Thứ tự ở đây là thứ tự các hàng trên màn hình. "shorts" (phim mở 3D của
// Blender Studio) đứng đầu vì đó là phần nét nhất và màu nhất của kệ — phần
// còn lại là phim nhựa quét lại, đẹp nhất cũng chỉ tới 720p.
export const CINEMA_CATEGORIES = [
  { id: "all", icon: "movie" },
  { id: "shorts", icon: "view_in_ar" },
  { id: "classic", icon: "theaters" },
  { id: "scifi", icon: "rocket_launch" },
  { id: "horror", icon: "dark_mode" },
  { id: "cartoon", icon: "animation" },
  { id: "doc", icon: "public" },
];

export const CINEMA_CATEGORY_IDS = CINEMA_CATEGORIES.map((c) => c.id);
