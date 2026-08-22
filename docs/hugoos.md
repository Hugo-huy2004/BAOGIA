# HugoOS — từ nền tảng lên hệ điều hành

Tài liệu này ghi lại lớp nền HugoOS đã dựng và thứ tự chuyển từng app sang nó.
Đọc trước khi làm UI cho bất kỳ app nào trong portal thành viên.

## Vì sao UI yếu

Không phải vì thiếu hiệu ứng. Vì mỗi app tự dựng chrome riêng:

| App | Chrome trước khi có HugoOS |
| --- | --- |
| HugoKit | iosKit (NavBar + Scroll) |
| Cinema | tự vẽ tab bar + nav |
| Supporter | không có gì — một khung chat nền `slate-950` cứng |
| Radio | `SubUtilityHeader` |
| Arcade, Store, Wallet | mỗi cái một kiểu |

Cùng một portal mà mỗi app một cỡ chữ, một nút quay lại, một cách chừa
safe-area. Sửa từng app là sửa mãi không hết; phải có một khung dùng chung.

## Lớp nền: `src/components/member/os/`

| File | Việc |
| --- | --- |
| `AppFrame.jsx` | Chrome duy nhất cho mọi app: nav bar tiêu đề lớn, `BackButton` chung, vùng cuộn, tab bar dưới có safe-area. App chỉ khai báo tab + nội dung. |
| `AppHome.jsx` | Bộ dựng trang chủ: `HomeHero`, `HomeSection`, `QuickGrid`, `ContinueCard`, `StatStrip`, `EmptyState`. |
| `appIntent.js` | `openDestination(appId, destination)` + `useAppIntent(appId, fn)` — mở thẳng một màn hình bên trong app. Ý định được giữ lại cho tới khi app tải lười xong. |
| `appUsage.js` | Nhật ký "vừa mở" trên localStorage, dùng để xếp Spotlight và dựng thẻ "tiếp tục việc đang dở". |
| `appPalette.js` | Màu nhấn và nền riêng cho từng app, trộn sẵn từ `tint` trong registry. |
| `useDarkScheme.js` | Bắc cầu giữa class `dark` trên `<html>` và prop `scheme` của iosKit. |

Nền màu vẫn là token `--ios-*` của `src/components/demos/iosKit.jsx`. iosKit là
ngôn ngữ thiết kế của cả HugoOS — sửa iosKit là toàn hệ đổi theo, đừng đẻ bộ
component thứ hai.

## Mỗi app có màu và nền của chính nó

App không được mượn `--primary` và nền của portal. Mở app nào cũng ra một màu
thì app không có bản sắc, và đổi theme portal là đổi màu cả hai mươi app cùng
lúc. `AppFrame` nhận `appId`, tra `tint` trong registry rồi tự sơn nền —
`appPalette.js` trộn sẵn bằng JS (không dùng `color-mix()` của CSS: custom
property nhận giá trị không hỗ trợ vẫn "hợp lệ" tới lúc dùng mới hỏng, nên
Safari cũ sẽ ra nền trong suốt).

Vẫn phẳng và tĩnh: toàn màu đặc, một màu nhấn, không gradient, không glow.

## App toàn màn hình

`FULLSCREEN_APP_IDS` trong `shared/appRegistry.js` là nguồn duy nhất. Danh sách
này từng nằm hardcode ở cả `MemberPortalPage` lẫn `MemberUtilitiesTab` và đã
lệch nhau — Supporter chỉ có ở một bên, nên app dựng vỏ `h-full` bên trong một
trang vẫn còn đệm và thanh tab, ra một khoảng đen thừa dưới đáy.

HugoPSY là ngoại lệ duy nhất: chỉ toàn màn hình trên điện thoại.

## Trang chủ của một app gồm gì

Trang chủ không phải một màn hình trang trí. Nó trả lời ba câu:

1. **App này làm được gì** — `HomeHero` (icon, tên, một câu, một nút chính).
2. **Việc đang dở của tôi** — `ContinueCard` (đọc từ `appUsage` hoặc API).
3. **Bấm tiếp vào đâu** — `QuickGrid` các tính năng, `HomeSection` cho nội dung.

Thêm tính năng cho app = thêm một ô `QuickGrid` hoặc một tab, không phải dựng
lại điều hướng. Đây mới là chỗ "mỗi app là một hệ sinh thái" trở thành việc làm
được từng bước thay vì một cuộc viết lại.

**Ngoại lệ có chủ đích:** app dưới 5 màn hình con và không có trạng thái người
dùng thì đừng thêm trang chủ. HugoKit là ví dụ — bốn công cụ, đã cố ý làm phẳng
để bỏ ba tầng điều hướng; ép thêm trang chủ là quay lại chỗ cũ.

