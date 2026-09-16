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
| `public/cv-le-gia-huy-zh.pdf` | Bản tiếng Trung | 1 |
| `public/cv-le-gia-huy-ats.pdf` | **Một cột**, dùng để upload vào form tuyển dụng | 2 |

Nút ngôn ngữ trên thanh công cụ xoay vòng vi → en → zh → vi (`public/cv/cv.js`).
Bản tiếng Trung nặng ~1 MB vì PDF phải nhúng bộ chữ vuông; hai bản kia ~0.4 MB.

> Vì sao cần bản ATS: máy đọc PDF quét theo dòng ngang, nên bản hai cột bị trộn
> nửa dòng sidebar với nửa dòng dự án. `?layout=ats` bỏ cột và bỏ nền — xấu hơn
> với người, đọc đúng thứ tự với máy. Bản này dài hai trang là bình thường: máy
> không quan tâm số trang, người mới quan tâm.

**Chưa có trong cả ba bản: số điện thoại.** Cố ý, vì `cv-le-gia-huy.pdf` được
phục vụ công khai trên web. Khi gửi thẳng cho một công ty (nhất là công ty Việt
Nam — họ gọi điện), thêm một dòng SĐT vào `.contact` rồi xuất một tệp riêng,
đừng ghi đè bản công khai.

## Bố cục: ít hộp, nhiều khoảng trắng

Bản trước có **chín khung viền** trên một trang A4 (ba thẻ cột trái, sáu thẻ dự
án) và **hai mươi hai viên chip kỹ năng**. Mắt người đọc phải mở–đóng chín lần
rồi nhặt hai mươi hai vật thể rời — đó là cảm giác "rối". Nay:

- Không còn khung: mỗi mục phân tách bằng một nét kẻ mảnh dưới nhãn và khoảng trắng.
- Chip kỹ năng thành **một dòng chữ** nối bằng dấu chấm giữa — cùng chừng ấy chữ, đọc một hơi là hết.
- Chỗ tiết kiệm được trả lại cho **cỡ chữ**: gạch đầu dòng dự án từ 7.95pt lên **10.1pt**, phần hồ sơ từ 8.5 lên **10.1pt**. Bản tiếng Trung nhích thêm một nấc nữa vì chữ vuông gói cùng nội dung vào ít chỗ hơn.

## Trục nội dung: năng lực, không phải tính năng

