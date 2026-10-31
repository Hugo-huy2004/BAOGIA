# Lời đọc video "Cài Hugo Studio lên điện thoại" — cho ElevenLabs

Mỗi ngôn ngữ có **7 đoạn**, mỗi đoạn là **một file âm thanh riêng**. Video tự
kéo dài từng cảnh theo độ dài file, nên đọc nhanh hay chậm đều khớp hình.

## Cài đặt ElevenLabs nên dùng

- **Model:** Eleven Multilingual v2 (hoặc Eleven v3 nếu tài khoản có).
- **Giọng:** dùng **một giọng** cho cả 3 thứ tiếng để thương hiệu nghe nhất quán.
  Chọn giọng ấm, tốc độ vừa, kiểu "người hướng dẫn thân thiện", không phải
  giọng quảng cáo.
- **Voice settings:** Stability 45–55 · Similarity 75 · Style 0–15 ·
  Speaker boost bật · Speed 0.95–1.0.
- **Định dạng xuất:** MP3 44.1 kHz 128 kbps trở lên.
- Đầu và cuối mỗi đoạn để yên, không cần chừa khoảng lặng — video tự thêm.
- Nếu một từ đọc sai (thường là "Hugo Studio" hay "Safari"), tạo lại riêng
  đoạn đó; không cần làm lại cả bộ.

## Đặt tên file khi gửi lại

```
vi-01.mp3 … vi-07.mp3
en-01.mp3 … en-07.mp3
zh-01.mp3 … zh-07.mp3
```

Đặt vào `artifacts/pwa-install-guide/voice/` (hoặc gửi cho Claude), rồi chạy
`node artifacts/pwa-install-guide/source/render.mjs` — video có lời sẽ ra ở
`public/video/pwa-install/`.

Cũng có thể thu **một file liền cho mỗi thứ tiếng** (các đoạn cách nhau bằng
`<break time="1.5s" />`), đặt ở `voice/source/<lang>.mp3` rồi tách bằng
`split-voice.mjs` — xem `voice/README.md`.

---

## Tiếng Việt

| # | Cảnh | Lời đọc |
| --- | --- | --- |
| 01 | Mở đầu | Chỉ khoảng ba mươi giây thôi, bạn đã có Hugo Studio ngay trên màn hình chính. Mình cùng làm nhé. |
| 02 | iPhone · mở bằng Safari | Nếu bạn dùng iPhone, hãy mở trang bằng Safari. Đang xem trong Zalo hay Facebook, thì chạm vào dấu ba chấm, rồi chọn Mở trong Safari. |
| 03 | iPhone · nút Chia sẻ | Tiếp theo, chạm vào nút Chia sẻ — ô vuông có mũi tên hướng lên. |
| 04 | iPhone · Thêm vào MH chính | Kéo danh sách lên một chút, rồi chọn Thêm vào Màn hình chính. |
| 05 | iPhone · Ứng dụng web | Giữ nguyên tên Hugo Studio, bật Mở dưới dạng ứng dụng web, rồi chạm Thêm ở góc trên. |
| 06 | Android · Chrome | Với điện thoại Android, mở trang bằng Chrome. Chạm vào dấu ba chấm ở góc trên, chọn Cài đặt ứng dụng, rồi xác nhận Cài đặt. |
| 07 | Hoàn tất | Vậy là xong. Từ giờ, chỉ cần mở Hugo Studio từ biểu tượng trên màn hình chính — gọn gàng, toàn màn hình, như một ứng dụng thật. |

## English

| # | Scene | Voice-over |
| --- | --- | --- |
| 01 | Intro | In about thirty seconds, you'll have Hugo Studio right on your home screen. Let's do it together. |
| 02 | iPhone · open in Safari | On iPhone, open the page in Safari. If you're viewing it inside Zalo or Facebook, tap the three dots, then choose Open in Safari. |
| 03 | iPhone · Share | Next, tap the Share button — the square with an arrow pointing up. |
| 04 | iPhone · Add to Home Screen | Scroll up a little, and choose Add to Home Screen. |
| 05 | iPhone · Web App | Keep the name Hugo Studio, turn on Open as Web App, then tap Add in the top corner. |
| 06 | Android · Chrome | On Android, open the page in Chrome. Tap the three dots in the top corner, choose Install app, then confirm Install. |
| 07 | Done | And that's it. From now on, just open Hugo Studio from your home screen — clean, full screen, just like a real app. |

## 中文（简体）

| # | 场景 | 旁白 |
| --- | --- | --- |
| 01 | 开场 | 只需大约三十秒，就能把 Hugo Studio 放到你的主屏幕上。我们一起来吧。 |
| 02 | iPhone · 用 Safari 打开 | 如果你用的是 iPhone，请用 Safari 打开页面。如果正在 Zalo 或 Facebook 里浏览，点一下右上角的三个点，再选择“在 Safari 中打开”。 |
| 03 | iPhone · 共享 | 接着，点一下“共享”按钮，也就是带向上箭头的方框。 |
| 04 | iPhone · 添加到主屏幕 | 把列表往上滑一点，选择“添加到主屏幕”。 |
| 05 | iPhone · 网页 App | 名称保留 Hugo Studio，打开“作为网页 App 打开”，然后点右上角的“添加”。 |
| 06 | Android · Chrome | 如果是安卓手机，请用 Chrome 打开页面。点右上角的三个点，选择“安装应用”，再确认“安装”。 |
| 07 | 完成 | 这样就完成了。以后只要从主屏幕打开 Hugo Studio，就能全屏使用，就像真正的 App 一样。 |
