// Theo yêu cầu của người dùng: Không khởi tạo bất kỳ phim mẫu nào nữa.
// Toàn bộ dữ liệu phim 100% thật sẽ do Admin thêm trực tiếp từ Bảng Điều Khiển Admin.
export const REAL_FAMOUS_MOVIES = [];

export async function seedMoviesToMongoDB() {
  console.log('[Hugo Cinema] Đã tắt khởi tạo phim mẫu. Admin sẽ tự thêm phim trực tiếp.');
  return 0;
}
