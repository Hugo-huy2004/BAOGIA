import { useHeadMeta } from "../../hooks/useHeadMeta";
import DocsLayout from "./DocsLayout";

const UPDATED_AT = "26/08/2026";
const CONTACT_EMAIL = "contact@hugowishpax.studio";

export default function PrivacyPolicyPage() {
  useHeadMeta({
    title: "Chính sách bảo mật | Hugo Studio",
    description: "Cách Hugo Studio thu thập, sử dụng, bảo vệ và chia sẻ dữ liệu khi bạn dùng hệ thống.",
    keywords: "chính sách bảo mật, dữ liệu cá nhân, bảo mật Hugo Studio, PayOS, JOY",
    canonicalUrl: "https://www.hugowishpax.studio/privacy-policy",
  });

  const sections = [
    {
      id: "tong-quan",
      title: "Bạn cần biết gì",
      blocks: [
        {
          type: "list",
          items: [
            "Hugo Studio chỉ thu thập dữ liệu cần để tính năng bạn chọn hoạt động.",
            "Không bán, cho thuê hoặc trao đổi dữ liệu cá nhân cho mạng quảng cáo.",
            "Bạn có thể dùng trang công khai mà không tạo hồ sơ thành viên.",
            "Dữ liệu do một dịch vụ bên thứ ba xử lý sẽ tuân theo chính sách của chính dịch vụ đó.",
            "Bạn có quyền biết, xem, sửa, yêu cầu cung cấp hoặc xoá dữ liệu; hạn chế hoặc phản đối xử lý; rút lại sự đồng ý; khiếu nại và yêu cầu bồi thường theo pháp luật.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Một nguyên tắc dễ nhớ",
          text: "Không dùng tính năng nào thì Hugo Studio không cần thu thập dữ liệu riêng của tính năng đó. Quyền vị trí, thông báo và các tiện ích cá nhân đều có thể tắt.",
        },
      ],
    },
    {
      id: "chu-the-va-co-so",
      title: "Ai kiểm soát dữ liệu và chính sách dựa trên đâu",
      blocks: [
        {
          type: "list",
          items: [
            "Bên quyết định mục đích và phương tiện xử lý dữ liệu trong hệ thống Hugo Studio là Lê Gia Huy, đơn vị vận hành Hugo Studio.",
            `Đầu mối tiếp nhận yêu cầu về dữ liệu cá nhân: ${CONTACT_EMAIL}. Bạn nên gửi từ email đang gắn với tài khoản để việc xác minh nhanh hơn.`,
            "Chính sách này được xây dựng theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, Nghị định 356/2025/NĐ-CP, Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 và quy định liên quan đang có hiệu lực.",
            "Trường hợp quy định pháp luật thay đổi hoặc yêu cầu bắt buộc cao hơn nội dung tại đây, quy định bắt buộc được ưu tiên áp dụng và chính sách sẽ được cập nhật tương ứng.",
          ],
        },
      ],
    },
    {
      id: "du-lieu",
      title: "Hugo Studio lưu dữ liệu nào",
      blocks: [
        { type: "p", text: "Dữ liệu thay đổi theo cách bạn sử dụng hệ thống. Bảng dưới đây là bản tóm tắt theo nhóm tính năng." },
        {
          type: "table",
          head: ["Nhóm", "Dữ liệu có thể được lưu", "Mục đích"],
          rows: [
            ["Tài khoản", "Email, tên, ảnh đại diện từ Google; thời điểm đăng nhập; khoá công khai của thiết bị nếu dùng WebAuthn.", "Xác minh đúng tài khoản và giữ phiên đăng nhập."],
            ["Hồ sơ và nội dung", "Bio, liên kết, ảnh, ghi chú, nhật ký giấc ngủ và nội dung bạn chủ động tạo.", "Hiển thị và đồng bộ nội dung cho chính bạn."],
            ["Hồ sơ thành viên riêng tư", "Quốc gia, tỉnh/thành, phường/xã, địa chỉ chi tiết, toạ độ đã xác minh; câu trả lời về tôn giáo/tín ngưỡng và dân tộc/bản sắc sắc tộc.", "Hoàn thiện hồ sơ và chuẩn bị tính năng phù hợp theo khu vực, văn hoá. Địa chỉ, toạ độ và các câu trả lời nhạy cảm được mã hoá, không đưa lên Bio công khai; tôn giáo và dân tộc luôn có lựa chọn không tiết lộ."],
            ["Quà HSSV", "Dấu đã nhận từng loại phần thưởng, năm xét và số ngày được cộng. Ảnh/PDF bằng chứng được gửi tới Google Gemini để xét trong request rồi huỷ, Hugo Studio không lưu file.", "Kiểm tra điều kiện của năm hiện tại, cộng ngày duy trì và ngăn nhận lặp."],
            ["HugoPSY và AI", "Câu hỏi, nội dung trò chuyện, bài tự đánh giá và phản hồi cần thiết để tạo câu trả lời.", "Vận hành công cụ trò chuyện và lưu lại khi bạn chọn sử dụng."],
            ["JOY và hoạt động", "Số dư, lịch sử thay đổi JOY, điểm game, tiến độ học, ván cờ và thành tích.", "Cập nhật đúng trạng thái tài khoản và hạn chế gian lận."],
            ["Đặt lịch và Donate", "Tên, email, nội dung yêu cầu, số tiền, mã giao dịch và trạng thái PayOS trả về.", "Xử lý yêu cầu, hiển thị trạng thái và gửi thư cảm ơn."],
            ["Thiết bị và vận hành", "Loại thiết bị, đường dẫn, lỗi kỹ thuật, chỉ số tốc độ; địa chỉ mạng có thể được xử lý để chống lạm dụng.", "Giữ hệ thống ổn định và chặn truy cập gây hại."],
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Hugo Studio có thấy mật khẩu Google hoặc mật khẩu ngân hàng không?",
              a: "Không. Đăng nhập Google được Google xác minh; đăng nhập ngân hàng và mã OTP diễn ra trong ứng dụng hoặc hệ thống của ngân hàng/PayOS, không đi qua biểu mẫu của Hugo Studio.",
            },
            {
              q: "Vân tay và khuôn mặt có được gửi lên server không?",
              a: "Không. Thiết bị tự kiểm tra sinh trắc học. Server chỉ nhận kết quả xác thực và khoá công khai cần để nhận diện thiết bị.",
            },
            {
              q: "Hugo Studio có quay lại màn hình hoặc thao tác gõ phím không?",
              a: "Không. Hệ thống không dùng công cụ quay lại toàn bộ phiên truy cập.",
            },
          ],
        },
      ],
    },
    {
      id: "quyen-du-lieu",
      title: "Quyền dữ liệu của bạn và cách thực hiện",
      blocks: [
        {
          type: "table",
          head: ["Quyền", "Bạn có thể yêu cầu", "Lưu ý"],
          rows: [
            ["Được biết", "Biết dữ liệu nào được xử lý, mục đích, cách xử lý, bên liên quan, thời gian và rủi ro có thể có", "Thông tin cốt lõi được công bố tại chính sách này và ngay tại tính năng khi cần"],
            ["Đồng ý hoặc từ chối", "Chọn có dùng tính năng tuỳ chọn và có cấp quyền thiết bị hay không", "Từ chối chỉ làm tắt phần cần đúng dữ liệu đó"],
            ["Xem và chỉnh sửa", "Xem dữ liệu tài khoản, sửa nội dung hoặc yêu cầu sửa dữ liệu bị khoá", "Dữ liệu ảnh hưởng chống gian lận có thể cần xác minh trước khi sửa"],
            ["Cung cấp bản sao", "Nhận dữ liệu cá nhân của chính bạn ở định dạng hợp lý trong khả năng hệ thống", "Thông tin của người khác và bí mật an toàn sẽ được loại bỏ"],
            ["Xoá hoặc hạn chế", "Xoá dữ liệu, ngừng hoặc giới hạn hoạt động xử lý cụ thể", "Có ngoại lệ khi pháp luật, đối soát, tranh chấp hoặc quyền của người khác yêu cầu tiếp tục lưu"],
            ["Rút lại hoặc phản đối", "Rút lại sự đồng ý, phản đối xử lý hoặc quảng cáo dùng dữ liệu cá nhân", "Không làm mất tính hợp pháp của việc xử lý đã hoàn thành trước thời điểm yêu cầu"],
            ["Khiếu nại và bồi thường", "Yêu cầu giải thích, khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường", "Thực hiện theo thủ tục và căn cứ thiệt hại của pháp luật"],
          ],
        },
        {
          type: "steps",
          items: [
            `Gửi yêu cầu tới ${CONTACT_EMAIL}, nêu email tài khoản, quyền muốn thực hiện và phạm vi dữ liệu liên quan.`,
            "Hugo Studio xác minh người yêu cầu là chủ thể dữ liệu hoặc người đại diện hợp pháp; chỉ yêu cầu thông tin ở mức cần thiết để ngăn mạo danh.",
            "Yêu cầu hợp lệ được phản hồi ban đầu trong 02 ngày làm việc. Thời gian thực hiện thông thường là 15 ngày; trường hợp cần phối hợp bên xử lý/bên thứ ba hoặc yêu cầu phức tạp có thể cần 20–30 ngày theo quy định hiện hành.",
            "Nếu cần gia hạn, không thể thực hiện hoặc chỉ có thể thực hiện một phần, Hugo Studio thông báo lý do và phạm vi xử lý trong thời hạn pháp luật yêu cầu.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Thực hiện quyền không làm bạn mất quyền lợi khác",
          text: "Hugo Studio không phân biệt đối xử vì bạn thực hiện quyền dữ liệu. Nếu dữ liệu là điều kiện kỹ thuật bắt buộc của một tính năng, việc xoá hoặc rút lại đồng ý chỉ khiến đúng tính năng đó ngừng hoạt động; các quyền độc lập khác vẫn được giữ.",
        },
      ],
    },
    {
      id: "du-lieu-nhay-cam",
      title: "Dữ liệu nhạy cảm và việc chuyển ra nước ngoài",
      blocks: [
        {
          type: "p",
          text: "Một số tính năng xử lý nhóm dữ liệu được pháp luật xếp vào loại nhạy cảm. Với câu hỏi hồ sơ bắt buộc, bạn có thể hoàn tất bằng lựa chọn “Không muốn tiết lộ”; các tính năng còn lại chỉ xử lý khi bạn chủ động sử dụng.",
        },
        {
          type: "table",
          head: ["Tính năng", "Dữ liệu nhạy cảm", "Bạn kiểm soát bằng cách"],
          rows: [
            ["HugoPSY và bài tự đánh giá", "Nội dung trò chuyện và câu trả lời liên quan tới sức khoẻ tinh thần.", "Không dùng tính năng, hoặc xoá lịch sử trò chuyện trong phần cài đặt."],
            ["Theo dõi giấc ngủ, phân tích chỉ số sức khoẻ", "Thông tin về giấc ngủ và chỉ số cơ thể bạn tự nhập hoặc thiết bị gửi.", "Tắt tính năng và xoá nhật ký đã lưu."],
            ["Thời tiết", "Vị trí gần đúng của bạn.", "Tắt quyền vị trí trong trình duyệt hoặc hệ điều hành."],
            ["Bạn bè gần bạn và bản đồ bạn bè", "GPS được làm tròn khoảng 100 m; khi GPS không dùng được, IP mạng có thể được gửi tới ipwho.is để suy ra khu vực cấp thành phố và được lưu ở độ chính xác thấp hơn.", "Tắt chia sẻ trong ứng dụng Bạn bè để không ai thấy; chỉ bạn bè đã chấp nhận và cũng đang chia sẻ mới xem được điểm ghim gần đúng. IP có thể sai khi dùng VPN hoặc mạng di động."],
            ["Xác minh địa chỉ tài khoản", "Toạ độ chính xác khi bạn chủ động bấm định vị; điểm ghim được hiển thị bằng bản đồ OpenStreetMap.", "Không cấp quyền định vị thì chưa thể hoàn tất bước xác minh; sau khi lưu, liên hệ admin để yêu cầu sửa hoặc xoá."],
            ["Cá nhân hoá văn hoá", "Câu trả lời về tôn giáo/tín ngưỡng và dân tộc/bản sắc sắc tộc.", "Chọn “Không muốn tiết lộ”, hoặc gửi yêu cầu sửa/xoá dữ liệu đã cung cấp."],
            ["Xét quà HSSV", "Nội dung giấy khen, chứng chỉ hoặc bảng điểm trong file bạn chủ động chọn.", "Không gửi file; file đã gửi chỉ được xử lý tức thời và không được Hugo Studio lưu lại."],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Dữ liệu có thể được xử lý ngoài lãnh thổ Việt Nam",
          text: "Hạ tầng và dịch vụ AI mà Hugo Studio sử dụng (Google, MongoDB Atlas, Cloudinary, Pinecone, SendGrid, Render, Vercel, Cloudflare) đặt máy chủ ở nhiều quốc gia. Khi bạn dùng các tính năng liên quan, dữ liệu tương ứng có thể được truyền và lưu ngoài Việt Nam theo chính sách của từng nhà cung cấp.",
        },
        {
          type: "p",
          text: `Bạn có quyền rút lại sự đồng ý với từng nhóm dữ liệu nhạy cảm bất cứ lúc nào bằng cách tắt tính năng tương ứng, hoặc gửi yêu cầu tới ${CONTACT_EMAIL}. Rút lại sự đồng ý không ảnh hưởng tới việc xử lý đã diễn ra hợp pháp trước đó.`,
        },
      ],
    },
    {
      id: "bao-mat",
      title: "Cách Hugo Studio bảo vệ dữ liệu",
      blocks: [
        { type: "security-flow" },
        {
          type: "list",
          items: [
            "Kết nối giữa trình duyệt và hệ thống dùng HTTPS.",
            "Google ID được kiểm tra tại server; hệ thống không tin vào email do trình duyệt tự khai báo.",
            "Phiên thành viên ưu tiên cookie HttpOnly để mã đăng nhập không bị JavaScript trên trang đọc trực tiếp.",
            "Mọi API thành viên đều kiểm tra danh tính và quyền ở server trước khi đọc hoặc thay đổi dữ liệu.",
            "Trình duyệt không gọi thẳng máy chủ AI nội bộ; yêu cầu đi qua server Hugo Studio trước.",
            "Trò chuyện HugoPSY được mã hoá trước khi ghi xuống cơ sở dữ liệu.",
            "Mã QR JOY do server ký; trình duyệt không tự tạo số dư hay giao dịch hợp lệ.",
            "Giới hạn tần suất, bộ lọc yêu cầu nguy hiểm và thông báo lỗi an toàn giúp giảm lạm dụng mà không làm lộ đường dẫn nội bộ.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Bảo mật là nhiều lớp, không phải lời hứa tuyệt đối",
          text: "Hugo Studio giảm rủi ro bằng nhiều lớp kiểm tra nhưng không tuyên bố an toàn 100%. Đừng nhập mật khẩu, OTP, số thẻ đầy đủ, giấy tờ tuỳ thân hoặc hồ sơ y tế vào nội dung trò chuyện.",
        },
      ],
    },
    {
      id: "vi-du-bao-mat",
      title: "Xem cách bảo vệ chạy thật",
      blocks: [
        {
          type: "p",
          text: "Đọc mô tả kỹ thuật thì dễ trôi. Đoạn video dưới đây chạy lại năm tình huống thật của hệ thống theo từng bước, bạn chỉ cần nhìn là hiểu dữ liệu đi qua đâu và bị chặn ở đâu.",
        },
        { type: "security-examples" },
        {
          type: "note",
          tone: "info",
          title: "Hoạt cảnh đã được làm giả an toàn",
          text: "Video chỉ minh hoạ cấu trúc xử lý. Không có API key, JWT, khoá mã hoá, địa chỉ server nội bộ hoặc dữ liệu người dùng thật xuất hiện trong bất kỳ cảnh nào.",
        },
      ],
    },
    {
      id: "do-tuoi",
      title: "Điều kiện độ tuổi",
      blocks: [
        { type: "age-card" },
        {
          type: "note",
          tone: "warn",
          title: "Khai đúng tuổi là điều kiện sử dụng",
          text: "Người dưới 14 tuổi không được tạo tài khoản. Thành viên từ đủ 14 đến dưới 16 tuổi cần xác nhận đã có sự đồng ý của cha mẹ hoặc người giám hộ theo tiêu chuẩn bảo vệ của Hugo Studio. Nhóm 16–17 tuổi được dùng tính năng thông thường nhưng bị chặn khỏi phần 18+ và giao dịch cần năng lực hành vi đầy đủ. Hugo Studio không mặc định yêu cầu tải giấy tờ tuỳ thân để xác minh tuổi; nếu có dấu hiệu khai sai, tài khoản có thể bị tạm ngừng trong lúc xác minh.",
        },
        {
          type: "p",
          text: "Với người chưa thành niên, người đại diện theo pháp luật có thể thực hiện quyền dữ liệu theo quy định. Khi việc công khai dữ liệu đời sống riêng tư của trẻ em từ đủ 07 tuổi trở lên cần sự đồng ý, Hugo Studio tôn trọng ý kiến của cả trẻ em và người đại diện theo pháp luật theo phạm vi luật định.",
        },
      ],
    },
    {
      id: "ben-thu-ba",
      title: "Dịch vụ bên thứ ba chịu trách nhiệm phần nào",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio dùng hạ tầng và API của các nhà cung cấp khác. Mỗi bên chỉ xuất hiện khi cần cho tính năng tương ứng và tự xử lý dữ liệu theo chính sách của họ.",
        },
        {
          type: "table",
          head: ["Bên cung cấp", "Vai trò", "Dữ liệu liên quan"],
          rows: [
            ["Google", "Đăng nhập và Gemini AI.", "Thông tin đăng nhập cơ bản, nội dung bạn gửi tới tính năng AI."],
            ["PayOS, VietQR và ngân hàng", "Tạo mã thanh toán, mở app ngân hàng và xác nhận giao dịch.", "Thông tin đơn, số tiền, nội dung chuyển khoản và dữ liệu giao dịch do họ xử lý."],
            ["MongoDB Atlas", "Cơ sở dữ liệu.", "Dữ liệu ứng dụng cần lưu lâu dài."],
            ["Pinecone", "Kho vector phục vụ tìm kiếm và gợi ý theo ngữ nghĩa.", "Biểu diễn dạng vector của nội dung bạn tạo trong tính năng liên quan; vector không được mô tả như một biện pháp mã hoá."],
            ["Cloudinary", "Lưu ảnh và tệp tải lên.", "Tệp bạn chủ động gửi."],
            ["Render, Vercel, Cloudflare", "Chạy website, API, bảo vệ và phân phối nội dung.", "Yêu cầu mạng, địa chỉ IP và nhật ký kỹ thuật."],
            ["Redis", "Bộ nhớ đệm và hàng đợi tạm.", "Dữ liệu phiên và kết quả tạm, tự hết hạn sau thời gian ngắn."],
            ["SendGrid và dịch vụ email", "Gửi thư xác minh, thông báo hoặc cảm ơn.", "Địa chỉ email và nội dung thư cần gửi."],
            ["Open-Meteo", "Cung cấp thời tiết.", "Toạ độ gần đúng khi bạn bật tính năng liên quan."],
            ["ipwho.is", "Ước lượng khu vực khi GPS không dùng được.", "Địa chỉ IP mạng; kết quả cấp thành phố được lưu đệm 24 giờ trên thiết bị."],
            ["Radio Browser", "Danh bạ đài phát thanh công khai.", "Tên đài bạn tìm; không gửi kèm danh tính."],
            ["GNews, NewsAPI, arXiv và RSS của các toà soạn", "Nguồn bản tin hôm nay.", "Chỉ chuyên mục và ngôn ngữ bạn chọn; không gửi kèm danh tính."],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Ranh giới trách nhiệm",
          text: "Hugo Studio chịu trách nhiệm lựa chọn nhà cung cấp phù hợp, giới hạn chỉ dẫn xử lý và bảo vệ phần dữ liệu nằm trong khả năng kiểm soát của mình. Dữ liệu do nhà cung cấp tự tạo và giữ trong tài khoản độc lập của họ thuộc quy trình của nhà cung cấp; Hugo Studio không có quyền truy cập để tự sửa hoặc xoá thay bạn, nhưng sẽ hướng dẫn đúng kênh và phối hợp trong phạm vi hợp đồng, kỹ thuật và pháp luật cho phép.",
        },
        {
          type: "external-links",
          items: [
            { label: "Chính sách bảo mật PayOS", href: "https://payos.vn/privacy-policy/" },
            { label: "Thoả thuận sử dụng PayOS", href: "https://payos.vn/thoa-thuan-su-dung/" },
            { label: "Chính sách quyền riêng tư Google", href: "https://policies.google.com/privacy" },
            { label: "Chính sách quyền riêng tư Cloudflare", href: "https://www.cloudflare.com/privacypolicy/" },
          ],
        },
      ],
    },
    {
      id: "hugopsy-ai",
      title: "HugoPSY và tính năng AI",
      blocks: [
        {
          type: "list",
          items: [
            "HugoPSY là công cụ trò chuyện và tự ghi chép, không phải bác sĩ hoặc dịch vụ chẩn đoán.",
            "Chỉ nội dung cần cho câu trả lời được gửi tới dịch vụ AI khi bạn chủ động nhắn.",
            "Hugo Studio không dùng cuộc trò chuyện của bạn để tự huấn luyện một mô hình AI riêng.",
            "Bản lưu hội thoại HugoPSY trong cơ sở dữ liệu Hugo Studio được mã hoá.",
            "Cách Google Gemini xử lý dữ liệu tại hạ tầng của Google tuân theo chính sách và điều khoản của Google.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Khi cần giúp đỡ khẩn cấp",
          text: "Đừng chờ phản hồi từ AI. Hãy liên hệ người bạn tin tưởng, cơ sở y tế gần nhất hoặc dịch vụ hỗ trợ khẩn cấp phù hợp với nơi bạn đang ở.",
        },
      ],
    },
    {
      id: "joy",
      title: "JOY được ghi nhận ra sao",
      blocks: [
        {
          type: "list",
          items: [
            "JOY là điểm dùng bên trong Hugo Studio cho quà tặng, tiện ích và trải nghiệm thành viên.",
            "Hệ thống lưu số dư, lý do cộng/trừ và lịch sử cần thiết để bạn xem lại giao dịch.",
            "JOY không phải tiền mặt và không rút ra tài khoản ngân hàng. Điểm phát sinh từ lỗi hoặc hành vi gian lận có thể được điều chỉnh để trả số dư về đúng trạng thái.",
          ],
        },
      ],
    },
    {
      id: "donate",
      title: "Donate được xử lý qua PayOS",
      blocks: [
        {
          type: "p",
          text: "Donate là lựa chọn ủng hộ tự nguyện bằng VNĐ. Hugo Studio tạo yêu cầu qua API PayOS và hiển thị mã VietQR hoặc trạng thái mà PayOS trả về; Hugo Studio không xây một cổng thanh toán riêng.",
        },
        {
          type: "list",
          items: [
            "Việc Donate không mở khoá tính năng và không ảnh hưởng tới Booking, báo giá hoặc quyền thành viên.",
            "Thông tin đăng nhập ngân hàng, OTP và thao tác xác nhận nằm trong app ngân hàng hoặc hạ tầng thanh toán, không được Hugo Studio thu thập.",
            "Quy trình thanh toán, bảo mật giao dịch, lưu trữ dữ liệu thanh toán và hỗ trợ phát sinh tại PayOS tuân theo chính sách cùng thoả thuận của PayOS.",
            "Sau khi PayOS báo giao dịch thành công, tên người đồng hành do ngân hàng trả về hoặc tên đã nhập có thể xuất hiện trong danh sách cảm ơn. Email, số tài khoản và mã giao dịch không được đưa vào danh sách công khai.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Khi giao dịch gặp vấn đề",
          text: "Vấn đề thuộc luồng thanh toán, ứng dụng ngân hàng hoặc dữ liệu PayOS cần được xử lý qua kênh hỗ trợ chính thức của PayOS/ngân hàng. Hugo Studio chỉ có thể hiển thị và đối chiếu trạng thái mà API trả về, không thể truy cập tài khoản ngân hàng của bạn.",
        },
        {
          type: "external-links",
          items: [
            { label: "Đọc chính sách PayOS", href: "https://payos.vn/privacy-policy/" },
            { label: "Mở tài liệu hỗ trợ PayOS", href: "https://payos.vn/docs/" },
          ],
        },
      ],
    },
    {
      id: "cookie",
      title: "Cookie và dữ liệu trên thiết bị",
      blocks: [
        {
          type: "list",
          items: [
            "Cookie phiên giúp bạn duy trì đăng nhập; cookie thành viên được cấu hình để JavaScript trên trang không đọc trực tiếp.",
            "Bộ nhớ trình duyệt giữ ngôn ngữ, giao diện và một số trạng thái dùng khi mất mạng.",
            "Bộ nhớ đệm của PWA giúp trang tải nhanh hơn và mở được một số nội dung đã lưu khi không có mạng.",
            "Hugo Studio không cài cookie quảng cáo hoặc pixel để bán hồ sơ hành vi.",
          ],
        },
        { type: "p", text: "Bạn có thể xoá dữ liệu trang trong cài đặt trình duyệt. Thao tác này cũng đăng xuất thiết bị và xoá các tuỳ chọn cục bộ." },
      ],
    },
    {
      id: "luu-xoa",
      title: "Thời gian lưu và quyền kiểm soát",
      blocks: [
        {
          type: "table",
          head: ["Dữ liệu Hugo Studio", "Thời gian dự kiến"],
          rows: [
            ["Tài khoản và nội dung bạn tạo", "Đến khi bạn xoá nội dung hoặc yêu cầu xoá tài khoản."],
            ["Thông báo trong ứng dụng", "Tự xoá sau khoảng 90 ngày."],
            ["Giỏ hàng hoặc trạng thái tạm chưa hoàn tất", "Tự xoá sau khoảng 30 ngày."],
            ["Nhật ký lỗi và chỉ số kỹ thuật", "Chỉ giữ trong thời gian cần để tìm lỗi, thường không quá 30 ngày."],
            ["Mã và trạng thái giao dịch", "Giữ trong thời gian cần để đối soát và tránh xử lý trùng."],
          ],
        },
        {
          type: "list",
          items: [
            "Sửa dữ liệu: dùng chức năng chỉnh sửa ngay trong tài khoản nếu có.",
            "Tắt thu thập theo tính năng: thu hồi quyền vị trí, thông báo hoặc ngừng dùng tính năng đó.",
            `Xoá dữ liệu Hugo Studio khi không có nút tự xoá: gửi yêu cầu từ email tài khoản tới ${CONTACT_EMAIL}.`,
            "Dữ liệu thuộc Google, PayOS, ngân hàng hoặc nhà cung cấp khác: thực hiện yêu cầu trực tiếp theo chính sách của bên đó.",
            "Hugo Studio chỉ tiếp tục giữ dữ liệu sau yêu cầu xoá khi có căn cứ pháp luật, nghĩa vụ đối soát, tranh chấp, yêu cầu bảo vệ quyền của người khác hoặc ngoại lệ hợp pháp khác; phần bị giữ được hạn chế sử dụng đúng mục đích đó.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Xác minh trước khi xoá",
          text: "Hugo Studio cần xác nhận người yêu cầu là chủ tài khoản để tránh người khác mạo danh. Dữ liệu đã xoá vĩnh viễn có thể không khôi phục được.",
        },
      ],
    },
    {
      id: "gioi-han",
      title: "Giới hạn sử dụng an toàn",
      blocks: [
        {
          type: "list",
          items: [
            "Khu vực thành viên bắt buộc từ đủ 14 tuổi; nhóm 14–15 tuổi cần xác nhận của cha mẹ/người giám hộ, còn nhóm 16–17 tuổi bị giới hạn khỏi tính năng 18+ và giao dịch cần năng lực hành vi đầy đủ.",
            "Trang Bio là nội dung công khai. Chỉ đăng thông tin bạn chấp nhận để người khác nhìn thấy.",
            "Không tải lên mật khẩu, OTP, dữ liệu thẻ đầy đủ, giấy tờ tuỳ thân hoặc bí mật của người khác.",
            "Nếu Hugo Studio dừng hoạt động có kế hoạch, hệ thống sẽ cố gắng báo trước để thành viên sao lưu dữ liệu; dữ liệu không được bán lại như một tài sản người dùng.",
          ],
        },
      ],
    },
    {
      id: "cap-nhat",
      title: "Cập nhật và liên hệ",
      blocks: [
        { type: "p", text: "Chính sách được cập nhật khi cách hệ thống thu thập hoặc xử lý dữ liệu thay đổi. Ngày cập nhật mới nhất luôn nằm ở đầu trang." },
        { type: "p", text: `Nếu câu hỏi liên quan trực tiếp tới dữ liệu nằm trong Hugo Studio, bạn có thể liên hệ ${CONTACT_EMAIL}. Với dữ liệu do bên thứ ba giữ, hãy dùng kênh quyền riêng tư hoặc hỗ trợ của chính bên đó.` },
      ],
    },
  ];

  return (
    <DocsLayout
      eyebrow="Quyền riêng tư"
      version="v12"
      title="Chính sách bảo mật"
      intro="Quyền dữ liệu của bạn, dữ liệu Hugo Studio xử lý, cách bảo vệ, thời hạn phản hồi và ranh giới trách nhiệm với dịch vụ bên thứ ba."
      updatedAt={UPDATED_AT}
      sections={sections}
      footerNote="Bạn nên đọc chính sách của dịch vụ bên thứ ba trước khi dùng tính năng có kết nối. Hugo Studio chịu trách nhiệm đối với phần xử lý nằm trong khả năng kiểm soát của mình và phối hợp thực hiện quyền dữ liệu theo phạm vi pháp luật, hợp đồng và kỹ thuật cho phép."
    />
  );
}
