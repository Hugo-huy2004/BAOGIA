# Study with Hugo — đề tài tốt nghiệp và học liệu

Tài liệu cho phần cá nhân hoá của giáo trình 100 bài. Đọc cùng `docs/hugoos.md`.

## Đề tài tốt nghiệp

`shared/capstoneTracks.js` là nguồn duy nhất. Năm đề tài: thư viện sách, cửa
hàng trực tuyến, đặt lịch phòng khám, cộng đồng học tập, kho và đơn nhập hàng.

Bài 71–90 vẫn dạy **một bộ khung kỹ thuật chung** — không fork hai mươi bài cho
năm đề tài. Đề tài mang theo bốn thứ:

| Trường | Việc |
| --- | --- |
| `entities` | Dữ liệu phải mô hình hoá, thay bảng `users` mẫu trong bài giảng |
| `milestones` | Dịch từng cột mốc chung sang đúng đề tài đó |
| `extraLessons` | Vài bài CHỈ đề tài này có, dạy phần khó riêng của nó |
| `research` | Ba việc 100 bài KHÔNG dạy thẳng, học viên phải tự đọc mà làm |

### Cách canh độ khó

`core` chỉ gồm thứ đã được dạy — làm đủ là chắc chắn nghiệm thu được.
`research` là phần phải tự tìm tòi: khoá lạc quan, phân trang con trỏ, khoá
idempotency, ràng buộc duy nhất chống đặt trùng, ảnh chụp tồn kho định kỳ. Mỗi
mục nêu **vấn đề** chứ không nêu lời giải, kèm một gợi ý trỏ về bài đã học.

Bắt cả ba mục `research` là quá tay cho đồ án tốt nghiệp; bỏ hẳn thì đồ án chỉ
còn là chép lại bài mẫu. `minResearchItems` đang là 1.

Mỗi đề tài bắt buộc một tính năng dùng LLM, và mỗi đề tài một kiểu khác nhau —
gợi ý sách, soạn mô tả sản phẩm, phân loại lý do khám, kiểm duyệt nội dung, dự
báo nhập hàng. Cả năm đều yêu cầu ép JSON theo schema và **kiểm tra lại đầu ra
đối chiếu dữ liệu thật**, vì schema chỉ bảo đảm hình dạng chứ không bảo đảm sự
thật.

### Lưu và hiển thị

- `Bio.capstoneTrack` + `capstoneTrackChosenAt`.
- `GET|PUT /api/member/progress/capstone` — chỉ nhận id có trong registry.
- `CapstoneTrackPicker` hiện trong tab Tiến độ của HugoCoderHub, chỉ khi học
  viên đã hoàn thành ít nhất 70 bài (đếm số bài xong, không đợi đúng `lesson70`:
  người mua trọn gói có thể học lệch thứ tự).

## Hình thức kiểm tra

`shared/quizKinds.js` là hợp đồng dữ liệu và bộ chấm cho tám dạng câu hỏi.
Câu hỏi **không có** `kind` vẫn là trắc nghiệm một đáp án, nên 471 câu cũ chạy y
như trước — không phải sửa gì.

| `kind` | Hình dạng | `value` giao diện thu được |
| --- | --- | --- |
| `mcq` (mặc định) | `{q, o[], a}` | số |
| `multi` | `{q, o[], a:[…]}` | mảng số |
| `truefalse` | `{q, a:bool, why}` | boolean |
| `blank` | `{q, code (có `___`), a}` | chuỗi |
| `order` | `{q, items[], a:[…]}` | mảng số |
| `match` | `{q, pairs:[[trái, phải]]}` | `{chỉ số trái: chỉ số phải}` |
| `bug` | `{q, lines[], a, why}` | số |
| `output` | `{q, code, o[], a}` | số |

Luật chấm nằm ở một chỗ vì giao diện dựng câu hỏi ở **hai** nơi (bảng bên cạnh
cho máy tính, sổ tay cho điện thoại) và bộ kiểm tra nội dung cũng cần biết thế
nào là hợp lệ. Ba bản sao của luật chấm là ba cơ hội để chúng lệch nhau.

