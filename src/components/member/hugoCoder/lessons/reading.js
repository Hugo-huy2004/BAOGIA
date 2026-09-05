// Một đường dẫn chính theo chủ đề cho TỪNG bài. Đây là tài liệu để mở ngay
// khi vấp ở bài hiện tại; danh sách đọc của chặng bên dưới vẫn là phần đào sâu.
// Chỉ dùng tài liệu chính thức hoặc tổ chức chuẩn, không nhét link blog vô danh.
const LESSON_READING_TRACKS = [
  [5, "MDN Learn — HTML, CSS và JavaScript", "Mozilla", "https://developer.mozilla.org/en-US/docs/Learn_web_development", "Đọc đúng nền tảng rồi quay lại tự làm lại bài, không chép đáp án."],
  [8, "MySQL 8.4 Reference Manual", "Oracle", "https://dev.mysql.com/doc/refman/8.4/en/", "Tra cú pháp SQL và transaction bằng tài liệu của chính hệ quản trị."],
  [15, "HTTP Semantics (RFC 9110)", "IETF", "https://www.rfc-editor.org/rfc/rfc9110", "Đối chiếu method và status code với chuẩn giao thức thật."],
  [17, "Web Content Accessibility Guidelines (WCAG)", "W3C", "https://www.w3.org/WAI/standards-guidelines/wcag/", "Kiểm tra tương phản, nhãn và thao tác bàn phím trên giao diện của bạn."],
  [25, "MDN — JavaScript Guide", "Mozilla", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "Dùng ví dụ ngắn để kiểm tra lại logic trước khi chạy code."],
  [30, "JavaScript data structures", "MDN", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections", "So sánh cấu trúc dữ liệu với bài toán thực tế trước khi chọn thuật toán."],
  [35, "Web Crypto API", "MDN", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API", "Dùng API đã được kiểm tra thay vì tự cài thuật toán mật mã."],
  [37, "Asynchronous JavaScript", "MDN", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS", "Chạy từng ví dụ nhỏ để quan sát Promise và event loop hoạt động."],
  [43, "Learn Performance", "web.dev", "https://web.dev/learn/performance", "Đo LCP, INP, CLS trên trang thật thay vì đoán bằng cảm giác."],
  [48, "Progressive web apps", "MDN", "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps", "Áp dụng từng phần: manifest, service worker, rồi mới thử offline."],
  [50, "Vitest Guide", "Vitest", "https://vitest.dev/guide/", "Viết một ca kiểm thử cho hành vi có thể hỏng, không chỉ kiểm tra biến tồn tại."],
  [58, "OWASP Cheat Sheet Series", "OWASP Foundation", "https://cheatsheetseries.owasp.org/", "Chuyển từng rủi ro bảo mật trong bài thành một kiểm soát có thể kiểm chứng."],
  [60, "Learn Performance", "web.dev", "https://web.dev/learn/performance", "Lấy số liệu từ DevTools hoặc dữ liệu thực địa trước khi tối ưu."],
  [64, "Gemini API Documentation", "Google AI", "https://ai.google.dev/gemini-api/docs", "Giữ khoá ở máy chủ, xác thực dữ liệu đầu ra và thử với dữ liệu biên."],
  [66, "Software Engineering Body of Knowledge", "IEEE Computer Society", "https://www.computer.org/education/bodies-of-knowledge/software-engineering", "Dùng yêu cầu và quyết định kiến trúc để giải thích lựa chọn của bạn."],
  [67, "Pro Git", "Git SCM", "https://git-scm.com/book/en/v2", "Thử trên branch riêng và đọc diff trước khi merge hoặc revert."],
  [69, "OpenAPI Specification", "OpenAPI Initiative", "https://spec.openapis.org/oas/latest.html", "Mô tả endpoint, input và lỗi trước khi nối frontend với backend."],
  [73, "Express 5 API", "Express", "https://expressjs.com/en/5x/api.html", "Xác thực ở middleware, lấy danh tính từ token đã kiểm tra và thử cả nhánh lỗi."],
  [82, "React Learn", "React", "https://react.dev/learn", "Chia component theo trách nhiệm, rồi đo lại phần tải trước khi lazy-load."],
  [85, "Using files from web applications", "MDN", "https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications", "Kiểm tra loại, kích thước và xử lý lỗi ở server, không tin metadata từ browser."],
  [88, "Gemini API Documentation", "Google AI", "https://ai.google.dev/gemini-api/docs", "Ràng buộc schema, nhưng vẫn xác thực giá trị trước khi lưu hoặc hiển thị."],
  [90, "Semantic Versioning", "semver.org", "https://semver.org/", "Tag bản phát hành từ commit đã qua kiểm tra và ghi rõ thay đổi cho người dùng."],
  [100, "Nginx Documentation", "F5 NGINX", "https://nginx.org/en/docs/", "Thử cấu hình trong môi trường an toàn, kiểm tra health check rồi mới phát hành."],
];

export function getLessonReading(course) {
  const ownResources = course?.resources || [];
  if (ownResources.length) return ownResources;
  const lessonNumber = Number(String(course?.id || "").replace("lesson", ""));
  const track = LESSON_READING_TRACKS.find(([lastLesson]) => lessonNumber <= lastLesson);
  if (!track) return [];
  const [, title, author, url, note] = track;
  return [{ title, author, url, note }];
}
