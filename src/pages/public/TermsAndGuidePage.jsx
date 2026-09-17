import { useHeadMeta } from "../../hooks/useHeadMeta";
import DocsLayout from "./DocsLayout";

const UPDATED_AT = "17/09/2026";
const CONTACT_EMAIL = "contact@hugowishpax.studio";

const PILLARS = [
  { id: "all", label: "Tất cả nội dung", icon: "dashboard", count: 16 },
  { id: "terms", label: "Điều khoản sử dụng", icon: "gavel", count: 3 },
  { id: "privacy", label: "Chính sách bảo mật", icon: "shield", count: 3 },
  { id: "guide", label: "Hướng dẫn sử dụng", icon: "menu_book", count: 10 },
];

export default function TermsAndGuidePage({ defaultPillar = "all" }) {
  useHeadMeta({
    title: "Điều khoản và hướng dẫn sử dụng | Hugo Studio",
    description:
      "Văn bản hợp nhất Điều khoản sử dụng, Cam kết bảo mật quyền riêng tư và Cẩm nang hướng dẫn sử dụng toàn diện hệ sinh thái Hugo Studio chuẩn phong cách Apple.",
    keywords:
      "điều khoản sử dụng, chính sách bảo mật, hướng dẫn sử dụng, Hugo Studio, Privacy by Design, PWA, Passkey, Hugo Bio, Ví JOY, Hugo Learning, PayOS",
    canonicalUrl: "https://www.hugowishpax.studio/terms-and-guide",
  });

  const sections = [
    // ==========================================
    // TRỤ CỘT 1: ĐIỀU KHOẢN SỬ DỤNG
    // ==========================================
    {
      id: "tinh-than-cong-dong",
      title: "Tinh thần cộng đồng & Tôn trọng bản quyền",
      pillar: "terms",
      pillarTitle: "Phần I: Điều khoản sử dụng",
      pillarIcon: "gavel",
      pillarDesc: "Quy ước văn minh, bảo vệ quyền sở hữu sáng tạo và trách nhiệm xây dựng môi trường số lành mạnh.",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio là nền tảng cá nhân do Lê Gia Huy thiết kế, phát triển và trực tiếp vận hành. Hệ sinh thái hướng đến việc tạo ra một không gian số an toàn, hỗ trợ học lập trình, chăm sóc sức khỏe tinh thần và cung cấp dịch vụ công nghệ chất lượng cao cho cộng đồng học sinh, sinh viên và người đi làm.",
        },
        {
          type: "note",
          tone: "info",
          title: "Quyền sở hữu trí tuệ thuộc về bạn",
          text: "Toàn bộ bài viết, đoạn mã lập trình, ghi chú cá nhân, thiết kế giao diện Hugo Bio và tài sản số do bạn tạo ra trên nền tảng hoàn toàn thuộc về bạn. Hugo Studio không bao giờ đòi hỏi quyền sở hữu hay chuyển nhượng bản quyền đối với các tác phẩm của bạn.",
        },
        {
          type: "list",
          items: [
            "Tôn trọng lẫn nhau: Hệ thống duy trì tinh thần tương trợ, cởi mở và văn minh. Mọi hành vi quấy rối, công kích cá nhân, phân biệt đối xử hoặc xúc phạm danh dự của thành viên khác đều không được chấp nhận.",
            "Nội dung lành mạnh: Nghiêm cấm tải lên hoặc chia sẻ nội dung độc hại, văn hóa phẩm đồi trụy, thông tin sai sự thật hoặc mã độc phá hoại máy chủ.",
            "Tôn trọng bản quyền bên thứ ba: Người dùng tự chịu trách nhiệm về tính nguyên bản của hình ảnh, liên kết và mã nguồn tải lên trang cá nhân hoặc các diễn đàn chia sẻ.",
            "Cam kết tính sẵn sàng: Hệ thống nỗ lực vận hành ổn định 24/7. Trong các đợt bảo trì nâng cấp hạ tầng, lịch bảo trì sẽ được thông báo sớm trên bảng tin để người dùng chủ động công việc.",
          ],
        },
        {
          type: "cards",
          items: [
            {
              title: "Sở hữu trọn vẹn",
              desc: "Mọi sản phẩm, ghi chú học tập và profile cá nhân thuộc 100% quyền sở hữu của bạn.",
              icon: "copyright",
              badge: "Sở hữu trí tuệ",
            },
            {
              title: "Cộng đồng văn minh",
              desc: "Giao lưu học hỏi lành mạnh, không phát tán spam, mã độc hoặc ngôn từ kích động.",
              icon: "diversity_3",
              badge: "Quy tắc ứng xử",
            },
            {
              title: "Ổn định & An tâm",
              desc: "Hạ tầng tối ưu hóa liên tục, đảm bảo ứng dụng luôn sẵn sàng phục vụ học tập 24/7.",
              icon: "speed",
              badge: "Độ sẵn sàng",
            },
          ],
        },
      ],
    },
    {
      id: "tai-khoan-an-toan",
      title: "Tài khoản, Độ tuổi & An toàn trải nghiệm",
      pillar: "terms",
      pillarTitle: "Phần I: Điều khoản sử dụng",
      pillarIcon: "gavel",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio mở rộng cửa cho mọi đối tượng khám phá công nghệ, đồng thời áp dụng các tiêu chuẩn an toàn hiện đại để bảo vệ quyền riêng tư và dữ liệu của người dùng trẻ tuổi.",
        },
        {
          type: "list",
          items: [
            "Trải nghiệm tự do không rào cản: Các công cụ công khai như Nghe nhạc Lofi Radio, Thư giãn Bàn học đường, Trải nghiệm HugoArcade và Luyện tập lập trình cơ bản đều mở miễn phí cho mọi lứa tuổi mà không bắt buộc tạo tài khoản.",
            "Khuyến nghị độ tuổi thành viên: Đối với tài khoản thành viên lưu trữ hồ sơ cá nhân và lịch sử học tập, chúng tôi khuyến nghị người dùng từ đủ 14 tuổi trở lên để có thể tự chủ quản lý thông tin.",
            "Mỗi cá nhân một tài khoản chính chủ: Để bảo đảm tính công bằng trên bảng xếp hạng và duy trì tài nguyên máy chủ cho mọi người, mỗi thành viên sử dụng một tài khoản chính thức. Nghiêm cấm tạo hàng loạt tài khoản ảo để cày điểm thưởng JOY hoặc thao túng hệ thống.",
            "Tự chủ bảo vệ tài khoản: Người dùng có trách nhiệm bảo mật thiết bị cá nhân, mã PIN ví JOY và phiên đăng nhập. Bạn có thể đăng xuất khỏi các thiết bị từ xa chỉ với một thao tác trong trang Cài đặt.",
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Bảo mật không mật khẩu với Passkey",
          text: "Chúng tôi khuyến khích bạn kích hoạt tính năng Passkey (Touch ID, Face ID, Windows Hello) trong mục Tài khoản. Công nghệ này giúp bạn đăng nhập tức thì trong 1 giây mà không lo nguy cơ bị lộ hay quên mật khẩu.",
        },
      ],
    },
    {
      id: "joy-va-chi-phi",
      title: "Quy ước Điểm thưởng JOY & Chi phí minh bạch",
      pillar: "terms",
      pillarTitle: "Phần I: Điều khoản sử dụng",
      pillarIcon: "gavel",
      blocks: [
        {
          type: "p",
          text: "Mọi hoạt động quy đổi, điểm thưởng và chi phí dịch vụ trong hệ sinh thái đều tuân theo nguyên tắc minh bạch, rõ ràng và không có bất kỳ điều khoản ẩn nào.",
        },
        {
          type: "table",
          head: ["Đặc tính", "Hệ thống Điểm thưởng JOY", "Giao dịch Dịch vụ Web / Donate"],
          rows: [
            [
              "Bản chất cốt lõi",
              "Điểm thưởng tri ân nội bộ, ghi nhận nỗ lực học tập và hoạt động lành mạnh.",
              "Thanh toán dịch vụ thực tế hoặc đóng góp tự nguyện duy trì máy chủ.",
            ],
            [
              "Phương thức nhận",
              "Điểm danh ngày (Streak), hoàn thành bài học lập trình, ván cờ, giờ học tập trung.",
              "Chuyển khoản chính xác qua mã VietQR tự động tích hợp cổng PayOS.",
            ],
            [
              "Quy đổi & Giá trị",
              "KHÔNG quy đổi thành tiền mặt, không phải tài sản tài chính hay công cụ đầu cơ.",
              "Báo giá niêm yết công khai, tính năng rõ ràng, hóa đơn điện tử minh bạch.",
            ],
            [
              "Chống trục lợi",
              "Hệ thống tự động phát hiện bot và thu hồi điểm thưởng do can thiệp bất thường.",
              "Chính sách cọc 50%, bảo hành 6 tháng, bàn giao 100% mã nguồn sạch trên Git.",
            ],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Điểm thưởng JOY mang giá trị tinh thần",
          text: "Điểm JOY được sinh ra để tiếp thêm động lực cho hành trình rèn luyện kỹ năng của bạn. Tuyệt đối không mua bán, trao đổi JOY bằng tiền thật với các thành viên khác bên ngoài nền tảng.",
        },
        {
          type: "p",
          text: "Đối với người dùng muốn đóng góp duy trì máy chủ (Donate), toàn bộ đóng góp là tự nguyện xuất phát từ tình cảm yêu quý sản phẩm, giúp duy trì kinh phí lưu trữ đám mây và mở rộng học liệu miễn phí cho cộng đồng.",
        },
      ],
    },

    // ==========================================
    // TRỤ CỘT 2: CHÍNH SÁCH BẢO MẬT
    // ==========================================
    {
      id: "cam-ket-bao-mat",
      title: "Cam kết bảo mật & Quyền riêng tư trong thiết kế",
      pillar: "privacy",
      pillarTitle: "Phần II: Chính sách bảo mật",
      pillarIcon: "shield",
      pillarDesc: "Quyền riêng tư là quyền cơ bản của con người. Chúng tôi thiết kế hệ thống bảo vệ bạn ngay từ dòng mã đầu tiên.",
      blocks: [
        {
          type: "p",
          text: "Tại Hugo Studio, chúng tôi tin rằng trải nghiệm số tuyệt vời phải luôn đi kèm với sự an tâm tuyệt đối. Quyền riêng tư của bạn không phải là một điều khoản phụ, mà là tiêu chuẩn kỹ thuật cốt lõi (Privacy by Design) định hình cách chúng tôi xây dựng từng tính năng.",
        },
        {
          type: "cards",
          items: [
            {
              title: "Không bán dữ liệu",
              desc: "Tuyệt đối không bao giờ chia sẻ, bán hoặc cho thuê thông tin cá nhân của bạn cho bất kỳ bên thứ ba hay mạng quảng cáo nào.",
              icon: "lock",
              badge: "Cam kết số 1",
            },
            {
              title: "Không theo dõi lén lút",
              desc: "Hệ thống không nhúng mã theo dõi hành vi xuyên trang (zero cross-site tracking) và không đọc dữ liệu ngoài ứng dụng.",
              icon: "visibility_off",
              badge: "Cam kết số 2",
            },
            {
              title: "Bảo mật trên máy bạn",
              desc: "Dữ liệu sinh trắc học Touch ID / Face ID được xử lý khép kín trong chip bảo mật thiết bị (Secure Enclave / TPM).",
              icon: "fingerprint",
              badge: "Cam kết số 3",
            },
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Nguyên tắc tối giản dữ liệu (Data Minimization)",
          text: "Bạn không sử dụng tính năng nào thì Hugo Studio không thu thập dữ liệu của tính năng đó. Bạn hoàn toàn có thể từ chối cấp quyền vị trí hoặc thông báo mà không làm ảnh hưởng đến các quyền lợi thành viên cơ bản khác.",
        },
      ],
    },
    {
      id: "minh-bach-du-lieu",
      title: "Bảng minh bạch dữ liệu thu thập & Lưu trữ",
      pillar: "privacy",
      pillarTitle: "Phần II: Chính sách bảo mật",
      pillarIcon: "shield",
      blocks: [
        {
          type: "p",
          text: "Để bạn luôn nắm rõ thông tin nào đang được lưu trữ, dưới đây là bảng đối chiếu minh bạch theo từng nhóm tính năng thực tế trong ứng dụng:",
        },
        {
          type: "table",
          head: ["Nhóm tính năng", "Thông tin có thể lưu trữ", "Mục đích sử dụng & Cam kết an toàn"],
          rows: [
            [
              "Đăng nhập & Tài khoản",
              "Tên, Email và Ảnh đại diện do Google cung cấp; khóa công khai thiết bị nếu bật Passkey.",
              "Xác định đúng tài khoản và duy trì phiên làm việc an toàn. Không bao giờ biết mật khẩu Google của bạn.",
            ],
            [
              "Hồ sơ Hugo Bio",
              "Biệt danh, tiểu sử ngắn, các liên kết mạng xã hội và chủ đề Aura bạn chủ động thiết lập.",
              "Hiển thị trang đại diện cá nhân công khai theo mong muốn của bạn. Bạn có thể sửa hoặc xóa bất kỳ lúc nào.",
            ],
            [
              "Lớp thời tiết (Weather)",
              "Tọa độ GPS tức thời (chỉ khi bạn chủ động nhấn nút cấp quyền trên trình duyệt).",
              "Gửi truy vấn lấy thông tin nhiệt độ thời tiết địa phương theo thời gian thực; hoàn toàn KHÔNG lưu vết hành trình.",
            ],
            [
              "HugoPSY & Sức khỏe",
              "Nhật ký thời lượng giấc ngủ, bài tập thở và cảm xúc bạn tự nhập.",
              "Vẽ biểu đồ nhịp sinh học cá nhân để bạn theo dõi sức khỏe; dữ liệu được mã hóa riêng tư, người ngoài không thể đọc.",
            ],
            [
              "Ví JOY & Tiến độ học",
              "Số dư JOY, chuỗi streak điểm danh, tiến độ bài tập và mã nộp bài lập trình.",
              "Đồng bộ tiến độ học tập trên các thiết bị và cấp chứng nhận hoàn thành khóa học tương ứng.",
            ],
            [
              "Thanh toán PayOS VietQR",
              "Mã đơn hàng, số tiền, nội dung chuyển khoản và trạng thái PayOS phản hồi.",
              "Xác thực đơn hàng tự động; hệ thống KHÔNG BAO GIỜ chạm vào hay lưu trữ số thẻ ngân hàng hoặc mã OTP của bạn.",
            ],
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Hugo Studio có thấy mật khẩu Google hoặc tài khoản ngân hàng của tôi không?",
              a: "Hoàn toàn không. Đăng nhập Google do máy chủ bảo mật của Google xử lý; giao dịch VietQR diễn ra trực tiếp trong ứng dụng ngân hàng của bạn thông qua cổng thanh toán quốc gia Napas/PayOS.",
            },
            {
              q: "Vân tay và khuôn mặt của tôi có được gửi lên máy chủ không?",
              a: "Không bao giờ. Dữ liệu sinh trắc học được bảo vệ tuyệt đối trong phần cứng máy bạn (Secure Enclave của Apple hoặc TPM của Windows). Trình duyệt chỉ gửi một chữ ký mật mã xác thực lên máy chủ.",
            },
            {
              q: "Ứng dụng có quay màn hình hay ghi lại thao tác bàn phím không?",
              a: "Tuyệt đối không. Hugo Studio không cài đặt bất kỳ công cụ ghi màn hình hay trình theo dõi thao tác gõ phím nào.",
            },
          ],
        },
      ],
    },
    {
      id: "kiem-soat-du-lieu",
      title: "Quyền kiểm soát & Tự chủ dữ liệu cá nhân",
      pillar: "privacy",
      pillarTitle: "Phần II: Chính sách bảo mật",
      pillarIcon: "shield",
      blocks: [
        {
          type: "p",
          text: "Bạn là chủ nhân duy nhất của dữ liệu cá nhân. Chúng tôi cung cấp các công cụ trực quan để bạn toàn quyền làm chủ thông tin của mình mà không gặp bất kỳ trở ngại nào:",
        },
        {
          type: "list",
          items: [
            "Xem và chỉnh sửa tức thời: Bạn có thể cập nhật tên hiển thị, tiểu sử, đường dẫn mạng xã hội, ảnh đại diện hoặc xóa từng liên kết Bio ngay trong bảng điều khiển.",
            "Xuất dữ liệu độc lập (Data Portability): Bất kỳ lúc nào, bạn cũng có thể yêu cầu xuất toàn bộ lịch sử học tập, nhật ký và hồ sơ cá nhân ra tệp JSON tiêu chuẩn để lưu trữ độc lập.",
            "Quyền được lãng quên (Xóa vĩnh viễn): Nếu không còn muốn đồng hành cùng Hugo Studio, bạn có thể xóa tài khoản trực tiếp trong mục Cài đặt hoặc gửi email tới contact@hugowishpax.studio. Toàn bộ thông tin cá nhân và dữ liệu liên kết sẽ được xóa sạch khỏi cơ sở dữ liệu trong vòng 24 giờ.",
            "Thu hồi quyền tức thì: Bạn có thể tắt quyền truy cập Vị trí địa lý (GPS) hoặc Thông báo đẩy (Web Push) bất cứ lúc nào trong phần cài đặt quyền riêng tư của trình duyệt.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Kênh hỗ trợ và phản hồi trực tiếp",
          text: `Mọi câu hỏi, thắc mắc hoặc yêu cầu hỗ trợ về quyền riêng tư và dữ liệu cá nhân đều được giải đáp trực tiếp qua email: ${CONTACT_EMAIL}. Chúng tôi cam kết phản hồi chu đáo và minh bạch trong thời gian sớm nhất.`,
        },
      ],
    },

    // ==========================================
    // TRỤ CỘT 3: HƯỚNG DẪN SỬ DỤNG HỆ SINH THÁI
    // ==========================================
    {
      id: "khong-gian-lam-viec",
      title: "Kiến trúc không gian làm việc macOS Desktop & Mobile Tab",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      pillarDesc: "Cẩm nang hướng dẫn thao tác chi tiết, chính xác 100% với giao diện thực tế của hệ sinh thái Hugo Studio.",
      blocks: [
        {
          type: "p",
          text: "Hệ sinh thái Hugo Studio được thiết kế với kiến trúc thích ứng cao cấp (Adaptive Architecture), mang lại trải nghiệm tương thích hoàn hảo giữa màn hình máy tính để bàn (macOS Desktop) và thiết bị di động cảm ứng (Mobile Native).",
        },
        {
          type: "cards",
          items: [
            {
              title: "Hôm nay (Today)",
              desc: "Bảng tin trung tâm hiển thị thời tiết thời gian thực, chuỗi ngày học tập (Streak), lịch hẹn và tổng quan năng lượng ngày mới.",
              icon: "wb_sunny",
              badge: "Tab 1",
            },
            {
              title: "Ứng dụng (Apps)",
              desc: "Kho ứng dụng toàn diện gồm Hugo Learning, HugoPSY, Bàn học đường, Lofi Radio, HugoArcade và HugoAura.",
              icon: "grid_view",
              badge: "Tab 2",
            },
            {
              title: "Hoạt động (Activity)",
              desc: "Nhật ký tiến độ học lập trình, ván cờ vua, lịch sử biến động ví JOY và các cột mốc thành tích cá nhân.",
              icon: "insights",
              badge: "Tab 3",
            },
            {
              title: "Tài khoản (Account)",
              desc: "Quản trị thông tin cá nhân, hồ sơ Hugo Bio, cài đặt sinh trắc học Passkey, bảo mật mã PIN và trung tâm điều khiển dữ liệu.",
              icon: "account_circle",
              badge: "Tab 4",
            },
          ],
        },
        {
          type: "table",
          head: ["Phím tắt macOS", "Phím tắt Windows", "Hành động thực hiện"],
          rows: [
            ["⌘K", "Ctrl + K", "Mở thanh tìm kiếm nhanh Spotlight Command Palette để truy cập tức thì mọi trang."],
            ["⌘B", "Ctrl + B", "Mở hoặc thu gọn thanh điều hướng bên (Sidebar Navigation)."],
            ["Esc", "Esc", "Đóng cửa sổ Popover, Modal chỉnh sửa ảnh Bio hoặc hộp thoại xác nhận."],
            ["Tab / Shift+Tab", "Tab / Shift+Tab", "Điều hướng tuần tự giữa các thẻ ứng dụng và trường nhập liệu."],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Cơ chế bảo vệ trải nghiệm di động (MobileInstallGate)",
          text: "Khi bạn truy cập cổng thành viên (/member) bằng trình duyệt Safari hoặc Chrome trên điện thoại, hệ thống sẽ kích hoạt giao diện MobileInstallGate hướng dẫn bạn thêm ứng dụng ra Màn hình chính (Add to Home Screen). Việc chạy ở chế độ PWA độc lập giúp loại bỏ hoàn toàn thanh địa chỉ trình duyệt, mang lại trải nghiệm toàn màn hình mượt mà như ứng dụng iOS/Android gốc.",
        },
        {
          type: "p",
          text: "Danh mục 10 lối tắt tiện ích chính bạn có thể truy cập nhanh bất cứ lúc nào:",
        },
        {
          type: "cards",
          items: [
            {
              title: "Hugo Bio (@slug)",
              desc: "Trang cá nhân một liên kết phong cách điện ảnh với hiệu ứng hào quang Aura và lớp thời tiết động.",
              icon: "badge",
              href: "/bio/hugo",
              badge: "Khám phá",
            },
            {
              title: "Ví JOY & Hạt QR",
              desc: "Quản lý điểm thưởng học tập, mã QR hạt phân tử chuyển đổi an toàn và bảo mật mã PIN 6 số.",
              icon: "wallet",
              href: "/member",
              badge: "Thành viên",
            },
            {
              title: "Hugo Learning",
              desc: "Lộ trình 5 giai đoạn từ Cơ bản đến AI, trình chạy mã trực tiếp và máy chủ chấm điểm tự động.",
              icon: "code_blocks",
              href: "/study",
              badge: "Học tập",
            },
            {
              title: "HugoPSY Sức Khỏe",
              desc: "Nhật ký giấc ngủ, nhịp sinh học, bài tập thở 4-7-8 với đồ họa lượn sóng thư giãn.",
              icon: "psychology",
              href: "/therapy",
              badge: "Trị liệu",
            },
            {
              title: "Bàn Học Đường",
              desc: "Âm thanh môi trường quán cà phê, tiếng mưa rơi, lật sách kết hợp đồng hồ Pomodoro 25/5.",
              icon: "local_cafe",
              href: "/banhocduong",
              badge: "Tập trung",
            },
            {
              title: "Lofi Radio",
              desc: "Đài phát thanh trực tuyến các bản nhạc không lời nhẹ nhàng giúp tập trung suy nghĩ sâu.",
              icon: "radio",
              href: "/radio",
              badge: "Âm nhạc",
            },
            {
              title: "HugoArcade",
              desc: "Không gian giải trí nhanh với cờ vua, mini game phản xạ và thử thách chinh phục điểm cao.",
              icon: "sports_esports",
              href: "/arcade",
              badge: "Thư giãn",
            },
            {
              title: "HugoAura",
              desc: "Trải nghiệm ánh sáng và âm thanh không gian đa chiều, hỗ trợ tái tạo năng lượng tinh thần.",
              icon: "auto_awesome",
              href: "/aura",
              badge: "Ánh sáng",
            },
            {
              title: "Báo Giá Dịch Vụ Web",
              desc: "Công cụ khảo sát và ước tính chi phí thiết kế web thông minh, thanh toán VietQR qua PayOS.",
              icon: "calculate",
              href: "/services",
              badge: "Báo giá",
            },
            {
              title: "Hỏi Đáp Thường Gặp",
              desc: "Trung tâm giải đáp nhanh các thắc mắc về tài khoản, bảo mật, chính sách và quyền lợi HSSV.",
              icon: "help_center",
              href: "/faq",
              badge: "Hỏi đáp",
            },
          ],
        },
      ],
    },
    {
      id: "phan-quyen-cong-cu",
      title: "Cơ chế phân quyền cổng truy cập tiện ích (PUBLIC_TOOLS)",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Hệ sinh thái Hugo Studio áp dụng cơ chế phân quyền thông minh (PUBLIC_TOOLS) nhằm giúp khách vãng lai trải nghiệm trước sự mượt mà của công nghệ trước khi quyết định tạo tài khoản.",
        },
        {
          type: "table",
          head: ["Cấp độ quyền", "Quy ước truy cập", "Trạng thái các ứng dụng trong hệ thống"],
          rows: [
            [
              "open (Mở tự do)",
              "Không cần đăng nhập, sử dụng trọn vẹn toàn bộ tính năng mà không bị giới hạn thời gian.",
              "Lofi Radio (/radio), Thư viện HugoKit (/hugokit), Kênh Hỗ trợ (/support), Trang Hỏi đáp (/faq).",
            ],
            [
              "level (Thử thách khởi đầu)",
              "Khách vãng lai chơi thử các màn mở đầu; đăng nhập thành viên để mở khóa toàn bộ các ải nâng cao và lưu điểm.",
              "HugoArcade (/arcade): Thử sức với các ván cờ và trò chơi phản xạ mức khởi đầu; đăng nhập để lưu chuỗi thắng.",
            ],
            [
              "result (Trải nghiệm tự do)",
              "Sử dụng toàn bộ công cụ thực hành; đăng nhập để lưu kết quả, đồng bộ lịch sử học tập hoặc xuất file.",
              "Hugo Learning (/study): Viết mã và chạy thử tự do; đăng nhập để hệ thống chấm bài tự động và cấp chứng chỉ.",
            ],
            [
              "demo (Dùng thử mỗi ngày)",
              "Mỗi ngày miễn phí 3 lượt trải nghiệm đầy đủ; đăng nhập thành viên để đồng bộ dữ liệu vào nhịp sinh học cá nhân.",
              "HugoPSY Trị liệu (/therapy), Bàn Học Đường (/banhocduong), Trải nghiệm ánh sáng HugoAura (/aura).",
            ],
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Mẹo nhỏ khi dùng thử",
          text: "Bạn hoàn toàn có thể nhấn vào bất kỳ công cụ nào để trải nghiệm ngay. Khi bạn quyết định đăng nhập Google, toàn bộ kết quả làm bài hoặc điểm số vừa chơi sẽ được đồng bộ ngay vào tài khoản mới mà không bị mất đi.",
        },
      ],
    },
    {
      id: "dang-nhap-passkey",
      title: "Đăng nhập Google an toàn & Xác thực sinh trắc học Passkey",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Chúng tôi loại bỏ hoàn toàn biểu mẫu nhập mật khẩu truyền thống dễ bị rò rỉ. Thay vào đó, Hugo Studio sử dụng Google One-Tap chuẩn OAuth 2.0 và công nghệ Passkey sinh trắc học chuẩn FIDO2 quốc tế.",
        },
        {
          type: "steps",
          items: [
            "Đăng nhập một chạm với Google: Nhấn nút 'Tiếp tục với Google' trên màn hình Đăng nhập. Cửa sổ xác thực chính thức của Google sẽ xuất hiện; chọn tài khoản email bạn muốn sử dụng.",
            "Tự động nhận diện Email Sinh Viên (.edu.vn): Nếu bạn đăng nhập bằng email của trường đại học hoặc cao đẳng có đuôi .edu.vn, hệ sinh thái sẽ tự động kích hoạt huy hiệu Sinh viên và mở khóa các đặc quyền trong gói Hugo Edu+.",
            "Thiết lập Passkey sinh trắc học: Sau khi vào trang Tài khoản, chọn mục 'Bảo mật' > 'Đăng ký Passkey cho thiết bị này'. Trình duyệt sẽ yêu cầu bạn quét vân tay (Touch ID) hoặc quét khuôn mặt (Face ID / Windows Hello).",
            "Cài đặt mã PIN Ví JOY 6 số: Thiết lập mã PIN 6 số bí mật để bảo vệ các thao tác chuyển điểm JOY và quản lý dữ liệu riêng tư, ngăn chặn việc ai đó vô tình sử dụng khi mượn điện thoại của bạn.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Không còn nỗi lo lộ mật khẩu",
          text: "Passkey lưu trữ khóa mật mã bất đối xứng trên chip bảo mật của máy bạn. Không ai — kể cả quản trị viên máy chủ — có thể đánh cắp hoặc suy đoán ra khóa xác thực của bạn.",
        },
      ],
    },
    {
      id: "cai-dat-pwa",
      title: "Cài đặt ứng dụng PWA & Thông báo đẩy Web Push",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio được xây dựng dưới dạng Progressive Web App (PWA), cho phép ứng dụng chạy độc lập, khởi động tức thì, hoạt động mượt mà ngay cả khi mạng chập chờn và hỗ trợ nhận thông báo đẩy Web Push.",
        },
        {
          type: "steps",
          items: [
            "Cài đặt trên iPhone & iPad (iOS Safari): Mở liên kết hugowishpax.studio bằng trình duyệt Safari. Nhấn vào biểu tượng Chia sẻ (nút hình vuông có mũi tên hướng lên ở thanh dưới) > cuộn xuống và chọn 'Thêm vào Màn hình chính' (Add to Home Screen) > nhấn 'Thêm'. Biểu tượng Hugo Studio sẽ xuất hiện trên màn hình chính như ứng dụng tải từ App Store.",
            "Cài đặt trên điện thoại Android (Google Chrome): Mở trang web bằng Chrome. Nhấn vào biểu tượng dấu 3 chấm ở góc trên bên phải màn hình > chọn 'Cài đặt ứng dụng' (Install app) hoặc 'Thêm vào màn hình chính' và xác nhận.",
            "Cài đặt trên máy tính macOS & Windows: Trên thanh địa chỉ của trình duyệt Chrome hoặc Edge, nhấn vào biểu tượng màn hình nhỏ có mũi tên tải xuống (Cài đặt ứng dụng) ở bên phải thanh URL để ghim ứng dụng vào Dock hoặc Taskbar.",
            "Kích hoạt thông báo Web Push: Khi mở ứng dụng lần đầu, hãy nhấn 'Cho phép' khi hộp thoại hỏi quyền thông báo xuất hiện. Hệ thống sẽ gửi thông báo nhắc nhở chuỗi học tập hàng ngày, cập nhật điểm JOY và nhắc giờ tập trung.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Lưu ý về trình duyệt mở liên kết",
          text: "Nếu bạn bấm vào liên kết từ ứng dụng Facebook, Messenger hoặc Zalo, trình duyệt tích hợp (In-App Browser) của họ có thể chặn tính năng cài đặt PWA. Hãy nhấn vào biểu tượng 3 chấm và chọn 'Mở trong trình duyệt mặc định' (Safari hoặc Chrome) để cài đặt chuẩn xác nhất.",
        },
      ],
    },
    {
      id: "trang-ca-nhan-bio",
      title: "Xây dựng trang cá nhân Hugo Bio một liên kết",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Hugo Bio giúp bạn sở hữu một trang đại diện trực tuyến độc quyền tại địa chỉ `hugowishpax.studio/@yourname`, tổng hợp toàn bộ liên kết mạng xã hội, dự án cá nhân và hồ sơ sự nghiệp với giao diện điện ảnh.",
        },
        {
          type: "steps",
          items: [
            "Đăng ký tên định danh độc quyền (@slug): Vào mục Tài khoản > Hồ sơ Bio. Nhập tên hiển thị và định danh @slug duy nhất của bạn để chia sẻ trên Instagram, TikTok, LinkedIn hay CV xin việc.",
            "Tải và căn chỉnh ảnh đại diện với CropModal: Chọn ảnh từ máy tính hoặc điện thoại. Hộp thoại CropModal thông minh sẽ tự động hỗ trợ bạn xoay, phóng to, thu nhỏ và cắt ảnh chuẩn tỉ lệ vuông 1:1 sắc nét.",
            "Thêm danh mục liên kết tùy biến: Nhập các liên kết GitHub, Portfolio cá nhân, Facebook, kênh YouTube hoặc bài viết nổi bật. Bạn có thể kéo thả để sắp xếp thứ tự hiển thị.",
            "Chọn chủ đề màu sắc Aura Themes: Cá nhân hóa phong cách với 5 bộ màu ánh sáng điện ảnh cao cấp phù hợp với cá tính của bạn.",
            "Kích hoạt lớp thời tiết động (Weather Layer): Bật công tắc 'Hiển thị thời tiết'. Khi khách truy cập cho phép định vị, trang Bio của bạn sẽ hiển thị nhiệt độ và biểu tượng thời tiết địa phương theo thời gian thực rất sinh động.",
          ],
        },
        {
          type: "cards",
          items: [
            {
              title: "Cyber Dark",
              desc: "Tông màu đen huyền bí kết hợp ánh sáng tím neon hiện đại, phù hợp cho lập trình viên và người yêu công nghệ.",
              icon: "terminal",
              badge: "Aura Theme 1",
            },
            {
              title: "Sunset Amber",
              desc: "Ánh hoàng hôn ấm áp với dải màu vàng cam dịu mắt, mang lại cảm giác thân thiện, tích cực và truyền cảm hứng.",
              icon: "wb_twilight",
              badge: "Aura Theme 2",
            },
            {
              title: "Emerald Focus",
              desc: "Sắc xanh ngọc lục bảo tươi mát, tượng trưng cho sự sinh sôi, tập trung học hỏi và phát triển tri thức bền bỉ.",
              icon: "eco",
              badge: "Aura Theme 3",
            },
            {
              title: "Oceanic Blue",
              desc: "Gam màu xanh đại dương sâu thẳm, toát lên sự điềm tĩnh, chuyên nghiệp và đáng tin cậy cho hồ sơ công việc.",
              icon: "water_drop",
              badge: "Aura Theme 4",
            },
            {
              title: "Neon Noir",
              desc: "Độ tương phản cao với các vệt sáng sắc nét, tạo dấu ấn thẩm mỹ mạnh mẽ và cá tính không thể hòa lẫn.",
              icon: "flare",
              badge: "Aura Theme 5",
            },
          ],
        },
      ],
    },
    {
      id: "vi-joy-qr",
      title: "Quản lý Ví JOY & Trao đổi qua mã QR hạt phân tử",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Ví JOY là trung tâm quản lý điểm thưởng học tập và hoạt động ngoại khóa của bạn. Mọi giao dịch chuyển nhận giữa các thành viên được thực hiện bảo mật qua mã QR hạt phân tử động (Particle Connect QR).",
        },
        {
          type: "steps",
          items: [
            "Tích lũy điểm JOY tự nhiên: Đăng nhập đều đặn mỗi ngày (+10 JOY), duy trì chuỗi Streak 7 ngày (+50 JOY), hoàn thành mỗi bài học lập trình (+25 JOY), và chiến thắng ván cờ vua trong Arcade (+30 JOY).",
            "Tạo mã QR nhận điểm (Particle Connect QR): Nhấn vào biểu tượng 'Nhận JOY' trong ví. Hệ thống sẽ tạo một mã QR đặc biệt với hiệu ứng các hạt phân tử phát sáng chuyển động và đồng hồ đếm ngược an toàn 60 giây.",
            "Quét mã chuyển điểm an toàn: Người gửi sử dụng camera trong ứng dụng để quét mã QR. Nhập số lượng JOY cần gửi và xác thực bằng mã PIN 6 số cá nhân để hoàn tất giao dịch trong tích tắc.",
            "Tra cứu sao kê minh bạch: Toàn bộ biến động số dư cộng/trừ đều được lưu trữ đầy đủ trong tab 'Hoạt động' với thời gian và lý do chi tiết.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Hạn mức bảo vệ an toàn",
          text: "Mỗi tài khoản được thiết lập hạn mức chuyển tối đa mỗi ngày để ngăn chặn các giao dịch nhầm lẫn ngoài ý muốn. Mã QR hạt phân tử tự động làm mới sau 60 giây; mã đã hết hạn sẽ không thể thực hiện giao dịch.",
        },
      ],
    },
    {
      id: "tu-hoc-lap-trinh",
      title: "Tự học có hướng dẫn tại Hugo Learning (Hugo Coder)",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Hugo Learning được xây dựng theo phương pháp 'Learn by Doing' (Học đi đôi với hành). Người học không cần cài đặt môi trường phức tạp; mọi đoạn mã đều được viết, chạy thử và chấm điểm ngay trên trình duyệt.",
        },
        {
          type: "steps",
          items: [
            "Giai đoạn 1 — Web Foundation: Làm chủ cấu trúc HTML5 ngữ nghĩa, bố cục CSS3 hiện đại (Flexbox, Grid), biến CSS tùy biến và thiết kế giao diện thích ứng Responsive.",
            "Giai đoạn 2 — Modern JS & TypeScript: Tư duy lập trình hiện đại, xử lý bất đồng bộ Async/Await, thao tác DOM, mảng nâng cao và an toàn kiểu dữ liệu với TypeScript.",
            "Giai đoạn 3 — React & UI Engineering: Kiến trúc component tái sử dụng, quản lý State, Hook nâng cao (useMemo, useCallback), routing và tích hợp thư viện hoạt ảnh.",
            "Giai đoạn 4 — Backend & Database: Xây dựng RESTful API với Node.js, xác thực bảo mật OAuth2/JWT, thiết kế cơ sở dữ liệu và triển khai đám mây (Cloud Deploy).",
            "Giai đoạn 5 — AI Engineering: Ứng dụng Gemini API, kỹ thuật Prompt Engineering, xử lý Streaming dữ liệu thời gian thực và xây dựng trợ lý AI thông minh.",
          ],
        },
        {
          type: "cards",
          items: [
            {
              title: "Trình chạy mã trực tiếp",
              desc: "Viết code và quan sát kết quả hiển thị tức thì trong khung Preview với công nghệ Code Runner.",
              icon: "play_circle",
              badge: "Tương tác",
            },
            {
              title: "Máy chủ chấm tự động",
              desc: "Hệ thống kiểm tra lỗi cú pháp, logic thuật toán và đưa ra gợi ý sửa sai cụ thể từng dòng code.",
              icon: "fact_check",
              badge: "Chấm điểm",
            },
            {
              title: "Chứng chỉ mã hóa UUID",
              desc: "Hoàn thành toàn bộ lộ trình để nhận chứng chỉ chính thức có mã định danh UUID chống làm giả.",
              icon: "verified",
              badge: "Chứng nhận",
            },
          ],
        },
      ],
    },
    {
      id: "cham-soc-tinh-than",
      title: "Chăm sóc tinh thần HugoPSY, Bàn Học Đường & Không gian tập trung",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Một lập trình viên hay người làm việc sáng tạo giỏi cần có một tâm trí lành mạnh và giấc ngủ trọn vẹn. Bộ công cụ chăm sóc tinh thần của Hugo Studio giúp bạn phục hồi năng lượng và duy trì sự tỉnh táo mỗi ngày.",
        },
        {
          type: "steps",
          items: [
            "Ghi nhật ký giấc ngủ & Nhịp sinh học: Vào HugoPSY (/therapy), ghi nhận giờ đi ngủ và giờ thức giấc. Hệ thống sẽ tự động phân tích độ sâu giấc ngủ và đưa ra gợi ý cân bằng nhịp sinh học.",
            "Luyện thở điều hòa nhịp tim 4-7-8: Bật bài tập thở khoa học. Hãy hít vào thật sâu bằng mũi trong 4 giây, nín thở giữ hơi trong 7 giây và thở nhẹ nhàng ra bằng miệng trong 8 giây theo vòng sóng biển chuyển động trên màn hình.",
            "Bàn học đường mô phỏng không gian thực: Mở Bàn học đường (/banhocduong), bật thanh gạt kết hợp các lớp âm thanh tự nhiên như tiếng mưa rơi bên cửa sổ, tiếng xào xạc lật sách, và tiếng rì rầm nhẹ nhàng của quán cà phê.",
            "Thiết lập chu kỳ Pomodoro 25/5: Nhấn bắt đầu phiên làm việc sâu 25 phút. Khi chuông báo vang lên, hãy nghỉ ngơi 5 phút trước khi bắt đầu chu kỳ tiếp theo để não bộ luôn ở trạng thái tập trung đỉnh cao.",
          ],
        },
        {
          type: "note",
          tone: "tip",
          title: "Bí quyết đạt trạng thái tập trung sâu (Deep Work)",
          text: "Hãy bật Lofi Radio cùng lúc với Bàn học đường ở mức âm lượng 40%. Sự kết hợp giữa giai điệu lofi không lời và tiếng mưa rơi nhẹ giúp triệt tiêu hoàn toàn các tiếng ồn gây xao nhãng xung quanh bạn.",
        },
      ],
    },
    {
      id: "dat-lich-dich-vu",
      title: "Quy trình Đặt lịch dịch vụ Web & Thanh toán PayOS",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Chúng tôi cung cấp dịch vụ thiết kế, phát triển website doanh nghiệp, Landing Page thương hiệu và ứng dụng Web App tùy biến với quy trình làm việc chuẩn mực, minh bạch 100% chi phí.",
        },
        {
          type: "steps",
          items: [
            "Bước 1 — Khảo sát & Dự toán tự động: Truy cập trang Dịch vụ (/services), chọn loại hình website bạn cần (Landing Page, Website bán hàng, Web App, PWA). Hệ thống sẽ tự động tính toán báo giá chi tiết từng hạng mục.",
            "Bước 2 — Tư vấn 1-1 miễn phí: Chọn lịch hẹn trực tuyến qua Google Meet tại trang Đặt lịch (/booking). Chúng tôi sẽ trao đổi trực tiếp, làm rõ bài toán kinh doanh và thống nhất tài liệu đặc tả kỹ thuật.",
            "Bước 3 — Xác nhận & Đặt cọc 50% qua VietQR PayOS: Sau khi thống nhất hợp đồng, bạn quét mã VietQR tự động tích hợp cổng PayOS. Hệ thống tự động nhận diện thanh toán chính xác đến từng đồng và kích hoạt dự án ngay lập tức.",
            "Bước 4 — Triển khai, Nghiệm thu & Bàn giao Git: Bạn theo dõi tiến độ theo từng tuần. Sau khi nghiệm thu ưng ý, chúng tôi bàn giao 100% mã nguồn sạch trên kho lưu trữ Git riêng tư cùng tài liệu hướng dẫn vận hành.",
          ],
        },
        {
          type: "table",
          head: ["Cam kết dịch vụ", "Chi tiết bảo đảm từ Hugo Studio"],
          rows: [
            ["Minh bạch chi phí", "Báo giá trọn gói được niêm yết rõ ràng; cam kết 100% không phát sinh chi phí phụ ngoài hợp đồng."],
            ["Tiến độ chuẩn xác", "Mỗi mốc bàn giao được ghi nhận cụ thể; nếu chậm tiến độ do lỗi phát triển, hoàn tiền 1% mỗi ngày trễ."],
            ["Bàn giao mã nguồn", "Bàn giao đầy đủ quyền sở hữu kho mã nguồn Git, hướng dẫn triển khai trên Vercel/Netlify hoặc Cloud VPS."],
            ["Bảo hành kỹ thuật", "Bảo hành sửa lỗi kỹ thuật miễn phí trong vòng 6 tháng kể từ ngày bàn giao chính thức."],
          ],
        },
      ],
    },
    {
      id: "cuu-ho-su-co",
      title: "Bảng ma trận cứu hộ 10 sự cố kỹ thuật thường gặp",
      pillar: "guide",
      pillarTitle: "Phần III: Hướng dẫn sử dụng",
      pillarIcon: "menu_book",
      blocks: [
        {
          type: "p",
          text: "Khi gặp các hiện tượng kỹ thuật bất thường trong quá trình sử dụng, bảng ma trận dưới đây giúp bạn tự xử lý nhanh chóng trong vòng 30 giây:",
        },
        {
          type: "table",
          head: ["Tình huống sự cố", "Nguyên nhân gốc rễ", "Cách khắc phục nhanh trong 30 giây"],
          rows: [
            [
              "1. Đăng nhập Google bị lặp lại (Cookie Loop)",
              "Trình duyệt đang chặn Cookie bên thứ ba hoặc phiên cũ bị kẹt.",
              "Mở Cài đặt trình duyệt > Xóa dữ liệu duyệt web cho tên miền hugowishpax.studio > Đăng nhập lại.",
            ],
            [
              "2. Bị chặn truy cập trên điện thoại (MobileInstallGate)",
              "Trình duyệt di động chưa chạy ở chế độ ứng dụng độc lập PWA.",
              "Nhấn nút Chia sẻ trên Safari và chọn 'Thêm vào Màn hình chính' (Add to Home Screen), sau đó mở từ biểu tượng mới tạo.",
            ],
            [
              "3. Giao diện không cập nhật tính năng mới",
              "Service Worker của PWA đang giữ bản lưu đệm (cache) phiên bản cũ.",
              "Đóng hoàn toàn ứng dụng, vuốt tắt khỏi danh sách đa nhiệm trên điện thoại rồi mở lại để Service Worker tự động làm mới.",
            ],
            [
              "4. Không nhận được thông báo Web Push",
              "Quyền thông báo đang bị tắt trong cài đặt hệ điều hành.",
              "Vào Cài đặt máy > Thông báo > Tìm trình duyệt/Hugo Studio và gạt bật công tắc 'Cho phép thông báo'.",
            ],
            [
              "5. Mã QR nhận JOY báo hết hạn hoặc không hợp lệ",
              "Đồng hồ đếm ngược 60 giây đã trôi qua để bảo vệ an toàn.",
              "Nhấn nút 'Làm mới mã QR' để sinh chuỗi hạt phân tử và chữ ký mật mã mới.",
            ],
            [
              "6. Ảnh đại diện Bio tải lên bị lỗi hoặc xoay ngang",
              "Ảnh chụp từ iPhone có định dạng file HEIC gốc hoặc metadata xoay.",
              "Mở ảnh trong ứng dụng Ảnh, cắt nhẹ hoặc xuất ra dạng JPEG/PNG chuẩn trước khi tải lên CropModal.",
            ],
            [
              "7. Thời tiết trên trang Bio không hiển thị",
              "Chưa cấp quyền truy cập vị trí (GPS) trên trình duyệt.",
              "Nhấn vào biểu tượng ổ khóa hoặc cài đặt trang trên thanh URL > chọn Vị trí > chuyển sang 'Cho phép'.",
            ],
            [
              "8. Điểm game Arcade không đồng bộ vào tài khoản",
              "Đường truyền mạng bị gián đoạn đúng lúc kết thúc màn chơi.",
              "Giữ kết nối mạng ổn định thêm 5 giây trước khi chuyển trang; hệ thống có cơ chế tự gửi lại gói tin khi có mạng.",
            ],
            [
              "9. Quên mã PIN ví JOY 6 số",
              "Người dùng nhập sai mã PIN quá số lần cho phép.",
              "Nhấn 'Quên mã PIN', hệ thống sẽ gửi một liên kết xác thực khôi phục bảo mật về chính email Google đăng ký của bạn.",
            ],
            [
              "10. Cần hỗ trợ kỹ thuật chuyên sâu trực tiếp",
              "Gặp lỗi giao diện cá biệt hoặc vấn đề tài khoản chưa được liệt kê.",
              "Chụp ảnh màn hình lỗi và gửi ngay về hòm thư contact@hugowishpax.studio để được hỗ trợ xử lý trong ngày.",
            ],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Đội ngũ kỹ thuật luôn lắng nghe",
          text: `Nếu bạn phát hiện bất kỳ lỗi nào trên hệ thống hoặc muốn đóng góp ý kiến cải tiến sản phẩm, hãy gửi phản hồi cho chúng tôi qua email: ${CONTACT_EMAIL}. Mọi đóng góp quý báu đều được ghi nhận với lòng biết ơn chân thành!`,
        },
      ],
    },
  ];

  return (
    <DocsLayout
      eyebrow="HUGO STUDIO • PRODUCT TERMS & USER GUIDE"
      version="v2.5"
      title="Điều khoản và hướng dẫn sử dụng"
      intro="Văn bản hợp nhất Điều khoản sử dụng, Cam kết bảo mật quyền riêng tư và Cẩm nang hướng dẫn sử dụng toàn diện hệ sinh thái Hugo Studio. Mọi quy ước được xây dựng dựa trên sự tôn trọng, minh bạch và an toàn tối đa cho người dùng."
      updatedAt={UPDATED_AT}
      pillars={PILLARS}
      defaultPillar={defaultPillar}
      sections={sections}
      footerNote={
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-foreground">
            Cam kết vận hành minh bạch bởi Hugo Studio — Lê Gia Huy
          </p>
          <p>
            Văn bản này thay thế toàn bộ các phiên bản điều khoản và chính sách riêng lẻ trước đây, tạo thành một nguồn tham chiếu thống nhất duy nhất cho toàn bộ hệ sinh thái. Nếu bạn có bất kỳ câu hỏi nào, xin vui lòng gửi email về:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-medium underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>.
          </p>
        </div>
      }
    />
  );
}
