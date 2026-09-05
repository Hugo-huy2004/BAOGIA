import { useHeadMeta } from "../../hooks/useHeadMeta";
import DocsLayout from "./DocsLayout";

const UPDATED_AT = "13/08/2026";
const CONTACT_EMAIL = "contact@hugowishpax.studio";

export default function TermsPage() {
  useHeadMeta({
    title: "Điều khoản sử dụng | Hugo Studio",
    description:
      "Điều kiện sử dụng Hugo Studio: tài khoản, độ tuổi, nội dung của bạn, quy trình gỡ nội dung vi phạm bản quyền, điểm JOY, dịch vụ trả phí và giới hạn trách nhiệm.",
    keywords: "điều khoản sử dụng, bản quyền, gỡ nội dung, JOY, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/terms",
  });

  const sections = [
    {
      id: "pham-vi",
      title: "Điều khoản này áp dụng cho ai",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio là sản phẩm cá nhân do Lê Gia Huy vận hành, gồm trang công khai, khu vực thành viên, ứng dụng di động và các tiện ích đi kèm. Điều khoản này xác định quyền lợi bạn nhận được, điều kiện truy cập và giới hạn trách nhiệm của mỗi bên. Khi tạo tài khoản hoặc tiếp tục dùng dịch vụ sau khi được cung cấp điều khoản, bạn xác nhận đã đọc và đồng ý với phần áp dụng cho mình.",
        },
        {
          type: "list",
          items: [
            "Bạn có thể không dùng tính năng tuỳ chọn nếu không đồng ý với điều kiện riêng của tính năng đó; từ chối một quyền thiết bị không làm mất các quyền thành viên độc lập khác.",
            "Chính sách bảo mật là một phần không tách rời của điều khoản này.",
            "Điều khoản riêng của từng dịch vụ bên thứ ba (Google, PayOS, ngân hàng…) vẫn ràng buộc bạn khi bạn dùng phần tính năng có kết nối tới họ.",
          ],
        },
      ],
    },
    {
      id: "tai-khoan",
      title: "Tài khoản và độ tuổi",
      blocks: [
        {
          type: "list",
          items: [
            "Người dưới 14 tuổi được xem nội dung công khai nhưng không được tạo hoặc sử dụng tài khoản thành viên.",
            "Thành viên từ đủ 14 đến dưới 16 tuổi cần cha mẹ hoặc người giám hộ đọc Chính sách bảo mật và đồng ý trước khi tài khoản tiếp tục xử lý dữ liệu. Đây là tiêu chuẩn bảo vệ riêng của Hugo Studio cho nhóm tuổi trẻ em.",
            "Thành viên từ đủ 16 đến dưới 18 tuổi được dùng tính năng thành viên thông thường; tính năng 18+, giao dịch hoặc thoả thuận cần năng lực hành vi đầy đủ vẫn bị giới hạn và có thể cần người đại diện theo pháp luật tham gia.",
            "Tính năng 18+ chỉ mở sau khi hệ thống xác định tài khoản đủ tuổi và đáp ứng điều kiện riêng. Việc một tài khoản đăng nhập được không đồng nghĩa mọi tính năng đều được mở.",
            "Một người dùng một tài khoản chính. Khai sai tuổi, mạo danh hoặc tạo tài khoản phụ để nhận JOY, lượt giới thiệu hay quyền lợi là vi phạm điều khoản.",
            "Ngày sinh được khoá sau lần khai đầu để bảo vệ cổng tuổi. Thành viên vẫn có quyền yêu cầu sửa sai sau bước xác minh hợp lý.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Tài khoản dưới tuổi tối thiểu",
          text: "Khi có căn cứ cho thấy tài khoản dưới 14 tuổi hoặc thiếu xác nhận cần thiết, Hugo Studio có thể tạm ngừng xử lý để xác minh, sau đó xoá hoặc hạn chế dữ liệu theo pháp luật. Phụ huynh hoặc người đại diện theo pháp luật có thể gửi email tới " + CONTACT_EMAIL + " để yêu cầu xử lý; Hugo Studio sẽ xác minh quan hệ đại diện ở mức cần thiết nhằm tránh yêu cầu mạo danh.",
        },
      ],
    },
    {
      id: "quyen-thanh-vien",
      title: "Quyền và lợi ích của thành viên",
      blocks: [
        {
          type: "list",
          items: [
            "Được biết rõ tính năng, giá, điều kiện mở khoá, thời hạn, giới hạn quan trọng và dữ liệu cần xử lý trước khi lựa chọn sử dụng.",
            "Được sử dụng bình đẳng các tính năng đang mở cho nhóm tài khoản của mình; không bị giảm quyền vì không Donate, không mua dịch vụ hoặc từ chối một quyền thiết bị không cần thiết.",
            "Được giữ quyền tác giả đối với nội dung do mình tạo, chọn phạm vi công khai và yêu cầu gỡ nội dung khỏi Hugo Studio.",
            "Được xem, sửa, yêu cầu cung cấp, xoá hoặc hạn chế xử lý dữ liệu cá nhân; rút lại sự đồng ý; phản đối xử lý; khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường theo pháp luật.",
            "Được xem lịch sử JOY, hạng và quyền lợi; yêu cầu đối soát khi dữ liệu hiển thị không đúng; nhận quyền lợi thay thế tương đương nếu một đặc quyền đã cấp hợp lệ không còn khả năng cung cấp.",
            "Được biết nhóm lý do khi nội dung, giao dịch hoặc tài khoản bị hạn chế và được gửi phản hồi, trừ phần thông tin phải giữ kín để bảo vệ hệ thống, người khác hoặc tuân thủ yêu cầu pháp luật.",
            "Được ngừng sử dụng và yêu cầu xoá tài khoản bất cứ lúc nào; việc xoá không làm mất quyền khiếu nại hay quyền bắt buộc đã phát sinh trước đó.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Cách hiểu có lợi cho thành viên",
          text: "Nếu nội dung do Hugo Studio công bố về cùng một quyền lợi có nhiều cách hiểu hợp lý, cách hiểu có lợi hơn cho thành viên được ưu tiên trong phạm vi pháp luật cho phép và không làm ảnh hưởng quyền của người khác.",
        },
      ],
    },
    {
      id: "nghia-vu-thanh-vien",
      title: "Nghĩa vụ của thành viên",
      blocks: [
        {
          type: "list",
          items: [
            "Cung cấp thông tin bắt buộc đầy đủ, chính xác; cập nhật khi thay đổi; không dùng danh tính, email, nội dung hoặc dữ liệu của người khác khi chưa được phép.",
            "Tự bảo vệ tài khoản Google, thiết bị, mã PIN JOY, mã QR và phiên đăng nhập; báo sớm khi nghi ngờ bị chiếm quyền hoặc phát hiện giao dịch bất thường.",
            "Tôn trọng dữ liệu cá nhân, danh dự, quyền tác giả và lợi ích hợp pháp của người khác; chịu trách nhiệm về nội dung mình tải lên hoặc công khai.",
            "Dùng tính năng theo hướng dẫn và cảnh báo; tự kiểm chứng nội dung AI, sức khoẻ, học tập và bên thứ ba trước khi dựa vào đó cho quyết định quan trọng.",
            "Thanh toán, cung cấp tài liệu đầu vào và phản hồi theo mốc đã thoả thuận khi mua dịch vụ; chịu phần chậm trễ trực tiếp phát sinh do mình cung cấp thiếu hoặc phê duyệt muộn.",
            "Hợp tác xác minh hợp lý khi yêu cầu quyền lợi, sửa ngày sinh, khôi phục tài khoản, khiếu nại hoặc thực hiện quyền dữ liệu, để bảo vệ chính chủ tài khoản.",
          ],
        },
      ],
    },
    {
      id: "quy-tac",
      title: "Những việc không được làm",
      blocks: [
        {
          type: "list",
          items: [
            "Đăng nội dung vi phạm pháp luật Việt Nam, xâm phạm quyền của người khác hoặc xâm phạm đời tư.",
            "Đăng nội dung khiêu dâm, bạo lực, kích động thù ghét, hoặc nội dung không phù hợp với người dùng chưa thành niên.",
            "Tải lên phần mềm độc hại, dò quét, khai thác lỗ hổng, gửi yêu cầu tự động quá mức hoặc can thiệp vào hệ thống.",
            "Tạo điểm JOY, thành tích, điểm số hoặc giao dịch bằng cách gian lận, khai thác lỗi hoặc dùng công cụ tự động.",
            "Bán lại, cho thuê hoặc dùng lại nội dung, khoá học, mã nguồn của Hugo Studio cho mục đích thương mại khi chưa có văn bản đồng ý.",
          ],
        },
      ],
    },
    {
      id: "quyen-hugo-studio",
      title: "Quyền của Hugo Studio",
      blocks: [
        {
          type: "list",
          items: [
            "Thiết kế, vận hành, thử nghiệm, bảo trì, thay đổi hoặc ngừng một tính năng vì an toàn, pháp luật, khả năng kỹ thuật, chi phí vận hành hoặc định hướng sản phẩm.",
            "Xác minh danh tính, độ tuổi, tình trạng HSSV, giao dịch, lượt giới thiệu và quyền sử dụng nội dung khi quyền truy cập hoặc quyền lợi phụ thuộc vào thông tin đó.",
            "Ẩn, gỡ hoặc từ chối nội dung; giới hạn tần suất; tạm giữ giao dịch; điều chỉnh JOY, thành tích hoặc đặc quyền phát sinh từ lỗi hệ thống, hoàn tiền, lạm dụng hay gian lận.",
            "Tạm khoá hoặc chấm dứt quyền truy cập khi cần ngăn thiệt hại, bảo vệ người dùng/hệ thống, xử lý vi phạm nghiêm trọng hoặc lặp lại, hay thực hiện yêu cầu của cơ quan có thẩm quyền.",
            "Sử dụng nhà cung cấp hạ tầng và bên xử lý dữ liệu phù hợp để vận hành, trong phạm vi Chính sách bảo mật và thoả thuận bảo vệ dữ liệu áp dụng.",
            "Bảo vệ quyền sở hữu trí tuệ, bí mật kỹ thuật, uy tín và quyền lợi hợp pháp của Hugo Studio.",
          ],
        },
      ],
    },
    {
      id: "nghia-vu-hugo-studio",
      title: "Nghĩa vụ của Hugo Studio",
      blocks: [
        {
          type: "list",
          items: [
            "Công bố thông tin rõ ràng, dễ đọc về tính năng, giá, điều kiện, quyền lợi và giới hạn quan trọng; không dùng điều khoản ẩn để tước quyền bắt buộc của người dùng.",
            "Xử lý dữ liệu đúng mục đích, trong phạm vi cần thiết; áp dụng biện pháp quản lý và kỹ thuật phù hợp; bảo đảm cơ chế thực hiện quyền của chủ thể dữ liệu.",
            "Không bán dữ liệu cá nhân, không buộc cấp quyền thiết bị không cần thiết và không dùng nội dung riêng tư để huấn luyện mô hình AI riêng của Hugo Studio.",
            "Ghi nhận và đối soát JOY, hạng, voucher, thanh toán và quyền lợi theo quy tắc công bố; sửa sai khi có đủ căn cứ.",
            "Thực hiện đúng phạm vi, giá, số lần chỉnh sửa và mốc bàn giao đã xác nhận đối với dịch vụ trả phí; cung cấp chứng từ hoặc thông tin giao dịch theo nghĩa vụ pháp luật áp dụng.",
            "Thông báo thay đổi quan trọng có ảnh hưởng bất lợi trước khi áp dụng khi có thể; không hồi tố để tước quyền lợi đã phát sinh hợp lệ, trừ trường hợp pháp luật, an toàn, lỗi hệ thống hoặc gian lận đòi hỏi.",
            "Tiếp nhận hỗ trợ, khiếu nại và phản hồi quyết định hạn chế tài khoản theo quy trình công bố.",
          ],
        },
      ],
    },
    {
      id: "noi-dung-cua-ban",
      title: "Nội dung bạn đăng lên",
      blocks: [
        {
          type: "list",
          items: [
            "Bạn giữ nguyên quyền tác giả với nội dung mình tạo ra: trang Bio, ảnh, bài viết cộng đồng, ghi chú.",
            "Bạn cấp cho Hugo Studio quyền lưu trữ, sao chép kỹ thuật và hiển thị nội dung đó ở đúng phạm vi mà bạn chọn, chỉ nhằm mục đích vận hành tính năng. Quyền này chấm dứt khi bạn xoá nội dung.",
            "Bạn cam kết mình có quyền với nội dung đã đăng: ảnh do bạn chụp hoặc được cấp phép, chữ do bạn viết, nhạc và phông chữ có giấy phép hợp lệ.",
            "Hugo Studio không dùng nội dung của bạn để huấn luyện mô hình AI riêng.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Trang Bio là nội dung công khai",
          text: "Bất kỳ ai có đường dẫn đều xem được trang Bio. Hãy cân nhắc trước khi đăng ảnh có mặt người khác, thông tin trường lớp, số điện thoại hoặc địa chỉ.",
        },
      ],
    },
    {
      id: "ban-quyen",
      title: "Báo cáo nội dung vi phạm bản quyền",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio gỡ nội dung xâm phạm quyền tác giả khi nhận được thông báo hợp lệ. Nếu bạn là chủ sở hữu quyền hoặc người được uỷ quyền, hãy gửi email tới " + CONTACT_EMAIL + " với tiêu đề bắt đầu bằng “[Bản quyền]”.",
        },
        {
          type: "steps",
          items: [
            "Nêu rõ tác phẩm bị xâm phạm và căn cứ cho thấy bạn là chủ sở hữu quyền hoặc người được uỷ quyền.",
            "Gửi kèm đường dẫn chính xác tới nội dung trên Hugo Studio mà bạn yêu cầu gỡ.",
            "Ghi họ tên, địa chỉ liên hệ và cam đoan thông tin trong thông báo là trung thực.",
            "Hugo Studio xác nhận đã nhận trong vòng 3 ngày làm việc và xử lý trong vòng 10 ngày làm việc kể từ khi nhận đủ thông tin.",
            "Người đăng nội dung được thông báo và có quyền phản hồi. Nếu hai bên không thống nhất, nội dung được giữ ở trạng thái ẩn cho tới khi có kết luận của cơ quan có thẩm quyền.",
          ],
        },
        {
          type: "list",
          items: [
            "Tài khoản tái phạm nhiều lần sẽ bị khoá.",
            "Thông báo cố ý sai sự thật nhằm gỡ nội dung hợp pháp của người khác cũng là căn cứ để khoá tài khoản và chịu trách nhiệm theo pháp luật.",
            "Nội dung do chính Hugo Studio tạo ra — giao diện, bài học, hình minh hoạ, mã nguồn — thuộc quyền của Lê Gia Huy, trừ phần đã nêu giấy phép riêng.",
          ],
        },
      ],
    },
    {
      id: "noi-dung-ben-thu-ba",
      title: "Nội dung của bên thứ ba trong ứng dụng",
      blocks: [
        {
          type: "table",
          head: ["Tính năng", "Nguồn nội dung", "Ranh giới"],
          rows: [
            ["Radio", "Sóng phát thanh công (VOV, VOH, NPR, RTÉ, CBC, RFI, SWR) và đài tự phát trên nền tảng streaming công khai", "Hugo Studio chỉ mở đường dẫn phát sóng công khai, không lưu, không phát lại và không sở hữu nội dung phát sóng."],
            ["Bản tin hôm nay", "RSS công khai của các toà soạn", "Chỉ hiển thị tiêu đề, tóm tắt do chính toà soạn viết và liên kết về bài gốc. Bản quyền toàn văn thuộc về toà soạn."],
            ["Thư viện mã nguồn mở", "Các thư viện MIT, BSD, Apache 2.0", "Danh sách và giấy phép xem ở mục dưới."],
          ],
        },
        {
          type: "p",
          text: "Nếu bạn đại diện một đơn vị và muốn nội dung của mình không xuất hiện trong Hugo Studio, gửi email tới " + CONTACT_EMAIL + " — Hugo Studio sẽ gỡ nguồn đó khỏi hệ thống.",
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
            "JOY là điểm ghi nhận hoạt động bên trong Hugo Studio. JOY không phải tiền, không phải phương tiện thanh toán, không quy đổi ra tiền mặt và không rút về tài khoản ngân hàng.",
            "JOY không được mua bán, chuyển nhượng ra ngoài hệ thống.",
            "Điểm phát sinh từ lỗi kỹ thuật hoặc hành vi gian lận có thể bị điều chỉnh về đúng trạng thái.",
            "Khi tài khoản bị xoá hoặc khi Hugo Studio ngừng hoạt động, số dư JOY chấm dứt và không phát sinh nghĩa vụ tài chính nào.",
          ],
        },
      ],
    },
    {
      id: "thanh-toan",
      title: "Dịch vụ trả phí, đặt lịch và ủng hộ",
      blocks: [
        {
          type: "list",
          items: [
            "Giá dịch vụ được niêm yết trên trang Dịch vụ. Phạm vi công việc, thời gian và số lần chỉnh sửa được chốt bằng văn bản trước khi bắt đầu.",
            "Thanh toán xử lý qua PayOS và ngân hàng; Hugo Studio không lưu thông tin thẻ hay tài khoản ngân hàng của bạn.",
            "Khoản ủng hộ (donate) là tự nguyện, không phải giao dịch mua bán và không hoàn lại, trừ trường hợp giao dịch bị trùng hoặc sai số tiền do lỗi kỹ thuật.",
            "Với dịch vụ đã đặt cọc: huỷ trước khi bắt đầu triển khai được hoàn phần chưa thực hiện; sau khi đã bàn giao bản nháp đầu tiên thì hoàn theo khối lượng còn lại.",
            "Khiếu nại giao dịch gửi tới " + CONTACT_EMAIL + " kèm mã đơn; Hugo Studio phản hồi trong 5 ngày làm việc.",
          ],
        },
      ],
    },
    {
      id: "gioi-han-tinh-nang",
      title: "Giới hạn của các tính năng đặc thù",
      blocks: [
        {
          type: "list",
          items: [
            "HugoPSY, bài tự đánh giá, theo dõi giấc ngủ và các phân tích sức khoẻ trong ứng dụng là công cụ tự ghi chép và tham khảo. Chúng không phải hoạt động khám bệnh, chữa bệnh, không thay thế chẩn đoán, đơn thuốc hay tư vấn của người có chuyên môn.",
            "Trong tình huống khẩn cấp, hãy liên hệ người thân, cơ sở y tế gần nhất hoặc đường dây hỗ trợ, đừng chờ phản hồi của AI.",
            "Giấy chứng nhận Study with Hugo ghi nhận tiến độ học trong ứng dụng. Đây không phải văn bằng, chứng chỉ thuộc hệ thống giáo dục quốc dân.",
            "Nội dung do AI tạo ra có thể sai. Hãy kiểm chứng trước khi dùng cho việc học, việc làm hoặc quyết định quan trọng.",
            "Các khoá học nhắc tới sản phẩm của bên khác chỉ nhằm mục đích hướng dẫn sử dụng. Hugo Studio không liên kết với, không được bảo trợ hay chứng thực bởi các đơn vị đó.",
          ],
        },
      ],
    },
    {
      id: "nguon-mo",
      title: "Giấy phép nguồn mở",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio được xây dựng trên các thư viện nguồn mở. Bản quyền thuộc về tác giả của từng thư viện, và Hugo Studio giữ nguyên thông báo giấy phép của họ.",
        },
        {
          type: "table",
          head: ["Thư viện", "Giấy phép"],
          rows: [
            ["React, React Router, Zustand, SWR, Framer Motion, react-i18next, Monaco Editor, Express, Mongoose", "MIT"],
            ["chess.js", "BSD"],
            ["hls.js", "Apache 2.0"],
            ["lucide-react", "ISC"],
            ["Material Symbols, Plus Jakarta Sans, Mali, Zhi Mang Xing, Klee One, Nanum Pen Script", "Apache 2.0 / SIL Open Font License 1.1"],
          ],
        },
        {
          type: "p",
          text: "Cần bản đầy đủ toàn văn giấy phép của một thư viện cụ thể, gửi email tới " + CONTACT_EMAIL + ".",
        },
      ],
    },
    {
      id: "tam-ngung",
      title: "Tạm ngưng và chấm dứt",
      blocks: [
        {
          type: "list",
          items: [
            "Bạn có thể ngừng dùng và yêu cầu xoá tài khoản bất cứ lúc nào; trước khi xoá nên tải hoặc sao chép nội dung còn cần vì dữ liệu đã xoá có thể không khôi phục được.",
            "Khi rủi ro không khẩn cấp, Hugo Studio ưu tiên cảnh báo hoặc hạn chế đúng tính năng liên quan trước khi khoá toàn bộ tài khoản. Trong tình huống khẩn cấp, hệ thống có thể chặn trước rồi xác minh sau để ngăn thiệt hại.",
            "Khi có thể thông báo, thành viên được biết nhóm lý do, phạm vi hạn chế, thời hạn dự kiến hoặc việc cần làm để được xem xét khôi phục và có quyền gửi phản hồi.",
            "Hugo Studio là sản phẩm cá nhân, có thể thay đổi, tạm dừng hoặc ngừng một tính năng. Nếu ngừng có kế hoạch, hệ thống sẽ cố gắng báo trước để bạn sao lưu; quyền lợi đã cấp hợp lệ được tiếp tục, thay bằng lợi ích tương đương hoặc xử lý theo thoả thuận áp dụng.",
          ],
        },
      ],
    },
    {
      id: "trach-nhiem",
      title: "Giới hạn trách nhiệm",
      blocks: [
        {
          type: "list",
          items: [
            "Các tính năng cộng đồng miễn phí được cung cấp theo khả năng vận hành thực tế, không kèm cam kết thời gian hoạt động liên tục, không lỗi hoặc đạt một kết quả học tập, sức khoẻ, nghề nghiệp hay thu nhập cụ thể.",
            "Hugo Studio chịu trách nhiệm đối với phần hệ thống và hành vi nằm trong khả năng kiểm soát hợp lý của mình. Sự cố điện, mạng, thiết bị người dùng, hành vi người khác và hạ tầng bên thứ ba nằm ngoài khả năng kiểm soát trực tiếp được xử lý theo nguyên tắc nỗ lực phối hợp, không phải bảo đảm tuyệt đối.",
            "Trong phạm vi pháp luật cho phép, Hugo Studio không chịu thiệt hại gián tiếp, lợi nhuận kỳ vọng, cơ hội bị mất hoặc hậu quả do người dùng bỏ qua cảnh báo, dùng sai hướng dẫn, cung cấp thông tin sai hay dựa vào nội dung AI cho quyết định quan trọng.",
            "Với dịch vụ trả phí không đạt phạm vi đã xác nhận, biện pháp khắc phục ưu tiên là sửa lỗi, thực hiện lại phần chưa đạt hoặc hoàn phần giá trị chưa được cung cấp theo thoả thuận và pháp luật.",
            "Không nội dung nào loại trừ hoặc hạn chế trách nhiệm bắt buộc về dữ liệu cá nhân, quyền lợi người tiêu dùng, lỗi cố ý, lỗi nghiêm trọng hoặc nghĩa vụ khác mà pháp luật không cho phép loại trừ.",
          ],
        },
      ],
    },
    {
      id: "luat-ap-dung",
      title: "Luật áp dụng và liên hệ",
      blocks: [
        {
          type: "p",
          text: "Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp trước hết được giải quyết bằng thương lượng qua email; nếu không đạt kết quả, vụ việc thuộc thẩm quyền của toà án có thẩm quyền tại Việt Nam.",
        },
        {
          type: "p",
          text: `Điều khoản có thể được cập nhật; ngày cập nhật luôn nằm ở đầu trang, và thay đổi lớn sẽ được thông báo trong ứng dụng. Mọi câu hỏi gửi về ${CONTACT_EMAIL}.`,
        },
      ],
    },
  ];

  return (
    <DocsLayout
      eyebrow="Pháp lý"
      version="v2"
      title="Điều khoản sử dụng"
      intro="Quyền lợi của thành viên, điều kiện truy cập, trách nhiệm của mỗi bên, cách xử lý nội dung, giao dịch và giới hạn hợp pháp của hệ thống."
      updatedAt={UPDATED_AT}
      sections={sections}
      footerNote="Điều khoản này đi cùng Chính sách bảo mật. Khi hai tài liệu nói về cùng một việc, phần nói chi tiết hơn về dữ liệu cá nhân trong Chính sách bảo mật được ưu tiên áp dụng."
    />
  );
}
