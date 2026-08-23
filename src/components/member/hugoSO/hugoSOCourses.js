export const HUGOSO_COURSE_ORDER = ["calendar", "docs", "sheets", "ai"];

export const HUGOSO_BUNDLE = {
  id: "bundle",
  title: "Chương trình Năng suất số & AI ứng dụng",
  priceJoy: 1290,
  regularJoy: 1680,
  saving: 390,
};

const GOOGLE_HELP = {
  calendar: "https://support.google.com/calendar/",
  docs: "https://support.google.com/docs/",
  sheets: "https://support.google.com/docs/topic/9054603",
  gemini: "https://support.google.com/gemini/",
};

const CONTENT_STOP_WORDS = new Set([
  "cach", "cho", "co", "cua", "de", "duoc", "gi", "khi", "la", "lam", "mot",
  "nao", "nen", "nguoi", "nhung", "the", "thi", "trong", "tu", "va", "voi",
]);

const contentTokens = (value = "") => new Set(
  value
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && !CONTENT_STOP_WORDS.has(token)),
);

const findRelatedGuideIndex = (guide, question, explanation) => {
  const assessmentTokens = contentTokens(`${question} ${explanation}`);
  let best = { index: 0, score: -1 };
  guide.forEach((item, index) => {
    const guideTokens = contentTokens(`${item.heading} ${item.detail}`);
    const score = [...assessmentTokens].reduce(
      (total, token) => total + (guideTokens.has(token) ? 1 : 0),
      0,
    );
    if (score > best.score) best = { index, score };
  });
  return best.index;
};

/**
 * Mọi lesson dùng cùng một hợp đồng dữ liệu để giao diện và bộ chấm không bị
 * thiếu phần. `guide`, `quiz`, `practice` được viết dạng tuple cho giáo trình
 * dễ audit, sau đó chuẩn hóa thành object mà HugoSOApp sử dụng.
 */
const defineLesson = ({
  id,
  stage,
  title,
  duration,
  summary,
  sourceUrl,
  availability = "Dùng được với tài khoản Google cá nhân và Workspace.",
  guide,
  tip,
  quiz,
  practice,
  free = false,
}) => {
  const normalizedGuide = guide.map(([heading, detail], index) => ({
    id: `${id}-action-${index + 1}`,
    heading,
    detail,
    checkpoint: `Hoàn thành và kiểm tra: ${heading.toLocaleLowerCase("vi-VN")}.`,
  }));
  const quizGuideIndex = Number.isInteger(quiz[4])
    ? quiz[4]
    : findRelatedGuideIndex(normalizedGuide, quiz[0], quiz[3]);
  return {
    id,
    stage,
    title,
    duration,
    summary,
    sourceUrl,
    availability,
    free,
    guide: normalizedGuide,
    mission: summary,
    deliverable: practice[0],
    learn: normalizedGuide.map(
      ({ heading }) => `Tự thực hiện và kiểm tra được: ${heading.toLocaleLowerCase("vi-VN")}.`,
    ),
    tip,
    video: {
      title: `${stage}: ${title}`,
      scenes: normalizedGuide.map(({ id: sceneId, heading, detail, checkpoint }, index) => ({
        id: sceneId,
        chapter: index + 1,
        heading,
        detail,
        checkpoint,
      })),
    },
    quiz: {
      question: quiz[0],
      options: quiz[1],
      correct: quiz[2],
      explanation: quiz[3],
      guideIndex: quizGuideIndex,
      guideHeading: normalizedGuide[quizGuideIndex].heading,
    },
    practice: {
      prompt: practice[0],
      placeholder: practice[1],
      keywords: practice[2],
      minimumKeywords: practice[3],
      checklist: normalizedGuide.map(({ heading, checkpoint }, index) => ({
        id: `${id}-check-${index + 1}`,
        guideIndex: index,
        heading,
        checkpoint,
      })),
    },
    alignment: {
      flow: ["Xem thao tác", "Hiểu từng bước", "Làm trên công cụ thật", "Trả lời và nộp"],
      actionCount: normalizedGuide.length,
      quizGuideIndex,
    },
  };
};

const C = (config) => defineLesson({ ...config, sourceUrl: config.sourceUrl || GOOGLE_HELP.calendar });
const D = (config) => defineLesson({ ...config, sourceUrl: config.sourceUrl || GOOGLE_HELP.docs });
const S = (config) => defineLesson({ ...config, sourceUrl: config.sourceUrl || GOOGLE_HELP.sheets });
const A = (config) => defineLesson({ ...config, sourceUrl: config.sourceUrl || GOOGLE_HELP.gemini });