## Spotlight tìm được vào bên trong app

`shared/appRegistry.js` giờ có `destinations` cho mỗi manifest, gom lại thành
`APP_DESTINATIONS`. Gõ "QR" trong Spotlight ra thẳng công cụ QR của HugoKit chứ
không dừng ở tên app.

Khai báo ở registry chứ không trong từng app, để tìm kiếm không phải nạp mã giao
diện của 20 app chỉ để biết bên trong có gì. Nhãn dùng `labelKey` trỏ tới khoá
i18n **đã có sẵn** — thêm một điểm đến không kéo theo 9 bản dịch mới.

Nhật ký `appUsage` được ghi ở `MemberUtilitiesTab` — chỗ duy nhất mọi đường vào
đều đi qua (icon Home, Thư viện, Spotlight, Hugo Store, URL dán tay).

## Từ vựng chung `os.*`

`os.home`, `os.tools`, `os.recent`, `os.seeAll`, `os.continue`,
`os.quickActions`, `os.allFeatures`, `os.activity`, `os.overview`… đủ 9 ngôn ngữ,
có trong `core.json` của vi/en vì nhãn điều hướng phải hiện ngay khi app mở.

Đừng thêm khoá "Trang chủ" riêng cho từng app nữa.

## Đã chuyển sang HugoOS

**Trung Tâm Hỗ Trợ** (`src/components/member/support/SupportCenterApp.jsx`) —
app tham chiếu. Ba tab: Trang chủ / Hướng dẫn / Yêu cầu. Id vẫn là `supporter`
để icon đã cài và bookmark cũ không hỏng.

**Không còn AI trong hỗ trợ.** Bản cũ là một khung chat bot, và tệ hơn: mỗi tin
nhắn đều `POST /api/support/tickets`, tức hỏi "ví JOY là gì" cũng đẻ một phiếu
hỗ trợ thật rồi gọi `autoProcessTicket` soạn câu trả lời máy. Người dùng nhận
câu trả lời bịa cho một hệ thống mà bot không thực sự biết, còn quản trị viên
thì ngập phiếu rác.

Giờ chỉ còn hai đường: đọc hướng dẫn viết sẵn (`support.g1q`…`g6a`, đủ 9 ngôn
ngữ), hoặc gửi yêu cầu thẳng cho quản trị viên kèm số điện thoại/Zalo. Trang
admin "Liên hệ & Hỗ trợ" vốn đã hiện tên, email, số điện thoại kèm liên kết
`tel:` và `mailto:` — không phải sửa gì bên đó.

Đã gỡ: `POST /api/support/chat` cùng system prompt và FAQ cứng, và lời gọi
`autoProcessTicket` khi tạo phiếu. Kho tri thức `aiSupportAdminService` vẫn còn
vì webhook Messenger và bản tin tóm tắt cho admin dùng nó — nó không còn dính gì
tới app Hỗ trợ.

Ba lỗi thật sửa kèm:

- Thành viên không xem lại được phiếu mình đã gửi — `GET /tickets` chỉ mở cho
  admin. Thêm `GET|POST /api/support/my-tickets` dùng `requireMember` và lấy danh
  tính từ `req.memberEmail`, không bao giờ từ email trong body.
- `repliedAt` không có trong schema `SupportTicket` nên mongoose lặng lẽ bỏ đi:
  chưa phiếu nào từng có mốc thời gian trả lời. Đổi sang `resolvedAt`.
- Id cũ `helpdesk` khớp cả nhánh HugoKit lẫn nhánh Supporter trong
  `MemberUtilitiesTab`, nên mở nó dựng hai app chồng lên nhau. `helpdesk` giờ chỉ
  còn mở HugoKit, đúng như lần sáp nhập tháng 8.

**HugoKit** cũng đã chuyển sang `AppFrame` — nhưng vẫn không có trang chủ, đúng
ngoại lệ ở trên.

## Thứ tự chuyển tiếp

Ưu tiên theo mức yếu, không theo thứ tự bảng chữ cái.

| Đợt | App | Việc chính |
| --- | --- | --- |
| 1 | Radio | Đang có bản standalone dở dang trong cây làm việc. Chuyển sang `AppFrame`, năm trang hiện tại thành năm tab. |
| 1 | Aura | Trang chủ: phiên gần nhất, chuỗi ngày tập trung, `QuickGrid` các chế độ. |
| 1 | Bio | 185 dòng, mỏng nhất. Trang chủ: lượt xem, liên kết nổi bật, sửa nhanh. |
| 2 | Cinema | Bỏ tab bar tự vẽ, dùng `AppFrame`; giữ nguyên trang chủ đã có. |
| 2 | Wallet | Trang chủ: số dư, giao dịch gần nhất, hành động nhanh. |
| 2 | Invest | Trang chủ: danh mục, phiên hôm nay, bài học đang học dở. |
| 3 | Study, Arcade, Store, HugoPSY | Đã có cấu trúc riêng đủ mạnh; chỉ đồng bộ chrome sang `AppFrame`. |

