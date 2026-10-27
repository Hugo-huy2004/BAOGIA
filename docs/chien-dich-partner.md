# Chiến dịch hợp tác — partner.hugowishpax.studio

Trang thư mời nhận ưu đãi cho các chiến dịch hợp tác (chiến dịch đầu tiên:
**hwagfu.dev × Hugo Studio**). Ai mở link cũng xem được; quà chỉ cộng cho tài
khoản đã đăng nhập Google, đã điền đủ hồ sơ, mỗi người một lần, tối đa
`maxClaims` tài khoản.

## Luồng người dùng

1. Phim mở màn dựng bằng SVG (`src/pages/public/partner/CollabFilm.jsx`),
   nhịp kiểu keynote: sân khấu đen, sàn bóng phản chiếu, tiêu đề hiện từ nhoè
   sang nét. Hai nhân vật vẽ theo logo — giọt thuỷ tinh Hugo Studio và ô `<J>`
   của hwagfu.dev — đi vào, bắt tay, nhảy lên chữ **COLLABORATE** phát sáng.
   Xong phim hiện nút **KHÁM PHÁ ƯU ĐÃI**.
2. Bốn thẻ quyền lợi có tương tác (bước đăng ký sáng dần, công tắc học sinh /
   sinh viên tính tổng ngày và hạn dùng, chạm từng dịch vụ, JOY đếm lên) →
   nút Google (một chạm). Thẻ theo chế độ sáng/tối của máy (`html.dark`).
   Trang **không** hiện số suất còn lại.
3. Hồ sơ thiếu gì hỏi nấy (`OnboardingProfileModal`, danh sách do server trả).
4. `POST /api/partner-campaigns/<slug>/claim` → pháo hoa, màn chào mừng ghi rõ
   quà đã áp dụng, hạn tài khoản mới, số dư JOY.
   Hết suất (hoặc chiến dịch đã đóng): vẫn đăng nhập và vẫn được chào mừng,
   nhưng không nhận gì từ chiến dịch — chỉ còn JOY khởi tạo của hệ thống, kèm
   lời nhắc xác minh giáo dục để tăng thời hạn dùng. Không bắn pháo hoa.
5. Tour driver.js tự chạy, dẫn qua Bio, Ví JOY, Hugo Team, Study, HugoKit,
   Aura, Arcade rồi nút vào trang thành viên.

## Thêm / đổi / xoá chiến dịch

Mọi thứ riêng của một chiến dịch nằm ở **một mục** trong
`shared/partnerCampaigns.js`: tên đối tác, logo (`mark`), lời văn + SEO
(`copy.vi`, `copy.en`), quà (`bioDays`, `eduBonusDays`, `joy`), số suất
(`maxClaims`), lịch (`startsAt`, `endsAt`), ngưỡng chống gian lận (`antiAbuse`).

- **Thêm**: chép một mục, đổi `slug`. Trang có ngay ở `/collab/<slug>`, API ở
  `/api/partner-campaigns/<slug>`, trang tĩnh SEO sinh lúc build.
  Chạy `npm run og:partner` để vẽ ảnh chia sẻ `public/og/partner-<slug>.jpg`.
- **Đưa chiến dịch khác lên tên miền partner**: sửa `PARTNER_HOST_CAMPAIGN`.
- **Đóng**: đặt `endsAt`. **Xoá**: xoá mục — lượt nhận cũ vẫn ở collection
  `partnerclaims` để đối soát.

Lời văn chung của trang (nút, trạng thái, tour) ở
`src/pages/public/partner/collabCopy.js`; số liệu luôn chèn từ chiến dịch.

## Quà và cách cộng