const calendarSteps = [
  C({
    id: "calendar-01", stage: "Cơ bản", title: "Làm quen giao diện và múi giờ", duration: "16 phút", free: true,
    summary: "Đọc đúng các vùng của Calendar và đặt múi giờ trước khi tạo dữ liệu.",
    sourceUrl: "https://support.google.com/calendar/answer/37064",
    guide: [
      ["Mở đúng tài khoản", "Vào calendar.google.com, kiểm tra ảnh đại diện và tài khoản đang dùng trước khi tạo lịch."],
      ["Đặt múi giờ chính", "Mở Settings → Time zone, chọn Asia/Ho_Chi_Minh; chỉ bật Ask to update khi bạn thường xuyên di chuyển."],
      ["Bật múi giờ phụ", "Chọn Display secondary time zone nếu làm việc quốc tế và đặt nhãn dễ nhận biết như VN hoặc UK."],
      ["Kiểm tra thực tế", "Tạo một event thử ở ngày mai, mở lại và xác nhận giờ hiển thị đúng trên web lẫn điện thoại."],
    ],
    tip: "Calendar lưu thời điểm theo UTC rồi hiển thị theo múi giờ người xem; đừng cộng trừ giờ thủ công trong tiêu đề.",
    quiz: ["Người được mời ở múi giờ khác sẽ thấy event thế nào?", ["Cùng con số giờ với người tạo", "Theo múi giờ của chính họ", "Luôn theo UTC"], 1, "Calendar tự hiển thị thời điểm theo múi giờ của từng người.", 1],
    practice: ["Ghi múi giờ chính, múi giờ phụ và giờ của một event thử.", "Asia/Ho_Chi_Minh · London · Event 09:00 VN = … UK", ["asia", "ho_chi_minh", "event", "giờ", "múi"], 3],
  }),
  C({
    id: "calendar-01b", stage: "Cơ bản", title: "Phân biệt Event và Task", duration: "24 phút",
    summary: "Chọn đúng loại mục: cuộc hẹn có thời lượng hay việc cần hoàn thành.",
    sourceUrl: "https://support.google.com/tasks/answer/7675838",
    guide: [
      ["Nhận diện Event", "Dùng Event khi một hoạt động chiếm khung giờ, có địa điểm/Meet hoặc có khách mời."],
      ["Nhận diện Task", "Dùng Task cho việc cần hoàn thành; thêm ngày và giờ nếu cần xuất hiện trên lịch và nhận thông báo."],
      ["Tạo Task đúng", "Trong Calendar chọn Create → Task, nhập kết quả cụ thể, ngày/giờ, mô tả và Task list phù hợp."],
      ["Hoàn thành và kiểm tra", "Đánh dấu Complete sau khi làm; kiểm tra task đã vào mục Completed thay vì xóa để giữ dấu vết."],
    ],
    tip: "Viết Task bằng động từ + kết quả: “Gửi bản PDF cho Mai”, không viết tên chủ đề mơ hồ như “Báo cáo”.",
    quiz: ["Mục nào phù hợp với việc “Gửi báo cáo trước 17:00” và không cần mời ai?", ["Event", "Task", "Appointment schedule"], 1, "Task theo dõi việc phải hoàn thành; Event giữ một khoảng thời gian."],
    practice: ["Tạo một Event và một Task liên quan cùng dự án rồi mô tả sự khác nhau.", "Event: Review 14:00–14:30… / Task: Gửi PDF 17:00…", ["event", "task", "gửi", "giờ", "hoàn thành"], 3],
  }),
  C({
    id: "calendar-02", stage: "Cơ bản", title: "Event đầy đủ và lịch lặp", duration: "27 phút",
    summary: "Tạo event có mục tiêu, mô tả, địa điểm/Meet, thông báo và quy tắc lặp.",
    sourceUrl: "https://support.google.com/calendar/answer/72143",
    guide: [
      ["Đặt tiêu đề có kết quả", "Dùng mẫu [Loại] Kết quả, ví dụ “[Review] Chốt kế hoạch tháng 8”."],
      ["Điền chi tiết", "Chọn lịch chứa event, thời gian bắt đầu/kết thúc, địa điểm hoặc Google Meet và mô tả có agenda."],
      ["Cấu hình thông báo", "Thêm số lượng thông báo vừa đủ cho tính chất công việc; người khác không thấy màu event cá nhân của bạn."],
      ["Thiết lập lặp có điểm dừng", "Chọn Does not repeat → Custom và đặt ngày kết thúc; kiểm tra kỹ phạm vi khi sửa một instance hay cả series."],
    ],
    tip: "Một event tốt trả lời được: diễn ra khi nào, ở đâu, cần chuẩn bị gì và kết quả mong đợi là gì.",
    quiz: ["Khi sửa một event trong chuỗi lặp, lựa chọn nào chỉ thay đổi lần đang mở?", ["This event", "This and following", "All events"], 0, "This event chỉ áp dụng cho instance hiện tại."],
    practice: ["Mô tả một event lặp hàng tuần có ngày kết thúc, agenda và thông báo.", "Weekly review · Thứ Sáu 16:00 · kết thúc 30/09 · agenda…", ["lặp", "kết thúc", "agenda", "thông báo", "thứ"], 3],
  }),
  C({
    id: "calendar-02b", stage: "Thực hành", title: "Time-blocking bằng Event", duration: "26 phút",
    summary: "Biến danh sách việc thành kế hoạch tuần có khối tập trung và khoảng đệm.",
    guide: [
      ["Chọn ba ưu tiên", "Trước khi kéo lịch, chọn tối đa ba kết quả quan trọng trong tuần thay vì xếp mọi task."],
      ["Đặt khối làm việc", "Tạo event 45–90 phút cho từng kết quả; mô tả ghi đầu ra cần đạt, không chỉ tên môn hoặc dự án."],
      ["Thêm khoảng đệm", "Chừa thời gian chuyển ngữ cảnh, nghỉ và xử lý phát sinh giữa các cuộc họp hoặc khối tập trung."],
      ["Review cuối ngày", "Cuối ngày, chuyển khối chưa làm sang thời điểm thực tế; không sửa event đã qua để che mất lịch sử."],
    ],
    tip: "Time-blocking là phương pháp lập kế hoạch, không phải một loại event riêng và không yêu cầu gói Workspace.",
    quiz: ["Tài khoản cá nhân không có Focus time nên dùng gì để time-block?", ["Event thường", "Appointment schedule", "Task không ngày"], 0, "Event thường vẫn giữ được khung giờ; Focus time chỉ bổ sung tự động từ chối và tắt Chat."],
    practice: ["Lập ba time block cho một ngày, mỗi block có đầu ra và khoảng đệm.", "09:00–10:00 Draft… · 10:00–10:15 Buffer…", ["09", "đầu ra", "buffer", "phút", "block"], 3],
  }),
  C({
    id: "calendar-02c", stage: "Thực hành", title: "Focus time, Working hours và Out of office", duration: "30 phút",
    summary: "Dùng đúng các loại thời gian Workspace và biết phương án thay thế khi tài khoản không hỗ trợ.",
    sourceUrl: "https://support.google.com/calendar/answer/11190973",
    availability: "Focus time và Working hours phụ thuộc gói Workspace/quản trị viên; tài khoản không có tính năng dùng Event thường.",
    guide: [
      ["Kiểm tra khả dụng", "Trên máy tính mở Day hoặc Week view; Focus time chỉ tạo được từ hai chế độ này và cần gói Workspace đủ điều kiện."],
      ["Tạo Focus time", "Chọn khung giờ → Focus time, đặt thời lượng, tùy chọn tự từ chối meeting và tắt thông báo Chat."],
      ["Đặt Working hours", "Trong Settings → Working hours, bật các ngày/khung giờ làm việc; có thể chia một ngày thành nhiều khoảng."],
      ["Tạo Out of office", "Dùng Out of office cho thời gian vắng mặt và kiểm tra nội dung từ chối tự động trước khi lưu."],
    ],
    tip: "Nếu không thấy một nút, đừng kết luận thao tác sai: kiểm tra loại tài khoản, gói dịch vụ, quyền admin và chế độ Day/Week.",
    quiz: ["Focus time chỉ có thể được tạo trực tiếp từ chế độ xem nào?", ["Month và Year", "Day và Week", "Schedule duy nhất"], 1, "Google quy định tạo Focus time từ Day hoặc Week view."],
    practice: ["Ghi tính năng tài khoản của bạn có, cấu hình đã dùng và phương án thay thế nếu bị giới hạn.", "Có Focus time: … / Không có: dùng Event tên [Focus]…", ["focus", "event", "workspace", "từ chối", "week"], 3],
  }),
  C({
    id: "calendar-03", stage: "Thực hành", title: "Mời họp, agenda và tìm giờ", duration: "28 phút",
    summary: "Tạo lời mời có khách, agenda, tài liệu và thời gian phù hợp.",
    sourceUrl: "https://support.google.com/calendar/answer/72143",
    guide: [
      ["Thêm khách đúng vai trò", "Nhập email khách mời, phân biệt người bắt buộc và người chỉ cần được biết trong agenda."],
      ["Tìm thời gian", "Dùng lịch khả dụng hoặc Suggested times khi tài khoản đủ điều kiện; không giả định phần trống luôn nghĩa là người kia rảnh."],
      ["Viết agenda", "Mô tả gồm mục tiêu, chuẩn bị trước, các quyết định cần chốt và owner ghi biên bản."],
      ["Kiểm tra quyền khách", "Tắt Invite others hoặc Modify event nếu khách không cần các quyền này; gửi update có chủ đích khi sửa."],
    ],
    tip: "Đính kèm tài liệu làm việc trước cuộc họp và cấp quyền Drive trước, tránh mất thời gian xin quyền khi họp đã bắt đầu.",
    quiz: ["Muốn ngăn khách tự thêm người khác, bạn cần làm gì?", ["Tắt Invite others", "Xóa Google Meet", "Đặt event Private"], 0, "Guest permissions có tùy chọn Invite others riêng."],
    practice: ["Soạn lời mời họp 30 phút gồm mục tiêu, chuẩn bị, quyết định và owner.", "Mục tiêu… / Chuẩn bị… / Quyết định… / Owner…", ["mục tiêu", "chuẩn bị", "quyết định", "owner", "30"], 4],
  }),
  C({
    id: "calendar-03b", stage: "Nâng cao", title: "Lịch phụ, chia sẻ và quyền riêng tư", duration: "27 phút",
    summary: "Tách lịch theo mục đích và cấp mức quyền nhỏ nhất cần thiết.",
    sourceUrl: "https://support.google.com/calendar/answer/15716974",
    guide: [
      ["Tạo lịch phụ", "Trên máy tính, tạo lịch riêng cho dự án/nhóm; đặt tên, mô tả và múi giờ rõ ràng."],
      ["Chọn người hoặc nhóm", "Trong Settings and sharing → Shared with, thêm đúng email hoặc Google Group."],
      ["Cấp quyền tối thiểu", "Chọn See only free/busy nếu chỉ cần tìm giờ; chỉ cấp Make changes and manage sharing cho đồng quản trị."],
      ["Kiểm tra quyền rộng hơn", "Rà Public access và domain sharing vì quyền rộng hơn có thể lấn át quyền hạn chế cấp cho một cá nhân."],
    ],
    tip: "Private event không thể bù cho một lịch đã công khai toàn bộ chi tiết; luôn kiểm tra quyền ở cấp lịch trước.",
    quiz: ["Mức nào phù hợp khi người khác chỉ cần biết bạn bận hay rảnh?", ["See only free/busy", "See all event details", "Make changes and manage sharing"], 0, "Free/busy ẩn tên và chi tiết event."],
    practice: ["Lập ma trận quyền cho ba vai trò: đồng quản trị, thành viên và người ngoài.", "Admin: manage sharing… / Member: see details… / External: free/busy…", ["admin", "member", "external", "free", "sharing"], 4],
  }),
  C({
    id: "calendar-04", stage: "Nâng cao", title: "Appointment schedule căn bản", duration: "24 phút",
    summary: "Tạo schedule đầu tiên với duration, availability và cách gặp.",
    sourceUrl: "https://support.google.com/calendar/answer/10729749",
    availability: "Tạo Appointment schedule trên máy tính; một số thiết lập nâng cao cần Google Workspace hoặc Google One đủ điều kiện.",
    guide: [
      ["Tạo schedule", "Trên máy tính chọn Create → Appointment schedule, đặt tên công khai, thời lượng và các khung availability."],
      ["Đặt availability", "Chọn ngày/khung giờ có thể được đặt, scheduling window và khoảng thời gian hiệu lực của schedule."],
      ["Chọn calendar", "Chọn primary hoặc secondary calendar nhận booking và các calendar cần Check calendars for availability."],
      ["Chọn cách gặp", "Chọn Google Meet, gặp trực tiếp, gọi điện hoặc để người đặt tự chỉ định theo loại dịch vụ."],
    ],
    tip: "Tên appointment schedule hiển thị công khai trên booking page; dùng tên mô tả dịch vụ, không dùng ghi chú nội bộ.",
    quiz: ["Bạn có thể tạo Appointment schedule mới trực tiếp trong app Calendar trên điện thoại không?", ["Có trên mọi tài khoản", "Không, cần trình duyệt máy tính", "Chỉ trên Android"], 1, "Google hiện yêu cầu máy tính với trình duyệt được hỗ trợ để tạo schedule."],
    practice: ["Ghi cấu hình schedule đầu tiên: title, duration, availability, calendar và cách gặp.", "Tư vấn 30 phút · T2/T4 14:00–17:00 · Work calendar · Meet…", ["phút", "availability", "calendar", "meet"], 3],
  }),
  C({
    id: "calendar-04b", stage: "Nâng cao", title: "Booking page nâng cao và bài tốt nghiệp", duration: "29 phút",
    summary: "Chống double-booking, thu đủ thông tin và kiểm thử toàn bộ hành trình đặt lịch.",
    sourceUrl: "https://support.google.com/calendar/answer/10729749",
    availability: "Buffer, nhiều reminder, payment và một số tùy chọn booking cần gói Google Workspace/Google One đủ điều kiện.",
    guide: [
      ["Chống đặt quá tải", "Đặt buffer, maximum bookings/day, minimum/maximum advance notice và rà các calendar dùng để kiểm tra xung đột."],
      ["Cấu hình co-host", "Thêm co-host khi cần; availability của co-host không được kiểm tra mặc định nên phải thêm calendar liên quan vào availability checks."],
      ["Hoàn thiện form", "Viết mô tả, thêm trường booking form cần thiết, bật email verification khi phù hợp và cấu hình confirmation/reminder."],
      ["Kiểm thử như khách", "Mở link ở cửa sổ ẩn danh, thử múi giờ khác, giờ đang bận, email xác nhận, hủy và đổi lịch; ghi lại lỗi."],
    ],
    tip: "Không thu dữ liệu nhạy cảm trong booking form nếu không thật sự cần và chưa có quy trình bảo vệ dữ liệu.",
    quiz: ["Appointment schedule có tự kiểm tra lịch của co-host theo mặc định không?", ["Có", "Không", "Chỉ khi dùng Meet"], 1, "Google lưu ý cần thêm calendar của co-host vào availability checks để ngăn trùng."],
    practice: ["Nộp biên bản test booking gồm buffer, advance notice, form, xung đột, múi giờ và email.", "Buffer 15… đặt trước 12 giờ… conflict blocked… timezone OK… email OK…", ["buffer", "đặt trước", "form", "conflict", "múi giờ", "email"], 5],
  }),
];

