# Portfolio và website dịch vụ

Hai website có entry React và thư mục build riêng, dùng chung dữ liệu dự án và bản dịch.

| Website | Nội dung | Chạy cục bộ | Build | Kết quả |
|---|---|---|---|---|
| `portfolio.hugowishpax.studio` | Giới thiệu, dự án, học vấn, kỹ năng, CV, liên hệ | `npm run dev:portfolio` (3001) | `npm run build:portfolio` | `dist-portfolio/` |
| `www.hugowishpax.studio` | Trang chủ dịch vụ, bảng giá, đặt lịch và portal hiện có | `npm run dev` (3000) | `npm run build` | `dist/` |

Portfolio không khởi động portal, đăng nhập, ví, quảng cáo hoặc service worker của website dịch vụ. Hồ sơ dùng dữ liệu dự phòng có sẵn nên không cần backend để hiển thị. Trang giới thiệu chính là một trang cuộn; chi tiết dự án vẫn có đường dẫn riêng. Học vấn và kỹ năng hiển thị trực tiếp, không nằm trong hoạt cảnh cuộn dài. Kỹ năng chia ba nhóm, có mô tả cách sử dụng và liên kết dự án; nguồn dùng chung với CV là `src/data/profileSkills.js`.

## Triển khai

Giữ Vercel project hiện tại cho `www`, dùng `vercel.json`. Tạo một Vercel project riêng cho portfolio. Từ gốc repo, triển khai bằng CLI với cấu hình riêng:

```sh
vercel --local-config deploy/portfolio.vercel.json
```

Chọn **project portfolio**, không chọn project dịch vụ. Cấu hình đặt build command và output directory riêng. Gắn `portfolio.hugowishpax.studio` vào project portfolio và cập nhật DNS theo giá trị Vercel cung cấp. Với CI, dùng project ID của portfolio và cùng `--local-config`; chỉ đổi build command trong dashboard chưa đủ vì phải áp dụng redirects, rewrites và headers riêng.

Website dịch vụ chuyển `/introduction`, `/en/introduction`, `/zh/introduction` sang portfolio; `/services` và hai bản ngôn ngữ chuyển về trang chủ tương ứng. Đường dẫn chi tiết dịch vụ giữ nguyên. Cả hai website có sitemap và canonical riêng.

Thay đổi trong repo chưa tự tạo Vercel project hoặc đổi DNS.

## CV và nhận xét

CV tập trung thực tập: sửa tiêu đề và phần giới thiệu, bỏ lời nhận freelance và mục tiêu junior khỏi CV. Chọn bốn dự án đại diện: Hugo Studio, Chánh Tòa Mỹ Tho, M-Hike và Mình Ơi Media. HWJ và L3GO vẫn có trên portfolio. Không bổ sung số liệu hay kinh nghiệm chưa xác minh.

Bốn dự án thể hiện sản phẩm cá nhân, người dùng thật, bài tập môn học và khách hàng. Đây là nội dung phù hợp để trình bày trong CV thực tập nếu bạn giải thích được mã nguồn, vai trò và những quyết định của mình. Danh sách công nghệ còn rộng; khi nộp từng vị trí, nên ưu tiên kỹ năng bạn có thể trao đổi sâu trong phỏng vấn.

CV giữ tên hiển thị Hugo Wishpax. Khi nộp hồ sơ, nên dùng tên bạn muốn nhà tuyển dụng đối chiếu với hồ sơ sinh viên và giấy tờ.

Nguồn và lệnh xuất: [CV](cv-noi-dung.md).
