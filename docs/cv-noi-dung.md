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
| `public/cv-le-gia-huy-ats.pdf` | **Một cột** tiếng Việt, upload vào form tuyển dụng | 2 |
| `public/cv-le-gia-huy-ats-en.pdf` | **Một cột** tiếng Anh, cho hệ thống lọc nước ngoài | 2 |

Nút ngôn ngữ trên thanh công cụ xoay vòng vi → en → zh → vi (`public/cv/cv.js`).
Bản tiếng Trung nặng ~1 MB vì PDF phải nhúng bộ chữ vuông; hai bản kia ~0.4 MB.

> Vì sao cần bản ATS: máy đọc PDF quét theo dòng ngang, nên bản hai cột bị trộn
> nửa dòng sidebar với nửa dòng dự án. `?layout=ats` bỏ cột và bỏ nền — xấu hơn
> với người, đọc đúng thứ tự với máy. Bản này dài hai trang là bình thường: máy
> không quan tâm số trang, người mới quan tâm.

```bash
npm run check:cv      # soát hai bản ATS bằng chính cách máy đọc chúng
```

### Ba bẫy ATS đã vá

1. **`letter-spacing` làm vỡ từ.** Nhãn mục giãn chữ cho đẹp, nhưng trình rút
   chữ chèn dấu cách giữa các con chữ: "EDUCATION" ra thành `E D U C AT I O N`
   và hệ thống lọc mất luôn nhãn mục đó. Bản ATS bỏ giãn chữ.
2. **Dấu đầu dòng vẽ bằng CSS không tồn tại với máy.** `li::before` là hình
   tròn định vị tuyệt đối — rút chữ ra chỉ còn một khối lùi lề không dấu. Bản
   ATS thay bằng ký tự `- ` thật nằm trong luồng chữ.
3. **Nhãn liên kết rút gọn làm mất địa chỉ.** Rút "github.com/…/HWJ_demo" còn
   chữ "GitHub" thì bản cho người đọc gọn hơn, nhưng máy đọc chữ chứ không đọc
   `href` — địa chỉ biến mất khỏi hồ sơ. Bản ATS in kèm địa chỉ đầy đủ
   (`span.ats-only`).

**Chưa có trong cả ba bản: số điện thoại.** Cố ý, vì `cv-le-gia-huy.pdf` được
phục vụ công khai trên web. Khi gửi thẳng cho một công ty (nhất là công ty Việt
Nam — họ gọi điện), thêm một dòng SĐT vào `.contact` rồi xuất một tệp riêng,
đừng ghi đè bản công khai.

## Kỷ luật cắt

Tiêu chuẩn giữ lại: **không nói hai lần**. Những thứ đã cắt và lý do:

| Đã bỏ | Vì sao |
|---|---|
| Dãy "6 dự án · 4 đang chạy thật" ở đầu trang | Đếm lại đúng thứ mục Dự án bày ra ngay bên dưới. Con số tự quảng cáo làm người đọc nghi; sáu khối dự án thì không. |
| Dòng nhỏ phía trên tên | Nói cùng chuyện với dòng chức danh dưới tên. Gộp làm một. |
| Hai dòng ghi chú nghiêng ở mục Kỹ năng | Hứa những điều mà sáu dự án đã chứng minh xong. |
| Gạch "phối hợp nhóm với ranh giới trách nhiệm rõ ràng" | Ai cũng viết được câu đó mà không cần làm gì. |
| URL repo dài 46 ký tự | Rút còn "GitHub" — liên kết vẫn bấm được, chữ không còn chiếm chỗ. |
| Dòng hoạt động ngoại khoá | Thứ yếu nhất trên một hồ sơ kỹ thuật. Cắt theo đúng kỷ luật; muốn giữ thì thêm lại một dòng. |
| Câu "đang tìm thực tập" trong phần Hồ sơ | Đã nằm ngay dưới tên. |

Chỗ dôi ra **không nhồi thêm chữ** mà trả cho khoảng thở giữa các mục — đó mới
là thứ làm tờ giấy trông đắt.

## Dàn đều xuống hết trang, không để trống chân

