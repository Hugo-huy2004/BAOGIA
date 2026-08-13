# Tuân thủ pháp lý — việc còn lại

Rà soát ngày 13/08/2026. Phần sửa được bằng code đã làm xong (xem cuối file).
Đây là những việc **không** sửa bằng code được: cần bạn nộp hồ sơ, ký giấy tờ,
hoặc quyết định về mặt kinh doanh.

---

## 1. Thông báo website thương mại điện tử với Bộ Công Thương

**Vì sao:** Trang Dịch vụ, Bảng giá học sinh, Hugo Store và các gói JOY có niêm
yết giá kèm thanh toán PayOS → website thương mại điện tử bán hàng theo Nghị
định 52/2013/NĐ-CP (sửa đổi bởi Nghị định 85/2021/NĐ-CP). Chưa thông báo bị phạt
10–20 triệu đồng theo Nghị định 98/2020/NĐ-CP.

**Làm gì:**
- Đăng ký tài khoản tại online.gov.vn, nộp hồ sơ thông báo website bán hàng.
- Gắn logo "Đã thông báo Bộ Công Thương" ở chân trang, trỏ về trang hồ sơ.
- Bổ sung ở chân trang hoặc trang Liên hệ: tên chủ sở hữu, địa chỉ, số điện
  thoại, email, mã số thuế hoặc số ĐKKD.
- Hồ sơ cần chủ thể kinh doanh hợp lệ (hộ kinh doanh hoặc doanh nghiệp). Nếu
  đang nhận tiền dịch vụ dưới danh nghĩa cá nhân, xem mục 4.

## 2. Hồ sơ theo Luật Bảo vệ dữ liệu cá nhân 2025 và Nghị định 356/2025/NĐ-CP

**Vì sao:** Hệ thống xử lý dữ liệu cá nhân nhạy cảm — sức khoẻ tinh thần
(HugoPSY, PHQ-9/GAD-7), giấc ngủ, chỉ số sinh hiệu IoT và vị trí — đồng thời
chuyển một số dữ liệu ra nước ngoài.

**Làm gì:**
- Lập **Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân**, gửi cơ quan chuyên
  trách bảo vệ dữ liệu cá nhân trong 60 ngày kể từ ngày đầu tiên xử lý.
- Lập **Hồ sơ đánh giá tác động chuyển dữ liệu cá nhân ra nước ngoài** cho:
  Google (Gemini, đăng nhập), MongoDB Atlas, Cloudinary, Pinecone, SendGrid,
  Render, Vercel, Cloudflare.
- Chỉ định đầu mối/nhân sự phụ trách bảo vệ dữ liệu cá nhân đáp ứng điều kiện
  áp dụng và ghi thông tin liên hệ trong Chính sách bảo mật.
- Lưu nhật ký các yêu cầu xoá dữ liệu và thời điểm xử lý.

> Nghị định 356/2025/NĐ-CP đã thay thế Nghị định 13/2023/NĐ-CP từ 01/01/2026.
> Phần *thông báo* cho người dùng đã làm xong trong code: Chính sách bảo mật có
> mục "Dữ liệu nhạy cảm và việc chuyển ra nước ngoài", bảng bên thứ ba đã đủ.
> Cái còn thiếu là **hồ sơ nộp cho cơ quan nhà nước**.

## 3. Xác nhận của cha mẹ với thành viên 14–15 tuổi

**Đã làm phần kỹ thuật:** khai ngày sinh dưới 16 tuổi thì onboarding bắt buộc
tick xác nhận đã có sự đồng ý của cha mẹ/người giám hộ, lưu ở `guardianConsentAt`.

**Cần bạn quyết:**
- Tick trong ứng dụng là mức tối thiểu, không phải xác minh thật. Nếu muốn chắc
  chắn hơn thì cách gọn nhất là **nâng tuổi tối thiểu lên 16** (`MEMBER_MIN_AGE`
  trong `server/utils/memberAge.js`) — bỏ luôn nghĩa vụ này.
- Với tài khoản 14–15 tuổi **đã đăng ký trước đây**: hệ thống sẽ hỏi xác nhận ở
  lần đăng nhập kế tiếp. Nếu muốn xử lý chủ động hơn thì gửi email thông báo.

## 4. Tư cách kinh doanh và thuế

**Vì sao:** Đang nhận tiền dịch vụ và tiền ủng hộ qua PayOS. PayOS yêu cầu chủ
thể kinh doanh hợp lệ; doanh thu trên 100 triệu/năm phải đăng ký và nộp thuế.

**Làm gì:** xác nhận tài khoản PayOS đang đứng tên ai; nếu là cá nhân thì cân
nhắc đăng ký hộ kinh doanh (cũng là điều kiện cho mục 1). Trao đổi với kế toán
về thuế GTGT/TNCN cho phần doanh thu dịch vụ.

## 5. HugoTeam — quan hệ lao động

**Vì sao:** Tính năng tuyển developer, giao task, chấm công theo giờ, đánh giá
(`server/routes/hugoTeamRoutes.js`) mang bản chất quan hệ lao động.