Mỗi gạch đầu dòng mở đầu bằng một **động từ nghề** — thiết kế, lập trình, tích
hợp, triển khai, tối ưu, bảo mật, phối hợp — rồi tới công nghệ và phạm vi. Bản
trước tả tính năng sản phẩm ("thực đơn lọc theo tâm trạng", "không một nút mua
ngay"); đó là chữ của trang bán hàng, còn nhà tuyển dụng đọc CV để tìm năng lực.

Dấu gạch trong toàn bộ tờ CV dùng "-", không dùng gạch dài (— hay –).

## Độ dài câu chữ

Mỗi gạch đầu dòng **một ý, ≤20 từ**. Bản trước dài 25–48 từ vì giọng kể chuyện
của trang `/project` lọt sang: ở đó kể lý do và hậu trường là đúng, trên tờ CV
thì người đọc quét chứ không đọc. Phần hồ sơ giữ ~40 từ.

Muốn biết có đang phình ra không thì đếm: mở CV trong trình duyệt, đếm số từ của
mỗi `.project li`. Trên 20 từ là phải cắt.

## Ba luật giữ tờ CV vừa một trang

1. **Cột trái và cột phải cao bằng nhau** (grid stretch), nên trang cao bằng cột
   CAO HƠN. Rút bớt phần dự án mà không rút cột trái thì chiều cao không đổi.
   Ngưỡng: 279mm cho vùng in A4 với lề 9mm.
2. **Đừng đặt `break-inside: avoid` cho cả mục `.main-section`.** Mục dự án nay
   có sáu khối; ép nguyên mục nằm gọn một trang thì nó nhảy hẳn sang trang sau và
   để trang đầu trống nửa dưới. Chống cắt ở từng `.project` là đủ.

3. **Thẻ một dòng thì đừng cho nó một khung riêng.** Mục "Ngôn ngữ" trước đây
   là một thẻ riêng chỉ chứa đúng một dòng, nhưng vẫn ăn trọn viền và khoảng
   cách như ba thẻ kia — gộp vào thẻ học vấn tiết kiệm ~6mm ở cả ba bản.

Đo nhanh trước khi xuất PDF: mở `public/cv/index.html?lang=vi` ở bề rộng 718px
(đúng bề rộng vùng in), bật print media, đọc `.page` scrollHeight.

---

## Header

**LÊ GIA HUY** · Thiết kế sản phẩm & lập trình web toàn phần
Ứng tuyển thực tập · Công nghệ Thông tin

contact@hugowishpax.studio · github.com/Hugo-huy2004 · www.hugowishpax.studio/introduction

Ba con số: **6** dự án đã hoàn thành · **4** đang chạy với người dùng thật · **B2** tiếng Anh VSTEP

> Con số cũ là "4 website đang chạy thật / 12 app có URL công khai". Bỏ đếm app
> và game: con số đó đổi theo tháng, viết vào là sai ngay lần ra mắt sau. Sáu dự
> án thì đếm được và bấm vào kiểm chứng được từng cái.
>
> **Không còn logo giọt nước ở đầu trang.** Trên một tờ CV, dấu hiệu thương hiệu
> cá nhân làm người đọc phải đoán, trong khi chỗ đó nên dành cho tên.

## Hồ sơ

Sinh viên CNTT Greenwich Việt Nam. Mình dựng giao diện thẳng trong trình duyệt
bằng React và Tailwind, rồi tự đưa lên chạy thật. Mạnh nhất ở phần **giao diện** —
bố cục, nhịp chữ, luồng thao tác, responsive; viết được cả phía máy chủ (Node.js,
MongoDB, Firebase) nên thiết kế ra là dựng được, không phải bản vẽ treo đó.
**Đang tìm vị trí thực tập Công nghệ Thông tin.**

> Bản trước viết theo lối cảm xúc ("khoảnh khắc người dùng khựng lại…") — đọc hay
> nhưng không nói được mình làm gì bằng công cụ gì. CV không phải chỗ để gợi mở.

## Kỹ năng

- **Thiết kế giao diện** — Bố cục · Phân cấp thị giác · Nhịp chữ · Hệ màu & token · Responsive · Chế độ tối · Đa ngôn ngữ
  (ghi chú in kèm: *dựng thẳng trong trình duyệt bằng React + Tailwind rồi chỉnh trên bản chạy thật — không qua Figma*)
- **Lập trình** — React · Next.js · TypeScript · React Native · Node.js · MongoDB · Firebase · Tailwind · PWA · Git
- **Vận hành** — Triển khai · Đọc log & xử lý sự cố · Tối ưu hiệu năng · SEO kỹ thuật · Review code
- Nền từ trường: Python · Express · WebSocket · SQLite · triển khai trên Vercel, Render, Cloudflare, Netlify.

> Bản trước ghi Figma, User Flow, Wireframe, Prototype, Design System cùng C#,
> PHP, MySQL. Chủ hồ sơ xác nhận không dùng bộ công cụ thiết kế đó, và ba ngôn
> ngữ kia không để lại dấu vết nào trong repo — CV ghi thứ mình không dùng thì
> hỏng ngay ở câu hỏi đầu tiên của vòng phỏng vấn.

## Học vấn & hoạt động (kèm mục Ngôn ngữ)

- **Greenwich Việt Nam** (2022–2027) — Công nghệ Thông tin, liên kết University of
  Greenwich (UK) và Đại học FPT, dự kiến tốt nghiệp 10/2027.
- **[Huynh trưởng – Giáo lý viên cấp 2](https://chanhtoa.tnttgiaophanmytho.online/gioi-thieu/xu-doan?bio=bdh-le-gia-huy)** — hướng dẫn hoạt động thiếu nhi, nói trước
  đám đông và quản lý nhóm.

## Dự án — sáu khối, cùng một khuôn

Mỗi dự án đúng **hai gạch đầu dòng**, không hơn, và **hai đường dẫn**: bản chạy
được (Demo) và mã nguồn (Mã nguồn). Hugo Studio và L3GO hiện chỉ có đường dẫn
demo — repo của Hugo Studio còn chờ dọn lịch sử git, L3GO chưa có địa chỉ. Bản cũ dành năm gạch cho Hugo
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