const docsSteps = [
  D({
    id: "docs-01", stage: "Cơ bản", title: "Pages, Pageless và thiết lập tài liệu", duration: "18 phút", free: true,
    summary: "Chọn đúng chế độ trang trước khi xây báo cáo.",
    sourceUrl: "https://support.google.com/docs/answer/11528737",
    guide: [
      ["Xác định đầu ra", "Chọn Pages nếu cần in/PDF, header, footer và page number; chọn Pageless nếu ưu tiên đọc và cộng tác trên màn hình."],
      ["Đặt page setup", "Trong File → Page setup, chọn Pages, cỡ giấy, hướng trang, lề và màu trang theo yêu cầu tổ chức."],
      ["Đặt tên file", "Dùng tên có chủ đề, phiên bản và ngày; không dùng “Untitled document” hoặc “final-final”."],
      ["Kiểm tra quyền", "Mở Share và xác nhận General access trước khi nhập dữ liệu nhạy cảm."],
    ],
    tip: "Header, footer và page number không hiển thị trong Pageless; đây là khác biệt tính năng, không phải lỗi.",
    quiz: ["Chế độ nào cần dùng nếu báo cáo bắt buộc có header và số trang?", ["Pageless", "Pages", "Either, không khác nhau"], 1, "Các phần tử trang chỉ khả dụng/hiển thị trong Pages."],
    practice: ["Ghi lựa chọn Pages/Pageless cho một báo cáo và giải thích bằng ba yêu cầu đầu ra.", "Chọn Pages vì cần PDF, header và số trang…", ["pages", "pdf", "header", "trang", "lề"], 3],
  }),
  D({
    id: "docs-01b", stage: "Cơ bản", title: "Heading, outline và mục lục tự động", duration: "28 phút",
    summary: "Dùng cấu trúc ngữ nghĩa thay cho định dạng thủ công.",
    sourceUrl: "https://support.google.com/docs/answer/116338",
    guide: [
      ["Dựng cây nội dung", "Viết Title, Heading 1 cho chương, Heading 2 cho mục và Heading 3 cho tiểu mục; không nhảy cấp tùy tiện."],
      ["Áp dụng style", "Chọn đoạn → Paragraph styles; chỉnh một heading mẫu rồi Update Heading to match nếu cần style riêng."],
      ["Chèn mục lục", "Đặt con trỏ ở vị trí mục lục → Insert → Page elements → Table of contents và chọn kiểu."],
      ["Kiểm thử cập nhật", "Thêm một heading mới, bấm Refresh trên mục lục và kiểm tra liên kết dẫn đúng vị trí."],
    ],
    tip: "Chữ to và in đậm không tự trở thành heading; outline và mục lục chỉ hiểu Paragraph styles.",
    quiz: ["Mục lục Google Docs lấy cấu trúc từ đâu?", ["Các đoạn in đậm", "Title và Heading styles", "Comment"], 1, "Table of contents liên kết đến các title/heading.", 1],
    practice: ["Viết cây cấu trúc có ít nhất ba Heading 1 và hai Heading 2 rồi mô tả kết quả refresh mục lục.", "H1 Introduction… H2 Scope… TOC đã refresh…", ["heading 1", "heading 2", "mục lục", "refresh"], 3],
  }),
  D({
    id: "docs-02", stage: "Cơ bản", title: "Document tabs và subtabs", duration: "24 phút",
    summary: "Tổ chức tài liệu dài bằng tabs mà không phá hierarchy heading.",
    sourceUrl: "https://support.google.com/docs/answer/15499791",
    guide: [
      ["Mở panel", "Chọn Show tabs and outlines ở góc trái; tài liệu mới luôn có Tab 1 và không xóa được nếu chưa có tab khác."],
      ["Tạo cấu trúc tab", "Thêm tab cho phần lớn, rename rõ nghĩa và chỉ dùng subtab khi thật sự cần phân cấp."],
      ["Hiểu giới hạn", "Tabs lồng tối đa ba cấp và một tài liệu tối đa 100 tabs; Suggesting mode không thêm/di chuyển/xóa tab."],
      ["Xuất đúng phạm vi", "Khi Download hoặc Print, chọn Current tab hay All tabs; mặc định có thể chỉ là tab hiện tại."],
    ],
    tip: "Tabs chia không gian lớn; headings tổ chức nội dung bên trong từng tab. Hai công cụ không thay thế nhau.",
    quiz: ["Khi tải một Docs có tabs, bạn cần kiểm tra điều gì?", ["Current tab hay All tabs", "Màu tab", "Chế độ dark mode"], 0, "Google yêu cầu chọn phạm vi tab khi download/print."],
    practice: ["Thiết kế tài liệu ba tabs, một subtab và ghi lựa chọn khi xuất toàn bộ PDF.", "Tab 1 Brief / Tab 2 Report → Subtab Appendix / Export All tabs…", ["tab", "subtab", "all tabs", "pdf"], 3],
  }),
  D({
    id: "docs-02a", stage: "Thực hành", title: "Chia sẻ và kiểm soát truy cập", duration: "22 phút",
    summary: "Phân biệt Viewer, Commenter, Editor và phạm vi General access.",
    sourceUrl: "https://support.google.com/docs/answer/2494822",
    guide: [
      ["Chọn phạm vi", "Để General access là Restricted khi tài liệu chưa sẵn sàng; chỉ mở link rộng hơn khi có lý do rõ ràng."],
      ["Chọn vai trò", "Viewer chỉ đọc, Commenter góp ý không sửa trực tiếp, Editor thay đổi nội dung và chia sẻ tùy cài đặt."],
      ["Gửi thông báo có ngữ cảnh", "Thêm message nói rõ người nhận cần review phần nào và hạn phản hồi."],
      ["Kiểm thử", "Dùng cửa sổ ẩn danh hoặc tài khoản thử để xác nhận người ngoài thấy đúng quyền."],
    ],
    tip: "Sao chép link không tự cấp quyền; luôn kiểm tra General access và vai trò trước khi gửi.",
    quiz: ["Vai trò nào phù hợp để góp ý nhưng không sửa trực tiếp bản gốc?", ["Viewer", "Commenter", "Editor"], 1, "Commenter có thể comment và thường có thể suggest nhưng không chỉnh trực tiếp."],
    practice: ["Lập ma trận quyền cho chủ file, reviewer và người chỉ đọc.", "Owner: Editor… Reviewer: Commenter… Reader: Viewer…", ["owner", "reviewer", "commenter", "viewer"], 3],
  }),
  D({
    id: "docs-02b", stage: "Thực hành", title: "Comments, Suggesting và action items", duration: "29 phút",
    summary: "Chọn đúng kênh cộng tác và giao việc có trách nhiệm.",
    sourceUrl: "https://support.google.com/docs/answer/6033474",
    availability: "Assign Tasks trực tiếp trong Docs chủ yếu dành cho tài khoản work/school trong cùng tổ chức; comments dùng rộng rãi hơn.",
    guide: [
      ["Dùng Comment đúng chỗ", "Bôi đen đúng đoạn, viết vấn đề + đề xuất + người cần phản hồi; @mention khi cần thông báo."],
      ["Dùng Suggesting", "Chuyển Editing → Suggesting để thay đổi không ghi đè bản gốc; chủ file Accept hoặc Reject từng đề xuất."],
      ["Giao action item", "Nếu tài khoản hỗ trợ, dùng @task hoặc assign comment cho đúng người và đặt hạn; bảo đảm họ có quyền truy cập."],
      ["Đóng vòng phản hồi", "Chỉ Resolve khi nội dung đã sửa và kiểm tra; dùng comment history để tìm lại thread đã đóng."],
    ],
    tip: "Comment thảo luận “nên sửa gì”; Suggesting trình bày chính xác “bản sửa sẽ trông thế nào”.",
    quiz: ["Chế độ nào cho phép đề xuất thay đổi mà chưa thay bản gốc?", ["Editing", "Suggesting", "Viewing"], 1, "Chủ file phải accept suggestion trước khi nó thay nội dung gốc."],
    practice: ["Mô tả một vòng review gồm comment, suggestion, phản hồi và resolve.", "Comment vấn đề → Suggesting bản sửa → Owner accept → Resolve…", ["comment", "suggesting", "accept", "resolve"], 4],
  }),
  D({
    id: "docs-02c", stage: "Thực hành", title: "Version history và khôi phục an toàn", duration: "18 phút",
    summary: "Đặt tên mốc, so sánh thay đổi và khôi phục mà không mất bản hiện tại.",
    sourceUrl: "https://support.google.com/docs/answer/190843",
    guide: [
      ["Mở lịch sử", "Chọn File → Version history → See version history; bạn cần quyền edit để duyệt phiên bản cũ."],
      ["Đặt tên mốc", "Trước vòng sửa lớn, chọn Name current version và dùng tên có ý nghĩa như “Approved outline”."],
      ["So sánh", "Chọn mốc và xem người sửa/màu thay đổi; xác định chính xác nội dung cần lấy lại."],
      ["Khôi phục an toàn", "Nếu chỉ cần một đoạn, tạo bản copy hoặc sao chép đoạn cũ; chỉ Restore version khi muốn đưa toàn tài liệu về mốc đó."],
    ],
    tip: "Version history không thay thế backup xuất bản; trước thao tác lớn, tạo named version hoặc bản copy.",
    quiz: ["Điều kiện để duyệt các phiên bản trước của Docs là gì?", ["Quyền xem", "Quyền chỉnh sửa", "Có link công khai"], 1, "Google yêu cầu edit permission để browse earlier versions."],
    practice: ["Đặt tên một version, tạo thay đổi thử và mô tả cách lấy lại mà không mất bản mới.", "Named version: Approved outline… tạo copy rồi lấy đoạn…", ["version", "name", "copy", "restore"], 3],
  }),
  D({
    id: "docs-03", stage: "Nâng cao", title: "Harvard: in-text citation chuẩn", duration: "34 phút",
    summary: "Viết trích dẫn tác giả–năm và hiểu rằng Harvard có nhiều biến thể.",
    sourceUrl: "https://support.google.com/docs/answer/10090962",
    guide: [
      ["Chọn style guide", "Xác nhận quy định Harvard của trường/tổ chức; Harvard không có một bản duy nhất áp dụng toàn cầu."],
      ["Viết paraphrase", "Dùng (Tác giả, Năm) hoặc Tác giả (Năm); trích trực tiếp cần trang nếu nguồn có số trang."],
      ["Xử lý tác giả tổ chức", "Dùng tên tổ chức khi không có cá nhân; không tự ghi Anonymous nếu trang có corporate author."],
      ["Hiểu giới hạn Docs", "Tools → Citations chỉ hỗ trợ MLA 8, APA 7 và Chicago Author-Date 17, không có lựa chọn Harvard riêng."],
    ],
    tip: "Có thể dùng Chicago Author-Date làm điểm tham khảo, nhưng phải chỉnh thủ công theo Harvard guide được yêu cầu.",
    quiz: ["Google Docs Citations có nút chọn Harvard trực tiếp không?", ["Có", "Không", "Chỉ trên Workspace"], 1, "Công cụ tích hợp hiện liệt kê MLA, APA và Chicago Author-Date."],
    practice: ["Viết một câu paraphrase và một trích dẫn trực tiếp có số trang theo Harvard guide của bạn.", "Nguyen (2025) cho rằng… / “…” (Nguyen, 2025, p. 18).", ["202", "nguyen", "p.", "trang", "("], 3],
  }),
  D({
    id: "docs-03b", stage: "Nâng cao", title: "Harvard: reference list và kiểm tra chéo", duration: "38 phút",
    summary: "Tạo reference cho sách, bài báo và website; kiểm tra 1–1 với citation.",
    sourceUrl: "https://support.google.com/docs/answer/10090962",
    guide: [
      ["Thu đủ metadata", "Ghi tác giả/tổ chức, năm, tiêu đề, nơi xuất bản hoặc journal, volume/issue/pages, DOI/URL và ngày truy cập khi guide yêu cầu."],
      ["Định dạng theo loại nguồn", "Không dùng một mẫu cho mọi nguồn; sách, journal article và webpage có trường khác nhau."],
      ["Sắp xếp danh sách", "Sắp xếp alphabet theo tác giả/tổ chức và dùng hanging indent theo guide của đơn vị."],
      ["Audit hai chiều", "Mỗi in-text citation phải có một reference và mỗi reference phải được trích trong bài; kiểm URL/DOI trước khi nộp."],
    ],
    tip: "Công cụ citation giúp lưu metadata nhưng không chịu trách nhiệm cho độ chính xác của dữ liệu bạn nhập.",
    quiz: ["Bước audit quan trọng nhất giữa bài và reference list là gì?", ["Mọi mục có cùng màu", "Đối chiếu citation và reference theo hai chiều", "Sắp theo ngày mới nhất"], 1, "Không được có citation thiếu reference hoặc reference chưa dùng."],
    practice: ["Tạo ba reference Harvard: sách, journal article và webpage, rồi ghi kết quả audit.", "Book: … / Journal: … DOI… / Web: … Accessed… / Audit 3–3", ["book", "journal", "doi", "accessed", "audit"], 4],
  }),
  D({
    id: "docs-04", stage: "Nâng cao", title: "Biên tập, accessibility và xuất bản", duration: "42 phút",
    summary: "Hoàn thiện báo cáo có cấu trúc, caption, alt text và PDF đúng phạm vi tabs.",
    sourceUrl: "https://support.google.com/docs/answer/86629",
    guide: [
      ["Biên tập ba vòng", "Vòng 1 kiểm luận điểm/cấu trúc; vòng 2 bằng chứng/citation; vòng 3 câu chữ, chính tả và format."],
      ["Tăng khả năng tiếp cận", "Giữ heading đúng cấp, link có mô tả, thêm alt text cho hình quan trọng và không dùng màu làm tín hiệu duy nhất."],
      ["Kiểm phần tử trang", "Trong Pages, rà section break, header/footer, page number, caption hình/bảng và mục lục."],
      ["Xuất và QA", "Download PDF với All tabs nếu cần; mở PDF, thử link, kiểm trang trống, bảng bị cắt và font thay đổi."],
    ],
    tip: "Luôn đánh giá file đầu ra, không chỉ bản Docs; PDF có thể phát sinh ngắt trang và cắt bảng khác màn soạn thảo.",
    quiz: ["Trình tự biên tập hợp lý là gì?", ["Format → chính tả → luận điểm", "Luận điểm → bằng chứng → câu chữ", "Màu → font → citation"], 1, "Sửa cấu trúc trước để tránh trau chuốt đoạn sau đó bị xóa."],
    practice: ["Nộp checklist QA tối thiểu sáu mục cho báo cáo PDF cuối khóa.", "□ Heading □ Citation-reference □ Alt text □ Caption □ All tabs □ Link…", ["heading", "citation", "alt", "caption", "pdf", "link"], 5],
  }),
];

