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