Hai cột trước đây dồn hết lên đầu rồi bỏ trống 26–40mm cuối trang. Nay `.layout`
chốt `min-height: 252mm` (phần còn lại của khổ A4 sau đầu trang) và cả hai cột
dùng `justify-content: space-between`, nên nội dung tự giãn kín trang — bản tiếng
Trung ngắn hơn thì khe giữa các dự án tự rộng ra (6.1mm so với 3.6mm ở bản Việt),
không phải chỉnh tay cho từng ngôn ngữ.

Giãn **khe giữa các khối**, không giãn ruột từng khối: kéo giãn bên trong làm mỗi
dự án cao thấp khác nhau, đọc ra là lệch.

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

Tên viết theo lối của từng ngôn ngữ:

| Bản | Tên in ra |
|---|---|
| vi | Lê Gia Huy |
| en | Gia Huy, Le |
| zh | 黎家辉 (Lê Gia Huy) — *家* là chữ "gia" trong gia đình |

Bản tiếng Trung giữ kèm tên gốc trong ngoặc để nhà tuyển dụng đối chiếu được với
hộ chiếu, bằng cấp và các hồ sơ khác.

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

Định hướng phát triển thành Kỹ sư Phần mềm Full-stack chuyên sâu, làm chủ quy trình kiến tạo sản phẩm số hoàn chỉnh: từ giao diện tối ưu trải nghiệm đến kiến trúc backend và hạ tầng đám mây tin cậy. Tìm kiếm cơ hội thực tập để giải quyết bài toán kỹ thuật thực tế và đóng góp lâu dài cho đội ngũ.

> Bản trước viết theo lối cảm xúc ("khoảnh khắc người dùng khựng lại…") — đọc hay
> nhưng không nói được mình làm gì bằng công cụ gì. CV không phải chỗ để gợi mở.

## Kỹ năng — xếp theo tầng kỹ thuật

- **Ngôn ngữ** — JavaScript · TypeScript · Java · Python · HTML/CSS · SQL
- **Frontend** — React · Next.js · React Native (Expo) · Tailwind CSS · PWA · Capacitor
  (ghi chú in kèm: *responsive, chế độ tối, đa ngôn ngữ VI/EN/ZH; dựng giao diện thẳng trong trình duyệt*)
- **Backend & dữ liệu** — Node.js · Express · REST API · WebSocket · MongoDB · Firebase/Firestore · SQLite
- **DevOps & tích hợp** — Git · Vercel · Render · Cloudflare · Netlify · Google OAuth · Cloudinary · Facebook Graph API
  (ghi chú in kèm: *tự triển khai và vận hành sáu dự án trên production*)
- **Kỹ năng mềm** — Lãnh đạo & quản lý nhóm · Thuyết trình & truyền đạt · Tổ chức & điều phối · Đào tạo & cố vấn · Giải quyết vấn đề
  (minh chứng qua 7 năm Huynh trưởng - Giáo lý viên Cấp 2 thuộc Ban Điều Hành Xứ đoàn Chánh Tòa Mỹ Tho và điều phối dự án kỹ thuật)

> Bản trước trộn chữ nghề thiết kế ("phân cấp thị giác", "nhịp chữ") với tên
> công nghệ, nên người sàng hồ sơ kỹ thuật không tìm ra thứ cần trong ba giây.
> Quy tắc giữ lại: **chỉ liệt kê thứ có dấu vết thật trong sáu dự án của tờ CV
> này** — không có dự án nào chứng minh được thì không ghi.

## Học vấn (kèm mục Hoạt động & Ngôn ngữ)

- **Greenwich Việt Nam** (2023–2027) — Công nghệ Thông tin, University of Greenwich (UK) - Hồ Chí Minh Campus, dự kiến tốt nghiệp 08/2027. GPA tích lũy quá trình học tập hiện tại 3.6/4.0.
- **[Huynh trưởng · Cấp 2](https://chanhtoa.tnttgiaophanmytho.online/gioi-thieu/xu-doan?bio=bdh-le-gia-huy)** (2018–2025) — Giáo phận Mỹ Tho · Ban Điều Hành · 7 năm lãnh đạo, tổ chức sự kiện và huấn luyện thiếu nhi.
- **Tiếng Anh** — VSTEP B2 (Bậc 4, 2024 · đọc hiểu tài liệu kỹ thuật).

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
