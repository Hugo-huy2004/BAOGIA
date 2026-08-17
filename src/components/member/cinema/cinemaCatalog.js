// Thể loại phim hệ thống
export const CINEMA_CATEGORIES = [
  { id: "all", labelKey: "cinema.catAll", labelVi: "Tất cả Phim" },
  { id: "shorts", labelKey: "cinema.catShorts", labelVi: "Phim Ngắn 3D" },
  { id: "scifi", labelKey: "cinema.catSciFi", labelVi: "Khoa Học Viễn Tưởng" },
  { id: "classic", labelKey: "cinema.catClassic", labelVi: "Kinh Điển Công Cộng" },
  { id: "horror", labelKey: "cinema.catHorror", labelVi: "Kinh Dị Nổi Tiếng" },
  { id: "doc", labelKey: "cinema.catDoc", labelVi: "Tài Liệu & Vũ Trụ" },
];

// Toàn bộ dữ liệu phim giả / phim mẫu đã được xóa 100%.
// Admin sẽ trực tiếp thêm các bộ phim chính thức từ Admin Panel.
export const CINEMA_MOVIES = [];

export function getMovieById(id) {
  return CINEMA_MOVIES.find((m) => m.id === id) || null;
}

export function getFeaturedMovie() {
  return null;
}

export function filterMovies({ category = "all", search = "", limit = 50 }) {
  return [];
}