| Quà | Cách cộng |
| --- | --- |
| 180 ngày duy trì tài khoản & Bio | Nối vào hạn hiện có (`expiresAt`, và `trialExpiresAt` nếu chưa xác minh giáo dục — không dời cả hai thì lịch dọn tài khoản dùng thử vẫn xoá sau 7 ngày) |
| +365 ngày khi đã xác minh giáo dục | Cộng ngay nếu đã xác minh; xác minh SAU thì quay lại trang bấm nhận là được cộng nốt (không tốn suất) |
| 1000 JOY | `awardJoy(..., 'partner_campaign', { rawAmount: true })` — đúng con số đã hứa, có dòng sổ JoyLedger |

Mỗi phần có cờ riêng trên `PartnerClaim` (`daysApplied`, `joyApplied`,
`eduBonusApplied`), lật bằng điều kiện nguyên tử: bấm hai lần song song hay
gọi lại sau lỗi cũng không cộng trùng.

## Chống một người nhiều Gmail

| Tín hiệu | Luật |
| --- | --- |
| Email chuẩn hoá (Gmail bỏ `.` và `+...`) | Chỉ mục duy nhất `{campaign, emailKey}` |
| Số điện thoại (bắt buộc trong hồ sơ) | Trùng với lượt đã nhận → chặn |
| Mã thiết bị (localStorage + cookie 400 ngày) | Trùng → chặn |
| Vân tay thiết bị **+ cùng mạng /24** | Trùng → chặn (vân tay một mình có thể trùng giữa hai máy cùng đời) |
| IP đã được edge ký | ≥ `maxPerIpPerDay` lượt/24h → chặn |
| Vị trí đã xác minh (ô ~11 m) | ≥ `maxPerLocation` lượt → chặn |

Ba luật đầu còn có chỉ mục duy nhất một phần (chỉ lượt `granted`) làm chốt
chặn cuối khi hai tài khoản cùng máy bấm nhận cùng một giây. Mọi tín hiệu chỉ
lưu dạng HMAC (`securityHash`), không giữ số điện thoại, IP hay toạ độ thô.

Tài khoản bị chặn được ghi thành lượt `rejected` (giữ chỗ email đó). Người thật
bị chặn nhầm thì admin gỡ:

- `GET /api/partner-campaigns/admin/<slug>/claims` — số đã nhận, số bị chặn,
  số suất đã dùng / còn lại (chỉ admin thấy), danh sách gần nhất kèm lý do.
- `DELETE /api/partner-campaigns/admin/<slug>/claims/<id>` — gỡ một lượt bị
  chặn để tài khoản đó thử lại (lượt đã nhận quà thì không gỡ được).

## Triển khai (làm một lần)

1. **Vercel** → project chính → Domains → thêm `partner.hugowishpax.studio`
   (cùng project với www, không cần project riêng). `middleware.js` ở gốc repo
   trỏ `/`, `/sitemap.xml`, `/robots.txt` của tên miền này về trang chiến dịch
   — rewrite trong `vercel.json` thua file tĩnh cùng đường dẫn nên không dùng.
2. **Google Cloud Console** → OAuth client của web → *Authorized JavaScript
   origins* → thêm `https://partner.hugowishpax.studio`. Thiếu bước này nút
   Google không hiện.
3. **Cloudflare** → Transform Rule gắn `x-hugo-client-ip` + `x-hugo-edge-auth`
   (như của www, xem `docs/chong-ddos-12-tang.md`) cho cả tên miền partner.
   Thiếu thì luật IP và luật "vân tay + cùng mạng" tự bỏ qua (an toàn: không
   chặn nhầm), chỉ còn điện thoại, mã thiết bị và vị trí.
4. **Backend (Render)**: deploy lại để có `https://partner.hugowishpax.studio`
   trong danh sách CORS (`server/config/cors.js`). Thiếu bước này trình duyệt
   chặn mọi lời gọi `api.hugowishpax.studio` từ tên miền partner.
5. **Google Search Console** → thêm property `partner.hugowishpax.studio`, nộp
   `https://partner.hugowishpax.studio/sitemap.xml`.