const sheetsSteps = [
  S({
    id: "sheets-01", stage: "Cơ bản", title: "Mô hình dữ liệu sạch", duration: "20 phút", free: true,
    summary: "Thiết kế bảng theo nguyên tắc một hàng–một bản ghi, một cột–một thuộc tính.",
    guide: [
      ["Xác định grain", "Viết rõ một hàng đại diện cho điều gì: một task, một giao dịch hay một người."],
      ["Đặt header duy nhất", "Mỗi cột có tên không trùng, không để header rỗng và không nhét hai thuộc tính vào cùng cột."],
      ["Giữ vùng dữ liệu liên tục", "Không merge cell, không chèn subtotal thủ công và không dùng hàng trống để chia nhóm trong nguồn."],
      ["Chuẩn hóa kiểu", "Ngày là date, số là number, trạng thái dùng tập giá trị nhất quán; không trộn “N/A” vào cột số."],
    ],
    tip: "Một sheet đẹp chưa chắc là dữ liệu tốt; cấu trúc phải cho phép sort, filter, formula và Pivot không bị vỡ.",
    quiz: ["Trong bảng nguồn, một hàng nên đại diện cho gì?", ["Một bản ghi nhất quán", "Một nhóm có nhiều loại dữ liệu", "Một màu trạng thái"], 0, "Grain nhất quán là nền tảng của phân tích."],
    practice: ["Thiết kế tám cột cho task tracker và nêu grain của mỗi hàng.", "Mỗi hàng = 1 task; Task ID, Title, Owner, Status, Start, Due…", ["mỗi hàng", "task", "owner", "status", "due"], 4],
  }),
  S({
    id: "sheets-01b", stage: "Cơ bản", title: "Tables, column types và validation", duration: "31 phút",
    summary: "Chuyển range thành Table và ngăn dữ liệu sai từ lúc nhập.",
    sourceUrl: "https://support.google.com/docs/answer/14239833",
    guide: [
      ["Chuyển thành Table", "Chọn vùng có header → Format → Convert to table; đặt tên table dễ đọc và không trùng."],
      ["Đặt column type", "Chọn kiểu phù hợp như Number, Text, Date, Dropdown, Checkbox hoặc None cho dữ liệu hỗn hợp có chủ đích."],
      ["Thiết lập validation", "Với cột ngoài Table hoặc yêu cầu riêng, dùng Data validation, bật reject input khi giá trị sai phải bị chặn."],
      ["Kiểm tra view", "Tạo table filter view; xác nhận việc lọc/sort không làm thay đổi góc nhìn của cộng tác viên."],
    ],
    tip: "Table references như `DeptSales[Sales Amount]` tự mở rộng khi thêm/xóa dữ liệu và dễ đọc hơn range cứng.",
    quiz: ["Table view có lợi ích gì khi cộng tác?", ["Mọi người bị ép cùng bộ lọc", "Có thể lọc mà không ảnh hưởng góc nhìn người khác", "Tự khóa toàn bộ sheet"], 1, "Mỗi view có cấu hình filter/sort riêng.", 3],
    practice: ["Mô tả Table task tracker gồm tên table, bốn column types và một quy tắc reject input.", "Tasks: Due=Date, Status=Dropdown… reject Status ngoài danh sách…", ["table", "date", "dropdown", "reject", "status"], 4],
  }),
  S({
    id: "sheets-02", stage: "Cơ bản", title: "Tham chiếu và công thức nền tảng", duration: "34 phút",
    summary: "Hiểu relative, absolute và mixed reference trước khi dùng hàm phức tạp.",
    guide: [
      ["Viết công thức", "Bắt đầu bằng `=`, tham chiếu ô thay vì gõ lại số và dùng ngoặc để thể hiện thứ tự tính."],
      ["Relative reference", "`A2` thay đổi theo vị trí khi copy; dùng cho phép tính từng hàng."],
      ["Absolute/mixed reference", "`$A$2` khóa cả hàng/cột; `$A2` hoặc `A$2` chỉ khóa một chiều."],
      ["Kiểm thử copy", "Copy công thức xuống và sang ngang, chọn vài ô để xác nhận reference đổi đúng ý."],
    ],
    tip: "Dấu phân cách hàm có thể là dấu phẩy hoặc chấm phẩy tùy Locale của file; đây không phải lỗi hàm.",
    quiz: ["Reference nào khóa cả cột A và hàng 2 khi sao chép?", ["A2", "$A$2", "A$2"], 1, "Hai dấu `$` tạo absolute reference hoàn toàn."],
    practice: ["Viết công thức tính Thành tiền = Số lượng × Đơn giá × tỷ lệ thuế cố định ở H1.", "=C2*D2*(1+$H$1)", ["c2", "d2", "$h$1", "="], 4],
  }),
  S({
    id: "sheets-02a", stage: "Thực hành", title: "IF, SUMIFS và COUNTIFS", duration: "35 phút",
    summary: "Tạo logic trạng thái và tổng hợp nhiều điều kiện mà không lọc tay.",
    guide: [
      ["Viết điều kiện rõ", "Dùng IF cho một quyết định đơn giản; tránh lồng quá nhiều IF khi có thể dùng bảng tra cứu."],
      ["Tổng hợp bằng SUMIFS", "Sum range đứng trước, sau đó là từng criteria range và criterion; các range phải cùng kích thước."],
      ["Đếm bằng COUNTIFS", "Dùng các cặp range/criterion để đếm bản ghi thỏa đồng thời nhiều điều kiện."],
      ["Kiểm tra biên", "Thử dữ liệu bằng đúng ngưỡng, rỗng, ngày cuối kỳ và trạng thái sai chính tả."],
    ],
    tip: "Đừng dùng toàn cột trong hàng chục SUMIFS lớn nếu file chậm; giới hạn range hợp lý hoặc dùng Table references.",
    quiz: ["Trong SUMIFS, đối số đầu tiên là gì?", ["Sum range", "Criterion đầu tiên", "Tên sheet"], 0, "Cú pháp bắt đầu bằng vùng cần cộng."],
    practice: ["Viết SUMIFS tính doanh thu của Owner ở H2 trong tháng ở H3.", "=SUMIFS(E2:E100,B2:B100,H2,C2:C100,H3)", ["sumifs", "e2:e", "b2:b", "h2", "h3"], 4],
  }),
  S({
    id: "sheets-02b", stage: "Thực hành", title: "XLOOKUP, FILTER và xử lý lỗi", duration: "39 phút",
    summary: "Tra cứu chính xác, trả tập kết quả và không che lỗi dữ liệu.",
    sourceUrl: "https://support.google.com/docs/answer/12405947",
    guide: [
      ["XLOOKUP exact match", "Dùng `XLOOKUP(search_key, lookup_range, result_range, missing_value)`; hai range phải có kích thước tương ứng."],
      ["Chọn missing value", "Trả thông báo rõ như “Không tìm thấy mã” thay vì để người dùng hiểu nhầm ô trống."],
      ["Dùng FILTER", "FILTER trả nhiều hàng thỏa điều kiện; các condition phải cùng chiều và cùng độ dài với range."],
      ["Xử lý lỗi có chủ đích", "Chỉ dùng IFERROR sau khi đã hiểu #N/A, #REF! hoặc #VALUE!; không bọc mọi công thức bằng chuỗi rỗng."],
    ],
    tip: "XLOOKUP mặc định exact match; match_mode và search_mode chỉ thêm khi yêu cầu nghiệp vụ thật sự cần.",
    quiz: ["Nếu FILTER không có dòng nào thỏa điều kiện, kết quả mặc định là gì?", ["Ô trống", "#N/A", "0"], 1, "FILTER trả #N/A khi không tìm thấy giá trị phù hợp."],
    practice: ["Viết XLOOKUP tìm giá theo mã A2 và FILTER trả các task có Status = Done.", "=XLOOKUP(A2,D2:D20,E2:E20,\"Không tìm thấy\") / =FILTER(A2:E,E2:E=\"Done\")", ["xlookup", "a2", "d2:d20", "filter", "done"], 5],
  }),
  S({
    id: "sheets-03", stage: "Thực hành", title: "Pivot table từ dữ liệu sạch", duration: "37 phút",
    summary: "Tóm tắt dữ liệu bằng Rows, Columns, Values và Filters.",
    sourceUrl: "https://support.google.com/docs/answer/7572895",
    guide: [
      ["Kiểm nguồn", "Nguồn phải có header, một grain, không subtotal và kiểu ngày/số đúng trước khi tạo Pivot."],
      ["Tạo Pivot", "Chọn nguồn → Insert → Pivot table; ưu tiên sheet mới để không đè vùng dữ liệu."],
      ["Cấu hình trường", "Thêm Rows cho nhóm chính, Columns nếu cần chiều thứ hai, Values với SUM/COUNT phù hợp và Filters để thu hẹp."],
      ["Nhóm và refresh", "Nhóm date theo tháng/quý khi cần; sau khi nguồn thay đổi, kiểm tra range nguồn và filter values."],
    ],
    tip: "Nếu Pivot đếm thay vì cộng, cột nguồn có thể đang chứa text hoặc kiểu số không nhất quán.",
    quiz: ["Muốn tổng doanh thu theo tháng, trường Doanh thu nên nằm ở đâu?", ["Rows", "Values với SUM", "Filters duy nhất"], 1, "Values thực hiện phép tổng hợp."],
    practice: ["Mô tả Pivot tổng doanh thu theo tháng và Owner, có một filter trạng thái.", "Rows: Month · Columns: Owner · Values: SUM Revenue · Filter: Status…", ["rows", "columns", "values", "sum", "filter"], 5],
  }),
  S({
    id: "sheets-03b", stage: "Nâng cao", title: "Chart, slicer và filter views", duration: "33 phút",
    summary: "Biến phân tích thành dashboard dễ đọc mà không phá dữ liệu chung.",
    sourceUrl: "https://support.google.com/docs/answer/3540681",
    guide: [
      ["Viết câu hỏi", "Mỗi chart phải trả lời một câu hỏi; line cho xu hướng thời gian, bar cho so sánh, tránh pie có quá nhiều nhóm."],
      ["Chọn vùng dữ liệu", "Dùng bảng tóm tắt/Pivot làm nguồn chart và kiểm tra header, series, trục và định dạng số."],
      ["Thêm tương tác", "Dùng slicer khi phù hợp với chart/Pivot; dùng filter view để mỗi người lọc riêng và có thể chia sẻ view."],
      ["Giảm nhiễu", "Bỏ 3D, màu thừa và label lặp; thêm title, đơn vị và nguồn/ngày cập nhật."],
    ],
    tip: "Nếu người xem không trả lời được câu hỏi trong năm giây, chart cần đơn giản hơn hoặc title cần cụ thể hơn.",
    quiz: ["Biểu đồ phù hợp nhất để theo dõi doanh thu theo tháng là gì?", ["Line chart", "Pie chart 12 lát", "Gauge"], 0, "Line chart thể hiện xu hướng theo thời gian rõ ràng."],
    practice: ["Đặc tả dashboard hai chart và hai filter views, nêu câu hỏi mỗi chart trả lời.", "Line: xu hướng tháng… Bar: so Owner… View: My open tasks…", ["line", "bar", "filter view", "tháng", "owner"], 4],
  }),
  S({
    id: "sheets-04", stage: "Nâng cao", title: "Audit, protected ranges và bàn giao", duration: "44 phút",
    summary: "Bảo vệ công thức, kiểm lỗi và giao file có README vận hành.",
    guide: [
      ["Audit lỗi", "Tìm #N/A, #REF!, #VALUE!, ô số lưu dạng text, ngày sai locale và công thức bị lệch range."],
      ["Bảo vệ vùng", "Dùng Data → Protect sheets and ranges; chọn cảnh báo hoặc giới hạn người sửa, nhưng hiểu đây không phải biện pháp bảo mật tuyệt đối."],
      ["Viết README", "Ghi owner, mục đích, grain, nguồn, lịch cập nhật, từ điển cột, vùng nhập và vùng không được sửa."],
      ["Kiểm thử bàn giao", "Mở bằng tài khoản có quyền thấp hơn, thử nhập giá trị biên, filter và thêm dòng mới; xác nhận dashboard cập nhật."],
    ],
    tip: "Protected range kiểm soát chỉnh sửa, không ngăn người có quyền xem sao chép hoặc xuất dữ liệu.",
    quiz: ["Protected range nên được hiểu là gì?", ["Mã hóa dữ liệu", "Kiểm soát ai được sửa vùng", "Ẩn hoàn toàn dữ liệu"], 1, "Bảo vệ range không phải cơ chế mã hóa hay chống sao chép."],
    practice: ["Nộp checklist bàn giao tracker gồm audit, quyền, protected ranges, README và test dữ liệu mới.", "□ #N/A… □ Editor… □ Formula protected… □ README… □ Add row test…", ["audit", "quyền", "protect", "readme", "test"], 5],
  }),
];