**Làm gì:**
- Nếu trả công: phải trả **bằng tiền** (Điều 94, 95 Bộ luật Lao động), không trả
  bằng JOY; ≥1 tháng phải có hợp đồng lao động bằng văn bản; bảo đảm lương tối
  thiểu vùng.
- Nếu là cộng tác không lương / học việc tự nguyện: ghi rõ bằng văn bản, bỏ phần
  chấm công bắt buộc, và không dùng từ "nhân sự", "ca làm".
- CV ứng viên (PDF) đang lưu trên đĩa server không giới hạn thời gian → đặt hạn
  lưu (ví dụ 12 tháng) rồi xoá, và nói rõ điều này khi nhận hồ sơ.

## 6. WHO-5 trong ứng dụng có gói trả phí

Thang WHO-5 (`src/components/member/banhocduong/clinicalTests.js`) được WHO cho
dùng miễn phí, nhưng **mục đích thương mại cần xin phép WHO**. Portal có gói trả
phí nên hai lựa chọn: gửi thư xin phép WHO, hoặc để bài WHO-5 luôn miễn phí và
không nằm sau bất kỳ gói JOY/gói trả phí nào.

PHQ-9 và GAD-7 không vướng — Pfizer đã đưa ra dùng tự do, và code đã ghi nguồn.

## 7. Chứng cứ giấy phép cho nhạc nền

Bốn tệp `rain / sea / campfire / ambient .mp3` trên Cloudinary
(`src/components/member/banhocduong/TherapyTab.jsx`) không có ghi chú nguồn.
Tìm lại nơi tải và **lưu ảnh chụp trang giấy phép** vào `docs/`; nếu không tìm
được thì thay bằng nguồn CC0 rõ ràng (Pixabay, Freesound CC0).

Tương tự với các ảnh chụp màn hình trong `src/context/DataContext.jsx` và
`IntroductionPage.jsx`: nếu là giao diện dự án của khách, cần họ đồng ý bằng văn bản.

## 8. Việc cũ chưa xong (từ đợt rà soát trước)

`.env` đã từng lộ trên GitHub → **xoay toàn bộ secret** (JWT_SECRET,
JOY_QR_SECRET, khoá PayOS, khoá Google, chuỗi kết nối MongoDB) nếu chưa làm.

---

## Đã sửa bằng code trong đợt này

| Việc | Nơi sửa |
|---|---|
| Gỡ 2 stream lấy từ CDN Zing MP3, gỡ đài thương mại có quảng cáo | `MemberRadioTab.jsx` |
| Ngừng bóc toàn văn báo chí, chỉ giữ nguồn truy cập mở (arXiv) | `studentNewsService.js` |
| Bỏ hẳn ảnh hotlink từ CDN toà soạn, thẻ bài dùng icon chuyên mục | `studentNewsService.js`, `MemberTodayTab.jsx`, `TodayArticleReader.jsx` |
| Bỏ User-Agent giả trình duyệt khi đọc feed | `studentNewsService.js` |
| Đổi tên và bảng màu game xếp hình, tránh nhãn hiệu Tetris® | `GameTetris.jsx`, `HugoArcadeTab.jsx`, i18n |
| "Chứng chỉ" → "Giấy chứng nhận hoàn thành" + ghi rõ không phải văn bằng | `CoderCertificatePage.jsx`, `CertificateModal.jsx` |
| Thêm trang Điều khoản sử dụng + quy trình gỡ nội dung vi phạm bản quyền | `TermsPage.jsx`, `/terms` |
| Bổ sung bên thứ ba còn thiếu + mục dữ liệu nhạy cảm | `PrivacyPolicyPage.jsx` |
| Xác nhận của người giám hộ cho thành viên dưới 16 tuổi | `profileRequirements.js`, `OnboardingProfileModal.jsx` |
| Đổi nhãn "Trị liệu" → "Thư giãn / tự chăm sóc" | `banhocduong/*`, i18n |
| Ghi rõ HugoSO không liên kết với Google | `HugoSOApp.jsx` |

Đã kiểm chứng ngày 13/08/2026: `tgpsaigon.net` và `hdgmvietnam.com` **không có
robots.txt** (cả hai trả 404). Theo RFC 9309, không có file nghĩa là không đặt
hạn chế thu thập, nên việc đọc trang danh sách để lấy tiêu đề + liên kết là hợp
lệ. Nếu sau này họ thêm robots.txt thì phải kiểm tra lại — hệ thống hiện **không**
tự đọc robots.txt.

Còn một việc mức trung bình chưa làm: **Google Fonts đang nạp từ CDN của Google**
(`index.html`). Với người dùng ở EU, việc này từng bị toà án Đức coi là vi phạm
GDPR. Cách xử lý là tải font về `public/fonts/` và tự phục vụ. Chưa làm vì repo
đang tối ưu dung lượng và người dùng chủ yếu ở Việt Nam.