`QuizQuestion.jsx` dựng cả tám dạng, dùng chung cho cả hai nơi. Sắp xếp dùng nút
lên/xuống và nối cặp dùng thẻ `select` của trình duyệt, **không kéo thả**: kéo
thả cần thư viện, hỏng trên trình đọc màn hình và khó dùng bằng bàn phím, trong
khi thứ đang kiểm tra là kiến thức chứ không phải độ khéo tay.

Nội dung mới nằm ở `lessons/variedQuestions.js` — ghép vào `miniQuiz` trong
`lessons/index.js`. Đặt riêng vì nội dung bài giảng và hình thức kiểm tra đổi
theo nhịp khác nhau; trộn lẫn thì mỗi lần thêm một dạng lại phải mở sáu file dài
hai nghìn dòng. Hiện có 23 câu trải đều sáu chặng.

Ràng buộc bộ kiểm tra bắt được: câu `truefalse` và `bug` **phải** có `why`; câu
`match` không được trùng vế phải (trùng thì câu hỏi có nhiều lời giải đúng mà bộ
chấm chỉ nhận một); câu `multi` không được đúng hết mọi phương án.

## Bản đồ kho báu

`CoderLearningJourney.jsx`. Sáu chặng trình bày thành sáu **vùng đất**; mỗi bài
là một bước chân trên đường mòn uốn lượn đã có sẵn. Hai thứ mới:

- **Mốc rương cuối mỗi vùng đất** (`.coder-treasure-stop`) — viền nét đứt khi
  chưa mở, nền đặc theo màu chặng khi đã mở. Nó là hình ảnh của giấy chứng nhận
  chặng vốn đã tồn tại, không phải một phần thưởng mới.
- **Thẻ "kho báu tiếp theo"** (`NextTreasure`) — rương gần nhất chưa mở và còn
  bao nhiêu bước, bấm vào thì mở đúng vùng đất đó.

Vì sao đếm bước thay vì phần trăm: "còn 3 bước" cụ thể hơn "62%", và mốc gần
nhất luôn cách tối đa một chặng nên nó luôn nằm trong tầm với.

Bản đồ **không** đẻ thêm màu: mốc rương dùng lại `--stage-color`/`--stage-soft`
của chặng, và các token chữ dùng `--coder-secondary`. Vẫn khối đặc, không
gradient — cùng ngôn ngữ với phần còn lại của lộ trình.

Từ vựng ở `hugoCoderLearning.treasure.*`, đủ 9 ngôn ngữ.

## Gỡ IDE khỏi bài học

Trình soạn thảo Monaco, cây thư mục và khung xem trước đã gỡ hẳn. Học viên gõ
code trong công cụ thật của mình — đúng như khi đi làm.

`MemberIdeTab.jsx` đổi tên thành **`LessonView.jsx`**: nó không còn là IDE, và
nhánh desktop (428 dòng Monaco + workspace) đã xoá. Màn hình bài học giờ dùng
chung `MobileGuidebook` cho mọi kích thước — thành phần đó vốn đã là màn hình
bài học đầy đủ không có trình soạn thảo, nên không phải dựng mới.

88 bài `code_challenge` chuyển sang `PracticeSteps`: mã khởi đầu để chép, các
bước thực hành đánh dấu từng cái, khối lỗi hay gặp, rồi mở phần câu hỏi chốt bài.
**Không phải soạn nội dung mới** — cả 88 bài đã có sẵn `labSteps`, `starterCode`,
`checklist`, `commonMistakes`, `miniQuiz`.

Bản cũ trên điện thoại chỉ có đúng MỘT nút tự khai *"Tôi đã hoàn thành yêu cầu
thực hành / Bỏ qua bài này"* dùng chung cho cả 88 bài, nên đổi sang bảng bước
không làm mất tính nghiêm túc nào — nó nghiêm hơn.