const aiSteps = [
  A({
    id: "ai-01", stage: "Nền tảng", title: "Mô hình ngôn ngữ trả lời bằng cách nào", duration: "22 phút", free: true,
    summary: "Hiểu cơ chế đoán từ tiếp theo để biết vì sao một câu trả lời có thể vừa trôi chảy vừa sai.",
    guide: [
      ["Đoán từ tiếp theo, không tra cứu", "Mô hình học quy luật ngôn ngữ từ khối văn bản khổng lồ rồi sinh câu bằng cách chọn từ có xác suất cao nhất. Nó không mở một cơ sở dữ liệu để tra, nên không có khái niệm 'không tìm thấy'."],
      ["Trôi chảy không phải là đúng", "Bender và cộng sự (2021) gọi hiện tượng này là 'con vẹt xác suất': câu đúng ngữ pháp, đúng giọng chuyên gia, nhưng nội dung có thể không tồn tại. Càng viết mượt càng khó phát hiện sai."],
      ["Ảo giác có dạng nhận biết được", "Ji và cộng sự (2023) chỉ ra các dạng hay gặp: bịa tên tác giả, bịa số liệu tròn trịa, bịa đường dẫn có cấu trúc hợp lý. Ba dấu hiệu này đáng nghi ngay cả khi bạn chưa kiểm chứng."],
      ["Ngữ cảnh là trí nhớ duy nhất", "Mô hình chỉ 'biết' những gì nằm trong cửa sổ ngữ cảnh của cuộc trò chuyện hiện tại. Tài liệu bạn dán vào đáng tin hơn nhiều so với thứ nó tự nhớ."],
      ["Thử một lần cho thấy", "Hỏi ba trợ lý cùng một câu hỏi hẹp về lĩnh vực bạn thạo. Ghi lại chỗ nào cả ba giống nhau và chỗ nào mỗi bên nói một kiểu — chỗ khác nhau là chỗ phải kiểm."],
    ],
    tip: "Câu trả lời càng cụ thể và tự tin về một chi tiết hiếm thì càng đáng kiểm chứng, không phải càng đáng tin.",
    quiz: [
      "Vì sao mô hình ngôn ngữ hiếm khi trả lời 'tôi không biết' dù không có dữ liệu?",
      [
        "Vì nó sinh từ tiếp theo theo xác suất chứ không tra cứu, nên luôn có một chuỗi từ hợp lý để nói ra",
        "Vì nhà cung cấp cấm nó trả lời như vậy",
        "Vì câu 'tôi không biết' quá ngắn so với độ dài tối thiểu",
        "Vì nó luôn tìm thấy dữ liệu trong cơ sở dữ liệu nội bộ",
      ],
      0,
      "Không có bước tra cứu thì không có trạng thái 'không tìm thấy'; mô hình luôn sinh được một chuỗi từ hợp lý.",
      0,
    ],
    practice: [
      "Hỏi ba trợ lý cùng một câu hỏi thuộc lĩnh vực bạn thạo, rồi ghi lại điểm giống, điểm khác và một chi tiết bạn xác định là sai.",
      "Câu hỏi:… · Cả ba giống ở:… · Khác nhau ở:… · Chi tiết sai:… vì nguồn… nói…",
      ["giống", "khác", "sai", "nguồn", "kiểm"],
      4,
    ],
  }),
  A({
    id: "ai-01b", stage: "Nền tảng", title: "Ba trợ lý, ba tính cách: Gemini, ChatGPT, Claude", duration: "26 phút",
    summary: "Biết mỗi công cụ mạnh ở đâu để chọn theo nhiệm vụ, không chọn theo thói quen.",
    guide: [
      ["Điểm chung trước", "Cả ba đều là mô hình Transformer (Vaswani và cộng sự, 2017), đều sinh văn bản theo xác suất, đều có thể ảo giác. Mọi quy tắc kiểm chứng trong học phần này áp dụng như nhau cho cả ba."],
      ["Gemini", "Gắn chặt với hệ sinh thái Google: đọc được tệp trong Drive, nối với Docs/Sheets/Gmail khi bạn cho phép. Chọn khi dữ liệu của bạn đã nằm sẵn trong Workspace."],
      ["ChatGPT", "Hệ sinh thái tiện ích rộng: tuỳ biến trợ lý riêng, chạy mã để tính toán và vẽ biểu đồ, kho công cụ do cộng đồng tạo. Chọn khi cần xử lý số liệu ngay trong hội thoại hoặc cần một trợ lý cấu hình sẵn."],
      ["Claude", "Mạnh ở văn bản dài và bám sát chỉ dẫn: đọc tài liệu nhiều trang, giữ đúng giọng và ràng buộc bạn đặt ra, ít tự ý thêm thắt. Chọn khi phải làm việc trên bản thảo dài hoặc cần bám khung chặt."],
      ["Chọn theo bằng chứng, không theo lời quảng cáo", "Mỗi bên cập nhật liên tục nên bảng so sánh hôm nay có thể sai sau vài tháng. Cách bền là tự chạy thử trên nhiệm vụ của chính bạn — đúng việc bài 6 sẽ làm."],
    ],
    tip: "Đừng hỏi 'cái nào tốt nhất'. Hãy hỏi 'với nhiệm vụ này, dữ liệu này, ràng buộc này thì cái nào cho kết quả tôi kiểm chứng được nhanh nhất'.",
    quiz: [
      "Cách đáng tin nhất để chọn trợ lý cho một công việc cụ thể là gì?",
      [
        "Chạy thử cùng một nhiệm vụ trên cả ba với dữ liệu thật của bạn rồi so kết quả",
        "Chọn cái có phiên bản mới nhất",
        "Chọn cái được nhắc tới nhiều nhất trên mạng xã hội",
        "Chọn cái có bảng giá cao nhất",
      ],
      0,
      "Năng lực thay đổi theo từng bản cập nhật; chỉ phép thử trên nhiệm vụ và dữ liệu của bạn mới nói đúng.",
      4,
    ],
    practice: [
      "Chọn một việc bạn làm hằng tuần và lập luận nên dùng trợ lý nào, dựa trên dữ liệu nằm ở đâu và ràng buộc là gì.",
      "Việc:… · Dữ liệu đang nằm ở:… · Ràng buộc:… · Chọn… vì…",
      ["việc", "dữ liệu", "ràng buộc", "chọn", "vì"],
      4,
    ],
  }),
  A({
    id: "ai-02", stage: "Nền tảng", title: "Dữ liệu nào được phép đưa vào", duration: "24 phút",
    summary: "Phân loại dữ liệu trước khi gõ, vì gửi đi rồi thì không rút lại được.",
    guide: [
      ["Gửi đi là rời khỏi tay bạn", "Nội dung bạn dán vào có thể được lưu để hiển thị lại lịch sử, và tuỳ cài đặt có thể được dùng để cải thiện dịch vụ. Hãy giả định mọi thứ bạn gõ đều được lưu ở đâu đó."],
      ["Ba nhóm dữ liệu", "Dùng được: tài liệu công khai, nội dung do bạn sáng tác, dữ liệu giả lập. Cần ẩn danh: dữ liệu nội bộ không nhạy cảm. Không đưa vào: mật khẩu, khoá API, thông tin thanh toán, hồ sơ sức khoẻ, dữ liệu cá nhân của người khác."],
      ["Ẩn tên chưa phải là ẩn danh", "Bỏ tên nhưng giữ ngày sinh, chức danh và phòng ban thì trong một tổ chức nhỏ vẫn chỉ ra đúng một người. Ẩn danh thật phải phá được liên kết ngược, không chỉ xoá cột tên."],
      ["Kiểm tra cài đặt trước khi dùng cho việc thật", "Mỗi công cụ có một trang quản lý lịch sử và việc dùng dữ liệu để huấn luyện. Mở, đọc, chọn, rồi mới đưa dữ liệu công việc vào."],
      ["Tài khoản tổ chức khác tài khoản cá nhân", "Gói doanh nghiệp thường có cam kết không dùng dữ liệu để huấn luyện, còn gói cá nhân miễn phí thì không chắc. Biết mình đang đăng nhập bằng tài khoản nào."],
    ],
    tip: "Quy tắc một câu: nếu bạn không dán được nội dung đó vào một email gửi ra ngoài công ty, thì đừng dán vào trợ lý.",
    quiz: [
      "Bảng nhân sự đã xoá cột họ tên nhưng còn ngày sinh, chức danh và phòng ban. Xếp vào nhóm nào?",
      [
        "Chưa ẩn danh — tổ hợp còn lại vẫn chỉ ra đúng một người trong tổ chức nhỏ",
        "Đã ẩn danh, dùng thoải mái vì không còn tên",
        "Dùng được vì ngày sinh không phải dữ liệu cá nhân",
        "Chỉ cần xoá thêm phòng ban là đủ ẩn danh",
      ],
      0,
      "Ẩn danh phải phá được liên kết ngược; xoá mỗi cột tên thường không đủ.",
      2,
    ],
    practice: [
      "Phân loại năm mẩu dữ liệu bạn thật sự gặp trong công việc vào ba nhóm và giải thích một trường hợp khó xử.",
      "Dùng được:… · Cần ẩn danh:… · Không đưa vào:… · Trường hợp khó:… vì…",
      ["dùng được", "ẩn danh", "không", "vì", "dữ liệu"],
      4,
    ],
  }),
  A({
    id: "ai-02b", stage: "Kỹ năng", title: "Bốn phần của một yêu cầu tốt", duration: "30 phút",
    summary: "Viết yêu cầu có mục tiêu, ngữ cảnh, ràng buộc và tiêu chí — để kết quả lặp lại được.",
    guide: [
      ["Mục tiêu đứng đầu", "Mở bằng kết quả cần đạt và người sẽ đọc kết quả đó. 'Viết cho trưởng phòng một bản tóm tắt để quyết định có duyệt ngân sách không' rõ hơn nhiều so với 'Bạn là chuyên gia tài chính…'."],
      ["Ngữ cảnh là dữ kiện, không phải tính từ", "Dán số liệu, trích đoạn, định nghĩa thuật ngữ nội bộ. Tách rõ phần dữ kiện với phần chỉ dẫn để mô hình không nhầm dữ liệu thành mệnh lệnh."],
      ["Ràng buộc nói cả điều KHÔNG được làm", "Giới hạn độ dài, giọng văn, phạm vi. Quan trọng nhất: 'không suy đoán số liệu không có trong dữ kiện; thiếu thì hỏi lại'. Thiếu câu này là mở đường cho ảo giác."],
      ["Tiêu chí biến 'hay' thành đo được", "Liệt kê 3–5 điều kiện quan sát được: đủ bốn mục, dưới 300 từ, mỗi khẳng định có số liệu kèm theo, không dùng từ cảm tính. Đây cũng là thước đo bạn dùng để chấm ở bài sau."],
      ["Một ví dụ hơn mười tính từ", "Nếu định dạng khó mô tả, hãy đưa một mẫu đầu ra tốt. Mô hình bám mẫu chính xác hơn nhiều so với bám các từ như 'chuyên nghiệp', 'súc tích', 'ấn tượng'."],
    ],
    tip: "Yêu cầu tốt là thứ đồng nghiệp đọc xong cũng làm ra được kết quả tương tự. Nếu chỉ bạn hiểu, đó chưa phải yêu cầu — đó là ghi chú.",
    quiz: [
      "Câu ràng buộc nào giảm ảo giác hiệu quả nhất?",
      [
        "'Không suy đoán số liệu không có trong dữ kiện; nếu thiếu thì hỏi lại tôi'",
        "'Hãy trả lời thật chuyên nghiệp và chính xác'",
        "'Bạn là chuyên gia hàng đầu trong lĩnh vực này'",
        "'Trả lời càng chi tiết càng tốt'",
      ],
      0,
      "Chỉ câu đầu tạo ra một lối thoát rõ ràng khi thiếu dữ liệu; ba câu còn lại chỉ là tính từ.",
      2,
    ],
    practice: [
      "Viết một yêu cầu đầy đủ bốn phần cho một việc thật, trong đó có câu chặn suy đoán và ba tiêu chí đo được.",
      "Mục tiêu:… · Ngữ cảnh:… · Ràng buộc: không suy đoán… · Tiêu chí: 1)… 2)… 3)…",
      ["mục tiêu", "ngữ cảnh", "ràng buộc", "tiêu chí", "không suy đoán"],
      4,
    ],
  }),
  A({
    id: "ai-03", stage: "Kỹ năng", title: "Sửa yêu cầu có kiểm soát", duration: "28 phút",
    summary: "Cải thiện theo tiêu chí và mỗi vòng chỉ đổi một biến, để biết điều gì tạo ra khác biệt.",
    guide: [
      ["Chấm bản nháp trước khi sửa", "Đối chiếu đầu ra với từng tiêu chí đã đặt, ghi rõ tiêu chí nào trượt. Sửa khi chưa biết trượt ở đâu là sửa mù."],
      ["Mỗi vòng một biến", "Đổi ngữ cảnh, hoặc ràng buộc, hoặc ví dụ — không đổi cả ba cùng lúc. Đổi hết thì kết quả có tốt lên bạn cũng không biết nhờ đâu."],
      ["Nhờ mô hình tự soi theo tiêu chí", "Đưa lại tiêu chí và bảo nó chỉ ra chỗ chưa đạt. Nó bắt lỗi hình thức khá tốt, nhưng phần đúng–sai dữ kiện vẫn phải do bạn kiểm."],
      ["Yêu cầu trình bày các bước khi bài toán cần suy luận", "Với việc có nhiều bước, bảo mô hình liệt kê các bước trung gian trước khi kết luận cho kết quả tốt hơn (Wei và cộng sự, 2022) — và cho bạn chỗ để soi sai ở bước nào."],
      ["Lưu yêu cầu, đừng chỉ lưu câu trả lời", "Lưu bản yêu cầu cuối cùng cùng một đầu ra mẫu đạt chuẩn. Chỉ lưu câu trả lời thì lần sau phải mò lại từ đầu."],
    ],
    tip: "Ba vòng sửa có kiểm soát thường ăn đứt mười vòng gõ thêm 'viết hay hơn nữa đi'.",
    quiz: [
      "Vì sao mỗi vòng chỉ nên sửa một nhóm biến trong yêu cầu?",
      [
        "Để biết chính xác thay đổi nào tạo ra khác biệt về chất lượng",
        "Để tiết kiệm số lượt gọi mô hình",
        "Vì mô hình chỉ đọc được một thay đổi mỗi lần",
        "Vì sửa nhiều chỗ sẽ làm mất lịch sử hội thoại",
      ],
      0,
      "Đổi nhiều biến cùng lúc thì không quy được kết quả về nguyên nhân nào.",
      1,
    ],
    practice: [
      "Chạy yêu cầu ở bài trước, chấm theo tiêu chí, rồi mô tả hai vòng sửa và điều bạn học được từ mỗi vòng.",
      "Vòng 1: sửa… → tiêu chí… đạt/trượt vì… · Vòng 2: sửa… → khác biệt là…",
      ["vòng", "tiêu chí", "sửa", "khác biệt", "đạt"],
      4,
    ],
  }),
  A({
    id: "ai-03b", stage: "Kỹ năng", title: "Tự chạy phép thử so ba mô hình", duration: "32 phút",
    summary: "Dựng một phép so sánh nhỏ trên nhiệm vụ của chính bạn, thay vì tin bảng xếp hạng.",
    guide: [
      ["Chọn nhiệm vụ đại diện", "Lấy một việc bạn làm thường xuyên và có đáp án đúng kiểm được: tóm tắt một tài liệu bạn đã đọc kỹ, phân loại 20 dòng dữ liệu bạn đã gán nhãn sẵn."],
      ["Giữ yêu cầu y hệt", "Cùng một yêu cầu, cùng dữ liệu, dán vào cả ba. Đổi cách diễn đạt giữa các bên là phép thử hỏng ngay từ đầu."],
      ["Chấm bằng thước đo có sẵn", "Dùng chính tiêu chí ở bài 4. Ghi số tiêu chí đạt trên tổng, cộng thời gian bạn phải bỏ ra để sửa lại — công sức sửa mới là chi phí thật."],
      ["Chạy lại lần hai", "Cùng yêu cầu chạy hai lần cho mỗi bên. Bên nào cho kết quả lệch nhau nhiều giữa hai lần là bên khó dựa vào cho việc lặp."],
      ["Kết luận có thời hạn", "Ghi ngày chạy phép thử vào kết luận. Các mô hình cập nhật liên tục, nên kết luận hôm nay nên được xem lại sau vài tháng."],
    ],
    tip: "Thước đo hữu ích nhất không phải 'câu trả lời hay hơn' mà 'tôi mất bao nhiêu phút để biến nó thành dùng được'.",
    quiz: [
      "Chạy mỗi yêu cầu hai lần trên cùng một mô hình để làm gì?",
      [
        "Đo độ ổn định — mô hình sinh theo xác suất nên hai lần có thể khác nhau",
        "Để mô hình nhớ yêu cầu tốt hơn ở lần sau",
        "Để tăng gấp đôi số lượng dữ liệu đầu ra",
        "Vì lần chạy đầu tiên luôn kém chất lượng",
      ],
      0,
      "Đầu ra có tính ngẫu nhiên; việc lặp lại nhiệm vụ đòi hỏi mô hình ổn định chứ không chỉ giỏi một lần.",
      3,
    ],
    practice: [
      "Chạy phép thử của bạn và ghi bảng kết quả: nhiệm vụ, số tiêu chí đạt của từng mô hình, thời gian sửa, và kết luận kèm ngày.",
      "Nhiệm vụ:… · Gemini …/5, sửa … phút · ChatGPT …/5 · Claude …/5 · Kết luận ngày…",
      ["nhiệm vụ", "tiêu chí", "phút", "kết luận", "ngày"],
      4,
    ],
  }),
  A({
    id: "ai-04", stage: "Vận dụng", title: "Đưa tài liệu của bạn vào ngữ cảnh", duration: "34 phút",
    summary: "Cho mô hình đọc nguồn thật thay vì tin trí nhớ của nó — và biết cách này vẫn sai ở đâu.",
    guide: [
      ["Vì sao dán nguồn tốt hơn hỏi suông", "Đưa tài liệu vào ngữ cảnh rồi bắt trả lời dựa trên đó cho kết quả bám nguồn hơn hẳn (Lewis và cộng sự, 2020). Mô hình chuyển từ 'nhớ mang máng' sang 'đọc và trích'."],
      ["Chuẩn bị tài liệu", "Cắt đúng phần liên quan, đánh số đoạn hoặc giữ số trang. Dán cả cuốn 200 trang thì phần giữa dễ bị bỏ qua và bạn không kiểm được nó lấy ý từ đâu."],
      ["Bắt trích dẫn vị trí", "Ràng buộc: 'mỗi khẳng định phải kèm số đoạn trong tài liệu tôi cung cấp; điều gì tài liệu không nói thì ghi rõ là không có'. Đây là chỗ biến câu trả lời thành kiểm được."],
      ["Thử phép thử ngược", "Hỏi một câu mà tài liệu chắc chắn KHÔNG trả lời được. Mô hình phải nói 'tài liệu không đề cập'. Nếu nó vẫn bịa ra câu trả lời thì ràng buộc của bạn chưa đủ chặt."],
      ["Giới hạn của cách này", "Bám nguồn không có nghĩa là hiểu đúng nguồn. Nó vẫn có thể trích đúng đoạn nhưng diễn giải sai. Trích dẫn vị trí là để BẠN kiểm nhanh, không phải để khỏi kiểm."],
    ],
    tip: "Ràng buộc 'điều gì tài liệu không nói thì ghi rõ là không có' đáng giá hơn cả một trang chỉ dẫn dài.",
    quiz: [
      "Phép thử ngược — hỏi câu mà tài liệu không trả lời được — dùng để làm gì?",
      [
        "Kiểm xem mô hình có chịu nhận 'tài liệu không đề cập' hay vẫn bịa",
        "Kiểm xem tài liệu đã đủ dài chưa",
        "Làm mô hình quen với chủ đề trước khi hỏi thật",
        "Tăng độ chính xác cho các câu hỏi sau đó",
      ],
      0,
      "Nếu mô hình bịa câu trả lời cho câu hỏi không có đáp án trong nguồn, mọi câu trả lời khác đều đáng nghi.",
      3,
    ],
    practice: [
      "Dán một tài liệu thật, đặt ràng buộc trích dẫn vị trí, rồi chạy cả câu hỏi thường lẫn phép thử ngược và ghi kết quả.",
      "Tài liệu:… · Ràng buộc trích dẫn:… · Câu hỏi thường → trích đoạn… · Phép thử ngược → mô hình trả lời…",
      ["tài liệu", "trích", "ràng buộc", "ngược", "kết quả"],
      4,
    ],
  }),
  A({
    id: "ai-04b", stage: "Vận dụng", title: "Kiểm chứng từng khẳng định", duration: "30 phút",
    summary: "Tách bản nháp máy sinh khỏi kết luận đã xác minh, bằng một quy trình làm được trong 15 phút.",
    guide: [
      ["Tách câu thành khẳng định", "Gạch chân từng mệnh đề có thể đúng hoặc sai: con số, ngày tháng, tên người, quan hệ nhân quả. Một đoạn văn mượt thường chứa năm sáu khẳng định cần kiểm riêng."],
      ["Xếp hạng theo hậu quả", "Kiểm trước những khẳng định mà nếu sai sẽ dẫn tới quyết định sai. Không đủ thời gian kiểm hết thì phải kiểm đúng chỗ đắt nhất."],
      ["Truy về nguồn gốc, không dừng ở nguồn nhắc lại", "Một bài báo dẫn lại một báo cáo thì nguồn là báo cáo. Mở đúng tài liệu gốc, tìm đúng con số. Trợ lý có thể dẫn một đường liên kết trông hợp lý nhưng không tồn tại — mở ra mới biết."],
      ["Đánh dấu ba trạng thái", "Mỗi khẳng định gắn một nhãn: đã xác minh (kèm nguồn), chưa kiểm được, hoặc sai. Không có nhãn 'chắc là đúng'."],
      ["Chỉ phần đã xác minh mới được lên bản chính thức", "Phần chưa kiểm được có thể giữ trong bản nháp nội bộ với ghi chú rõ. Trộn hai loại vào một tài liệu là cách nhanh nhất để mất uy tín."],
    ],
    tip: "Đường liên kết do mô hình đưa ra phải được MỞ mới tính là đã kiểm. Đường liên kết trông đúng cấu trúc vẫn có thể dẫn tới trang không tồn tại.",
    quiz: [
      "Trợ lý dẫn một bài báo, bài báo đó dẫn lại một báo cáo của cơ quan thống kê. Nguồn cần kiểm là gì?",
      [
        "Báo cáo gốc của cơ quan thống kê",
        "Bài báo, vì đó là thứ trợ lý dẫn ra",
        "Cả hai đều không cần kiểm nếu số liệu khớp nhau",
        "Trang tổng hợp tin tức đăng lại bài báo",
      ],
      0,
      "Nguồn nhắc lại có thể trích sai hoặc trích thiếu ngữ cảnh; phải về tới tài liệu gốc.",
      2,
    ],
    practice: [
      "Lấy một đoạn do trợ lý viết, tách thành các khẳng định, kiểm ba khẳng định đắt nhất và gắn nhãn cho từng cái.",
      "Khẳng định 1:… → đã xác minh, nguồn… · Khẳng định 2:… → sai vì… · Khẳng định 3:… → chưa kiểm được vì…",
      ["khẳng định", "xác minh", "nguồn", "sai", "chưa kiểm"],
      4,
    ],
  }),
  A({
    id: "ai-05", stage: "Vận dụng", title: "Nối AI vào quy trình có điểm dừng", duration: "36 phút",
    summary: "Ghép Sheets – AI – Docs thành một dây chuyền có chỗ cho con người chặn lại.",
    guide: [
      ["Vẽ dây chuyền trước khi tự động hoá", "Ghi ra từng bước: dữ liệu vào từ đâu, AI làm gì, kết quả đi đâu, ai đọc. Tự động hoá một quy trình bạn chưa vẽ được là tự động hoá luôn cả cái sai."],
      ["Đặt điểm dừng ở chỗ tốn kém", "Trước mọi bước gửi ra ngoài, tiêu tiền, hoặc chạm dữ liệu khách hàng phải có một người bấm duyệt. NIST (2023) gọi đây là kiểm soát tương xứng với mức rủi ro."],
      ["Đầu ra có cấu trúc mới ghép được", "Yêu cầu trả về bảng hoặc danh sách trường cố định thay vì văn xuôi. Văn xuôi phải bóc tách bằng tay, và bóc sai thì cả dây chuyền sai theo."],
      ["Giữ dữ liệu gốc bên cạnh kết quả", "Trong bảng theo dõi, để cột dữ liệu gốc cạnh cột AI sinh ra. Khi nghi ngờ, so hai cột là ra ngay, không phải chạy lại từ đầu."],
      ["Thử với dữ liệu cố ý xấu", "Cho vào dòng trống, dòng sai định dạng, dòng cực trị. Quy trình phải dừng lại và báo, chứ không được lặng lẽ sinh ra kết quả trông bình thường."],
    ],
    tip: "Quy trình tốt là quy trình HỎNG TO KHI SAI. Thứ đáng sợ là quy trình sai nhưng vẫn cho ra bảng đẹp.",
    quiz: [
      "Vì sao nên yêu cầu đầu ra có cấu trúc thay vì văn xuôi khi nối AI vào quy trình?",
      [
        "Vì bước sau ghép được trực tiếp, không phải bóc tách văn xuôi và bóc sai thì cả dây chuyền sai",
        "Vì đầu ra có cấu trúc luôn chính xác hơn về nội dung",
        "Vì văn xuôi tốn nhiều lượt gọi hơn",
        "Vì mô hình không viết được văn xuôi dài",
      ],
      0,
      "Cấu trúc cố định làm bước ghép nối tin cậy; nó không làm nội dung đúng hơn, chỉ làm việc ghép an toàn hơn.",
      2,
    ],
    practice: [
      "Vẽ một quy trình bốn bước cho công việc của bạn, chỉ rõ điểm dừng có người duyệt và cách bạn thử với dữ liệu xấu.",
      "Bước 1 dữ liệu từ… · Bước 2 AI… · ĐIỂM DỪNG: … duyệt · Bước 3… · Thử dữ liệu xấu:…",
      ["bước", "điểm dừng", "duyệt", "dữ liệu xấu", "kết quả"],
      4,
    ],
  }),
  A({
    id: "ai-05b", stage: "Tốt nghiệp", title: "Hồ sơ quy trình và trách nhiệm cuối", duration: "40 phút",
    summary: "Nộp một quy trình AI hoàn chỉnh có nhật ký để người khác tái lập và kiểm được.",
    guide: [
      ["Nhật ký quyết định", "Ghi lại: yêu cầu đã dùng, mô hình và ngày chạy, những gì bạn đã sửa và vì sao. Không có nhật ký thì ba tháng sau chính bạn cũng không tái lập nổi."],
      ["Bảng khẳng định đã kiểm", "Liệt kê mọi khẳng định quan trọng kèm nhãn và nguồn. Đây là phần biến sản phẩm từ 'AI viết hộ' thành 'tôi chịu trách nhiệm'."],
      ["Ghi rõ giới hạn", "Nói thẳng phần nào chưa kiểm được, dữ liệu tới ngày nào, kết luận không áp dụng cho trường hợp nào. Tài liệu giấu giới hạn là tài liệu nguy hiểm."],
      ["Một người chịu trách nhiệm, có tên", "Cuối tài liệu ghi tên người phê duyệt và ngày. 'Nhóm đã duyệt' nghĩa là không ai duyệt."],
      ["Hẹn ngày rà lại", "Đặt một sự kiện trong lịch để xem lại quy trình sau ba tháng — đúng kỹ năng học ở CAL 101. Mô hình đổi, nguồn đổi, kết luận cũ hết hạn."],
    ],
    tip: "Thước đo cuối cùng: đưa hồ sơ cho một đồng nghiệp, họ có tái lập được kết quả và chỉ ra được chỗ bạn có thể sai không?",
    quiz: [
      "Vì sao hồ sơ quy trình phải ghi tên một người phê duyệt cụ thể thay vì 'nhóm đã duyệt'?",
      [
        "Vì trách nhiệm chia đều cho tất cả thì trên thực tế không ai chịu trách nhiệm",
        "Vì quy định bắt buộc mọi tài liệu phải có chữ ký",
        "Vì tên người giúp tài liệu trông chuyên nghiệp hơn",
        "Vì nhóm không có quyền phê duyệt tài liệu",
      ],
      0,
      "Trách nhiệm giải trình cần một chủ thể xác định; ghi chung chung là cách phổ biến nhất để trách nhiệm bốc hơi.",
      3,
    ],
    practice: [
      "Nộp hồ sơ quy trình đầy đủ: nhật ký, bảng khẳng định đã kiểm, giới hạn, người phê duyệt và ngày rà lại.",
      "Nhật ký:… · Đã kiểm:… · Giới hạn:… · Người duyệt:… ngày… · Rà lại ngày…",
      ["nhật ký", "kiểm", "giới hạn", "duyệt", "rà lại"],
      5,
    ],
  }),
];

