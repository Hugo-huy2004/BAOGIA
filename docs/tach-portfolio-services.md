# Portfolio và website dịch vụ

Hai website có entry React và thư mục build riêng, dùng chung dữ liệu dự án và bản dịch.

| Website | Nội dung | Chạy cục bộ | Build | Kết quả |
|---|---|---|---|---|
| `portfolio.hugowishpax.studio` | Giới thiệu, dự án, học vấn, kỹ năng, CV, liên hệ | `npm run dev:portfolio` (3001) | `npm run build:portfolio` | `dist-portfolio/` |
| `www.hugowishpax.studio` | Trang chủ dịch vụ, bảng giá, đặt lịch và portal hiện có | `npm run dev` (3000) | `npm run build` | `dist/` |

Portfolio không khởi động portal, đăng nhập, ví, quảng cáo hoặc service worker của website dịch vụ. Hồ sơ dùng dữ liệu dự phòng có sẵn nên không cần backend để hiển thị. Trang giới thiệu chính là một trang cuộn; chi tiết dự án vẫn có đường dẫn riêng. Học vấn và kỹ năng hiển thị trực tiếp, không nằm trong hoạt cảnh cuộn dài. Kỹ năng chia ba nhóm, có mô tả cách sử dụng và liên kết dự án; nguồn dùng chung với CV là `src/data/profileSkills.js`.

## Triển khai

Website dịch vụ dùng Vercel project **`baogia`** trong team **`hugo-huy2004s-projects`**, kết nối nhánh `main` của repo `BAOGIA` và tự triển khai khi push.

Portfolio dùng project riêng **`hugo-portfolio`**, với tên miền `portfolio.hugowishpax.studio`. Từ gốc repo:

```sh
npm run deploy:portfolio
```

Lệnh kiểm tra CV, build portfolio, kiểm tra SEO, rồi tải **chỉ bản website đã build** lên project portfolio. Cấu hình redirects, rewrites và headers lấy từ `deploy/portfolio.vercel.json`; API và file môi trường của website dịch vụ không được gửi lên project portfolio. Cần Vercel CLI đã đăng nhập đúng team. Khi sửa CV, vẫn phải xuất PDF trước khi triển khai.

DNS nằm ở Cloudflare: CNAME `portfolio` trỏ đến đích được Vercel đề xuất (`cname.vercel-dns.com` cũng được chấp nhận), chế độ DNS only. `www` giữ cấu hình hiện có.

Website dịch vụ chuyển `/introduction`, `/en/introduction`, `/zh/introduction` sang portfolio; `/services` và hai bản ngôn ngữ chuyển về trang chủ tương ứng. Đường dẫn chi tiết dịch vụ giữ nguyên. Cả hai website có sitemap và canonical riêng.

Project portfolio và tên miền đã được tạo trên Vercel. Việc cập nhật DNS cần quyền Cloudflare hoặc chủ tài khoản thêm CNAME.

## CV và nhận xét

CV tập trung thực tập: sửa tiêu đề và phần giới thiệu, bỏ lời nhận freelance và mục tiêu junior khỏi CV. Chọn bốn dự án đại diện: Hugo Studio, Chánh Tòa Mỹ Tho, M-Hike và Mình Ơi Media. HWJ và L3GO vẫn có trên portfolio. Không bổ sung số liệu hay kinh nghiệm chưa xác minh.

Bốn dự án thể hiện sản phẩm cá nhân, người dùng thật, bài tập môn học và khách hàng. Đây là nội dung phù hợp để trình bày trong CV thực tập nếu bạn giải thích được mã nguồn, vai trò và những quyết định của mình. Danh sách công nghệ còn rộng; khi nộp từng vị trí, nên ưu tiên kỹ năng bạn có thể trao đổi sâu trong phỏng vấn.

CV giữ tên hiển thị Hugo Wishpax. Khi nộp hồ sơ, nên dùng tên bạn muốn nhà tuyển dụng đối chiếu với hồ sơ sinh viên và giấy tờ.

Nguồn và lệnh xuất: [CV](cv-noi-dung.md).
