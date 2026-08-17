import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import DocsLayout from "./DocsLayout";

/**
 * Hướng dẫn viết theo việc người dùng muốn làm, không theo cấu trúc module của
 * code. Mỗi mục: hình minh hoạ có chấm số → các bước khớp chấm số → bảng ý
 * nghĩa từng ô → lưu ý → câu hỏi hay gặp.
 *
 * Hình lấy từ guideArt.jsx (vẽ bằng SVG). Đổi giao diện thì sửa hình ở đó,
 * đừng chèn ảnh chụp màn hình: ảnh chụp lỗi thời sau mỗi lần đổi UI.
 */
const UPDATED_AT = "13/08/2026";

export default function UserGuidePage() {
  const { t } = useTranslation();
  const email = "contact@hugowishpax.studio";

  useHeadMeta({
    title: "Hướng dẫn sử dụng | Hugo Studio",
    description:
      "Hướng dẫn từng bước có hình minh hoạ: đăng nhập, dựng trang Bio, ví JOY, cài ứng dụng lên máy, bật thông báo, đặt lịch và xử lý lỗi.",
    keywords: "hướng dẫn sử dụng, trang Bio, ví JOY, cài đặt PWA, đăng nhập vân tay, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/user-guide",
  });

  const sections = [
    {
      id: "tong-quan",
      title: "Hugo Studio gồm những gì",
      blocks: [
        {
          type: "p",
          text: "Trang này có hai phần. Phần công khai gồm giới thiệu, bảng giá dịch vụ, hỏi đáp — ai cũng xem được, không cần tài khoản. Phần thành viên là một ứng dụng riêng cần đăng nhập, gồm trang Bio, ví JOY, HugoPSY, arcade và các khoá học.",
        },
        { type: "figure", art: "tabs", caption: "Khu vực thành viên điều hướng bằng thanh tab dưới đáy. Khi bạn mở một ứng dụng con (arcade, cửa hàng, Study with Hugo), thanh tab tự ẩn để ứng dụng đó chiếm trọn màn hình — muốn quay ra thì bấm nút quay lại ở góc trên." },
        {
          type: "table",
          head: ["Khu vực", "Dùng để làm gì", "Cần đăng nhập"],
          rows: [
            ["Giới thiệu, Dịch vụ, Hỏi đáp", "Xem thông tin và bảng giá", "Không"],
            ["Trang Bio công khai", "Trang cá nhân bạn gửi cho người khác", "Không, với người xem"],
            ["Trang chủ thành viên", "Tóm tắt hoạt động, lối tắt", "Có"],
            ["Bio", "Dựng và sửa trang cá nhân của bạn", "Có"],
            ["Ví JOY", "Xem điểm, đổi vật phẩm, tạo mã QR", "Có"],
            ["HugoPSY", "Ghi tâm trạng, nhật ký giấc ngủ", "Có"],
            ["Arcade, Study with Hugo", "Chơi game; học lập trình, kỹ năng văn phòng và AI", "Có"],
          ],
        },
      ],
    },
    {
      id: "quyen-va-truy-cap",
      title: "Xem quyền và phạm vi truy cập của bạn",
      blocks: [
        {
          type: "p",
          text: "Mỗi tài khoản được mở tính năng theo độ tuổi, tình trạng xác minh HSSV, hạng thẻ và quyền lợi còn hiệu lực. Bạn có thể tra toàn bộ căn cứ ngay trong tài khoản, không cần đoán vì sao một mục đang mở hoặc bị giới hạn.",
        },
        {
          type: "steps",
          items: [
            "Mở khu vực thành viên và chọn Tài khoản ở thanh điều hướng.",
            "Mở nhóm Thành viên, chọn Quyền và truy cập.",
            "Đọc bảng nhóm truy cập để biết tính năng công khai, thành viên cơ bản, HSSV đã xác minh, quyền theo hạng và tính năng 18+.",
            "Xem mục Quyền trên thiết bị để biết vị trí, thông báo, camera, microphone hoặc sinh trắc học được dùng khi nào và điều gì xảy ra nếu bạn từ chối.",
            "Nếu quyền hiển thị không đúng, gửi phản hồi theo hướng dẫn cuối tài liệu; kèm ảnh màn hình và email tài khoản để được đối soát.",
          ],
        },
        {
          type: "table",
          head: ["Trạng thái", "Ý nghĩa", "Cách xử lý"],
          rows: [
            ["Cần đăng nhập", "Tính năng cần gắn dữ liệu với đúng chủ tài khoản", "Đăng nhập bằng Google hoặc passkey đã đăng ký"],
            ["Cần xác minh HSSV", "Quyền lợi dành riêng cho người học", "Dùng email trường hoặc gửi yêu cầu xác minh theo biểu mẫu"],
            ["Chỉ dành cho 18+", "Tính năng không phù hợp người chưa thành niên", "Không thể mở sớm; ngày sinh đã khai được dùng làm căn cứ"],
            ["Cần quyền thiết bị", "Tính năng cần vị trí, camera hoặc thông báo", "Chỉ cấp đúng quyền nếu muốn dùng; các tính năng khác vẫn hoạt động"],
            ["Tạm hạn chế", "Hệ thống đang bảo vệ tài khoản, đối soát hoặc xử lý vi phạm", "Đọc lý do hiển thị và gửi phản hồi nếu cho rằng quyết định chưa đúng"],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Quyền truy cập không phải quyền sở hữu hệ thống",
          text: "Bạn được sử dụng tính năng theo điều kiện đang áp dụng và giữ quyền đối với nội dung của mình. Mã nguồn, hạ tầng, dữ liệu của người khác và công cụ quản trị không thuộc phạm vi truy cập của tài khoản thành viên.",
        },
      ],
    },
    {
      id: "dang-nhap",
      title: "Đăng nhập lần đầu",
      blocks: [
        { type: "figure", art: "login", caption: "Màn hình đăng nhập chỉ có một nút. Không có ô nhập mật khẩu vì hệ thống không tạo mật khẩu riêng cho bạn." },
        {
          type: "steps",
          items: [
            "Bấm Đăng nhập ở thanh điều hướng trên cùng hoặc ở chân trang.",
            "Bấm nút Tiếp tục với Google.",
            "Chọn tài khoản Google bạn muốn dùng. Nếu máy đang đăng nhập nhiều tài khoản, chọn kỹ — đây sẽ là danh tính gắn với toàn bộ dữ liệu của bạn về sau.",
            "Xong. Trình duyệt tự nhớ phiên, lần sau vào thẳng.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Hugo Studio không nhìn thấy mật khẩu Google của bạn",
          text: "Việc kiểm tra mật khẩu do Google làm. Hệ thống chỉ nhận lại một tấm vé xác nhận rồi lấy từ đó ba thứ: email, tên hiển thị và ảnh đại diện.",
        },
        {
          type: "faq",
          items: [
            {
              q: "Đăng nhập xong lại bị đá về trang đăng nhập?",
              a: "Gần như luôn là do trình duyệt chặn cookie. Bật lại cookie cho trang, và nếu đang ở chế độ duyệt web riêng tư thì thoát ra dùng cửa sổ thường.",
            },
            {
              q: "Đổi sang tài khoản Google khác được không?",
              a: "Được, nhưng đó là một tài khoản hoàn toàn mới: dữ liệu Bio, JOY, nhật ký của tài khoản cũ không tự chuyển sang.",
            },
            {
              q: "Dùng chung máy với người khác thì sao?",
              a: "Xong việc hãy xoá dữ liệu trang trong trình duyệt để đăng xuất. Đóng tab không đủ để đăng xuất.",
            },
          ],
        },
      ],
    },
    {
      id: "dang-nhap-nhanh",
      title: "Bật đăng nhập bằng vân tay hoặc khuôn mặt",
      blocks: [
        { type: "p", text: "Sau lần đăng nhập đầu, bạn có thể bật khoá thiết bị để lần sau vào bằng vân tay, khuôn mặt hoặc mã mở khoá máy — nhanh hơn và không phụ thuộc vào việc còn đăng nhập Google hay không." },
        { type: "figure", art: "passkey", caption: "Bật công tắc trong phần Cài đặt, sau đó xác nhận bằng cảm biến của máy. Hai bước nằm ở hai màn hình khác nhau: một của ứng dụng, một của hệ điều hành." },
        {
          type: "steps",
          items: [
            "Vào Tài khoản → Quyền riêng tư & thông báo → Quyền riêng tư và sinh trắc học.",
            "Trình duyệt hiện hộp thoại của hệ điều hành — chạm vân tay, quét khuôn mặt hoặc nhập mã mở khoá máy.",
            "Đặt tên cho thiết bị để sau này bạn biết đâu là máy nào trong danh sách.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Sinh trắc học không rời khỏi máy bạn",
          text: "Máy của bạn giữ phần khoá bí mật và chỉ gửi lên hệ thống một khoá công khai. Từ khoá công khai đó không dựng lại được vân tay hay khuôn mặt.",
        },
        {
          type: "list",
          items: [
            "Mỗi thiết bị cần bật riêng — bật trên điện thoại không tự có trên máy tính.",
            "Mất thiết bị thì vẫn đăng nhập được bằng Google trên máy khác, rồi xoá thiết bị cũ khỏi danh sách.",
            "Máy không có cảm biến vân tay vẫn dùng được, hệ điều hành sẽ hỏi mã mở khoá thay thế.",
          ],
        },
      ],
    },
    {
      id: "trang-bio",
      title: "Dựng trang Bio",
      blocks: [
        { type: "p", text: "Bio là trang cá nhân một đường dẫn: gom liên kết, giới thiệu bản thân, gửi cho người khác thay vì đưa từng đường dẫn rời rạc. Bạn sửa ở bên trái, người xem thấy kết quả ở bên phải." },
        { type: "figure", art: "bioEditor", caption: "Sửa ở trình soạn, bấm Lưu là trang công khai đổi theo ngay. Không cần bước xuất bản riêng." },
        {
          type: "steps",
          items: [
            "Điền tên hiển thị — đây là dòng chữ to nhất trên trang công khai.",
            "Viết mô tả ngắn. Một hai câu là đủ; dài quá sẽ bị cắt trên màn hình nhỏ.",
            "Thêm các liên kết. Mỗi liên kết gồm nhãn hiển thị và địa chỉ đầy đủ bắt đầu bằng https://",
            "Chọn ảnh đại diện, nền và bố cục ở phần bên dưới.",
            "Bấm Lưu, rồi sao chép đường dẫn ở đầu trang để gửi cho người khác.",
          ],
        },
        {
          type: "table",
          head: ["Ô", "Ý nghĩa", "Gợi ý"],
          rows: [
            ["Tên hiển thị", "Dòng tiêu đề của trang", "Dùng tên người ta hay gọi bạn, không cần tên đầy đủ trên giấy tờ"],
            ["Mô tả ngắn", "Câu giới thiệu dưới tên", "Nói bạn làm gì, không nói bạn là ai — dễ nhớ hơn"],
            ["Liên kết", "Các nút bấm được trên trang", "Xếp cái quan trọng nhất lên đầu, 5–7 cái là vừa"],
            ["Ảnh đại diện", "Ảnh tròn trên cùng", "Ảnh vuông, dưới 5MB, mặt chiếm phần lớn khung"],
            ["Nền", "Màu hoặc hiệu ứng nền", "Nền càng đơn giản chữ càng dễ đọc"],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Nền thời tiết cần vị trí của bạn",
          text: "Bật nền thời tiết đồng nghĩa với việc chia sẻ toạ độ gần đúng để lấy dữ liệu trời. Không muốn thì để tắt — mọi phần khác của Bio vẫn chạy bình thường.",
        },
        {
          type: "faq",
          items: [
            { q: "Trang Bio của tôi ai cũng xem được à?", a: "Đúng, ai có đường dẫn đều xem được mà không cần đăng nhập. Đừng đặt ở đó thông tin bạn không muốn công khai." },
            { q: "Đổi đường dẫn được không?", a: "Được, trong phần cài đặt Bio. Lưu ý đường dẫn cũ sẽ ngừng hoạt động ngay, ai đã lưu link cũ sẽ không vào được nữa." },
            { q: "Ảnh tải lên bị lỗi?", a: "Kiểm tra dung lượng dưới 5MB và định dạng là JPG, PNG hoặc WebP. Ảnh chụp màn hình điện thoại đời mới đôi khi ở định dạng HEIC, cần đổi sang JPG trước." },
          ],
        },
      ],
    },
    {
      id: "vi-joy",
      title: "Ví JOY",
      blocks: [
        { type: "p", text: "JOY là điểm thưởng trong ứng dụng. Bạn nhận JOY khi vào đều đặn, hoàn thành bài học hoặc chơi arcade, rồi dùng JOY đổi vật phẩm trang trí và quà tặng trong hệ thống." },
        { type: "figure", art: "joy", caption: "Số dư nằm trên thẻ đầu tiên, bên dưới là lịch sử từng lần cộng trừ kèm lý do. Mã QR dùng để nhận hoặc trao JOY, có đếm ngược thời gian hiệu lực." },
        {
          type: "steps",
          items: [
            "Mở Tài khoản → Trung tâm JOY để xem số dư hiện tại.",
            "Cuộn xuống xem lịch sử: mỗi dòng ghi rõ cộng hay trừ bao nhiêu và vì lý do gì.",
            "Cần nhận hay trao JOY thì tạo mã QR và đưa cho đúng người trong lúc mã còn hiệu lực.",
          ],
        },
        {
          type: "table",
          head: ["Cách kiếm JOY", "Ghi chú"],
          rows: [
            ["Vào ứng dụng đều đặn", "Tính theo chuỗi ngày liên tiếp"],
            ["Hoàn thành bài học Study with Hugo", "Mỗi bài một lần duy nhất"],
            ["Chơi arcade đạt mốc điểm", "Có giới hạn theo ngày để tránh cày máy"],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Ai có mã là dùng được mã",
          text: "Đừng chụp màn hình mã QR rồi đăng lên nhóm chat hay mạng xã hội. Mã hết hạn nhanh, nhưng trong khoảng thời gian đó ai quét trước được trước.",
        },
        {
          type: "note",
          tone: "info",
          title: "JOY không phải tiền",
          text: "JOY không quy đổi ra tiền mặt, không chuyển ra ngoài hệ thống và không phải công cụ đầu tư. JOY có được do gian lận hoặc lỗi kỹ thuật sẽ bị thu hồi.",
        },
      ],
    },
    {
      id: "hugopsy",
      title: "HugoPSY và nhật ký giấc ngủ",
      blocks: [
        {
          type: "note",
          tone: "warn",
          title: "Đây là công cụ ghi chép, không phải bác sĩ",
          text: "HugoPSY không chẩn đoán, không kê đơn và không thay thế người có chuyên môn. Nếu bạn đang trong tình huống nguy hiểm tới tính mạng, hãy gọi 115 hoặc số đường dây nóng hiển thị trong ứng dụng — đừng chờ ứng dụng.",
        },
        { type: "p", text: "Phần này gồm hai thứ tách biệt: trò chuyện để ghi lại điều bạn đang nghĩ, và nhật ký giấc ngủ để theo dõi thay đổi theo thời gian." },
        { type: "figure", art: "sleep", caption: "Ghi nhật ký buổi sáng chỉ mất khoảng nửa phút. Sau vài ngày, biểu đồ tuần bắt đầu cho thấy quy luật mà cảm giác chủ quan khó nhận ra." },
        {
          type: "steps",
          items: [
            "Buổi sáng, mở nhật ký giấc ngủ và điền giờ ngủ, giờ dậy.",
            "Chấm chất lượng giấc ngủ theo cảm nhận, chọn tâm trạng khi thức dậy.",
            "Nếu muốn theo dõi kỹ hơn, khai thêm caffeine, vận động, mức căng thẳng hôm trước.",
            "Xem biểu đồ tuần để đối chiếu: đêm ngủ ít có kéo theo tâm trạng xấu hôm sau không.",
          ],
        },
        {
          type: "list",
          items: [
            "Nội dung trò chuyện được mã hoá trước khi lưu xuống cơ sở dữ liệu.",
            "Nội dung trò chuyện không được dùng để huấn luyện mô hình AI.",
            "Kết quả các bài trắc nghiệm tâm trạng chỉ để bạn tự theo dõi, không phải kết luận y khoa.",
            "Bạn xoá được từng mục nhật ký bất cứ lúc nào.",
          ],
        },
      ],
    },
    {
      id: "cai-len-may",
      title: "Cài lên máy như một ứng dụng",
      blocks: [
        { type: "p", text: "Hugo Studio chạy được như ứng dụng thật: có biểu tượng riêng ngoài màn hình chính, mở toàn màn hình không còn thanh địa chỉ, và dùng được một phần khi mất mạng." },
        { type: "figure", art: "install", caption: "iPhone cài qua nút Chia sẻ của Safari. Android cài qua menu ba chấm của Chrome. Trên máy tính, biểu tượng cài đặt nằm ngay trong thanh địa chỉ." },
        {
          type: "table",
          head: ["Thiết bị", "Cách cài"],
          rows: [
            ["iPhone, iPad", "Mở bằng Safari → nút Chia sẻ ở thanh dưới → cuộn tìm Thêm vào MH chính → Thêm"],
            ["Android", "Mở bằng Chrome → menu ba chấm góc trên → Cài đặt ứng dụng"],
            ["Windows, macOS", "Mở bằng Chrome hoặc Edge → biểu tượng cài đặt ở cuối thanh địa chỉ"],
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "iPhone bắt buộc dùng Safari",
          text: "Trên iOS, Chrome và các trình duyệt khác không có mục Thêm vào MH chính. Mở bằng Safari mới cài được.",
        },
        {
          type: "list",
          items: [
            "Mất mạng vẫn chơi được arcade; điểm tự đồng bộ khi có mạng trở lại.",
            "Bản cài trên máy tự cập nhật khi bạn mở lại lúc có mạng.",
            "Gỡ ứng dụng như gỡ app thường; dữ liệu tài khoản vẫn còn trên máy chủ.",
          ],
        },
      ],
    },
    {
      id: "thong-bao",
      title: "Bật thông báo",
      blocks: [
        { type: "p", text: "Thông báo dùng để nhắc lịch hẹn và nhắc chuỗi ngày hoạt động. Có hai lớp cho phép, phải qua cả hai mới nhận được." },
        { type: "figure", art: "notifications", caption: "Lớp một là công tắc trong ứng dụng. Lớp hai là hộp thoại của trình duyệt. Bấm Chặn ở lớp hai thì công tắc lớp một bật cũng vô nghĩa." },
        {
          type: "steps",
          items: [
            "Vào Tài khoản → Quyền riêng tư & thông báo → Thông báo, rồi bật Thông báo đẩy.",
            "Trình duyệt hiện hộp thoại hỏi quyền — bấm Cho phép.",
            "Muốn kiểm tra, gửi thử một thông báo từ chính phần cài đặt đó.",
          ],
        },
        {
          type: "faq",
          items: [
            {
              q: "Lỡ bấm Chặn rồi thì sao?",
              a: "Trình duyệt sẽ không hỏi lại. Phải vào phần cài đặt quyền của trang trong trình duyệt, đổi Thông báo từ Chặn sang Hỏi hoặc Cho phép, rồi bật lại trong ứng dụng.",
            },
            {
              q: "iPhone không thấy thông báo?",
              a: "Trên iOS, thông báo đẩy chỉ hoạt động khi bạn đã cài trang lên màn hình chính. Mở bằng Safari thường sẽ không nhận được.",
            },
            {
              q: "Nhận quá nhiều thông báo?",
              a: "Trong phần cài đặt có thể tắt riêng từng loại thay vì tắt hết.",
            },
          ],
        },
      ],
    },
    {
      id: "dat-lich",
      title: "Đặt lịch và thanh toán dịch vụ",
      blocks: [
        { type: "p", text: "Phần này dành cho việc thuê làm website, khác hoàn toàn với khu vực thành viên miễn phí ở trên." },
        { type: "figure", art: "booking", caption: "Bốn bước từ lúc xem giá tới lúc thanh toán. Buổi trao đổi đầu tiên không tính phí." },
        {
          type: "steps",
          items: [
            "Xem bảng giá ở trang Dịch vụ, chọn nhóm gần với nhu cầu của bạn nhất. Chưa rõ thì cứ bỏ qua bước chọn.",
            "Bấm Đặt lịch trao đổi và mô tả việc bạn cần: bạn bán gì, cho ai, đang có sẵn gì chưa.",
            "Trao đổi để chốt phạm vi công việc, giá và mốc thời gian. Tất cả ghi lại bằng văn bản.",
            "Nhận liên kết thanh toán riêng và thanh toán qua đó.",
          ],
        },
        {
          type: "list",
          items: [
            "Giá trên trang Dịch vụ là giá khởi điểm cho phạm vi tiêu chuẩn, chốt cuối sau khi rõ yêu cầu.",
            "Đặt cọc dùng để giữ lịch làm việc.",
            "Hugo Studio không lưu số thẻ của bạn — mọi yêu cầu thanh toán và khoản ủng hộ đều dùng VNĐ, xử lý qua PayOS.",
            "Có vướng mắc về một khoản thanh toán thì gửi email kèm mã đơn.",
          ],
        },
      ],
    },
    {
      id: "du-lieu-cua-ban",
      title: "Kiểm soát dữ liệu của bạn",
      blocks: [
        {
          type: "table",
          head: ["Bạn muốn", "Làm ở đâu"],
          rows: [
            ["Sửa hoặc xoá nội dung đã tạo", "Ngay trong ứng dụng, tại chính mục đó"],
            ["Tắt chia sẻ vị trí", "Thu hồi quyền vị trí trong trình duyệt/hệ điều hành và tắt tính năng liên quan"],
            ["Tắt thông báo", "Tài khoản → Thông báo; nếu đã chặn ở hệ điều hành thì đổi tại cài đặt hệ thống"],
            ["Ngừng dùng tính năng AI", "Ngừng gửi nội dung mới và xoá lịch sử tại tính năng nếu có"],
            ["Đăng xuất khỏi máy đang dùng", "Tài khoản → Đăng xuất; trên máy dùng chung nên xoá thêm dữ liệu trang"],
            ["Lấy bản sao toàn bộ dữ liệu", `Gửi email tới ${email}`],
            ["Xoá hẳn tài khoản", `Gửi email từ chính địa chỉ đã đăng nhập tới ${email}`],
          ],
        },
        { type: "p", text: "Yêu cầu dữ liệu hợp lệ được phản hồi ban đầu trong 02 ngày làm việc. Thời gian thực hiện thông thường là 15 ngày và có thể là 20–30 ngày khi cần phối hợp bên thứ ba hoặc xử lý yêu cầu phức tạp theo pháp luật. Chi tiết đầy đủ nằm ở Chính sách bảo mật." },
      ],
    },
    {
      id: "loi-thuong-gap",
      title: "Gặp lỗi thì làm gì",
      blocks: [
        { type: "p", text: "Thử theo thứ tự từ trên xuống, phần lớn sự cố dừng lại ở hai bước đầu." },
        {
          type: "table",
          head: ["Hiện tượng", "Thử cách này"],
          rows: [
            ["Đăng nhập xong vẫn quay về trang đăng nhập", "Bật cookie cho trang, thoát chế độ duyệt web riêng tư, thử lại"],
            ["Trang trắng sau khi cập nhật", "Kéo xuống làm mới; nếu vẫn trắng thì đóng hẳn ứng dụng rồi mở lại"],
            ["Giao diện cũ, tính năng mới chưa thấy", "Đóng hẳn ứng dụng rồi mở lại khi có mạng để bản cài tự cập nhật"],
            ["Không nhận được thông báo", "Kiểm tra quyền trong cài đặt hệ điều hành trước, rồi tới cài đặt trình duyệt, rồi mới tới trong ứng dụng"],
            ["Điểm arcade chơi lúc mất mạng chưa lên", "Mở lại ứng dụng khi đã có mạng, chờ vài giây"],
            ["Ảnh tải lên bị lỗi", "Giảm ảnh xuống dưới 5MB, đổi HEIC sang JPG"],
            ["Mã QR JOY báo hết hạn", "Tạo mã mới — mã chỉ có hiệu lực trong thời gian ngắn"],
            ["Nút bấm không phản hồi", "Kiểm tra mạng; ứng dụng chờ máy chủ trả lời trước khi đổi trạng thái"],
          ],
        },
      ],
    },
    {
      id: "ho-tro",
      title: "Liên hệ hỗ trợ",
      blocks: [
        { type: "p", text: "Thử hết bảng trên mà vẫn chưa được thì báo cho tôi. Báo lỗi càng cụ thể càng sửa nhanh." },
        {
          type: "list",
          items: [
            `Email: ${email} — cách nhanh nhất.`,
            "Zalo: dùng nút liên hệ ở chân trang.",
            "Trong khu vực thành viên có mục gửi yêu cầu hỗ trợ, tiện hơn vì tự kèm thông tin thiết bị.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Bốn thứ nên gửi kèm",
          text: "Bạn đang ở màn hình nào, bạn bấm gì thì lỗi xảy ra, ảnh chụp màn hình, và tên trình duyệt cùng loại máy. Có bốn thứ này thì phần lớn lỗi tìm ra trong vài phút.",
        },
      ],
    },
  ];

  return (
    <DocsLayout
      eyebrow="Hướng dẫn"
      version="v4"
      title={t("userGuide.huongDanSuDung")}
      intro="Từng bước để đăng nhập, xem quyền truy cập, dựng Bio, dùng JOY, quản lý quyền thiết bị, đặt dịch vụ và thực hiện quyền dữ liệu."
      updatedAt={UPDATED_AT}
      sections={sections}
      footerNote={`Còn vướng ở đâu thì gửi email tới ${email}, kèm ảnh chụp màn hình và tên trình duyệt nếu được.`}
    />
  );
}