Ngân sách: `member-ide-shell` 389.8 kB → `member-lesson-view` **313.3 kB**.

Id `ide` **vẫn giữ** trong `FULLSCREEN_APP_IDS` và nhánh mở app: bookmark cũ
`/member/utilities/ide/lesson12` phải tiếp tục mở đúng bài trong Study. Nghỉ hưu
một id không có nghĩa là làm gãy link đã chia sẻ. Đã gỡ: trang công khai `/ide`,
rewrite Vercel, manifest `ide` trong registry và Store, nhánh `case "ide"` ở
trang công khai.

## Trang lộ trình theo lối Duolingo

Trước đây phải cuộn qua bốn khối mới thấy con đường học: hero có cảnh phòng thí
nghiệm, bảng giải thích quy trình ba bước, dải chỉ số, thanh tiến độ tổng.
Duolingo mở app ra là thấy ngay đường đi.

Giờ còn: một **dải chỉ số bám đỉnh** (chuỗi ngày, XP, số bài, thanh tiến độ),
thẻ "kho báu tiếp theo" làm nút tiếp tục, rồi bản đồ. Trang từ 342 xuống 183
dòng.

Màu lấy từ token Hugo Studio (`--coder-blue`, `--coder-secondary`,
`--stage-color`), **không** mượn bảng xanh lá của Duolingo. Lối tương tác thì
theo Duolingo: nút tròn vát nổi lún khi bấm, đường đi lượn, rương cuối chặng.

## Bài qua bằng đọc

Không phải bài nào cũng nên có câu hỏi qua môn. "Vì sao mô hình bịa ra thứ nghe
thuyết phục" hay "khi nào KHÔNG nên dùng agent" là hiểu biết cần đọc kỹ, và mọi
cách đặt câu hỏi bốn lựa chọn cho chúng đều biến thành mẹo nhớ từ khoá.

`shared/readingLessons.js` khai bài nào qua bằng đọc và đọc bài viết nào. Hiện
có năm bài, đều thuộc phần AI: 61, 62, 86, 87, 88.

**Thời gian do máy chủ đo.** `ReadingSession` ghi mốc bắt đầu khi mở bài;
`POST /read/finish` tự trừ và trả 425 kèm số giây còn thiếu nếu chưa đủ. Client
chỉ được nói "tôi bắt đầu" và "tôi xong" — nếu tin `startedAt` trong body thì
bấm mở rồi khai lùi năm phút là qua bài.

`requiredMinutes` chốt lại tại thời điểm bắt đầu, không đọc lại từ học liệu lúc
kết thúc: admin sửa số phút giữa chừng thì người đang đọc dở không bị đổi luật.

**Cửa kiểm ở hai nơi, và nơi thật là server.** Giao diện khoá nút cho tới khi
hết giờ, nhưng `POST /api/joy/award-learning` cũng tự kiểm lại — khoá nút chỉ
ngăn bấm nhầm, không ngăn ai gọi thẳng API.

Đây **không** phải bằng chứng người học thực sự đọc: mở tab rồi đi pha trà vẫn
tính. Nó chặn đúng một thứ — bấm qua bài trong hai giây. Muốn đo hiểu thì phải
hỏi, mà hỏi thì lại quay về trắc nghiệm.

Không đo vị trí cuộn: đo cuộn chỉ chặn được người lười, không chặn được người
muốn gian, mà lại phạt oan người đọc trên màn hình lớn — cả bài hiện ra không
cần cuộn.

Kiểm tra: `npm run check:reading` (đã nằm trong `check:all`) đối chiếu mọi tiêu
đề khai trong `readingLessons.js` với bài viết thật trong kho, và thử lại luật
thời gian ở cả hai chiều.

## Quản lý người học

Admin trước đây chỉ có trang duyệt đồ án, tức chỉ thấy người đã đi tới cuối. Ai
đang học dở, ai kẹt ở đâu, ai bỏ giữa chừng thì không có chỗ nào xem.

