# CV Hugo Wishpax — ứng tuyển thực tập

Nguồn nội dung và bố cục: [`public/cv/index.html`](../public/cv/index.html). Thanh công cụ đổi ngôn ngữ, xem PDF và tải PDF: [`public/cv/cv.js`](../public/cv/cv.js).

Riêng kỹ năng quản lý tại [`apps/web/src/data/profileSkills.js`](../src/data/profileSkills.js): ba nhóm dùng trong dự án web, đã thực hành theo dự án và công cụ làm việc. Portfolio đọc trực tiếp; lệnh xuất PDF tự đồng bộ vào HTML bằng `scripts/sync-profile-skills.mjs`. Sửa tên, mô tả, công nghệ và dự án liên quan ở một nơi này, không sửa tay các khối `skills:*` trong HTML. Không dùng phần trăm hay mức tự nhận thành thạo, không liệt kê kỹ năng mềm và AI chung chung.

CV tập trung thực tập lập trình web, với học vấn, kỹ năng và bốn dự án tiêu biểu. Các dự án còn lại nằm trên portfolio. Dự án cá nhân và bài tập môn học được ghi đúng loại, không coi là kinh nghiệm làm việc tại công ty.

| Tệp chính | Ngôn ngữ | Bố cục | Yêu cầu |
|---|---|---|---|
| `public/hugo-wishpax-cv.pdf` | Việt | Hai cột | Một trang A4 |
| `public/hugo-wishpax-cv-en.pdf` | Anh | Một cột | Một trang A4 |
| `public/hugo-wishpax-cv-zh.pdf` | Trung | Hai cột | Một trang A4 |

```sh
npm run cv:pdf
npm run check:cv
```

Chạy trước khi build và cập nhật PDF cùng HTML. Các PDF chính được giữ trong repo để liên kết xem/tải hoạt động, không yêu cầu môi trường triển khai cài Chrome. Đặt `CHROME_BIN` nếu đường dẫn Chrome khác mặc định macOS. Kiểm tra PDF cần Poppler (`pdfinfo`, `pdftotext`).

Bản HTML nằm ở `https://portfolio.hugowishpax.studio/cv/index.html`. Nút xem PDF mở trình đọc của trình duyệt, nút tải lưu cùng bản PDF đúng ngôn ngữ.

Chi tiết tách website và nhận xét CV: [portfolio và dịch vụ](tach-portfolio-services.md).
