import 'dotenv/config';
import mongoose from 'mongoose';
import CoderResource from '../models/CoderResource.js';
import { CODER_ARTICLES } from './data/coderArticles.mjs';

/**
 * Nạp học liệu tham khảo cho Study with Hugo.
 *
 * Mọi mục ở đây là TÀI LIỆU CHÍNH CHỦ của đơn vị vận hành công nghệ đó, hoặc
 * bài nghiên cứu / tiêu chuẩn công bố công khai. Không có bài blog cá nhân,
 * không có nội dung do AI viết, không có đường dẫn tự bịa: bài đọc bắt buộc mà
 * dẫn tới nguồn sai thì tệ hơn là không có bài đọc nào.
 *
 * Chạy: node server/scripts/seed-coder-resources.mjs
 * Chạy lại được nhiều lần — khớp theo `url` nên không sinh bản trùng.
 */
const RESOURCES = [
  // ── Chặng 1: nền tảng web ────────────────────────────────────────────────
  {
    stageId: 'basic',
    type: 'document',
    title: 'HTML — Ngôn ngữ đánh dấu siêu văn bản',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    source: 'MDN Web Docs — Mozilla',
    description: 'Tài liệu tham chiếu đầy đủ về mọi thẻ HTML và ngữ nghĩa của chúng. Đây là nguồn tra cứu chuẩn của nghề, không phải bài hướng dẫn nhanh.',
  },
  {
    stageId: 'basic',
    type: 'document',
    title: 'CSS Box Model — mô hình hộp',
    url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model',
    source: 'MDN Web Docs — Mozilla',
    description: 'Hiểu sai box model là gốc của phần lớn lỗi bố cục. Đọc kỹ phần phân biệt content-box và border-box.',
  },
  {
    stageId: 'basic',
    type: 'document',
    title: 'MySQL 8.4 — Hướng dẫn chính thức',
    url: 'https://dev.mysql.com/doc/refman/8.4/en/tutorial.html',
    source: 'Oracle — MySQL Reference Manual',
    description: 'Tài liệu gốc của MySQL. Dùng làm nguồn tra cứu cú pháp thay vì các trang tổng hợp lại.',
  },

  // ── Chặng 2: kiến trúc ───────────────────────────────────────────────────
  {
    stageId: 'intermediate',
    type: 'document',
    title: 'RFC 9110 — HTTP Semantics',
    url: 'https://www.rfc-editor.org/rfc/rfc9110.html',
    source: 'IETF — Internet Engineering Task Force',
    description: 'Tiêu chuẩn định nghĩa ý nghĩa của từng phương thức và mã trạng thái HTTP. Khi tranh luận "trả 200 hay 204", đây là nơi có câu trả lời.',
  },
  {
    stageId: 'intermediate',
    type: 'document',
    title: 'Architectural Styles and the Design of Network-based Software Architectures',
    url: 'https://ics.uci.edu/~fielding/pubs/dissertation/top.htm',
    source: 'Roy T. Fielding — Luận án tiến sĩ, UC Irvine (2000)',
    description: 'Luận án gốc định nghĩa REST. Chương 5 là phần định nghĩa REST thật sự — đọc nó rồi sẽ thấy phần lớn thứ được gọi là "REST API" không phải REST.',
  },
  {
    stageId: 'intermediate',
    type: 'document',
    title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
    url: 'https://www.w3.org/TR/WCAG22/',
    source: 'W3C — World Wide Web Consortium',
    description: 'Tiêu chuẩn tiếp cận. Phần độ tương phản và thứ tự tiêu điểm là yêu cầu tối thiểu cho mọi giao diện nộp bài.',
  },

  // ── Chặng 3: giải thuật và mật mã ────────────────────────────────────────
  {
    stageId: 'advanced',
    type: 'document',
    title: 'FIPS 197 — Advanced Encryption Standard (AES)',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197-upd1.pdf',
    source: 'NIST — Viện Tiêu chuẩn và Công nghệ Quốc gia Hoa Kỳ',
    description: 'Văn bản tiêu chuẩn định nghĩa AES. Đọc để biết mã hoá đối xứng thật sự được đặc tả thế nào, thay vì học qua ví dụ.',
  },
  {
    stageId: 'advanced',
    type: 'document',
    title: 'NIST SP 800-63B — Hướng dẫn xác thực số',
    url: 'https://pages.nist.gov/800-63-3/sp800-63b.html',
    source: 'NIST — Digital Identity Guidelines',
    description: 'Quy tắc chuẩn về mật khẩu: vì sao bắt đổi mật khẩu định kỳ là phản tác dụng, và độ dài quan trọng hơn ký tự đặc biệt.',
  },
  {
    stageId: 'advanced',
    type: 'document',
    title: 'ECMAScript — Đặc tả ngôn ngữ',
    url: 'https://tc39.es/ecma262/',
    source: 'TC39 — Ecma International',
    description: 'Đặc tả gốc của JavaScript. Dùng khi cần biết chính xác một cấu trúc hoạt động ra sao, không phải khi học lần đầu.',
  },

  // ── Chặng 4: bảo mật ─────────────────────────────────────────────────────
  {
    stageId: 'security',
    type: 'document',
    title: 'OWASP Top 10 — Rủi ro bảo mật ứng dụng web',
    url: 'https://owasp.org/www-project-top-ten/',
    source: 'OWASP Foundation',
    description: 'Danh sách rủi ro được cả ngành lấy làm chuẩn. Đồ án tốt nghiệp phải trả lời được mình đã xử lý những mục nào.',
  },
  {
    stageId: 'security',
    type: 'document',
    title: 'OWASP Cheat Sheet Series',
    url: 'https://cheatsheetseries.owasp.org/',
    source: 'OWASP Foundation',
    description: 'Hướng dẫn phòng thủ cụ thể theo từng loại tấn công: SQL injection, XSS, CSRF, lưu mật khẩu. Tra khi làm chứ không đọc một lượt.',
  },
  {
    stageId: 'security',
    type: 'document',
    title: 'RFC 9700 — Best Current Practice for OAuth 2.0 Security',
    url: 'https://www.rfc-editor.org/rfc/rfc9700.html',
    source: 'IETF — Internet Engineering Task Force',
    description: 'Thực hành bảo mật hiện hành cho OAuth 2.0. Đọc trước khi tự dựng luồng đăng nhập bằng bên thứ ba.',
  },
  {
    stageId: 'security',
    type: 'document',
    title: 'Content Security Policy Level 3',
    url: 'https://www.w3.org/TR/CSP3/',
    source: 'W3C — World Wide Web Consortium',
    description: 'Đặc tả CSP. Phần nonce và strict-dynamic là cách thoát khỏi unsafe-inline mà vẫn chạy được ứng dụng thật.',
  },

  // ── Chặng 5: AI, agent và LLM ────────────────────────────────────────────
  {
    stageId: 'project',
    type: 'document',
    title: 'Attention Is All You Need',
    url: 'https://arxiv.org/abs/1706.03762',
    source: 'Vaswani và cộng sự — NeurIPS 2017',
    description: 'Bài báo giới thiệu kiến trúc Transformer, nền tảng của mọi mô hình ngôn ngữ lớn hiện nay. Đọc phần tóm tắt và mục 3 là đủ để hiểu vì sao LLM hoạt động được.',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    url: 'https://arxiv.org/abs/2005.11401',
    source: 'Lewis và cộng sự — NeurIPS 2020',
    description: 'Bài báo gốc của RAG. Đây là cách đúng để cho mô hình trả lời dựa trên dữ liệu của bạn thay vì nhồi hết vào lời nhắc.',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    url: 'https://arxiv.org/abs/2210.03629',
    source: 'Yao và cộng sự — ICLR 2023',
    description: 'Bài báo đặt nền cho khái niệm agent: mô hình vừa suy luận vừa gọi công cụ theo vòng lặp. Hiểu bài này rồi mới hiểu vì sao agent không phải là một lời nhắc dài.',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'Function calling — Gemini API',
    url: 'https://ai.google.dev/gemini-api/docs/function-calling',
    source: 'Google AI for Developers',
    description: 'Tài liệu chính chủ về cách khai báo công cụ cho mô hình và xử lý lời gọi trả về. Đây là cơ chế thật đứng sau chữ "agent".',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'Structured output — Gemini API',
    url: 'https://ai.google.dev/gemini-api/docs/structured-output',
    source: 'Google AI for Developers',
    description: 'Ép mô hình trả về JSON đúng schema. Bắt buộc đọc trước khi làm tính năng AI của đồ án — không bao giờ phân tích văn bản tự do bằng biểu thức chính quy.',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'Model Context Protocol — Đặc tả',
    url: 'https://modelcontextprotocol.io/specification/2025-06-18',
    source: 'Model Context Protocol (Anthropic)',
    description: 'Giao thức chuẩn để mô hình kết nối với công cụ và nguồn dữ liệu bên ngoài. Đọc phần kiến trúc để thấy ranh giới giữa máy chủ công cụ và mô hình.',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'Building effective agents',
    url: 'https://www.anthropic.com/engineering/building-effective-agents',
    source: 'Anthropic — Engineering',
    description: 'Phân biệt quy trình có sẵn (workflow) với agent thật, và khi nào KHÔNG nên dùng agent. Phần lớn bài toán chỉ cần một chuỗi lời gọi cố định.',
  },
  {
    stageId: 'project',
    type: 'document',
    title: 'Prompt engineering — Hướng dẫn chính thức',
    url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies',
    source: 'Google AI for Developers',
    description: 'Chiến lược viết lời nhắc từ nhà cung cấp mô hình. Dùng thay cho các mẹo truyền miệng trên mạng xã hội.',
  },

  // ── Chặng 6: vận hành ────────────────────────────────────────────────────
  {
    stageId: 'devops',
    type: 'document',
    title: 'Nginx — Tài liệu quản trị chính thức',
    url: 'https://nginx.org/en/docs/',
    source: 'Nginx / F5',
    description: 'Tài liệu gốc. Phần proxy ngược và bộ nhớ đệm là hai chương cần cho bài 94.',
  },
  {
    stageId: 'devops',
    type: 'document',
    title: 'Let\'s Encrypt — Cách hoạt động',
    url: 'https://letsencrypt.org/how-it-works/',
    source: 'Internet Security Research Group (ISRG)',
    description: 'Giải thích quy trình cấp chứng chỉ tự động. Biết cơ chế rồi thì gỡ lỗi certbot không còn là đoán mò.',
  },
  {
    stageId: 'devops',
    type: 'document',
    title: 'Core Web Vitals — Định nghĩa và ngưỡng',
    url: 'https://web.dev/articles/vitals',
    source: 'Google — web.dev',
    description: 'Định nghĩa chính thức của LCP, INP, CLS kèm ngưỡng đạt. Đồ án phải đo được và báo cáo ba chỉ số này.',
  },
  {
    stageId: 'all',
    type: 'document',
    title: 'Pro Git — Sách đầy đủ, miễn phí',
    url: 'https://git-scm.com/book/en/v2',
    source: 'Scott Chacon, Ben Straub — Apress (CC BY-NC-SA)',
    description: 'Sách Git chính thức của dự án Git. Chương 3 về nhánh là phần quyết định khi làm việc nhóm.',
  },
];

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Thiếu MONGO_URI trong server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  let created = 0;
  let updated = 0;

  // Bài Hugo Studio biên soạn khớp theo `title` (không có url); link tham khảo
  // khớp theo `url`. Cả hai đều chạy lại được nhiều lần mà không sinh bản trùng.
  const upsert = async (doc, filter) => {
    const result = await CoderResource.updateOne(filter, { $set: doc }, { upsert: true });
    if (result.upsertedCount) created += 1;
    else if (result.modifiedCount) updated += 1;
  };

  for (const article of CODER_ARTICLES) {
    await upsert(article, { type: 'article', title: article.title });
  }
  for (const resource of RESOURCES) {
    await upsert(resource, { url: resource.url });
  }

  const [articles, documents] = await Promise.all([
    CoderResource.countDocuments({ type: 'article' }),
    CoderResource.countDocuments({ type: 'document' }),
  ]);
  console.log(
    `Học liệu: thêm ${created}, cập nhật ${updated}. `
    + `Trong kho: ${articles} bài biên soạn, ${documents} link tham khảo.`,
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Nạp học liệu thất bại:', error);
  process.exit(1);
});
