import { useData } from "../../context/DataContext";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import DocsLayout from "./DocsLayout";

/**
 * Chính sách viết theo đúng những gì hệ thống thật sự làm — mỗi mục dữ liệu ở
 * đây đều đối chiếu được với một model trong server/models.
 *
 * Nguyên tắc khi sửa file này:
 *   1. Không nêu tên văn bản luật hay điều khoản cụ thể. Trích sai luật rủi ro
 *      hơn nhiều so với việc mô tả trung thực bằng lời thường.
 *   2. Không hứa tuyệt đối ("bảo mật 100%", "không bao giờ lộ"). Hứa quá là
 *      thứ đầu tiên bị đem ra đối chiếu khi có sự cố.
 *   3. Thêm tính năng có đụng dữ liệu người dùng thì cập nhật mục 3 và 5.
 */
const UPDATED_AT = "10/08/2026";

export default function PrivacyPolicyPage() {
  const { data } = useData();
  const email = "contact@hugowishpax.studio";
  const owner = data.profile.fullName || "Peter Hugo Wishpax Le";

  useHeadMeta({
    title: "Chính sách bảo mật & điều khoản sử dụng | Hugo Studio",
    description:
      "Hugo Studio thu thập dữ liệu gì, dùng để làm gì, gửi cho ai, giữ bao lâu và bạn yêu cầu xoá bằng cách nào.",
    keywords: "chính sách bảo mật, điều khoản sử dụng, dữ liệu cá nhân, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/privacy-policy",
  });

  const sections = [
    {
      id: "tom-tat",
      title: "Tóm tắt trong một phút",
      blocks: [
        {
          type: "list",
          items: [
            "Không đăng nhập thì bạn chỉ là khách xem trang — hệ thống không tạo hồ sơ cho bạn.",
            "Đăng nhập bằng Google. Hugo Studio nhận email, tên và ảnh đại diện từ Google, và không bao giờ thấy mật khẩu Google của bạn.",
            "Dữ liệu bạn tự nhập (trang Bio, nhật ký giấc ngủ, trò chuyện với HugoPSY) được lưu để chính bạn dùng lại.",
            "Nhật ký trò chuyện HugoPSY được mã hoá trước khi ghi xuống cơ sở dữ liệu.",
            "Không bán, không cho thuê, không trao đổi dữ liệu cá nhân với bên quảng cáo.",
            "Muốn xoá tài khoản và toàn bộ dữ liệu: gửi email, sẽ xử lý trong vòng 30 ngày.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Đây là trang cá nhân, không phải doanh nghiệp lớn",
          text: "Hugo Studio do một người vận hành. Chính sách này viết bằng lời thường để bạn đọc hiểu ngay, không phải văn bản pháp lý do luật sư soạn.",
        },
      ],
    },
    {
      id: "ai-van-hanh",
      title: "Ai vận hành và liên hệ ở đâu",
      blocks: [
        { type: "p", text: `Hugo Studio là dự án cá nhân do ${owner} vận hành tại Việt Nam, gồm trang giới thiệu công khai và một khu vực thành viên cần đăng nhập.` },
        {
          type: "list",
          items: [
            `Email liên hệ và yêu cầu về dữ liệu: ${email}`,
            "Zalo: dùng nút liên hệ ở chân trang.",
            "Mọi yêu cầu liên quan đến dữ liệu cá nhân xin gửi bằng email để có dấu vết xử lý.",
          ],
        },
      ],
    },
    {
      id: "du-lieu",
      title: "Dữ liệu được thu thập",
      blocks: [
        { type: "p", text: "Danh sách dưới đây liệt kê theo tính năng. Tính năng nào bạn không dùng thì phần dữ liệu đó không tồn tại." },
        {
          type: "table",
          head: ["Khi bạn dùng", "Dữ liệu được lưu"],
          rows: [
            ["Đăng nhập", "Email, tên hiển thị, ảnh đại diện do Google cung cấp; thời điểm đăng nhập gần nhất."],
            ["Đăng nhập bằng vân tay / khuôn mặt", "Khoá công khai của thiết bị, tên thiết bị, bộ đếm chống phát lại. Vân tay và khuôn mặt nằm lại trong thiết bị của bạn, hệ thống không nhận được."],
            ["Trang Bio", "Tên, mô tả, liên kết, ảnh, và vị trí (kinh độ/vĩ độ) nếu bạn bật tính năng thời tiết hoặc điểm danh theo vị trí."],
            ["Ví JOY", "Lịch sử cộng/trừ điểm, lý do phát sinh, mã quà tặng."],
            ["HugoPSY", "Nội dung trò chuyện (đã mã hoá), kết quả bài trắc nghiệm tâm trạng, ghi chú bạn tự viết."],
            ["Nhật ký giấc ngủ", "Giờ ngủ, giờ dậy, chất lượng giấc ngủ, tâm trạng, và các yếu tố bạn tự khai như caffeine, vận động, mức căng thẳng."],
            ["Arcade, cờ vua, HugoCoder", "Điểm số, xếp hạng, tiến độ bài học, ván cờ đã chơi."],
            ["Thông báo đẩy", "Địa chỉ đăng ký thông báo của trình duyệt, khoá mã hoá kèm theo, ngôn ngữ, múi giờ, loại thiết bị."],
            ["Đặt lịch, thanh toán", "Tên, cách liên hệ bạn cung cấp, nội dung yêu cầu, trạng thái đơn thanh toán."],
            ["Ủng hộ Hugo Studio", "Tên, email nhận thư cảm ơn, số tiền, trạng thái giao dịch; tên đối soát ngân hàng chỉ được công khai khi bạn chủ động đồng ý."],
            ["Chỉ cần mở trang", "Số đo tốc độ tải trang, loại thiết bị, đường dẫn trang, và nhật ký lỗi kỹ thuật khi có sự cố."],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Không có gì trong danh sách này là bắt buộc",
          text: "Bạn có thể dùng khu vực thành viên mà không bật vị trí, không bật thông báo, không dùng HugoPSY và không ghi nhật ký giấc ngủ.",
        },
        {
          type: "faq",
          items: [
            {
              q: "Đăng nhập Google thì hệ thống thấy được gì trong tài khoản Google của tôi?",
              a: "Chỉ ba thứ: email, tên hiển thị và ảnh đại diện. Không đọc được Gmail, Drive, Danh bạ, Lịch hay bất cứ dịch vụ nào khác của Google, và không bao giờ thấy mật khẩu Google của bạn.",
            },
            {
              q: "Vị trí được lưu chính xác đến mức nào?",
              a: "Toạ độ do trình duyệt cung cấp, đủ để tra thời tiết khu vực và tính khoảng cách điểm danh. Chỉ lưu khi bạn chủ động bật tính năng cần tới nó, không theo dõi ngầm và không ghi lại lộ trình di chuyển.",
            },
            {
              q: "Nội dung nào của tôi là công khai?",
              a: "Trang Bio công khai với cả người chưa đăng nhập. Nhật ký giấc ngủ và trò chuyện HugoPSY chỉ mình bạn thấy.",
            },
            {
              q: "Có ghi lại thao tác chuột, gõ phím hay quay lại phiên duyệt web không?",
              a: "Không. Phần đo đạc chỉ gồm tốc độ tải trang, loại thiết bị và đường dẫn trang — không có công cụ ghi hình phiên truy cập nào.",
            },
          ],
        },
      ],
    },
    {
      id: "noi-luu",
      title: "Dữ liệu nằm ở đâu",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio không sở hữu máy chủ riêng. Toàn bộ hệ thống chạy trên hạ tầng thuê của các nhà cung cấp quốc tế, nghĩa là dữ liệu của bạn được lưu trên máy chủ đặt ngoài Việt Nam.",
        },
        {
          type: "list",
          items: [
            "Cơ sở dữ liệu: MongoDB Atlas.",
            "Máy chủ ứng dụng và trang web: Render, Vercel, Cloudflare.",
            "Ảnh và tệp tải lên: Cloudinary.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Vì sao nói rõ điều này",
          text: "Nếu việc dữ liệu cá nhân của bạn được lưu ở nước ngoài là điều bạn không chấp nhận, hãy cân nhắc trước khi tạo tài khoản. Nói trước vẫn hơn để bạn phát hiện sau.",
        },
      ],
    },
    {
      id: "muc-dich",
      title: "Dữ liệu được dùng làm gì",
      blocks: [
        {
          type: "list",
          items: [
            "Cho bạn đăng nhập và giữ phiên làm việc.",
            "Hiển thị lại chính nội dung bạn đã tạo, trên mọi thiết bị bạn đăng nhập.",
            "Gợi ý nội dung trong khu vực thành viên dựa trên chủ đề bạn hay xem. Đây là gợi ý nội dung, không phải quảng cáo và không ghép đôi người dùng với nhau.",
            "Xử lý đơn đặt lịch và đơn thanh toán bạn tạo.",
            "Tìm và sửa lỗi kỹ thuật, theo dõi tốc độ trang.",
            "Chặn lạm dụng, gian lận điểm JOY và các hành vi phá hoại.",
          ],
        },
        { type: "p", text: "Dữ liệu không được dùng để bán quảng cáo, không dựng hồ sơ để bán cho bên thứ ba, và không dùng để chấm điểm hay đánh giá con người bạn." },
      ],
    },
    {
      id: "ben-thu-ba",
      title: "Bên thứ ba tham gia xử lý",
      blocks: [
        { type: "p", text: "Hugo Studio không tự làm mọi thứ. Những dịch vụ sau có thể nhận một phần dữ liệu khi bạn dùng tính năng tương ứng:" },
        {
          type: "table",
          head: ["Dịch vụ", "Nhận gì", "Khi nào"],
          rows: [
            ["Google", "Xác minh danh tính khi đăng nhập", "Lúc bạn bấm đăng nhập bằng Google"],
            ["Google Maps / Places", "Toạ độ vùng bạn đang tìm", "Khi bạn dùng tab Khám phá"],
            ["Google Gemini", "Nội dung câu hỏi bạn gửi cho trợ lý AI", "Khi bạn dùng tính năng có AI"],
            ["PayOS", "Thông tin đơn thanh toán hoặc ủng hộ, gồm tên và email bạn cung cấp", "Khi bạn tạo giao dịch"],
            ["Cloudinary", "Ảnh và tệp bạn tải lên", "Khi bạn tải tệp"],
            ["MongoDB Atlas", "Toàn bộ cơ sở dữ liệu", "Luôn luôn — đây là nơi lưu dữ liệu"],
            ["Render, Vercel, Cloudflare", "Yêu cầu truy cập và địa chỉ IP", "Mỗi lần bạn mở trang"],
            ["Open-Meteo", "Toạ độ gần đúng để lấy thời tiết", "Khi bạn bật nền thời tiết"],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Điều Hugo Studio không kiểm soát được",
          text: "Mỗi dịch vụ trên có chính sách riêng của họ. Khi dữ liệu đã sang phía họ, việc xử lý tuân theo chính sách của họ chứ không phải trang này.",
        },
      ],
    },
    {
      id: "cookie",
      title: "Cookie và dữ liệu lưu trên máy bạn",
      blocks: [
        {
          type: "list",
          items: [
            "Cookie phiên đăng nhập: giữ cho bạn không phải đăng nhập lại. Cookie này trình duyệt không cho JavaScript đọc được.",
            "Bộ nhớ cục bộ của trình duyệt: lưu tuỳ chọn giao diện, ngôn ngữ, và điểm arcade khi bạn chơi lúc mất mạng.",
            "Bộ nhớ đệm của ứng dụng: giúp trang mở được khi không có mạng.",
            "Không dùng cookie theo dõi quảng cáo và không nhúng pixel của mạng quảng cáo.",
          ],
        },
        { type: "p", text: "Xoá dữ liệu trang trong trình duyệt sẽ xoá hết những thứ trên và đăng xuất bạn khỏi thiết bị đó." },
      ],
    },
    {
      id: "luu-tru",
      title: "Giữ dữ liệu trong bao lâu",
      blocks: [
        {
          type: "table",
          head: ["Loại dữ liệu", "Thời hạn"],
          rows: [
            ["Nội dung bạn tạo (Bio, bài viết, nhật ký, JOY)", "Giữ đến khi bạn xoá hoặc yêu cầu xoá tài khoản"],
            ["Số đo tốc độ trang và nhật ký lỗi", "Tự xoá sau 30 ngày"],
            ["Giỏ hàng chưa hoàn tất", "Tự xoá sau 30 ngày"],
            ["Thông báo trong ứng dụng", "Tự xoá sau 90 ngày"],
            ["Hoá đơn, đơn thanh toán", "Giữ lâu hơn để đối soát, kể cả sau khi bạn xoá tài khoản"],
            ["Đơn ủng hộ", "Giữ để đối soát và ngăn gửi trùng thư cảm ơn; email và tên ngân hàng không xuất hiện trong API công cộng"],
          ],
        },
      ],
    },
    {
      id: "bao-mat",
      title: "Cách dữ liệu được bảo vệ",
      blocks: [
        {
          type: "list",
          items: [
            "Toàn bộ kết nối đi qua HTTPS.",
            "Thành viên không có mật khẩu lưu trên hệ thống — đăng nhập qua Google hoặc khoá thiết bị.",
            "Phiên đăng nhập nằm trong cookie mà JavaScript không đọc được, giảm rủi ro bị đánh cắp phiên.",
            "Nhật ký trò chuyện HugoPSY được mã hoá bằng AES-256-GCM trước khi ghi xuống cơ sở dữ liệu.",
            "Mã QR ví JOY là chuỗi do máy chủ ký, phía trình duyệt không tự tạo được.",
            "Mọi truy cập vào dữ liệu thành viên đều phải qua kiểm tra phiên đăng nhập ở máy chủ.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Không hệ thống nào an toàn tuyệt đối",
          text: "Những biện pháp trên giảm rủi ro chứ không loại bỏ được rủi ro. Đừng đăng lên đây thông tin mà bạn không chấp nhận được rủi ro nếu nó lộ ra: số căn cước, số thẻ ngân hàng, hồ sơ bệnh án.",
        },
      ],
    },
    {
      id: "quyen-cua-ban",
      title: "Quyền của bạn và cách thực hiện",
      blocks: [
        {
          type: "list",
          items: [
            "Xem lại dữ liệu của mình: phần lớn nằm ngay trong khu vực thành viên.",
            "Sửa hoặc xoá từng phần: sửa trực tiếp trong ứng dụng.",
            "Yêu cầu bản sao toàn bộ dữ liệu: gửi email.",
            "Yêu cầu xoá tài khoản và toàn bộ dữ liệu: gửi email từ chính địa chỉ đã đăng nhập.",
            "Rút lại đồng ý cho từng tính năng: tắt vị trí, tắt thông báo, ngừng dùng AI — không cần xoá tài khoản.",
          ],
        },
        { type: "p", text: "Yêu cầu được xử lý trong vòng 30 ngày. Nếu không xác minh được bạn là chủ tài khoản, yêu cầu sẽ bị từ chối để tránh người khác mạo danh xoá dữ liệu của bạn." },
        {
          type: "table",
          head: ["Yêu cầu", "Cần gửi gì", "Kết quả"],
          rows: [
            ["Xin bản sao dữ liệu", "Email từ địa chỉ đã đăng nhập, tiêu đề \"Yêu cầu bản sao dữ liệu\"", "Nhận lại một tệp chứa dữ liệu gắn với tài khoản của bạn"],
            ["Sửa dữ liệu sai", "Nêu rõ mục nào sai và giá trị đúng", "Sửa trực tiếp trong cơ sở dữ liệu"],
            ["Xoá một phần", "Nêu rõ phần muốn xoá, ví dụ toàn bộ nhật ký giấc ngủ", "Xoá phần đó, giữ nguyên tài khoản"],
            ["Xoá toàn bộ tài khoản", "Email từ địa chỉ đã đăng nhập, ghi rõ muốn xoá vĩnh viễn", "Xoá tài khoản và dữ liệu gắn với nó, trừ hoá đơn phải giữ để đối soát"],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Xoá là xoá thật, không khôi phục được",
          text: "Sau khi xoá tài khoản, dữ liệu không lấy lại được. Nếu bạn muốn giữ lại nội dung mình đã tạo, hãy xin bản sao trước rồi mới yêu cầu xoá.",
        },
      ],
    },
    {
      id: "neu-dung",
      title: "Nếu dự án dừng hoạt động",
      blocks: [
        {
          type: "p",
          text: "Đây là dự án cá nhân, nên khả năng dừng là có thật và nói trước vẫn tốt hơn im lặng.",
        },
        {
          type: "list",
          items: [
            "Nếu dừng có kế hoạch, thành viên sẽ được báo trước ít nhất 30 ngày qua thông báo trong ứng dụng và email.",
            "Trong thời gian đó bạn có thể xin bản sao dữ liệu của mình.",
            "Sau khi dừng, cơ sở dữ liệu sẽ bị xoá thay vì chuyển nhượng cho bên khác.",
            "Số JOY còn lại sẽ mất giá trị sử dụng và không quy đổi thành tiền.",
          ],
        },
      ],
    },
    {
      id: "tre-em",
      title: "Người dùng nhỏ tuổi",
      blocks: [
        { type: "p", text: "Khu vực thành viên dành cho người từ 13 tuổi trở lên. Người dưới 16 tuổi nên dùng với sự đồng ý và giám sát của cha mẹ hoặc người giám hộ." },
        { type: "p", text: "Nếu phát hiện tài khoản của trẻ dưới 13 tuổi, tài khoản đó sẽ bị xoá. Phụ huynh có thể yêu cầu xoá dữ liệu của con qua email." },
      ],
    },
    {
      id: "hugopsy",
      title: "HugoPSY và nội dung sức khoẻ tinh thần",
      blocks: [
        {
          type: "note",
          tone: "warn",
          title: "Không phải dịch vụ y tế",
          text: "HugoPSY là công cụ ghi chép và trò chuyện, không phải bác sĩ, không phải nhà trị liệu, không đưa ra chẩn đoán và không thay thế điều trị chuyên môn.",
        },
        {
          type: "list",
          items: [
            "Kết quả các bài trắc nghiệm tâm trạng chỉ để bạn tự theo dõi, không phải kết luận y khoa.",
            "Khi phát hiện dấu hiệu khủng hoảng, ứng dụng hiển thị số đường dây nóng hỗ trợ. Hãy gọi.",
            "Trong tình huống nguy hiểm đến tính mạng, hãy gọi cấp cứu 115 hoặc tới cơ sở y tế gần nhất — đừng chờ ứng dụng.",
            "Nội dung trò chuyện được mã hoá khi lưu và không dùng để huấn luyện mô hình AI.",
          ],
        },
      ],
    },
    {
      id: "joy",
      title: "Điểm JOY",
      blocks: [
        {
          type: "list",
          items: [
            "JOY là điểm thưởng trong ứng dụng, không phải tiền, không phải tiền mã hoá và không phải công cụ đầu tư.",
            "JOY không quy đổi ra tiền mặt và không chuyển ra ngoài hệ thống.",
            "JOY thu được từ gian lận, lỗi kỹ thuật hoặc thao túng sẽ bị thu hồi.",
            "Nếu một tính năng dừng hoạt động, số JOY gắn với tính năng đó có thể mất giá trị sử dụng mà không được bồi hoàn bằng tiền.",
          ],
        },
      ],
    },
    {
      id: "donate",
      title: "Chính sách Donate và ủng hộ tự nguyện",
      blocks: [
        {
          type: "p",
          text: "Donate là tính năng để Hugo Studio đón nhận sự ủng hộ tinh thần và tài chính hoàn toàn tự nguyện từ những người muốn đồng hành cùng dự án. Khoản ủng hộ giúp duy trì hạ tầng, thử nghiệm ý tưởng và phát triển các tiện ích cộng đồng; đây không phải giá mua sản phẩm, phí mở khoá chức năng, khoản đầu tư, khoản vay hay tiền đặt cọc cho một dịch vụ.",
        },
        {
          type: "list",
          items: [
            "Không có tính năng nào của Hugo Studio bắt buộc người dùng phải Donate. Việc ủng hộ hoặc không ủng hộ không làm thay đổi quyền truy cập, thứ tự xử lý Booking, báo giá hay chất lượng hỗ trợ.",
            "Mọi khoản Donate được yêu cầu bằng VNĐ, tạo và đối soát qua API PayOS. Điều khoản, kiểm soát rủi ro, phí và chính sách quyền riêng tư của PayOS cũng được áp dụng cho phần giao dịch do đối tác này xử lý.",
            "Hugo Studio không nhận hoặc lưu mật khẩu ngân hàng hay toàn bộ dữ liệu thẻ. Hệ thống chỉ lưu thông tin cần thiết để đối soát: tên, email nhận thư cảm ơn, số tiền VNĐ, mã giao dịch và trạng thái.",
            "Sau khi giao dịch được đối tác thanh toán xác nhận, khoản Donate trở thành khoản tặng tự nguyện dành cho chủ sở hữu Hugo Studio là Peter Hugo Wishpax Lê. Người gửi không nhận cổ phần, lãi, quyền sở hữu, quyền biểu quyết hoặc cam kết cung cấp tính năng để đổi lại khoản tiền này.",
            "Hugo Studio không phải quỹ từ thiện và không phát hành chứng từ khấu trừ thuế cho khoản Donate. Thư cảm ơn hoặc xác nhận giao dịch chỉ có mục đích ghi nhận và đối soát.",
            "Khi tiếp tục Donate, người gửi được thông báo rằng tên đối soát do ngân hàng trả về sẽ tự động xuất hiện trong danh sách cảm ơn sau khi PayOS xác nhận thanh toán. Nếu ngân hàng không trả tên, hệ thống dùng tên đã nhập. Email, số tài khoản và thông tin định danh khác không được công khai; người gửi có thể liên hệ để yêu cầu ẩn tên.",
          ],
        },
        {
          type: "note",
          tone: "warning",
          title: "Nguyên tắc hoàn trả",
          text: "Vì đây là khoản tặng tự nguyện, Hugo Studio không áp dụng chính sách hoàn trả theo yêu cầu đổi ý thông thường sau khi giao dịch hoàn tất. Tuy nhiên, hệ thống vẫn tiếp nhận và xem xét trường hợp chuyển trùng, sai số tiền do lỗi kỹ thuật, giao dịch không được chủ tài khoản cho phép, quyết định hoàn tiền hoặc đảo giao dịch của PayOS, và mọi trường hợp pháp luật hiện hành bắt buộc phải xử lý. Khoản hoàn trả hợp lệ chỉ được thực hiện qua phương thức thanh toán ban đầu hoặc quy trình chính thức của đối tác; không chuyển sang tài khoản của một bên thứ ba.",
        },
        {
          type: "note",
          tone: "danger",
          title: "Không chấp nhận rửa tiền hoặc sử dụng tiền bất hợp pháp",
          text: "Nghiêm cấm lợi dụng Donate để rửa tiền, che giấu hoặc hợp thức hoá nguồn tiền, chuyển tiền hộ người không xác định, chia nhỏ giao dịch nhằm né kiểm soát, sử dụng tiền có nguồn gốc phạm pháp, thử thẻ hoặc tài khoản bị đánh cắp, lạm dụng hoàn tiền/chargeback, hay thực hiện bất kỳ hành vi nào vi phạm pháp luật. Người gửi xác nhận mình là chủ hợp pháp của phương thức thanh toán hoặc đã được chủ sở hữu cho phép sử dụng.",
        },
        {
          type: "list",
          items: [
            "Hugo Studio có thể từ chối ghi nhận, huỷ yêu cầu đang chờ, ẩn tên khỏi danh sách cảm ơn, lưu bằng chứng đối soát hoặc phối hợp với PayOS, ngân hàng và cơ quan có thẩm quyền khi giao dịch có dấu hiệu bất thường hoặc khi có yêu cầu hợp pháp.",
            "Donate không phải dịch vụ đổi tiền. Hugo Studio không nhận yêu cầu rút tiền mặt, đổi sang JOY, chuyển tiếp đến người khác hoặc hoàn về một phương thức thanh toán khác.",
            "Người gửi phải kiểm tra số tiền VNĐ, tài khoản nhận và nội dung chuyển khoản trên ứng dụng ngân hàng trước khi xác nhận.",
            `Cần đối soát giao dịch: gửi email đến ${email} kèm mã giao dịch, số tiền và thời điểm thanh toán; không gửi mật khẩu, mã OTP hoặc toàn bộ số thẻ.`,
          ],
        },
      ],
    },
    {
      id: "thanh-toan",
      title: "Thanh toán và hoàn tiền",
      blocks: [
        {
          type: "list",
          items: [
            "Mọi yêu cầu thanh toán và khoản ủng hộ đều sử dụng VNĐ, xử lý qua PayOS. Hugo Studio không lưu số thẻ hoặc mật khẩu ngân hàng của bạn.",
            "Phạm vi công việc, giá và tiến độ được thống nhất bằng văn bản trước khi bắt đầu.",
            "Khoản đặt cọc dùng để giữ lịch làm việc. Nếu bạn huỷ sau khi công việc đã bắt đầu, phần đã làm được tính theo thoả thuận ban đầu.",
            "Khoản ủng hộ là tự nguyện, không mua hoặc mở khoá tính năng. Khoản đã hoàn tất nhìn chung không hoàn lại, trừ giao dịch trùng, lỗi kỹ thuật hoặc trường hợp pháp luật quy định khác.",
            "Sau khi PayOS xác nhận khoản ủng hộ, tên đối soát từ ngân hàng sẽ tự động xuất hiện trong danh sách cảm ơn; nếu cần ẩn tên, người gửi có thể liên hệ Hugo Studio.",
          ],
        },
        { type: "p", text: "Có vướng mắc về một khoản thanh toán, hãy gửi email kèm mã đơn — xử lý bằng trao đổi trực tiếp luôn nhanh hơn mọi cách khác." },
      ],
    },
    {
      id: "gioi-han",
      title: "Giới hạn trách nhiệm",
      blocks: [
        {
          type: "list",
          items: [
            "Các tính năng miễn phí được cung cấp ở trạng thái hiện có, có thể thay đổi hoặc dừng mà không báo trước.",
            "Hugo Studio không cam kết hệ thống chạy liên tục không gián đoạn — đây là dự án cá nhân chạy trên hạ tầng miễn phí và có giới hạn.",
            "Bạn tự chịu trách nhiệm về nội dung mình đăng lên, gồm cả việc nội dung đó có xâm phạm quyền của người khác hay không.",
            "Nội dung vi phạm pháp luật hoặc xúc phạm người khác sẽ bị gỡ và tài khoản có thể bị khoá.",
            "Các dấu kiểm tra ở chân trang là liên kết tới công cụ kiểm tra công khai và trang chính sách; không phải mục nào cũng là chứng nhận do bên thứ ba cấp.",
          ],
        },
      ],
    },
    {
      id: "thay-doi",
      title: "Khi chính sách thay đổi",
      blocks: [
        { type: "p", text: "Chính sách sẽ được cập nhật khi hệ thống có tính năng mới đụng tới dữ liệu người dùng. Ngày cập nhật luôn hiển thị ở đầu trang này." },
        { type: "p", text: "Với thay đổi lớn ảnh hưởng trực tiếp tới dữ liệu đã lưu, thành viên sẽ nhận thông báo trong ứng dụng trước khi thay đổi có hiệu lực." },
      ],
    },
  ];

  return (
    <DocsLayout
      eyebrow="Chính sách"
      version="v8"
      title="Chính sách bảo mật & điều khoản sử dụng"
      intro="Trang này nói rõ Hugo Studio thu thập dữ liệu gì, dùng để làm gì, gửi cho ai, giữ bao lâu, và bạn yêu cầu xoá bằng cách nào."
      updatedAt={UPDATED_AT}
      sections={sections}
      footerNote={`Có điểm nào chưa rõ hoặc bạn muốn yêu cầu xoá dữ liệu, gửi email tới ${email}. Đây là tài liệu do chủ trang tự soạn bằng lời thường, không phải văn bản tư vấn pháp lý.`}
    />
  );
}
