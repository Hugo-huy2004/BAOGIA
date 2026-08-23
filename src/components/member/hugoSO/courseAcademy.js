/**
 * Tầng học thuật của các học phần Hugo Studio Academy.
 *
 * Tách khỏi `hugoSOCourses.js` vì hai thứ đổi theo hai nhịp khác nhau: nội dung
 * thao tác đổi khi công cụ ra tính năng mới, còn mã học phần, chuẩn đầu ra và
 * thư mục tham khảo đổi khi chương trình đào tạo được rà soát.
 *
 * TRÍCH DẪN: mọi mục dưới đây là công trình CÓ THẬT, ghi theo Harvard
 * (Cite Them Right, ấn bản 12). Giáo trình do Hugo Studio biên soạn, nhưng luận
 * điểm nào dựa trên nghiên cứu của người khác thì phải dẫn được về nguồn gốc —
 * đó là ranh giới giữa tài liệu học thuật và bài viết cảm tính. Không bao giờ
 * bịa tên tác giả, năm hay số trang để làm đầy danh mục.
 */

/** Bậc học phần theo lối trường lớp: 100 nhập môn, 200 vận dụng, 300 chuyên sâu. */
export const COURSE_LEVELS = Object.freeze({
  100: "Nhập môn",
  200: "Vận dụng",
  300: "Chuyên sâu",
});

const ref = (citation, note) => Object.freeze({ citation, note });