export const HUGOSO_COURSES = {
  calendar: {
    id: "calendar",
    eyebrow: "CAL 101 · Khoa Năng suất số",
    title: "Quản trị Thời gian và Lịch làm việc",
    shortTitle: "Calendar",
    description: "Từ Event/Task cơ bản đến lịch nhóm, Focus time và booking page.",
    outcome: "Tự vận hành một tuần làm việc, tổ chức họp và nhận lịch hẹn không trùng.",
    priceJoy: 320,
    duration: "4 giờ 11 phút",
    level: "Nhập môn · 2 tín chỉ",
    icon: "calendar_month",
    color: "#4285f4",
    soft: "#eaf2ff",
    sourceUrl: GOOGLE_HELP.calendar,
    sourceLabel: "Google Calendar Help",
    steps: calendarSteps,
  },
  docs: {
    id: "docs",
    eyebrow: "DOC 102 · Khoa Năng suất số",
    title: "Soạn thảo Học thuật và Bố cục Báo cáo",
    shortTitle: "Docs",
    description: "Từ cấu trúc tài liệu đến cộng tác, Harvard và xuất bản báo cáo.",
    outcome: "Hoàn thiện báo cáo có cấu trúc, trích dẫn kiểm chứng được và PDF đạt chuẩn.",
    priceJoy: 450,
    duration: "4 giờ 13 phút",
    level: "Nhập môn · 3 tín chỉ",
    icon: "description",
    color: "#1a73e8",
    soft: "#e9f2ff",
    sourceUrl: GOOGLE_HELP.docs,
    sourceLabel: "Google Docs Editors Help",
    steps: docsSteps,
  },
  sheets: {
    id: "sheets",
    eyebrow: "SHE 201 · Khoa Dữ liệu ứng dụng",
    title: "Dữ liệu và Báo cáo Vận hành",
    shortTitle: "Sheets",
    description: "Từ dữ liệu sạch đến formula, Pivot, dashboard và bàn giao an toàn.",
    outcome: "Xây tracker có validation, công thức, phân tích và dashboard tự cập nhật.",
    priceJoy: 520,
    duration: "4 giờ 33 phút",
    level: "Vận dụng · 3 tín chỉ",
    icon: "table_chart",
    color: "#0f9d58",
    soft: "#e5f7ed",
    sourceUrl: GOOGLE_HELP.sheets,
    sourceLabel: "Google Docs Editors Help",
    steps: sheetsSteps,
  },
  ai: {
    id: "ai",
    eyebrow: "AIA 202 · Khoa Trí tuệ nhân tạo ứng dụng",
    title: "Trợ lý AI: Gemini, ChatGPT và Claude",
    shortTitle: "Trợ lý AI",
    description: "Từ cơ chế sinh văn bản đến so sánh ba mô hình, kiểm chứng nguồn và quy trình có người chịu trách nhiệm.",
    outcome: "Một quy trình AI tái lập được: có nhật ký, nguồn đã kiểm, điểm dừng và người phê duyệt.",
    priceJoy: 390,
    duration: "5 giờ 12 phút",
    level: "Vận dụng · 3 tín chỉ",
    icon: "neurology",
    color: "#7c4dff",
    soft: "#f0ebff",
    sourceUrl: "https://docs.anthropic.com/",
    sourceLabel: "Tài liệu chính thức của ba nhà cung cấp",
    steps: aiSteps,
  },
};

