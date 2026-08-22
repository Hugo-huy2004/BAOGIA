/**
 * Học liệu do Hugo Studio biên soạn — toàn văn, trích dẫn chuẩn Harvard.
 *
 * Vì sao tự biên soạn thay vì dẫn link ra ngoài: bài đọc bắt buộc mà trỏ tới
 * trang của người khác thì nội dung có thể đổi, có thể dựng tường chặn, có thể
 * chết link — và học viên vẫn bị tính là "đã đọc". Toàn văn nằm trong kho của
 * mình thì kiểm soát được, dịch được, và trích dẫn được đúng nguồn gốc.
 *
 * Quy ước: `body` là Markdown; `references` là danh mục tham khảo Harvard, mỗi
 * phần tử một mục. Mọi khẳng định có thể tra cứu đều phải dẫn được về một mục
 * trong danh mục đó.
 */
const ACCESSED = '22 tháng 8 năm 2026';

export const CODER_ARTICLES = [
  {
    type: 'article',
    stageId: 'project',
    pinned: true,
    readingMinutes: 5,
    title: 'Mô hình ngôn ngữ lớn hoạt động thế nào',
    description: 'Token, cửa sổ ngữ cảnh và vì sao mô hình bịa ra thứ nghe rất thuyết phục. Đọc trước khi viết dòng mã gọi API đầu tiên.',
    body: `## Mô hình không hiểu, mô hình dự đoán

Một mô hình ngôn ngữ lớn (Large Language Model, LLM) làm đúng một việc: cho một
chuỗi ký hiệu đầu vào, nó ước lượng ký hiệu nào có xác suất xuất hiện tiếp theo
cao nhất, rồi sinh ra ký hiệu đó, rồi lặp lại. Toàn bộ cảm giác "nó hiểu tôi"
đến từ việc phép dự đoán này được huấn luyện trên một khối văn bản khổng lồ.

Điều đó có một hệ quả mà lập trình viên phải nắm trước khi làm bất cứ tính năng
AI nào: **mô hình không có khái niệm đúng hay sai, chỉ có khái niệm hợp lý về
mặt thống kê**. Một câu trả lời sai mà trôi chảy có xác suất cao hơn một câu trả
lời đúng mà lủng củng. Đây là nguồn gốc của hiện tượng thường được gọi là "ảo
giác" (hallucination), và nó không phải lỗi cài đặt để chờ bản vá.

## Token: đơn vị mô hình thực sự nhìn thấy

Mô hình không đọc ký tự và cũng không đọc từ. Nó đọc **token** — những mảnh văn
bản do một bộ tách token quy định. Trong tiếng Anh, một token trung bình khoảng
bốn ký tự. Tiếng Việt có dấu nên tốn token hơn đáng kể cho cùng một lượng nghĩa.

Ba hệ quả thực tế:

1. **Chi phí tính theo token**, không theo số câu. Một lời nhắc dài dòng bằng
   tiếng Việt có thể đắt gấp rưỡi bản tiếng Anh cùng nội dung.
2. **Giới hạn ngữ cảnh tính theo token.** Cửa sổ ngữ cảnh là tổng số token cả
   đầu vào lẫn đầu ra mà mô hình xử lý được trong một lượt.
3. **Cắt chuỗi không an toàn.** Cắt văn bản theo ký tự có thể chẻ đôi một token
   và làm hỏng nghĩa; hãy cắt theo ranh giới câu hoặc đoạn.

## Cửa sổ ngữ cảnh không phải trí nhớ

Mô hình không nhớ cuộc trò chuyện trước. Mỗi lần gọi API, **toàn bộ lịch sử phải
được gửi lại** trong phần đầu vào. Cái mà người dùng cảm nhận là "nó nhớ" thực ra
là ứng dụng của bạn đang gửi lại lịch sử ở mỗi lượt.

Do đó chi phí của một cuộc hội thoại tăng theo bình phương độ dài nếu bạn gửi
lại tất cả. Ứng dụng nghiêm túc phải có chiến lược cắt gọt: giữ n lượt gần nhất,
tóm tắt phần cũ, hoặc chỉ nạp lại phần liên quan tới câu hỏi hiện tại — cách cuối
chính là ý tưởng nền của RAG.

## Nhiệt độ và tính lặp lại

Tham số nhiệt độ (temperature) điều khiển mức ngẫu nhiên khi chọn token tiếp
theo. Nhiệt độ thấp cho đầu ra ổn định và lặp lại được; nhiệt độ cao cho đầu ra
đa dạng hơn nhưng khó đoán hơn.

Quy tắc thực hành: **mọi tính năng mà kết quả được đưa vào cơ sở dữ liệu phải
chạy ở nhiệt độ thấp và phải ép định dạng đầu ra**. Nhiệt độ cao chỉ hợp với
những chỗ mà sự đa dạng chính là giá trị, ví dụ gợi ý ý tưởng.

Kể cả ở nhiệt độ 0, đầu ra vẫn có thể khác nhau giữa các lần gọi do cách nhà
cung cấp phân bổ phần cứng. Đừng bao giờ viết kiểm thử khẳng định mô hình trả về
đúng một chuỗi ký tự.

## Vì sao kiến trúc Transformer làm được việc này

Trước năm 2017, các mô hình xử lý chuỗi đọc văn bản tuần tự nên rất khó song song
hoá và hay quên phần đầu của chuỗi dài. Vaswani và cộng sự (2017) đề xuất kiến
trúc Transformer, trong đó cơ chế tự chú ý (self-attention) cho phép mỗi token
nhìn thẳng vào mọi token khác trong chuỗi, bất kể khoảng cách, và toàn bộ phép
tính đó song song hoá được trên GPU.

Đó là lý do kỹ thuật khiến việc huấn luyện ở quy mô rất lớn trở nên khả thi, và
mọi mô hình ngôn ngữ lớn đang dùng phổ biến hiện nay đều là biến thể của kiến
trúc này.

## Điều cần nhớ khi lập trình

- Mô hình sinh văn bản có xác suất cao, không tra cứu sự thật.
- Mọi đầu ra đưa vào hệ thống phải được kiểm tra lại bằng mã của bạn.
- Ngữ cảnh là thứ bạn gửi đi, không phải thứ mô hình tự nhớ.
- Chi phí và giới hạn đều tính bằng token, và tiếng Việt tốn token hơn.`,
    references: [
      `Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A.N., Kaiser, Ł. và Polosukhin, I. (2017) 'Attention is all you need', trong Advances in Neural Information Processing Systems 30. Có tại: https://arxiv.org/abs/1706.03762 (Truy cập: ${ACCESSED}).`,
      `Google (2026) Prompting strategies. Google AI for Developers. Có tại: https://ai.google.dev/gemini-api/docs/prompting-strategies (Truy cập: ${ACCESSED}).`,
    ],
  },

  {
    type: 'article',
    stageId: 'project',
    pinned: true,
    readingMinutes: 5,
    title: 'Kết nối mô hình ngôn ngữ vào ứng dụng web',
    description: 'Khoá API đặt ở đâu, ép đầu ra thành JSON, xử lý hạn mức và lỗi. Phần kỹ thuật cụ thể của tính năng AI trong đồ án.',
    body: `## Nguyên tắc số một: khoá API không bao giờ ở trình duyệt

Khoá API là thông tin xác thực có khả năng tiêu tiền. Bất cứ thứ gì gửi tới
trình duyệt đều đọc được — kể cả khi nằm trong biến môi trường lúc dựng bản, kể
cả khi đã làm rối mã. Chỉ cần mở tab Network là thấy.

Kiến trúc đúng chỉ có một hình dạng:

\`\`\`
Trình duyệt  →  Máy chủ của bạn  →  API mô hình
             ↑ đã xác thực       ↑ giữ khoá, đếm hạn mức
\`\`\`

Máy chủ của bạn là nơi duy nhất giữ khoá, và cũng là nơi duy nhất áp được ba thứ
mà nhà cung cấp không làm hộ: xác thực người dùng, giới hạn tần suất theo tài
khoản, và ghi nhật ký để đối soát chi phí.

## Luôn ép đầu ra về JSON có schema

Phân tích văn bản tự do bằng biểu thức chính quy là cách chắc chắn để có lỗi
trong sản xuất. Mô hình hôm nay trả về \`{"ten": "..."}\`, ngày mai thêm một câu
dẫn nhập trước dấu ngoặc, và bộ phân tích của bạn vỡ.

Các API hiện đại cho phép khai báo schema đầu ra, và mô hình bị buộc sinh ra dữ
liệu khớp schema đó (Google, 2026a):

\`\`\`javascript
const schema = {
  type: "object",
  properties: {
    tomTat: { type: "string" },
    theLoai: { type: "string", enum: ["tin", "huong-dan", "hoi-dap"] },
    doTinCay: { type: "number" },
  },
  required: ["tomTat", "theLoai"],
};
\`\`\`

**Ép schema vẫn chưa đủ.** Schema bảo đảm hình dạng, không bảo đảm nội dung.
Mô hình có thể trả về một mã sản phẩm đúng định dạng nhưng không tồn tại trong
kho. Sau khi nhận JSON, mã của bạn phải kiểm tra lại giá trị đối chiếu với cơ sở
dữ liệu — quy tắc là **hình dạng do schema lo, sự thật do bạn lo**.

## Thiết kế cho thất bại, vì thất bại là bình thường

Gọi API mô hình khác gọi một hàm nội bộ ở chỗ nó thất bại thường xuyên và thất
bại theo nhiều kiểu:

| Tình huống | Xử lý đúng |
| --- | --- |
| Hết hạn mức (429) | Chờ tăng dần rồi thử lại, tối đa vài lần |
| Máy chủ lỗi (5xx) | Thử lại, sau đó chuyển sang phương án dự phòng |
| Quá thời gian | Đặt hạn thời gian rõ ràng, đừng chờ vô hạn |
| Nội dung bị chặn | Thông báo cho người dùng, không thử lại |
| Hết ngân sách tháng | Tắt tính năng, giữ ứng dụng chạy bình thường |

Nguyên tắc bao trùm: **tính năng AI hỏng không được làm hỏng ứng dụng**. Nếu gợi
ý sản phẩm không sinh được, trang sản phẩm vẫn phải mở. Trong mã nguồn của chính
Hugo Studio, mọi lời gọi mô hình đều đi qua một lớp trung gian lo hạn mức, bộ nhớ
đệm, thử lại và công tắc tắt khẩn cấp — không route nào gọi thẳng thư viện của
nhà cung cấp.

## Luồng chảy (streaming) và trải nghiệm chờ

Một câu trả lời dài mất vài giây để sinh xong. Chờ trắng màn hình vài giây là
trải nghiệm tệ. Chế độ luồng chảy trả về từng phần ngay khi có, giúp người dùng
thấy phản hồi gần như tức thì.

Nhưng luồng chảy chỉ hợp với **văn bản để người đọc**. Với đầu ra JSON dùng cho
máy, hãy đợi trọn vẹn — JSON dở dang không phân tích được, và ghép thủ công các
mảnh là mời gọi lỗi.

## Đo trước khi tối ưu

Ba con số phải ghi lại cho mỗi lời gọi: số token đầu vào, số token đầu ra, và độ
trễ. Không có ba con số này thì mọi câu hỏi về chi phí đều là phỏng đoán, và bạn
sẽ chỉ biết mình dùng quá tay khi nhận hoá đơn.

## Bảng kiểm trước khi nộp đồ án

- Khoá API chỉ tồn tại ở phía máy chủ, không có trong mã nguồn đã đẩy lên kho.
- Endpoint AI có xác thực và có giới hạn tần suất theo tài khoản.
- Đầu ra ép theo schema, và được kiểm tra lại đối chiếu dữ liệu thật.
- Có phương án dự phòng khi mô hình không phản hồi.
- Có ghi nhật ký token và độ trễ.`,
    references: [
      `Google (2026a) Structured output. Google AI for Developers. Có tại: https://ai.google.dev/gemini-api/docs/structured-output (Truy cập: ${ACCESSED}).`,
      `Google (2026b) Function calling with the Gemini API. Google AI for Developers. Có tại: https://ai.google.dev/gemini-api/docs/function-calling (Truy cập: ${ACCESSED}).`,
      `OWASP Foundation (2025) OWASP Top 10. Có tại: https://owasp.org/www-project-top-ten/ (Truy cập: ${ACCESSED}).`,
    ],
  },

  {
    type: 'article',
    stageId: 'project',
    pinned: true,
    readingMinutes: 5,
    title: 'Agent là gì, và khi nào bạn không cần agent',
    description: 'Phân biệt quy trình cố định với agent thật. Phần lớn bài toán được gán nhãn agent chỉ cần một chuỗi lời gọi có sẵn.',
    body: `## Định nghĩa hẹp và có ích

Trong kỹ thuật, **agent** là hệ thống trong đó mô hình ngôn ngữ tự quyết định
gọi công cụ nào, theo thứ tự nào, và khi nào thì dừng. Điểm mấu chốt nằm ở chữ
*tự quyết định*: luồng điều khiển do mô hình chọn tại thời điểm chạy, không do
lập trình viên viết sẵn.

Đối lập với nó là **quy trình cố định** (workflow): các bước do bạn viết ra, mô
hình chỉ được gọi ở những chỗ đã định trước.

Phân biệt này quan trọng vì hai thứ có đặc tính vận hành hoàn toàn khác nhau:

| | Quy trình cố định | Agent |
| --- | --- | --- |
| Luồng điều khiển | Lập trình viên viết | Mô hình quyết định |
| Chi phí mỗi lượt | Đoán trước được | Không đoán trước được |
| Gỡ lỗi | Đọc mã là ra | Phải đọc lại nhật ký từng bước |
| Phù hợp khi | Biết trước các bước | Không biết trước cần bao nhiêu bước |

## Vòng lặp làm nên một agent

Yao và cộng sự (2023) mô tả mẫu ReAct: mô hình xen kẽ giữa suy luận và hành
động. Rút gọn thành mã, một agent chỉ là vòng lặp sau:

\`\`\`javascript
let messages = [systemPrompt, userMessage];
for (let step = 0; step < MAX_STEPS; step += 1) {
  const reply = await model.generate({ messages, tools });
  if (!reply.toolCall) return reply.text;          // mô hình cho rằng đã xong
  const result = await runTool(reply.toolCall);     // ứng dụng thi hành
  messages = [...messages, reply, toolResult(result)];
}
throw new Error('Vượt quá số bước cho phép');
\`\`\`

Ba chi tiết trong đoạn mã trên là toàn bộ phần khó:

1. **\`MAX_STEPS\` không được thiếu.** Không có nó, một mô hình lẫn lộn có thể
   gọi công cụ vô hạn và đốt sạch hạn mức trong vài phút.
2. **\`runTool\` chạy bằng quyền của ứng dụng, không phải quyền của mô hình.**
   Mô hình đề nghị; mã của bạn quyết định có thi hành hay không.
3. **Vòng lặp lớn dần theo mỗi bước**, nên chi phí tăng nhanh hơn trực giác.

## Khi nào không nên dùng agent

Anthropic (2024) khuyến nghị dùng giải pháp đơn giản nhất còn đáp ứng được yêu
cầu, và chỉ chuyển sang agent khi tính linh hoạt thực sự cần thiết. Đây là lời
khuyên kỹ thuật, không phải khiêm tốn.

Với đồ án tốt nghiệp, gần như mọi tính năng AI hợp lý đều là quy trình cố định:

- Tóm tắt một bài đăng → một lời gọi.
- Phân loại lý do khám → một lời gọi, ép JSON.
- Gợi ý sách theo lịch sử mượn → một truy vấn cơ sở dữ liệu rồi một lời gọi.

Không có bài nào cần mô hình tự chọn thứ tự các bước. Dùng agent ở đây làm hệ
thống khó đoán hơn, đắt hơn và khó gỡ lỗi hơn mà không đổi lại lợi ích nào.

Agent chỉ xứng đáng khi **số bước không biết trước**: dò lỗi trong một kho mã,
tra cứu nhiều nguồn cho tới khi đủ dữ kiện, thao tác trên môi trường mà kết quả
mỗi bước quyết định bước sau.

## Nếu vẫn muốn làm agent, hãy làm cho an toàn

- Danh sách công cụ càng ngắn càng tốt; mỗi công cụ một việc rõ ràng.
- Công cụ ghi dữ liệu phải có bước xác nhận của người dùng.
- Đặt trần số bước, trần token và hạn thời gian cho mỗi phiên.
- Ghi nhật ký từng bước; không có nhật ký thì không gỡ lỗi được.
- Coi mọi đối số mô hình truyền vào là dữ liệu do người lạ nhập, và kiểm tra
  đúng như vậy.

## Câu hỏi tự kiểm

Trước khi gọi thứ mình xây là agent, hãy trả lời: *nếu tôi viết cứng thứ tự các
bước thì có mất gì không?* Không mất gì, nghĩa là bạn đang cần một quy trình cố
định, và như vậy tốt hơn.`,
    references: [
      `Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K. và Cao, Y. (2023) 'ReAct: synergizing reasoning and acting in language models', trong International Conference on Learning Representations (ICLR). Có tại: https://arxiv.org/abs/2210.03629 (Truy cập: ${ACCESSED}).`,
      `Anthropic (2024) Building effective agents. Có tại: https://www.anthropic.com/engineering/building-effective-agents (Truy cập: ${ACCESSED}).`,
      `Model Context Protocol (2025) Specification 2025-06-18. Có tại: https://modelcontextprotocol.io/specification/2025-06-18 (Truy cập: ${ACCESSED}).`,
    ],
  },

  {
    type: 'article',
    stageId: 'project',
    readingMinutes: 5,
    title: 'Khai báo công cụ cho mô hình: function calling từng bước',
    description: 'Cách mô tả một hàm để mô hình gọi được, vòng lặp trao đổi, và những chỗ dễ mở ra lỗ hổng bảo mật.',
    body: `## Mô hình không chạy hàm của bạn

Hiểu lầm phổ biến nhất về function calling: người ta tưởng mô hình thi hành hàm.
Nó không thi hành gì cả. Nó chỉ trả về một thông điệp có nội dung đại ý "tôi
muốn gọi hàm \`timSach\` với tham số \`{ tacGia: 'Nguyễn Nhật Ánh' }\`".

**Ứng dụng của bạn là bên thi hành**, và vì thế cũng là bên chịu trách nhiệm.
Mọi câu hỏi về bảo mật đều quy về câu này.

## Ba bước của một lượt trao đổi

**Bước 1 — khai báo công cụ.** Mô tả hàm bằng JSON Schema. Phần \`description\`
không phải chú thích cho người đọc: đó là thứ duy nhất mô hình dựa vào để quyết
định khi nào gọi hàm, nên hãy viết nó cẩn thận (Google, 2026).

\`\`\`javascript
const tools = [{
  name: "timSach",
  description: "Tìm sách trong kho thư viện theo tên hoặc tác giả. " +
               "Chỉ dùng khi người dùng hỏi về sách có trong thư viện.",
  parameters: {
    type: "object",
    properties: {
      tuKhoa: { type: "string", description: "Tên sách hoặc tên tác giả" },
      soLuong: { type: "integer", description: "Số kết quả, mặc định 5" },
    },
    required: ["tuKhoa"],
  },
}];
\`\`\`

**Bước 2 — mô hình đề nghị gọi.** Bạn nhận về tên hàm và các đối số.

**Bước 3 — thi hành và trả kết quả.** Chạy hàm thật, đưa kết quả trở lại cuộc
hội thoại, gọi mô hình lần nữa để nó diễn đạt thành câu trả lời cho người dùng.

## Đối số từ mô hình là dữ liệu chưa tin cậy

Đây là phần dễ sai nhất, và sai thì hậu quả nặng.

Mô hình sinh đối số từ câu chữ của người dùng. Nếu người dùng viết một câu được
dàn dựng khéo, đối số sinh ra có thể mang nội dung tấn công — kỹ thuật này gọi
là tiêm lời nhắc (prompt injection). Do đó:

\`\`\`javascript
// SAI — nối thẳng đối số vào câu truy vấn
const rows = await db.query(\`SELECT * FROM books WHERE author = '\${args.tuKhoa}'\`);

// ĐÚNG — tham số hoá, và kiểm tra như mọi đầu vào khác
const tuKhoa = String(args.tuKhoa || '').slice(0, 100);
const rows = await db.query('SELECT * FROM books WHERE author = ? LIMIT ?', [tuKhoa, limit]);
\`\`\`

Nguyên tắc: **đối số do mô hình truyền vào phải đi qua đúng lớp kiểm tra mà bạn
áp cho dữ liệu người dùng nhập** — không được nhẹ tay hơn một chút nào.

## Quyền hạn: công cụ chỉ được làm điều đã cho phép

Hàm được khai báo cho mô hình chạy dưới quyền nào? Câu trả lời đúng: dưới quyền
của **người dùng đang đăng nhập**, không phải quyền quản trị.

Nếu \`xoaSach\` được khai báo là công cụ, và phiên hiện tại là bạn đọc chứ không
phải thủ thư, thì lời gọi đó phải bị từ chối ở tầng dịch vụ — đúng như khi người
đó bấm nút xoá trên giao diện. Mô hình không phải một vai trò trong hệ thống
phân quyền của bạn.

Với công cụ gây thay đổi khó hoàn tác, hãy chèn bước xác nhận của con người:
mô hình đề nghị, giao diện hỏi lại, người dùng bấm đồng ý, khi đó mới thi hành.

## Bảng kiểm khi thêm một công cụ

- Mô tả hàm nói rõ *khi nào dùng* và *khi nào không dùng*.
- Mọi tham số có kiểu và giới hạn độ dài.
- Đối số được kiểm tra và tham số hoá như đầu vào của người lạ.
- Công cụ chạy dưới quyền của phiên đăng nhập hiện tại.
- Công cụ ghi dữ liệu có bước xác nhận của người dùng.
- Có trần số lần gọi trong một phiên.`,
    references: [
      `Google (2026) Function calling with the Gemini API. Google AI for Developers. Có tại: https://ai.google.dev/gemini-api/docs/function-calling (Truy cập: ${ACCESSED}).`,
      `Model Context Protocol (2025) Specification 2025-06-18. Có tại: https://modelcontextprotocol.io/specification/2025-06-18 (Truy cập: ${ACCESSED}).`,
      `OWASP Foundation (2025) OWASP Cheat Sheet Series: SQL Injection Prevention. Có tại: https://cheatsheetseries.owasp.org/ (Truy cập: ${ACCESSED}).`,
    ],
  },

  {
    type: 'article',
    stageId: 'project',
    readingMinutes: 5,
    title: 'RAG: cho mô hình trả lời dựa trên dữ liệu của bạn',
    description: 'Vì sao nhồi hết dữ liệu vào lời nhắc là sai, và quy trình chia đoạn, nhúng vector, truy hồi rồi mới sinh câu trả lời.',
    body: `## Bài toán

Mô hình không biết gì về cơ sở dữ liệu của bạn. Muốn nó trả lời "thư viện còn
cuốn nào của Nguyễn Nhật Ánh?", bạn phải đưa dữ liệu đó vào ngữ cảnh.

Cách ngây thơ là nhồi toàn bộ danh mục vào lời nhắc. Cách này hỏng vì ba lý do:
cửa sổ ngữ cảnh có hạn, chi phí tính theo token nên mỗi câu hỏi đều trả tiền cho
toàn bộ danh mục, và mô hình trả lời kém đi khi phải lọc trong một đống dữ liệu
phần lớn không liên quan.

## Ý tưởng: truy hồi trước, sinh sau

Lewis và cộng sự (2020) đề xuất cách làm mà nay gọi là RAG (Retrieval-Augmented
Generation): **tìm phần dữ liệu liên quan trước, chỉ đưa phần đó vào ngữ cảnh,
rồi mới yêu cầu mô hình trả lời**.

\`\`\`
Câu hỏi → tìm k đoạn liên quan nhất → ghép vào lời nhắc → mô hình sinh câu trả lời
\`\`\`

Bạn trả tiền cho vài đoạn thay vì cả kho, và mô hình có ít nhiễu hơn để lạc.

## Bốn bước cài đặt

**1. Chia đoạn (chunking).** Cắt tài liệu thành các đoạn vừa phải. Cắt quá nhỏ
thì mất ngữ cảnh; quá lớn thì mỗi kết quả kéo theo nhiều phần thừa. Hãy cắt theo
ranh giới tự nhiên — tiêu đề, đoạn văn — chứ không theo số ký tự cứng, và cho các
đoạn chồng lấn nhẹ để câu bị cắt ngang vẫn còn ngữ cảnh ở đoạn kế bên.

**2. Nhúng vector (embedding).** Mỗi đoạn được chuyển thành một vector số. Hai
đoạn gần nghĩa nhau thì hai vector gần nhau. Đây là điều làm cho tìm kiếm ngữ
nghĩa khác tìm kiếm từ khoá: hỏi "sách thiếu nhi" vẫn tìm ra đoạn viết "truyện
cho trẻ em" dù không trùng chữ nào.

**3. Truy hồi.** Nhúng câu hỏi thành vector, tìm k đoạn có vector gần nhất. Với
đồ án quy mô vài nghìn đoạn, **không cần cơ sở dữ liệu vector chuyên dụng** —
lưu vector trong bảng thường rồi tính độ tương đồng cosine là đủ nhanh. Chỉ khi
số đoạn lên tới hàng trăm nghìn thì chỉ mục vector mới đáng công.

**4. Sinh câu trả lời.** Ghép các đoạn tìm được vào lời nhắc kèm chỉ dẫn rõ
ràng: *chỉ trả lời dựa trên tài liệu được cung cấp; nếu không có thông tin thì
nói không biết*. Không có câu này, mô hình sẽ điền vào chỗ trống bằng kiến thức
chung của nó, và bạn có một câu trả lời sai nghe rất thuyết phục.

## Luôn trích dẫn nguồn

Mỗi đoạn đưa vào ngữ cảnh nên mang theo định danh, và câu trả lời nên chỉ ra nó
dựa vào đoạn nào. Việc này có ba lợi ích: người dùng kiểm chứng được, bạn gỡ lỗi
được khi câu trả lời sai, và bản thân sự hiện diện của trích dẫn làm giảm xu
hướng bịa của mô hình.

## Khi câu trả lời sai, sai ở đâu?

Đây là câu hỏi vận hành quan trọng nhất, và nó chỉ có hai đáp án:

- **Truy hồi sai** — đoạn cần thiết không nằm trong k đoạn lấy về. Sửa ở khâu
  chia đoạn, cách nhúng, hoặc tăng k.
- **Sinh sai** — đoạn đúng đã có trong ngữ cảnh nhưng mô hình vẫn trả lời sai.
  Sửa ở lời nhắc, hoặc ở cách trình bày ngữ cảnh.

Muốn phân biệt hai trường hợp, hãy ghi lại các đoạn đã truy hồi cho mỗi câu hỏi.
Không có nhật ký này thì mọi nỗ lực cải thiện đều là đoán mò.

## Đánh giá: một bộ câu hỏi nhỏ còn hơn cảm tính

Hãy dựng một tập ba mươi câu hỏi kèm đáp án đúng, và chạy lại toàn bộ sau mỗi
lần chỉnh. Không có nó, "tôi thấy lần này trả lời hay hơn" là toàn bộ cơ sở để
bạn ra quyết định — và cảm giác đó thường sai.`,
    references: [
      `Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S. và Kiela, D. (2020) 'Retrieval-augmented generation for knowledge-intensive NLP tasks', trong Advances in Neural Information Processing Systems 33. Có tại: https://arxiv.org/abs/2005.11401 (Truy cập: ${ACCESSED}).`,
      `Vaswani, A. và cộng sự (2017) 'Attention is all you need', trong Advances in Neural Information Processing Systems 30. Có tại: https://arxiv.org/abs/1706.03762 (Truy cập: ${ACCESSED}).`,
      `Anthropic (2024) Building effective agents. Có tại: https://www.anthropic.com/engineering/building-effective-agents (Truy cập: ${ACCESSED}).`,
    ],
  },
];