`AdminLearnersTab` (tab Coder → **Người Học**) dựa trên hai endpoint:

- `GET /admin/learners` — danh sách có phân trang, lọc theo đề tài và trạng thái
  đồ án, tìm theo tên hoặc email. Mỗi dòng: số bài đã xong, chặng đang ở, **bài
  đang kẹt**, đề tài, số bài đọc đã hoàn thành, trạng thái đồ án.
- `GET /admin/learners/stuck` — mười bài đang chặn nhiều người nhất.

Khối "bài đang chặn nhiều người nhất" đặt trên cùng vì nó là thứ hành động được:
**ba người cùng kẹt ở một bài nghĩa là bài đó có vấn đề**, không phải ba người đó
lười. Đề mơ hồ, bộ chấm quá chặt, hoặc thiếu kiến thức dẫn nhập.

Cột "Hồ sơ đổi" cố tình **không** gọi là "học lần cuối": `Bio.updatedAt` đổi theo
mọi thay đổi hồ sơ, không riêng việc học. `completedLessons` là mảng chuỗi không
có mốc thời gian, nên hiện chưa có ngày học chính xác cho mọi người —
`LearningEvidence.occurredAt` có, nhưng chỉ với những ai đã bật minh chứng.

### Lỗi sửa kèm

`GET /admin/coder-submissions` lọc `completedLessons: 'lesson62'` với chú thích
"bài cuối của Chặng 5". Sai với lộ trình hiện tại: chặng 5 là bài **71–90**, còn
bài 62 nằm giữa chặng 4 — nên danh sách duyệt đồ án hiện cả những người còn cách
ngày tốt nghiệp gần bốn mươi bài. Trang này để duyệt đồ án, nên điều kiện đúng là
**đã nộp đồ án** (`hugoCoderProjectUrl` có giá trị).

## Học liệu do Hugo Studio biên soạn

`CoderResource` có thêm `type: 'article'`: toàn văn trong `body` (Markdown),
danh mục tham khảo chuẩn Harvard trong `references`, `readingMinutes` là số phút
đọc tối thiểu, `author` mặc định là ban biên soạn.

Vì sao tự biên soạn thay vì dẫn link ra ngoài: bài đọc bắt buộc mà trỏ tới trang
của người khác thì nội dung có thể đổi, có thể dựng tường chặn bot, có thể chết
link — mà học viên vẫn được tính là đã đọc. Kiểm tra thực tế lúc làm: ba trong
số hai mươi lăm trang tham khảo (W3C, MySQL) trả về 403 với công cụ tự động vì
Cloudflare chặn, dù trang vẫn sống với người thật.

Năm bài đầu tiên, tất cả về AI (đúng phần giáo trình còn mỏng nhất):

1. Mô hình ngôn ngữ lớn hoạt động thế nào
2. Kết nối mô hình ngôn ngữ vào ứng dụng web
3. Agent là gì, và khi nào bạn không cần agent
4. Khai báo công cụ cho mô hình: function calling từng bước
5. RAG: cho mô hình trả lời dựa trên dữ liệu của bạn

Mỗi bài 640–780 từ, đặt `readingMinutes: 5`. Con số đó dựa trên ~120 từ/phút cho
văn bản kỹ thuật tiếng Việt có khối mã và bảng — chậm hơn văn xuôi thường.

Nạp bằng `node server/scripts/seed-coder-resources.mjs` (chạy trong thư mục
`server/`). Chạy lại nhiều lần được: bài biên soạn khớp theo `title`, link tham
khảo khớp theo `url`.

**Quy tắc khi thêm bài:** mọi khẳng định tra cứu được phải dẫn về một mục trong
`references`, và mục đó phải là tài liệu chính chủ của đơn vị vận hành công nghệ
hoặc bài nghiên cứu công bố công khai. Không blog cá nhân, không nội dung do AI
sinh, không đường dẫn chưa kiểm chứng.