export const COURSE_ACADEMY = Object.freeze({
  calendar: {
    code: "CAL 101",
    credits: 2,
    level: 100,
    faculty: "Khoa Năng suất số",
    prerequisite: "Không yêu cầu học phần tiên quyết.",
    // Chuẩn đầu ra viết theo động từ quan sát được: chấm được thì mới là chuẩn.
    outcomes: [
      "Phân biệt được sự kiện, tác vụ và khối thời gian, chọn đúng loại cho từng tình huống công việc.",
      "Thiết lập lịch làm việc một tuần có khối tập trung, khoảng đệm và quy tắc lặp có điểm dừng.",
      "Tổ chức lịch nhóm với quyền truy cập đúng vai trò và kiểm chứng được qua tài khoản thứ hai.",
      "Vận hành trang đặt hẹn không trùng lịch và giải thích được cơ chế chống trùng.",
    ],
    assessment: "Chấm trên sản phẩm thật: cấu hình lịch nộp kèm ảnh kiểm chứng, mỗi bài một trắc nghiệm hiểu bài.",
    references: [
      ref(
        "Allen, D. (2015) Getting Things Done: The Art of Stress-Free Productivity. Rev. edn. New York: Penguin Books.",
        "Nguồn gốc của nguyên tắc tách 'việc phải làm' khỏi 'lịch hẹn cố định' mà học phần dùng để phân biệt Task và Event.",
      ),
      ref(
        "Newport, C. (2016) Deep Work: Rules for Focused Success in a Distracted World. New York: Grand Central Publishing.",
        "Cơ sở của phần khối tập trung: chi phí chuyển ngữ cảnh và lý do phải đặt trước thời gian sâu trong lịch.",
      ),
      ref(
        "Perlow, L.A. (2012) Sleeping with Your Smartphone: How to Break the 24/7 Habit and Change the Way You Work. Boston: Harvard Business Review Press.",
        "Nghiên cứu thực địa cho thấy thời gian không-liên-lạc phải được nhóm thoả thuận, không thể do cá nhân tự giữ.",
      ),
      ref(
        "Internet Assigned Numbers Authority (no date) Time Zone Database. Available at: https://www.iana.org/time-zones (Accessed: 23 August 2026).",
        "Cơ sở dữ liệu múi giờ mà mọi lịch điện tử dựa vào; giải thích vì sao phải lưu theo UTC thay vì cộng trừ giờ thủ công.",
      ),
      ref(
        "Google (no date) Google Calendar Help. Available at: https://support.google.com/calendar/ (Accessed: 23 August 2026).",
        "Tài liệu chính thức của công cụ; dùng để đối chiếu tên menu và thao tác khi giao diện thay đổi.",
      ),
    ],
  },

  docs: {
    code: "DOC 102",
    credits: 3,
    level: 100,
    faculty: "Khoa Năng suất số",
    prerequisite: "Không yêu cầu; học sau CAL 101 sẽ thuận hơn khi lập kế hoạch viết.",
    outcomes: [
      "Dựng được bố cục báo cáo có phân cấp tiêu đề, mục lục tự sinh và kiểu định dạng dùng lại được.",
      "Cộng tác trên một bản thảo mà không mất dấu vết thay đổi, dùng góp ý và lịch sử phiên bản đúng mục đích.",
      "Trích dẫn theo chuẩn Harvard và lập danh mục tham khảo kiểm chứng được từ nguồn gốc.",
      "Xuất bản báo cáo đạt yêu cầu tiếp cận cơ bản: thẻ tiêu đề đúng cấp, văn bản thay thế cho hình, tương phản đủ.",
    ],
    assessment: "Sản phẩm cuối là một báo cáo hoàn chỉnh; chấm theo rubric bố cục, trích dẫn, tính tiếp cận và bản PDF.",
    references: [
      ref(
        "Pears, R. and Shields, G. (2022) Cite Them Right: The Essential Referencing Guide. 12th edn. London: Bloomsbury Academic.",
        "Chuẩn Harvard mà toàn bộ học phần và mọi tài liệu Hugo Studio Academy tuân theo.",
      ),
      ref(
        "Williams, J.M. and Bizup, J. (2017) Style: Lessons in Clarity and Grace. 12th edn. Boston: Pearson.",
        "Cơ sở của phần viết câu và đoạn: nguyên tắc thông tin cũ đứng trước, thông tin mới đứng sau.",
      ),
      ref(
        "Gopen, G.D. and Swan, J.A. (1990) 'The Science of Scientific Writing', American Scientist, 78(6), pp. 550–558.",
        "Giải thích vì sao vị trí của thông tin trong câu quyết định người đọc hiểu gì — nền của phần bố cục đoạn.",
      ),
      ref(
        "World Wide Web Consortium (2023) Web Content Accessibility Guidelines (WCAG) 2.2. Available at: https://www.w3.org/TR/WCAG22/ (Accessed: 23 August 2026).",
        "Tiêu chuẩn dùng cho phần tiếp cận: tương phản tối thiểu, cấu trúc tiêu đề, văn bản thay thế.",
      ),
      ref(
        "Google (no date) Google Docs Editors Help. Available at: https://support.google.com/docs/ (Accessed: 23 August 2026).",
        "Tài liệu chính thức để đối chiếu thao tác kiểu, mục lục và lịch sử phiên bản.",
      ),
    ],
  },

  sheets: {
    code: "SHE 201",
    credits: 3,
    level: 200,
    faculty: "Khoa Dữ liệu ứng dụng",
    prerequisite: "DOC 102 hoặc kỹ năng soạn thảo tương đương.",
    outcomes: [
      "Thiết kế bảng dữ liệu gọn (tidy) trong đó một hàng là một quan sát và một cột là một biến.",
      "Ràng buộc dữ liệu đầu vào bằng kiểm tra hợp lệ để lỗi bị chặn ngay lúc nhập, không phải lúc báo cáo.",
      "Viết công thức và bảng tổng hợp có xử lý trường hợp biên, kiểm thử được bằng dữ liệu cố ý sai.",
      "Bàn giao bảng theo dõi có bảng điều khiển tự cập nhật, vùng công thức được khoá và hướng dẫn sử dụng.",
    ],
    assessment: "Chấm trên bảng theo dõi thật: cấu trúc dữ liệu, độ bền công thức trước dữ liệu biên, và chất lượng bàn giao.",
    references: [
      ref(
        "Wickham, H. (2014) 'Tidy Data', Journal of Statistical Software, 59(10), pp. 1–23.",
        "Định nghĩa dữ liệu gọn — nền tảng cho quy tắc 'một hàng là một quan sát' của học phần.",
      ),
      ref(
        "Broman, K.W. and Woo, K.H. (2018) 'Data Organization in Spreadsheets', The American Statistician, 72(1), pp. 2–10.",
        "Khuyến nghị cụ thể cho bảng tính: không gộp ô, không tô màu thay dữ liệu, ngày ghi theo ISO 8601.",
      ),
      ref(
        "Panko, R.R. (1998) 'What We Know About Spreadsheet Errors', Journal of End User Computing, 10(2), pp. 15–21.",
        "Bằng chứng định lượng về tỉ lệ lỗi trong bảng tính thực tế; lý do học phần bắt buộc kiểm thử công thức.",
      ),
      ref(
        "Few, S. (2012) Show Me the Numbers: Designing Tables and Graphs to Enlighten. 2nd edn. Burlingame, CA: Analytics Press.",
        "Cơ sở cho phần bảng điều khiển: chọn dạng biểu đồ theo câu hỏi cần trả lời, không theo thẩm mỹ.",
      ),
      ref(
        "Tufte, E.R. (2001) The Visual Display of Quantitative Information. 2nd edn. Cheshire, CT: Graphics Press.",
        "Nguyên tắc tỉ lệ mực–dữ liệu, dùng để loại bỏ trang trí thừa khỏi báo cáo.",
      ),
      ref(
        "Google (no date) Google Sheets Help. Available at: https://support.google.com/docs/topic/9054603 (Accessed: 23 August 2026).",
        "Tài liệu chính thức để đối chiếu cú pháp hàm và thao tác bảng tổng hợp.",
      ),
    ],
  },

  ai: {
    code: "AIA 202",
    credits: 3,
    level: 200,
    faculty: "Khoa Trí tuệ nhân tạo ứng dụng",
    prerequisite: "DOC 102; nên học cùng hoặc sau SHE 201 để có dữ liệu thật mà kiểm chứng.",
    outcomes: [
      "Giải thích được mô hình ngôn ngữ sinh câu trả lời bằng cách nào, và vì sao nó có thể sai một cách trôi chảy.",
      "Viết yêu cầu có mục tiêu, ngữ cảnh, ràng buộc và tiêu chí chấm, cho ra kết quả lặp lại được.",
      "So sánh Gemini, ChatGPT và Claude trên cùng một nhiệm vụ và chọn công cụ theo bằng chứng, không theo thói quen.",
      "Kiểm chứng từng khẳng định của mô hình về nguồn gốc, và tách bản nháp máy sinh khỏi kết luận đã xác minh.",
      "Thiết kế quy trình có điểm kiểm soát, nhật ký quyết định và người chịu trách nhiệm cuối.",
    ],
    assessment: "Sản phẩm cuối là một quy trình AI có nhật ký: yêu cầu đã dùng, mô hình đã thử, nguồn đã kiểm và người phê duyệt.",
    references: [
      ref(
        "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A.N., Kaiser, Ł. and Polosukhin, I. (2017) 'Attention Is All You Need', Advances in Neural Information Processing Systems, 30, pp. 5998–6008.",
        "Kiến trúc Transformer — nền của mọi mô hình trong học phần này.",
      ),
      ref(
        "Bender, E.M., Gebru, T., McMillan-Major, A. and Shmitchell, S. (2021) 'On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?', Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency, pp. 610–623.",
        "Lập luận vì sao độ trôi chảy không đồng nghĩa với độ đúng; cơ sở cho quy tắc kiểm chứng bắt buộc.",
      ),
      ref(
        "Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., Ishii, E., Bang, Y., Madotto, A. and Fung, P. (2023) 'Survey of Hallucination in Natural Language Generation', ACM Computing Surveys, 55(12), pp. 1–38.",
        "Tổng quan các dạng ảo giác và cách phát hiện — dùng cho phần đối chiếu nguồn.",
      ),
      ref(
        "Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., Chi, E., Le, Q. and Zhou, D. (2022) 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', Advances in Neural Information Processing Systems, 35, pp. 24824–24837.",
        "Bằng chứng cho kỹ thuật yêu cầu mô hình trình bày các bước trung gian.",
      ),
      ref(
        "Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S. and Kiela, D. (2020) 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', Advances in Neural Information Processing Systems, 33, pp. 9459–9474.",
        "Cơ sở kỹ thuật của việc đưa tài liệu của bạn vào ngữ cảnh thay vì tin trí nhớ của mô hình.",
      ),
      ref(
        "National Institute of Standards and Technology (2023) Artificial Intelligence Risk Management Framework (AI RMF 1.0). Gaithersburg, MD: NIST. Available at: https://doi.org/10.6028/NIST.AI.100-1 (Accessed: 23 August 2026).",
        "Khung quản trị rủi ro dùng cho phần điểm kiểm soát và trách nhiệm giải trình.",
      ),
      ref(
        "Google (no date) Gemini Apps Help. Available at: https://support.google.com/gemini/ (Accessed: 23 August 2026).",
        "Tài liệu chính thức của một trong ba công cụ được so sánh.",
      ),
      ref(
        "OpenAI (no date) OpenAI Help Center. Available at: https://help.openai.com/ (Accessed: 23 August 2026).",
        "Tài liệu chính thức của ChatGPT.",
      ),
      ref(
        "Anthropic (no date) Claude Documentation. Available at: https://docs.anthropic.com/ (Accessed: 23 August 2026).",
        "Tài liệu chính thức của Claude.",
      ),
    ],
  },
});

export function academyOf(courseId) {
  return COURSE_ACADEMY[courseId] || null;
}