Mỗi đợt: khai báo `destinations` trong registry cho app đó, và gọi
`useAppIntent` để Spotlight nhảy đúng màn.

## Mỗi app một URL công khai

Nguyên tắc: gõ `hugowishpax.studio/<tên-app>` là trải nghiệm được ngay, không
cần tài khoản; đăng nhập mới bỏ giới hạn. Hạ tầng đã có sẵn, ba mảnh:

1. Một mục trong `src/config/publicTools.js` (tiêu đề ≤ 65 ký tự — `check:seo`
   bắt buộc — mô tả, `heading`, `summary`, và `gate`).
2. Một nhánh trong `src/pages/public/UtilityPublicPage.jsx` dựng app đó với
   `isGuestMode` + `requireAccount`.
3. Một rewrite trong `vercel.json` trỏ `/<slug>` sang `/<slug>/index.html`
   (HTML tĩnh do `scripts/generate-seo.mjs` sinh ra từ chính registry trên).

Bốn mức `gate`: `open` (không cần gì), `level` (chơi/dùng ngay, mở thêm thì cần
tài khoản), `demo` (3 lượt/ngày cho khách), `result` (cần tài khoản đã xác minh
để lưu hoặc xuất kết quả).

Đã mở (14): `banhocduong`, `therapy`, `radio`, `aura`, `arcade`, `hugokit`,
`ide`, `support`, `study`, `chess`, `caro`, `snake`, `2048`, `survivor`.

`/study` là trang học đứng riêng: xem trọn lộ trình 100 bài và **học thật 10 bài
đầu** mà không cần tài khoản. Trước đây cả bộ nằm sau một `FeatureGate` 1500
JOY — khách chỉ thấy bức tường. Giờ `HugoCoderHub` nhận `previewLessons`: khoá
theo từng bài thay vì chặn cả app, bài 11 trở đi mới hiện thẻ đăng nhập và mở
gói. Số bài miễn phí khai báo trong `publicTools.js` chứ không trong hub — trang
công khai chỉ cần con số, import từ hub sẽ kéo cả bộ học vào bundle.

Từng game một URL không cần `case` riêng: mục nào khai báo `game` thì
`UtilityPublicPage` dựng thẳng `StandaloneGameShell` — thêm game mới chỉ là thêm
một mục trong registry.

`/chess` trần trước đây chuyển hướng vào Arcade của thành viên, tức bắt đăng
nhập — trái hẳn nguyên tắc "vào là chơi". Giờ nó là trang game công khai; chỉ
liên kết phòng `/chess/<id>` mới còn đi đường cũ.

### Còn lại và giá phải trả

| App | Mở được? | Việc cần làm |
| --- | --- | --- |
| `study` | Có | Cho xem lộ trình và bài đầu; tiến độ và chấm bài cần tài khoản (`level`). |
| `cinema` | Có | Cho duyệt danh mục phim công cộng; xem thì tốn token (`level`). |
| `invest` | Có | Cho xem bảng giá; đặt lệnh cần tài khoản (`level`). |
| `team` | Có | Trang tuyển dụng gần như chỉ đọc — rẻ nhất trong nhóm còn lại (`open`). |
| `store` | Một phần | Duyệt gian hàng công khai tốt cho SEO; mua thì cần tài khoản. |
| `info` | Có | Thông tin hệ thống và ghi chú phát hành (`open`). |
| `bio`, `profile` | Không | Đây là hồ sơ CỦA MỘT NGƯỜI, bản công khai đã là `/bio/:slug`. |
| `joy_wallet` | Không | Ví không có tài khoản thì rỗng — không có gì để trải nghiệm. |

Mỗi app trong nhóm "Có" cần component nhận `isGuestMode` và `requireAccount`
rồi tự đổi phần cần tài khoản thành thẻ mời đăng nhập, đúng như
`SupportCenterApp` đang làm ở tab Yêu cầu.

## Ràng buộc không được bỏ

- Icon Material Symbols đơn sắc, không emoji, không icon màu (mascot chibi ở
  trang Introduction là ngoại lệ đã chốt).
- App phẳng và tĩnh: nền đặc, không gradient/glow/blur trang trí, một màu nhấn.
  Bản Supporter cũ vi phạm cả ba — đó là lý do nó bị viết lại đầu tiên.
- Chữ ≥ 15px, vùng chạm ≥ 44px.
- Route thành viên mới phải dùng `requireMember` và `req.memberEmail`.
- Chuỗi mới phải đủ 9 ngôn ngữ.
