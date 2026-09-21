/**
 * 2 VĂN BẢN QUY CHUẨN DUY NHẤT DÀNH CHO THÀNH VIÊN HUGO STUDIO
 * ==========================================================
 * Bản 1: terms-manifest - Điều khoản dịch vụ & Tuyên ngôn hệ thống (Bản đã làm)
 * Bản 2: database-policy - Quy ước cơ sở dữ liệu người dùng & Chính sách thành viên
 *
 * Tối ưu hóa cho trải nghiệm Apple Inset Grouped, giao diện tinh gọn, không rối mắt.
 */

export const MEMBER_DOCS = {
  "terms-manifest": {
    id: "terms-manifest",
    title: "Điều khoản dịch vụ & Tuyên ngôn hệ thống",
    subtitle: "Cam kết vận hành bền vững, quyền lợi thành viên và nguyên tắc tương hỗ minh bạch",
    version: "2026.4",
    lastUpdated: "Tháng 09, 2026",
    badge: "Văn bản hiện hành",
    sections: [
      {
        id: "tuyen-ngon",
        title: "Tuyên ngôn hệ thống & Triết lý vận hành",
        blocks: [
          {
            type: "p",
            text: "Hugo Studio được xây dựng dựa trên nguyên tắc minh bạch, công bằng và tôn trọng quyền riêng tư của mọi cá nhân. Hệ thống từ chối các mô hình kinh doanh bóc lột dữ liệu hoặc thương mại hóa quyền tự do của thành viên.",
          },
          {
            type: "note",
            tone: "info",
            title: "Cam kết bảo tồn tài nguyên",
            text: "Mọi sản phẩm, dịch vụ và tính năng trong hệ sinh thái đều được tối ưu hóa theo tiêu chuẩn Carbon-neutral, giảm thiểu tải điện toán máy chủ và bảo vệ tuổi thọ thiết bị Thành Viên.",
          },
          {
            type: "steps",
            items: [
              "Hệ sinh thái tự chủ, không lệ thuộc vào các nền tảng mạng xã hội độc quyền.",
              "Dữ liệu của Quý thành viên thuộc về Quý thành viên. Quý thành viên có quyền xuất bản, lưu trữ và xóa bỏ vĩnh viễn bất kỳ lúc nào.",
              "Không bán dữ liệu hành vi Thành Viên cho bên thứ ba dưới bất kỳ hình thức quảng cáo nào.",
              "Môi trường giao lưu lành mạnh, văn minh, thúc đẩy sáng tạo nghệ thuật và tri thức số.",
            ],
          },
        ],
      },
      {
        id: "dieu-khoan-dich-vu",
        title: "Quyền và Nghĩa vụ thành viên",
        blocks: [
          {
            type: "p",
            text: "Mọi cá nhân khi tạo tài khoản và kích hoạt định danh tại Member Portal đều là thành viên chính thức của Hugo Studio. Quyền hạn và nghĩa vụ được quy định chi tiết theo từng phân vùng.",
          },
          {
            type: "table",
            head: ["Hạng mục", "Quyền lợi thành viên", "Nghĩa vụ ràng buộc"],
            rows: [
              ["Tài khoản & Hồ sơ", "Toàn quyền sở hữu trang cá nhân Bio, tùy biến Aura và bảo mật Passkey", "Bảo mật khóa xác thực, không cho thuê hoặc chuyển nhượng tài khoản"],
              ["Tài nguyên JOY", "Tích lũy JOY từ các hoạt động sáng tạo, tương tác và học tập", "Sử dụng JOY đúng mục đích nội bộ, không gian lận hay can thiệp luồng giao dịch"],
              ["Nội dung công khai", "Được tự do sáng tạo, xuất bản bài viết và liên kết nghệ thuật", "Không phát tán nội dung bạo lực, vi phạm thuần phong mỹ tục hoặc xâm phạm chủ quyền"],
              ["Hỗ trợ & Khiếu nại", "Được bảo vệ quyền lợi và giải quyết tranh chấp trong vòng 24 giờ", "Cung cấp thông tin xác minh trung thực khi có yêu cầu kiểm toán an ninh"],
            ],
          },
          {
            type: "p",
            text: "Hugo Studio bảo lưu quyền tạm đình chỉ hoặc chấm dứt cung cấp dịch vụ đối với bất kỳ tài khoản nào có hành vi phá hoại an ninh hệ thống, khai thác lỗ hổng hoặc vi phạm các tuyên bố về hòa bình và chủ quyền.",
          },
        ],
      },
      {
        id: "quyen-thiet-bi",
        title: "Quyền thiết bị & Giới hạn truy cập",
        blocks: [
          {
            type: "p",
            text: "Hệ thống chỉ yêu cầu các quyền truy cập tối thiểu cần thiết để vận hành trơn tru giao diện ứng dụng trên thiết bị di động và máy tính.",
          },
          {
            type: "steps",
            items: [
              "Thông báo đẩy (Push Notifications): Chỉ gửi cảnh báo bảo mật, biến động số dư JOY và tin tức quan trọng.",
              "Bộ nhớ cục bộ (IndexedDB/Cache): Lưu trữ cấu hình giao diện, tài liệu ngoại tuyến để tăng tốc độ tải mà không tốn băng thông.",
              "Khóa bảo mật sinh trắc (Biometrics/WebAuthn): Xác thực vân tay hoặc khuôn mặt hoàn toàn cục bộ trên phần cứng máy (Secure Enclave), không gửi vân tay lên máy chủ.",
            ],
          },
        ],
      },
    ],
  },

  "database-policy": {
    id: "database-policy",
    title: "Quy ước cơ sở dữ liệu Thành Viên & Chính sách thành viên",
    subtitle: "Cơ chế bảo mật Zero-Trust, quy chế ngân khố JOY/JOY Gối Đầu và lộ trình phân hạng đặc quyền",
    version: "2026.4",
    lastUpdated: "Tháng 09, 2026",
    badge: "Quy ước hệ thống",
    sections: [
      {
        id: "kien-truc-csdl",
        title: "Quy ước Cơ sở dữ liệu & Kiến trúc Zero-Trust",
        blocks: [
          {
            type: "p",
            text: "Cơ sở dữ liệu Thành Viên của Hugo Studio được thiết kế theo nguyên tắc Zero-Knowledge và Zero-Trust. Dữ liệu nhạy cảm được mã hóa cấp trường (Field-Level Encryption) với chuẩn AES-256-GCM trước khi ghi vào đĩa vật lý.",
          },
          {
            type: "table",
            head: ["Trường dữ liệu", "Phương thức lưu trữ", "Thời gian lưu giữ"],
            rows: [
              ["Mật khẩu / Khóa PIN", "Bcrypt salt 12 rounds / Argon2id, không lưu mật khẩu thô", "Vĩnh viễn cho tới khi thành viên đổi mã mới"],
              ["Khóa Passkey (FIDO2)", "Public Key lưu tại server, Private Key nằm trong thiết bị", "Vĩnh viễn hoặc khi hủy liên kết thiết bị"],
              ["Lịch sử giao dịch ngân khố JOY", "Sổ cái bất biến (Append-Only Ledger) có chữ ký số", "Lưu trữ vĩnh viễn phục vụ đối soát minh bạch"],
              ["Nhật ký đăng nhập thiết bị", "IP ẩn danh (hash SHA-256), User-Agent rút gọn", "Tự động thanh lọc sau 90 ngày"],
            ],
          },
          {
            type: "note",
            tone: "warning",
            title: "Quyền xóa dữ liệu (Right to be Forgotten)",
            text: "Khi Quý thành viên chọn 'Xóa tài khoản vĩnh viễn' trong Cài đặt bảo mật, toàn bộ hồ sơ cá nhân, bio, liên kết và avatar sẽ bị xóa sạch khỏi máy chủ ngay lập tức. Sổ cái giao dịch tài chính chỉ giữ lại hash ẩn danh để bảo toàn số dư đối ứng.",
          },
        ],
      },
      {
        id: "quy-che-joy",
        title: "Quy chế ngân khố điểm thưởng JOY & JOY Gối Đầu",
        blocks: [
          {
            type: "p",
            text: "JOY là đơn vị điểm thưởng tiện ích nội bộ (Utility Points) của hệ sinh thái Hugo Studio. JOY không phải tiền pháp định, không có giá trị quy đổi thành tiền mặt và không được phép giao dịch chợ đen.",
          },
          {
            type: "table",
            head: ["Tính năng / Dịch vụ", "Chi phí / Hạn mức", "Ghi chú vận hành"],
            rows: [
              ["Điểm danh hằng ngày", "+5 đến +20 JOY / ngày", "Cộng tự động vào 00:00 (GMT+7)"],
              ["Giới thiệu bạn bè mới", "+100 JOY / người", "Áp dụng khi người mới kích hoạt hồ sơ"],
              ["Chuyển JOY cho bạn bè", "500 JOY/ngày (Star-14) · 1.000 JOY/ngày (các hạng khác) · 8.000 JOY/tháng", "Yêu cầu xác thực mã PIN bảo vệ ngân khố"],
              ["Phí chuyển JOY", "0% (Star-VIP) · 5% (các hạng khác)", "Phí giữ hệ thống vận hành, không phải khoản thu lợi nhuận"],
              ["JOYlater (Vay JOY)", "Hạn mức xét theo hồ sơ, nhân hệ số của hạng thẻ", "Xét lại tự động 17:00 thứ Bảy hằng tuần"],
              ["Lãi JOY Gối Đầu", "Lãi trong hạn thả theo tuần · quá hạn ×1,5 · chậm trả lãi 10%/năm", "Theo giới hạn Bộ luật Dân sự 2015 điều 466"],
            ],
          },
          {
            type: "steps",
            items: [
              "Vay JOY Gối Đầu chỉ dùng để mở khoá tiện ích hoặc công cụ số trong hệ thống Hugo Studio. JOY không quy đổi thành tiền mặt, nên khoản vay này không phải quan hệ tín dụng tiền tệ.",
              "Hạn mức được xét theo hồ sơ thành viên (JOY thu vào trừ JOY tiêu ra, số dư, mức độ sử dụng hệ thống và lịch sử hoàn trả), sau đó nhân hệ số của hạng thẻ. Hạng Star-14 không được cấp hạn mức.",
              "Khoản vay chịu lãi tính theo ngày trên dư nợ gốc còn lại. Lãi trong hạn được chốt tại thời điểm ký và không thay đổi suốt kỳ vay. Trả trước hạn luôn giảm lãi và không mất phí.",
              "Chậm hoàn trả phát sinh lãi quá hạn (tối đa 150% lãi trong hạn) và lãi chậm trả lãi (tối đa 10%/năm), theo đúng giới hạn của Bộ luật Dân sự 2015 điều 466.",
              "Quá hạn kéo dài dẫn tới các biện pháp tăng dần, mỗi mức đều được thông báo trước: quá 7 ngày tạm ngưng quyền chuyển JOY và mở khoản mới; quá 21 ngày đình chỉ chi tiêu; quá 45 ngày phong toả tài khoản 30 ngày; quá 90 ngày lập hồ sơ trình quản trị thẩm định biện pháp vĩnh viễn.",
              "Hugo Studio không bao giờ đòi nợ bằng bất kỳ hình thức nào ngoài hệ thống, không chuyển giao dữ liệu thành viên cho bên thứ ba để thu hồi, và không quy đổi khoản vay thành nghĩa vụ tiền mặt.",
            ],
          },
        ],
      },
      {
        id: "phan-hang-dac-quyen",
        title: "Hệ thống Phân hạng thành viên & Đặc quyền",
        blocks: [
          {
            type: "p",
            text: "Hạng thành viên được ghi nhận tự động theo đóng góp kết nối cộng đồng. Không áp dụng phí duy trì định kỳ, không bị hạ hạng theo thời gian.",
          },
          {
            type: "table",
            head: ["Hạng thành viên", "Điều kiện tích lũy", "Đặc quyền cốt lõi"],
            rows: [
              ["Member", "Mặc định khi đăng ký", "Sở hữu trang Hugo Bio cơ bản, ngân khố JOY cá nhân"],
              ["Silver", "Giới thiệu từ 3 bạn bè", "Mở khóa thêm giao diện Dark Aura, tặng 500 JOY"],
              ["Gold", "Giới thiệu từ 10 bạn bè", "Tặng Voucher 1,300 JOY, ưu tiên xử lý ticket 24/7"],
              ["Diamond", "Giới thiệu từ 25 bạn bè", "Tặng Voucher 3,500 JOY, mở khóa toàn bộ kho hiệu ứng Bio"],
              ["Premium VIP", "Giới thiệu từ 50 bạn bè", "Tặng Voucher 20,000 JOY, quà lưu niệm độc quyền Hugo"],
            ],
          },
        ],
      },
    ],
  },
};

export const LEGAL_DOC_KEYS = ["terms-manifest", "database-policy"];