export const HUGOSO_ALL_STEPS = HUGOSO_COURSE_ORDER.flatMap(
  (courseId) => HUGOSO_COURSES[courseId].steps,
);

export const HUGOSO_CONTENT_AUDIT = (() => {
  const lessons = HUGOSO_ALL_STEPS;
  const checks = lessons.map((lesson) => {
    const guideCount = lesson.guide.length;
    const issues = [];
    if (!lesson.sourceUrl?.startsWith("https://")) issues.push("missing-source");
    if (guideCount < 4) issues.push("short-guide");
    if (lesson.video.scenes.length !== guideCount) issues.push("video-guide-mismatch");
    if (lesson.practice.checklist.length !== guideCount) issues.push("practice-guide-mismatch");
    if (!lesson.quiz.guideHeading) issues.push("quiz-not-linked");
    if (lesson.practice.minimumKeywords > lesson.practice.keywords.length) issues.push("invalid-threshold");
    return { id: lesson.id, passed: issues.length === 0, issues };
  });
  const passed = checks.filter((item) => item.passed).length;
  return {
    total: checks.length,
    passed,
    percent: Math.round((passed / checks.length) * 100),
    checks,
  };
})();

export const getCourseProgress = (course, completedIds) => {
  const completed = course.steps.filter((step) => completedIds.has(`hugoso-${step.id}`)).length;
  return {
    completed,
    total: course.steps.length,
    percent: Math.round((completed / course.steps.length) * 100),
  };
};
