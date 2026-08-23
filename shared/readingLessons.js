/**
 * Bài học qua bằng ĐỌC, không phải bằng trắc nghiệm.
 *
 * Có nội dung không kiểm tra được bằng bốn lựa chọn. "Vì sao mô hình bịa ra thứ
 * nghe thuyết phục" hay "khi nào KHÔNG nên dùng agent" là hiểu biết cần đọc kỹ,
 * và mọi cách đặt câu hỏi trắc nghiệm cho chúng đều biến thành mẹo nhớ từ khoá.
 *
 * Với các bài dưới đây, điều kiện qua bài là đọc đủ số phút tối thiểu của bài
 * viết tương ứng — máy chủ đo thời gian, xem server/models/ReadingSession.js.
 *
 * Khoá là TIÊU ĐỀ bài viết trong kho học liệu (CoderResource), vì học liệu do
 * admin quản lý nên không có id cố định trong mã nguồn.
 */
export const READING_LESSONS = Object.freeze({
  lesson61: "Mô hình ngôn ngữ lớn hoạt động thế nào",
  lesson62: "Kết nối mô hình ngôn ngữ vào ứng dụng web",
  lesson86: "Khai báo công cụ cho mô hình: function calling từng bước",
  lesson87: "Agent là gì, và khi nào bạn không cần agent",
  lesson88: "RAG: cho mô hình trả lời dựa trên dữ liệu của bạn",
});

export const READING_LESSON_IDS = Object.freeze(Object.keys(READING_LESSONS));

export const requiredReadingFor = (lessonId) => READING_LESSONS[lessonId] || null;
