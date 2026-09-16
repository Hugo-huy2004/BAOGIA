# Nội dung CV — Lê Gia Huy

Nguồn duy nhất của tờ CV là [`public/cv/index.html`](../public/cv/index.html). Tệp này chép lại **nội
dung đang in ra**, để sửa chữ thì đọc ở đây, sửa dàn trang thì sửa HTML.

```bash
npm run cv:pdf        # xuất cả ba bản dưới
```

| Tệp | Dùng khi nào | Số trang |
|---|---|---|
| `public/cv-le-gia-huy.pdf` | Bản chính, tiếng Việt, gửi cho người đọc | 1 |
| `public/cv-le-gia-huy-en.pdf` | Bản tiếng Anh | 1 |
| `public/cv-le-gia-huy-ats.pdf` | **Một cột**, dùng để upload vào form tuyển dụng | 2 |

> Vì sao cần bản ATS: máy đọc PDF quét theo dòng ngang, nên bản hai cột bị trộn
> nửa dòng sidebar với nửa dòng dự án. `?layout=ats` bỏ cột và bỏ nền — xấu hơn
> với người, đọc đúng thứ tự với máy. Bản này dài hai trang là bình thường: máy
> không quan tâm số trang, người mới quan tâm.

**Chưa có trong cả ba bản: số điện thoại.** Cố ý, vì `cv-le-gia-huy.pdf` được
phục vụ công khai trên web. Khi gửi thẳng cho một công ty (nhất là công ty Việt
Nam — họ gọi điện), thêm một dòng SĐT vào `.contact` rồi xuất một tệp riêng,
đừng ghi đè bản công khai.

## Hai luật giữ tờ CV vừa một trang

1. **Cột trái và cột phải cao bằng nhau** (grid stretch), nên trang cao bằng cột
   CAO HƠN. Rút bớt phần dự án mà không rút cột trái thì chiều cao không đổi.
   Ngưỡng: 279mm cho vùng in A4 với lề 9mm.
2. **Đừng đặt `break-inside: avoid` cho cả mục `.main-section`.** Mục dự án nay
   có sáu khối; ép nguyên mục nằm gọn một trang thì nó nhảy hẳn sang trang sau và
   để trang đầu trống nửa dưới. Chống cắt ở từng `.project` là đủ.

Đo nhanh trước khi xuất PDF: mở `public/cv/index.html?lang=vi` ở bề rộng 718px
(đúng bề rộng vùng in), bật print media, đọc `.page` scrollHeight.

---

## Header

**LÊ GIA HUY** · Thiết kế sản phẩm & lập trình web toàn phần
Ứng tuyển thực tập · Product & UI/UX Design

contact@hugowishpax.studio · github.com/Hugo-huy2004 · www.hugowishpax.studio/introduction

Ba con số: **6** dự án đã hoàn thành · **4** đang chạy với người dùng thật · **B2** tiếng Anh VSTEP

> Con số cũ là "4 website đang chạy thật / 12 app có URL công khai". Bỏ đếm app
> và game: con số đó đổi theo tháng, viết vào là sai ngay lần ra mắt sau. Sáu dự
> án thì đếm được và bấm vào kiểm chứng được từng cái.
>
> **Không còn logo giọt nước ở đầu trang.** Trên một tờ CV, dấu hiệu thương hiệu
> cá nhân làm người đọc phải đoán, trong khi chỗ đó nên dành cho tên.

## Hồ sơ

Sinh viên CNTT Greenwich Việt Nam. **Sáu dự án đã bàn giao**: vẽ giao diện trên
Figma, dựng thành React rồi tự đưa lên chạy thật. Mạnh nhất ở phần **giao diện** —
bố cục, nhịp chữ, luồng thao tác, responsive; viết được cả phía máy chủ (Node.js,
MongoDB, Firebase) nên thiết kế ra là dựng được, không phải bản vẽ treo đó.
**Đang tìm vị trí thực tập Product/UI/UX Design.**

> Bản trước viết theo lối cảm xúc ("khoảnh khắc người dùng khựng lại…") — đọc hay
> nhưng không nói được mình làm gì bằng công cụ gì. CV không phải chỗ để gợi mở.

## Kỹ năng

- **Product & UI/UX** — Figma · User Flow · Wireframe · Prototype · Responsive · Design System
- **Lập trình** — React · Next.js · TypeScript · React Native · Node.js · MongoDB · Firebase · Tailwind · PWA · Git
- **Vận hành** — Triển khai · Đọc log & xử lý sự cố · Tối ưu hiệu năng · SEO kỹ thuật · Review code
- Nền từ trường: C#, Python, PHP, MySQL, Express, WebSocket. Triển khai trên Vercel, Render, Cloudflare, Netlify.

## Ngôn ngữ

Tiếng Anh — VSTEP B2 (bậc 4, 2024), đọc hiểu tài liệu kỹ thuật.

## Học vấn & hoạt động

- **Greenwich Việt Nam** (2022–2027) — Công nghệ Thông tin, liên kết University of
  Greenwich (UK) và Đại học FPT, dự kiến tốt nghiệp 10/2027.
- **Huynh trưởng – Giáo lý viên cấp 2** — hướng dẫn hoạt động thiếu nhi, nói trước
  đám đông và quản lý nhóm.

## Dự án — sáu khối, cùng một khuôn

Mỗi dự án đúng **hai gạch đầu dòng**, không hơn. Bản cũ dành năm gạch cho Hugo
Studio và mỗi dự án còn lại một dòng; đọc ra thành "một dự án thật và vài thứ
lặt vặt", trong khi các dự án nặng ngang nhau.

| Dự án | Mốc | Vai trò | Địa chỉ |
|---|---|---|---|
| Hugo Studio — Hệ sinh thái công cụ số | 04/2026 – nay | Thiết kế & lập trình toàn phần · Vận hành | hugowishpax.studio |
| Xứ Đoàn Chánh Tòa Mỹ Tho — Cổng thông tin giáo xứ | 08/2026 – nay | Thiết kế & lập trình toàn phần | chanhtoa.tnttgiaophanmytho.online |
| M-Hike — Ứng dụng đi bộ đường dài (iOS & Android) | 06–09/2026 | Thiết kế & lập trình toàn phần | github.com/Hugo-huy2004/Hiking_App |
| HWJ — Nền tảng trang sức cao cấp | 01–04/2026 | Thiết kế & lập trình toàn phần | hwj-demo.hugowishpax.studio |
| Mình Ơi Media — Website studio phóng sự cưới | 03–04/2026 | Thiết kế & lập trình toàn phần | minhoimedia.digital |
| L3GO Coffee — Website quán cà phê | 2026 | Thiết kế UI/UX (cùng Jason Phan) | legocoffee.hwagfu.dev |

Nội dung từng gạch đầu dòng đọc thẳng trong `public/cv/index.html`; chúng bám sát
phần chữ ở `src/data/projects.js` và `projectsPage.items.*` trong i18n, nên sửa
mô tả dự án ở trang /project thì ngó lại tờ CV.
