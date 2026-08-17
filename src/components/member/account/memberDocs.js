import { MembershipFactory } from "../../../models/membershipTier.js";
import {
  DAILY_CASUAL_JOY, JOY_INCOME_SOURCES, dailyCeiling,
  FEATURE_PRICES, ownFromMonthly, STUDY_STAGES, STUDY_ALL_STAGES_PRICE,
  HUGOSO_PRICES, HUGOSO_BUNDLE_PRICE, BIO_THEME_RENTAL_PRICE,
  EXCHANGE_TAX_RATE, TRANSFER_DAILY_CAP, TRANSFER_FEE_RATE, OWN_DISCOUNT, OWN_EQUIV_MONTHS,
} from "../../../../shared/joyPrices.js";
import {
  JOY_DENOMS, DENOM_OPTIONS, CROSS_DENOM_FEE, formatDenom,
} from "../../../../shared/joyCurrency.js";
import { joyText } from "../../../lib/joyDisplay";
import {
  JOYLATER, creditLimit, loanTotal, expectedDays,
} from "../../../../shared/joyLater.js";

/**
 * Bộ tài liệu pháp lý đọc ngay trong tài khoản. Viết dưới dạng văn bản như
 * trang chính sách (cùng bộ block của
 * `DocsLayout`), không phải carousel thẻ — người ta vào đây để TRA, không để
 * vuốt.
 *
 * Bảng đặc quyền dựng thẳng từ `MembershipFactory`, nên sửa mốc giới thiệu hay
 * quyền lợi trong model là văn bản đổi theo. Không chép tay con số nào.
 */

const CONTACT_EMAIL = "contact@hugowishpax.studio";

export function privilegeSections() {
  const tiers = MembershipFactory.getAllTiers();

  return [
    {
      id: "cach-len-hang",
      title: "Hạng thẻ được tính thế nào",
      blocks: [
        {
          type: "p",
          text: "Hạng thẻ thành viên phụ thuộc vào số người bạn đã giới thiệu thành công bằng mã của mình. Người được giới thiệu phải tạo tài khoản thật và nhập mã của bạn thì mới được tính. Hạng tự lên ngay khi đủ số người, không cần yêu cầu.",
        },
        {
          // Hai cột thôi: cột "Mô tả" cũ chỉ chép lại đúng con số ở cột giữa
          // ("5 người" → "Dành cho thành viên đã giới thiệu 5 người mới"), mà
          // lại là thứ làm bảng rộng quá màn hình điện thoại.
          type: "table",
          head: ["Hạng thẻ", "Điều kiện"],
          rows: tiers.map((tier) => [
            tier.name,
            tier.minReferrals === 0 ? "Mặc định khi tạo tài khoản" : `Giới thiệu ${tier.minReferrals} người`,
          ]),
        },
        {
          type: "note",
          tone: "info",
          title: "Hạng thẻ khác với hạng Star",
          text: "Hạng thẻ (MemberShip → Premium) đến từ việc giới thiệu bạn bè. Hạng Star (Star-14, Star-18, Star-VIP) đến từ độ tuổi và quyết định quà sinh nhật — xem tài liệu Quyền và nghĩa vụ thành viên.",
        },
      ],
    },
    ...tiers.map((tier) => ({
      id: `hang-${tier.id}`,
      title: `Hạng ${tier.name}`,
      blocks: [
        {
          type: "p",
          text:
            tier.minReferrals === 0
              ? "Mọi tài khoản đều bắt đầu ở hạng này ngay sau khi đăng ký."
              : `Mở khoá khi bạn đã giới thiệu ${tier.minReferrals} người.`,
        },
        {
          type: "list",
          items: tier.privileges.map((p) => (p.detail ? `${p.title} — ${p.detail}` : p.title)),
        },
      ],
    })),
    {
      id: "nhan-dac-quyen",
      title: "Nhận đặc quyền bằng cách nào",
      blocks: [
        {
          type: "steps",
          items: [
            "Chia sẻ mã giới thiệu của bạn (nằm ngay trên thẻ thành viên trong tài khoản).",
            "Người mới đăng ký và nhập mã của bạn ở phần “Mã người giới thiệu”.",
            "Số người giới thiệu tăng, hạng thẻ tự cập nhật.",
            "Voucher và JOY kèm theo hạng được cấp vào ví; xem lại bất cứ lúc nào ở mục “Ưu đãi của tôi”.",
          ],
        },
        {
          type: "note",
          tone: "warn",
          title: "Mã giới thiệu chỉ áp dụng một lần",
          text: "Mỗi tài khoản chỉ nhập được một mã người giới thiệu, và chỉ trong lần đầu. Tự tạo tài khoản phụ để nhập mã của chính mình là gian lận và sẽ bị thu hồi toàn bộ JOY, đặc quyền liên quan.",
        },
      ],
    },
    {
      id: "bao-ve-dac-quyen",
      title: "Đặc quyền của bạn được bảo vệ ra sao",
      blocks: [
        {
          type: "list",
          items: [
            "Đặc quyền đã được cấp hợp lệ được ghi nhận trong tài khoản và bạn có quyền xem lại trạng thái, thời hạn, điều kiện sử dụng trước khi dùng.",
            "Nếu Hugo Studio thay đổi cơ cấu hạng, thay đổi chỉ áp dụng cho tương lai. Quyền lợi đã cấp và còn hạn được tiếp tục sử dụng theo điều kiện tại thời điểm cấp, trừ khi quyền lợi phát sinh do lỗi hệ thống, gian lận hoặc pháp luật yêu cầu xử lý khác.",
            "Nếu một quyền lợi không thể cung cấp vì tính năng đã ngừng, Hugo Studio có thể thay bằng quyền lợi có giá trị sử dụng tương đương trong hệ sinh thái. Thành viên sẽ được thông báo trước khi thay thế.",
            "Bạn có quyền yêu cầu kiểm tra khi hạng, số lượt giới thiệu, voucher hoặc JOY hiển thị không đúng. Lịch sử hệ thống là căn cứ đối soát chính; bằng chứng hợp lệ do bạn cung cấp cũng được xem xét.",
            "Việc không dùng hết quyền lợi trong thời hạn không tự tạo thành khoản tiền phải hoàn, vì JOY, voucher và thời gian trải nghiệm là lợi ích nội bộ, không phải tiền gửi hay tài sản đầu tư.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Bạn luôn được biết trước điều kiện",
          text: "Mỗi voucher hoặc quyền lợi có điều kiện riêng về thời hạn, phạm vi và số lần dùng. Điều kiện hiển thị trong tài khoản tại thời điểm cấp là phần áp dụng cho quyền lợi đó; nếu có mâu thuẫn, cách hiểu có lợi hơn cho thành viên được ưu tiên trong phạm vi pháp luật cho phép.",
        },
      ],
    },
  ];
}

export function conditionSections() {
  return [
    {
      id: "quyen-thanh-vien",
      title: "Quyền của thành viên",
      blocks: [
        {
          type: "list",
          items: [
            "Được biết rõ tính năng nào miễn phí, tính năng nào cần xác minh, hạng thành viên, độ tuổi, JOY hoặc khoản thanh toán trước khi lựa chọn sử dụng.",
            "Được dùng các tính năng đang mở cho nhóm tài khoản của mình một cách bình đẳng; không bị giảm quyền chỉ vì không Donate, không mua dịch vụ hoặc không đồng ý với quyền thiết bị không cần thiết.",
            "Được sở hữu nội dung do mình tạo và quyết định nội dung nào công khai trên Bio, nội dung nào chỉ lưu trong tài khoản, theo giới hạn kỹ thuật của từng tính năng.",
            "Được xem, sửa, yêu cầu cung cấp, xoá hoặc hạn chế xử lý dữ liệu cá nhân; rút lại sự đồng ý; phản đối hoạt động xử lý; khiếu nại và yêu cầu bồi thường theo pháp luật.",
            "Được nhận lý do khi tài khoản hoặc quyền truy cập bị hạn chế, trừ phần thông tin phải giữ kín để bảo vệ hệ thống, người khác hoặc phục vụ yêu cầu của cơ quan có thẩm quyền.",
            "Được yêu cầu hỗ trợ, đối soát quyền lợi và phản hồi quyết định khoá, thu hồi JOY hoặc từ chối yêu cầu.",
            "Được ngừng sử dụng, xoá nội dung và yêu cầu xoá tài khoản bất cứ lúc nào, với điều kiện chấp nhận những phần dữ liệu không thể khôi phục sau khi xoá.",
          ],
        },
      ],
    },
    {
      id: "do-tuoi",
      title: "Độ tuổi",
      blocks: [
        {
          type: "list",
          items: [
            "Khu vực thành viên chỉ dành cho người từ đủ 14 tuổi. Người dưới 14 tuổi vẫn có thể xem trang công khai nhưng không được tạo hoặc sử dụng tài khoản thành viên.",
            "Từ đủ 14 đến dưới 16 tuổi: Hugo Studio yêu cầu cha mẹ hoặc người giám hộ đọc Chính sách bảo mật và đồng ý trước khi tài khoản tiếp tục xử lý dữ liệu. Hệ thống ghi nhận thời điểm xác nhận, nhưng không yêu cầu tải giấy tờ tuỳ thân chỉ để chứng minh tuổi.",
            "Từ đủ 16 đến dưới 18 tuổi: được dùng các tính năng thành viên thông thường; tính năng 18+, giao dịch hoặc thoả thuận cần năng lực hành vi đầy đủ vẫn bị giới hạn và có thể cần người đại diện theo pháp luật tham gia.",
            "Từ đủ 18 tuổi: có thể mở nhóm tính năng dành cho người trưởng thành sau khi khai đủ ngày sinh và đáp ứng các điều kiện riêng của tính năng.",
            "Nếu phát hiện tài khoản dưới 14 tuổi hoặc không có xác nhận cần thiết, Hugo Studio tạm ngừng xử lý, xác minh tình trạng và xoá hoặc hạn chế dữ liệu theo pháp luật; phụ huynh có thể liên hệ để yêu cầu xử lý sớm.",
          ],
        },
        { type: "age-card" },
      ],
    },
    {
      id: "nghia-vu-thanh-vien",
      title: "Nghĩa vụ của thành viên",
      blocks: [
        {
          type: "list",
          items: [
            "Cung cấp thông tin thuộc các trường bắt buộc một cách trung thực, đặc biệt là ngày sinh, email và tình trạng xác minh; không mạo danh hoặc dùng tài khoản của người khác.",
            "Tự bảo vệ tài khoản Google, thiết bị, mã PIN JOY, mã QR và phiên đăng nhập; báo sớm khi nghi ngờ bị chiếm quyền để hệ thống có thể hạn chế thiệt hại.",
            "Tôn trọng quyền riêng tư, danh dự, quyền tác giả và dữ liệu cá nhân của người khác; chỉ đăng nội dung mà mình có quyền sử dụng.",
            "Dùng hệ thống đúng hướng dẫn; không khai thác lỗi, tự động hoá trái phép, can thiệp kỹ thuật, tạo giao dịch giả hoặc né cổng độ tuổi và phân quyền.",
            "Kiểm tra thông tin do AI, công cụ sức khoẻ, bản tin hoặc bên thứ ba cung cấp trước khi dựa vào đó cho quyết định quan trọng.",
            "Thanh toán đúng phần công việc đã xác nhận nếu mua dịch vụ; cung cấp phản hồi, tài liệu đầu vào và phê duyệt đúng mốc đã thống nhất để dự án không bị chậm vì thiếu thông tin.",
            "Chịu trách nhiệm đối với nội dung mình công khai, quyết định mình đưa ra và thiệt hại do vi phạm điều khoản hoặc pháp luật gây cho Hugo Studio hay người khác.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Trách nhiệm đi cùng khả năng kiểm soát",
          text: "Thành viên chỉ chịu trách nhiệm đối với hành vi, nội dung và thiết bị nằm trong khả năng kiểm soát hợp lý của mình; không bị quy trách nhiệm cho sự cố hoàn toàn do hệ thống hoặc nhà cung cấp của Hugo Studio gây ra.",
        },
      ],
    },
    {
      id: "hang-star",
      title: "Hạng Star và quà sinh nhật",
      blocks: [
        {
          type: "p",
          text: "Hạng Star suy ra từ ngày sinh mỗi lần đọc, không lưu cố định — Star-14 tự thành Star-18 đúng ngày sinh nhật thứ 18 của bạn. Hạng này quyết định phần quà trong tháng sinh nhật.",
        },
        {
          // Ba cột với câu dài thì trên điện thoại thành ba dải chữ dựng đứng —
          // danh sách đọc thẳng hàng hơn.
          type: "list",
          items: [
            "Star-14 (từ đủ 14 đến dưới 18 tuổi): +15 ngày duy trì tài khoản.",
            "Star-18 (từ đủ 18 tuổi): +30 ngày duy trì, kèm voucher giảm 15% cho landing page và website nhiều trang.",
            "Star-VIP (thành viên danh dự do Hugo Studio trao): +90 ngày duy trì, kèm voucher 15% web tĩnh và voucher 10% dynamic web app.",
          ],
        },
        {
          type: "list",
          items: [
            "Quà chỉ mở trong đúng tháng sinh nhật và mỗi năm một lần, đi kèm một lượt quay may mắn.",
            "Phải khai đủ ngày, tháng, năm sinh thì mới nhận được quà — thiếu năm sinh là hệ thống coi như chưa biết tuổi.",
            "Voucher dịch vụ có hạn 30 ngày kể từ lúc phát, mỗi mã dùng một lần, đưa mã khi trao đổi dự án.",
          ],
        },
      ],
    },
    {
      id: "tai-khoan",
      title: "Giữ tài khoản hoạt động",
      blocks: [
        {
          type: "list",
          items: [
            "Một người dùng một tài khoản chính. Tài khoản phụ nhằm gian lận giới thiệu, JOY, thành tích hoặc quyền lợi có thể bị hợp nhất quyền lợi, thu hồi hoặc khoá.",
            "Tài khoản có hạn duy trì; hết hạn thì trang Bio có thể tạm ngừng hiển thị công khai. Dữ liệu không bị xoá ngay chỉ vì hết hạn, và bạn vẫn có thể gia hạn bằng quyền lợi hợp lệ hoặc lựa chọn đang được cung cấp.",
            "Một số tính năng học tập dành riêng cho học sinh — sinh viên yêu cầu xác minh. Chưa xác minh không làm mất các quyền thành viên cơ bản không phụ thuộc tình trạng học tập.",
            "Ngày sinh đã khai được khoá để bảo vệ cổng tuổi. Nếu khai nhầm, bạn có quyền yêu cầu sửa sau khi Hugo Studio xác minh hợp lý nhằm tránh người khác lạm dụng thay đổi tuổi.",
          ],
        },
      ],
    },
    {
      id: "joy",
      title: "Quy tắc với điểm JOY",
      blocks: [
        {
          type: "list",
          items: [
            "JOY là điểm thưởng nội bộ, không phải tiền tệ và không quy đổi ngược ra tiền mặt.",
            "JOY đến từ nhiệm vụ, điểm danh, trò chơi, giới thiệu bạn bè và quà hệ thống; mọi lần cộng trừ đều ghi lại trong lịch sử ví.",
            "Tạo JOY, thành tích hoặc giao dịch bằng cách gian lận, khai thác lỗi hoặc dùng công cụ tự động là căn cứ để thu hồi và khoá tài khoản.",
            "Chuyển JOY cho người khác cần mã PIN giao dịch sáu số; đặt PIN ngay trong ví.",
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Tài liệu đầy đủ",
          text: `Phần này tóm tắt cho thành viên. Văn bản ràng buộc là Điều khoản sử dụng và Chính sách bảo mật trên trang công khai. Thắc mắc gửi về ${CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      id: "khieu-nai",
      title: "Yêu cầu hỗ trợ và khiếu nại",
      blocks: [
        {
          type: "steps",
          items: [
            `Gửi yêu cầu từ email đang gắn với tài khoản tới ${CONTACT_EMAIL}; nêu rõ tính năng, thời điểm, kết quả mong muốn và bằng chứng nếu có.`,
            "Hugo Studio xác nhận đã nhận yêu cầu trong thời hạn hợp lý; yêu cầu về dữ liệu cá nhân được phản hồi ban đầu trong 02 ngày làm việc theo quy định hiện hành.",
            "Nếu cần thêm thông tin để xác minh chủ tài khoản hoặc làm rõ sự việc, thời gian xử lý tính từ khi nhận đủ thông tin hợp lệ.",
            "Nếu không đồng ý với kết quả, bạn có thể yêu cầu xem xét lại một lần và vẫn giữ quyền khiếu nại, tố cáo, khởi kiện hoặc yêu cầu cơ quan có thẩm quyền hỗ trợ theo pháp luật.",
          ],
        },
      ],
    },
  ];
}

export function rightsAccessSections() {
  return [
    {
      id: "nguyen-tac-truy-cap",
      title: "Nguyên tắc cấp quyền truy cập",
      blocks: [
        {
          type: "p",
          text: "Hugo Studio áp dụng quyền truy cập theo mức cần thiết: bạn được mở đầy đủ phần phù hợp với tuổi, tình trạng xác minh, hạng thành viên và quyền lợi đang có; dữ liệu riêng tư chỉ hiện cho đúng chủ tài khoản hoặc người được pháp luật cho phép.",
        },
        {
          type: "table",
          head: ["Nhóm truy cập", "Bạn được dùng", "Điều kiện chính"],
          rows: [
            ["Khách công khai", "Trang giới thiệu, dịch vụ, hướng dẫn, điều khoản và Bio được chủ tài khoản công khai", "Không cần đăng nhập"],
            ["Thành viên cơ bản", "Tài khoản, Bio, JOY và tiện ích đang mở cho cộng đồng", "Từ đủ 14 tuổi, hồ sơ bắt buộc hợp lệ"],
            ["Thành viên HSSV đã xác minh", "Các tiện ích và ưu đãi dành riêng cho người học", "Tình trạng xác minh còn hợp lệ"],
            ["Hạng thẻ hoặc quyền lợi", "Voucher, thời gian trải nghiệm, vật phẩm và tính năng ghi trên quyền lợi", "Đủ hạng, còn hạn, chưa dùng hết lượt"],
            ["Tính năng 18+", "Tính năng có nội dung, giao dịch hoặc rủi ro chỉ phù hợp người trưởng thành", "Đủ 18 tuổi và đáp ứng điều kiện riêng"],
            ["Quản trị hệ thống", "Công cụ vận hành, chống gian lận và hỗ trợ", "Chỉ người được phân quyền; mọi thao tác quan trọng được kiểm soát ở server"],
          ],
        },
      ],
    },
    {
      id: "quyen-thiet-bi",
      title: "Quyền trên thiết bị do bạn quyết định",
      blocks: [
        {
          type: "table",
          head: ["Quyền", "Chỉ dùng khi", "Nếu bạn từ chối"],
          rows: [
            ["Thông báo", "Bạn chủ động bật để nhận nhắc lịch và cập nhật", "Tài khoản vẫn dùng bình thường; chỉ không có thông báo đẩy"],
            ["Vị trí", "Bạn bật thời tiết, tính năng địa điểm hoặc bảo vệ đăng nhập theo vị trí", "Tính năng liên quan không hoạt động hoặc dùng dữ liệu mặc định"],
            ["Camera", "Bạn chọn quét mã QR hoặc tải ảnh trực tiếp", "Có thể nhập/chọn tệp bằng cách khác nếu tính năng hỗ trợ"],
            ["Microphone", "Bạn chủ động chọn tính năng nhập âm thanh có hỗ trợ", "Tiếp tục dùng nhập văn bản"],
            ["Sinh trắc học", "Thiết bị xác nhận đăng nhập nhanh bằng passkey", "Vẫn đăng nhập bằng Google; Hugo Studio không nhận mẫu vân tay hay khuôn mặt"],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "Không đánh đổi quyền cơ bản để lấy quyền thiết bị",
          text: "Từ chối một quyền tuỳ chọn chỉ làm tắt tính năng cần đúng quyền đó. Hugo Studio không hạ hạng thành viên, trừ JOY hoặc chặn các chức năng độc lập khác chỉ vì bạn không cấp quyền thiết bị.",
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
            "Thiết kế, vận hành, thử nghiệm, bảo trì, thay đổi hoặc ngừng một tính năng để bảo đảm an toàn, phù hợp pháp luật, chi phí vận hành và định hướng sản phẩm.",
            "Xác minh danh tính, độ tuổi, tình trạng HSSV, giao dịch, lượt giới thiệu và quyền sở hữu nội dung khi có dấu hiệu bất thường hoặc khi quyền lợi phụ thuộc vào thông tin đó.",
            "Từ chối, ẩn hoặc gỡ nội dung; giới hạn tần suất; tạm giữ giao dịch; điều chỉnh JOY, thành tích hoặc quyền lợi phát sinh do lỗi, hoàn tiền, lạm dụng hay gian lận.",
            "Tạm khoá hoặc chấm dứt quyền truy cập khi cần ngăn thiệt hại, bảo vệ người dùng, bảo vệ hệ thống, thực hiện yêu cầu pháp luật hoặc xử lý vi phạm nghiêm trọng/lặp lại.",
            "Sử dụng nhà cung cấp hạ tầng và bên xử lý dữ liệu phù hợp để vận hành dịch vụ, trong phạm vi đã công bố tại Chính sách bảo mật và theo thoả thuận bảo vệ dữ liệu áp dụng.",
            "Bảo vệ quyền sở hữu trí tuệ, bí mật kỹ thuật, uy tín và quyền lợi hợp pháp của Hugo Studio trước hành vi xâm phạm.",
          ],
        },
      ],
    },
    {
      id: "nghia-vu-hugo-studio",
      title: "Nghĩa vụ và cam kết của Hugo Studio",
      blocks: [
        {
          type: "list",
          items: [
            "Cung cấp thông tin rõ ràng về tính năng, giá, điều kiện hưởng quyền lợi, giới hạn quan trọng và cách xử lý dữ liệu trước khi người dùng đưa ra lựa chọn.",
            "Tôn trọng quyền đối với dữ liệu cá nhân; tạo cơ chế để xem, sửa, yêu cầu cung cấp, xoá, hạn chế, phản đối hoặc rút lại sự đồng ý theo pháp luật.",
            "Áp dụng biện pháp quản lý và kỹ thuật phù hợp với quy mô, tính chất dữ liệu và rủi ro; phân quyền truy cập; xử lý sự cố và thông báo cho cơ quan/người bị ảnh hưởng khi pháp luật yêu cầu.",
            "Không bán dữ liệu cá nhân, không buộc cấp quyền thiết bị không cần thiết và không dùng nội dung riêng tư của thành viên để huấn luyện mô hình AI riêng của Hugo Studio.",
            "Ghi nhận đúng JOY, hạng và quyền lợi theo quy tắc công bố; tiếp nhận đối soát và sửa sai khi có đủ căn cứ.",
            "Thực hiện đúng phạm vi, giá, mốc bàn giao và cơ chế xử lý đã thoả thuận đối với dịch vụ trả phí; áp dụng quyền bắt buộc của người tiêu dùng kể cả khi điều khoản này không ghi hết.",
            "Thông báo thay đổi quan trọng có ảnh hưởng bất lợi trước khi áp dụng khi có thể; không hồi tố để tước quyền lợi đã phát sinh hợp lệ, trừ trường hợp pháp luật, an toàn hoặc gian lận đòi hỏi.",
            "Đưa ra lý do và kênh phản hồi đối với quyết định hạn chế tài khoản, trừ thông tin có thể làm lộ biện pháp bảo mật, xâm phạm người khác hoặc bị pháp luật hạn chế cung cấp.",
          ],
        },
      ],
    },
    {
      id: "tam-ngung-khieu-nai",
      title: "Tạm ngưng, khôi phục và phản hồi quyết định",
      blocks: [
        {
          type: "steps",
          items: [
            "Trong tình huống khẩn cấp, Hugo Studio có thể chặn trước để ngăn thiệt hại rồi mới xác minh. Biện pháp ưu tiên là biện pháp hẹp nhất đủ để xử lý rủi ro.",
            "Khi có thể thông báo, thành viên nhận được nhóm lý do, phạm vi bị hạn chế, thời hạn dự kiến hoặc việc cần làm để được xem xét khôi phục.",
            `Thành viên gửi phản hồi từ email tài khoản tới ${CONTACT_EMAIL}; nêu lý do và bằng chứng cho rằng quyết định chưa chính xác.`,
            "Hugo Studio xem xét lại dựa trên nhật ký hệ thống, bằng chứng hai bên và mức độ rủi ro. Quyền truy cập được khôi phục hoặc thu hẹp biện pháp khi căn cứ hạn chế không còn.",
          ],
        },
      ],
    },
    {
      id: "ranh-gioi-trach-nhiem",
      title: "Ranh giới trách nhiệm",
      blocks: [
        {
          type: "list",
          items: [
            "Các tính năng cộng đồng miễn phí được cung cấp theo khả năng vận hành thực tế, không phải dịch vụ có cam kết thời gian hoạt động liên tục hoặc kết quả học tập, sức khoẻ, nghề nghiệp hay thu nhập.",
            "Hugo Studio chịu trách nhiệm đối với phần hệ thống và hành vi nằm trong khả năng kiểm soát hợp lý của mình; nhà cung cấp thứ ba chịu trách nhiệm đối với tài khoản, hạ tầng và giao dịch do họ trực tiếp kiểm soát.",
            "Trong phạm vi pháp luật cho phép, Hugo Studio không chịu thiệt hại gián tiếp, lợi nhuận kỳ vọng, cơ hội bị mất hoặc hậu quả do người dùng bỏ qua cảnh báo, dùng sai hướng dẫn, cung cấp dữ liệu sai hay dựa vào nội dung AI cho quyết định quan trọng.",
            "Với dịch vụ trả phí, biện pháp khắc phục ưu tiên là sửa lỗi, thực hiện lại phần chưa đạt hoặc hoàn phần giá trị chưa được cung cấp theo thoả thuận và pháp luật.",
            "Không nội dung nào trong tài liệu này loại trừ trách nhiệm bắt buộc về bảo vệ dữ liệu cá nhân, quyền lợi người tiêu dùng, lỗi cố ý, lỗi nghiêm trọng hoặc nghĩa vụ khác mà pháp luật không cho phép loại trừ.",
          ],
        },
      ],
    },
  ];
}

// ── Bảng biểu JOY và quy chế ───────────────────────────────────────
// Ưu tiên BẢNG: mỗi ô là một cụm ngắn, dịch sang ngôn ngữ khác không phải viết
// lại cả đoạn văn. Mọi con số dựng từ `shared/joyPrices.js` — sửa giá trong bảng
// đó là tài liệu tự đổi theo, không chép tay một số nào.
// Mọi con số tiền trong tài liệu viết theo ĐƠN VỊ CỦA TÀI KHOẢN đang đọc —
// bảng giá trong tài liệu và giá ngoài màn hình không được lệch cách viết.
const joy = (n) => joyText(n);
const days = (n) => `≈ ${(n / DAILY_CASUAL_JOY).toFixed(1)} ngày`;

const INCOME_LABELS = {
  checkin:   "Điểm danh hằng ngày",
  arcade:    "Chơi game ở Trò Chơi",
  focus:     "Tập trung sâu (3 giờ)",
  ecoCaro:   "Cờ caro chế độ tiết kiệm",
  therapy:   "Trò chuyện trị liệu (60 phút)",
  challenge: "Hoàn thành 5 thử thách ngày",
};

const APP_LABELS = {
  hugoProfile: "Hồ sơ công bố",
  hugoAura:    "Tập Trung — tập trung sâu & âm thanh",
  hugoRadio:   "Âm Thanh — tin tức & nhạc",
  hugoChess:   "Cờ Vua",
  hugoArcade:  "Trò Chơi — trọn bộ game",
};

const STAGE_LABELS = {
  basic:        "Chặng 1 — Phản xạ cơ bản",
  intermediate: "Chặng 2 — Tư duy kiến trúc",
  advanced:     "Chặng 3 — Giải thuật & mật mã",
  security:     "Chặng 4 — Bảo mật & tiền đề AI",
  project:      "Chặng 5 — Đồ án full-stack",
  devops:       "Chặng 6 — DevOps & phát hành",
};

const HUGOSO_LABELS = {
  calendar: "Google Calendar",
  docs:     "Google Docs",
  sheets:   "Google Sheets",
  gemini:   "Google Gemini",
};

export function joyRulesSections() {
  const partsSum = STUDY_STAGES.reduce((sum, stage) => sum + stage.lifetime, 0);
  const hugosoSum = Object.values(HUGOSO_PRICES).reduce((a, b) => a + b, 0);

  return [
    {
      id: "joy-la-gi",
      title: "JOY là gì",
      blocks: [
        {
          type: "p",
          text: "JOY là điểm thưởng nội bộ của Hugo Studio. Bạn nhận JOY khi dùng ứng dụng và dùng JOY để thuê hoặc mua vĩnh viễn các ứng dụng, khoá học, giao diện. JOY không phải tiền tệ và không quy đổi ngược ra tiền mặt.",
        },
        {
          type: "note",
          tone: "info",
          title: "Giá được neo theo thu nhập một ngày",
          text: `Mọi mức giá dưới đây quy ra "mấy ngày chơi thường". Một ngày chơi thường (khoảng 20 phút) cho ${joy(DAILY_CASUAL_JOY)}, nên thuê một tháng ứng dụng nhỏ chỉ tốn khoảng một ngày chơi.`,
        },
      ],
    },
    {
      id: "bang-thu-nhap",
      title: "Bảng 1 — Kiếm JOY mỗi ngày",
      blocks: [
        {
          type: "table",
          head: ["Nguồn", "Tối đa mỗi ngày", "Dành cho"],
          rows: JOY_INCOME_SOURCES.map((source) => [
            INCOME_LABELS[source.id],
            joy(source.max),
            source.vietnameseOnly ? "Người dùng tiếng Việt" : "Mọi thành viên",
          ]),
        },
        {
          type: "note",
          tone: "info",
          title: "Hai mức trần khác nhau",
          text: `Làm hết mọi việc trong ngày: tối đa ${joy(dailyCeiling(true))}. Hai nguồn cuối nằm trong ứng dụng Tâm Trí — ứng dụng này chỉ phục vụ người dùng tiếng Việt, nên ở ngôn ngữ khác trần một ngày là ${joy(dailyCeiling(false))}.`,
        },
      ],
    },
    {
      id: "bang-thue-app",
      title: "Bảng 2 — Thuê tháng và mua vĩnh viễn",
      blocks: [
        {
          type: "table",
          head: ["Ứng dụng", "Thuê 1 tháng", "Mua vĩnh viễn", "Quy ra ngày chơi"],
          rows: Object.entries(APP_LABELS).map(([key, label]) => [
            label,
            joy(FEATURE_PRICES[key]),
            joy(ownFromMonthly(FEATURE_PRICES[key])),
            days(ownFromMonthly(FEATURE_PRICES[key])),
          ]),
        },
        {
          type: "p",
          text: `Giá mua vĩnh viễn tính bằng ${OWN_EQUIV_MONTHS} tháng thuê rồi giảm ${Math.round(OWN_DISCOUNT * 100)}%. Nghĩa là thuê khoảng tám tháng mới bằng tiền mua trọn đời, nên thuê phù hợp khi bạn chỉ cần dùng ngắn hạn.`,
        },
      ],
    },
    {
      id: "bang-khoa-hoc",
      title: "Bảng 3 — Khoá học sáu chặng",
      blocks: [
        {
          type: "table",
          head: ["Chặng", "Thuê 1 tháng", "Mua vĩnh viễn"],
          rows: STUDY_STAGES.map((stage) => [
            STAGE_LABELS[stage.tier],
            joy(FEATURE_PRICES[stage.monthlyKey]),
            joy(stage.lifetime),
          ]),
        },
        {
          type: "note",
          tone: "info",
          title: "Chặng sau đắt hơn chặng trước",
          text: "Giá tăng dần theo độ khó. Muốn mở chặng sau thì phải học xong bài cuối của chặng trước — điều kiện này ghi trong màn mở khoá của từng chặng.",
        },
      ],
    },
    {
      id: "bang-tron-goi",
      title: "Bảng 4 — Gói trọn bộ",
      blocks: [
        {
          type: "table",
          head: ["Gói", "Mua lẻ từng phần", "Giá trọn bộ", "Tiết kiệm"],
          rows: [
            ["Trọn khoá 6 chặng", joy(partsSum), joy(STUDY_ALL_STAGES_PRICE), `${Math.round((1 - STUDY_ALL_STAGES_PRICE / partsSum) * 100)}%`],
            ["Trọn bộ 4 công cụ Google", joy(hugosoSum), joy(HUGOSO_BUNDLE_PRICE), `${Math.round((1 - HUGOSO_BUNDLE_PRICE / hugosoSum) * 100)}%`],
          ],
        },
        {
          type: "table",
          head: ["Công cụ lẻ", "Giá"],
          rows: [
            ...Object.entries(HUGOSO_LABELS).map(([key, label]) => [label, joy(HUGOSO_PRICES[key])]),
            ["Giao diện Bio (thuê)", joy(BIO_THEME_RENTAL_PRICE)],
          ],
        },
      ],
    },
    {
      id: "bang-phi",
      title: "Bảng 5 — Phí và giới hạn",
      blocks: [
        {
          type: "table",
          head: ["Mục", "Mức"],
          rows: [
            ["Phí giao dịch khi trao đổi JOY", `${Math.round(EXCHANGE_TAX_RATE * 100)}% giá món, làm tròn xuống`],
            ["Phí sáng tạo khi gửi JOY", `${Math.round(TRANSFER_FEE_RATE * 100)}% số gửi, người gửi trả`],
            ["Phí đổi đơn vị khi gửi khác đơn vị", `${Math.round(CROSS_DENOM_FEE * 100)}% số gửi, người gửi trả`],
            ["Trần chuyển JOY cho người khác", `${joy(TRANSFER_DAILY_CAP)} mỗi ngày`],
            ["Mã PIN giao dịch", "6 chữ số, đặt trong ví"],
            ["Trần nhận JOY từ game", `${joy(150)} mỗi ngày`],
            ["Trần nhận JOY từ tập trung", `${joy(150)} mỗi ngày`],
          ],
        },
        {
          type: "p",
          text: "Phí giao dịch được hiện tách dòng ngay trên màn xác nhận trước khi bạn đồng ý. Ba dòng phí nhỏ luôn cộng đúng bằng tổng phí — không có khoản nào ẩn.",
        },
      ],
    },
    {
      id: "bang-don-vi",
      title: "Bảng 6 — Đơn vị JOY",
      blocks: [
        {
          type: "p",
          text: `JOY chỉ có MỘT giá trị. Mỗi đơn vị là một cách viết số cho quen mắt: ${joy(1000)} của người dùng ${JOY_DENOMS.vi.code} và ${joy(1000)} của người dùng ${JOY_DENOMS.ja.code} mua được đúng những thứ như nhau, vì mọi giá trong bảng trên đều tính bằng JOY.`,
        },
        {
          type: "table",
          head: ["Đơn vị", "Tên đơn vị", `${joy(1000)} viết thành`],
          rows: DENOM_OPTIONS.map((denom) => [
            denom.code,
            denom.name,
            formatDenom(1000, denom.key, "vi-VN"),
          ]),
        },
        {
          type: "note",
          tone: "warning",
          title: "Chọn một lần, giữ cố định",
          text: `Bạn chọn đơn vị ở lần đăng nhập đầu tiên và đơn vị đó gắn với tài khoản. Đổi ngôn ngữ giao diện KHÔNG đổi đơn vị. Lý do: gửi JOY cho người dùng đơn vị khác phải trả thêm ${Math.round(CROSS_DENOM_FEE * 100)}% phí đổi đơn vị — nếu ai cũng đổi đơn vị được tuỳ ý thì chỉ cần đổi cho khớp người nhận trước khi gửi là né hết phí.`,
        },
        {
          type: "p",
          text: "Phí đổi đơn vị được cộng thêm vào phần người gửi trả — người nhận luôn nhận đủ số JOY đã gửi. Hai người cùng đơn vị thì không có phí này. Tiếng Tây Ban Nha và tiếng Pháp cùng dùng JOYve nên gửi qua lại giữa hai bên cũng không tính là đổi đơn vị.",
        },
      ],
    },
    {
      id: "joylater",
      title: "Bảng 7 — JOYlater: mở trước, hoàn lại dần",
      blocks: [
        {
          type: "p",
          text: "JOYlater cho bạn mở khoá món mình muốn ngay hôm nay và hoàn lại dần bằng JOY kiếm được sau đó. Không có lãi chồng lãi. Hoàn một lần thì không có hạn chót; chia đợt thì mỗi đợt có ngày riêng và trễ ngày sẽ bị cộng thêm một lần.",
        },
        {
          type: "table",
          head: ["Khoản", "Mức"],
          rows: [
            ["Mức tối đa", `${JOYLATER.limitDays} lần JOY bạn kiếm mỗi ngày (trung vị ${JOYLATER.incomeWindowDays} ngày), tối đa ${joy(JOYLATER.hardCap)}`],
            ["Phần cộng thêm", `${Math.round(JOYLATER.feeRate * 100)}% số mở trước nếu hoàn một lần, cộng thêm ${Math.round(JOYLATER.installmentFeeStep * 100)} điểm cho mỗi đợt chia thêm (tối đa ${JOYLATER.maxInstallments} đợt) — chốt MỘT LẦN lúc mở, không đổi về sau`],
            ["Cách hoàn", `tự giữ lại ${Math.round(JOYLATER.garnishRate * 100)}% mỗi lần bạn nhận JOY`],
            ["Ngày hoàn", `hoàn một lần thì không có hạn chót; chia đợt thì mỗi đợt có ngày riêng, chia đều số ngày dự kiến và chốt lúc mở`],
            ["Trễ ngày", `quá hạn một đợt cộng ${Math.round(JOYLATER.latePenaltyRate * 100)}% CỦA ĐỢT ĐÓ, đúng một lần dù trễ bao lâu — không cộng lặp, không lãi chồng lãi`],
            ["Hoàn sớm", "hoàn một lần: bất cứ lúc nào, không cộng thêm gì. Chia đợt: cửa hoàn chỉ mở đúng ngày tới hạn"],
            ["Điều kiện", `đủ 18 tuổi · ví đã mở ≥ ${JOYLATER.minAccountDays} ngày · từng kiếm ≥ ${joy(JOYLATER.minLifetimeEarned)} · không còn lượt nào chưa hoàn xong`],
            ["Khi chưa hoàn xong", "không mở trước thêm và không chuyển JOY cho người khác"],
          ],
        },
        {
          type: "table",
          head: ["JOY kiếm mỗi ngày", "Mở trước tối đa", "Hoàn xong sau"],
          rows: [415, 800, 1185].map((income) => [
            `${joy(income)} mỗi ngày`,
            joy(creditLimit(income)),
            `${expectedDays(loanTotal(creditLimit(income)).total, income)} ngày`,
          ]),
        },
        {
          type: "note",
          tone: "info",
          title: "Vì sao thời gian hoàn gần như bằng nhau",
          text: `Mức tối đa tính theo JOY chính bạn kiếm được, nên người kiếm nhiều mở trước được nhiều hơn nhưng cũng hoàn xong nhanh hơn. Không ai kéo dài quá khoảng hai tuần.`,
        },
        {
          type: "steps",
          items: [
            "JOYlater chỉ là JOY trong hệ thống. JOY không mua được bằng tiền và không đổi ra tiền được, nên đây không phải và không bao giờ trở thành một khoản tiền thật; cũng không bao giờ được chuyển sang bên thứ ba.",
            "Số ứng cộng thẳng vào ví; bạn dùng JOY đó để mở khoá như bình thường. Món đã mở vẫn là của bạn trong lúc còn nợ.",
            "Mỗi lần bạn nhận JOY, hệ thống tự trừ một phần cho nợ và ghi rõ trong lịch sử ví. Phần còn lại vẫn vào ví bạn để tiếp tục dùng.",
            "Chỉ dùng để mở khoá tính năng trong hệ thống. Không dùng JOYlater để chuyển JOY cho người khác.",
            "Hoàn chậm không bao giờ mất món đã mở và không bị đòi bằng bất cứ cách nào — chỉ là không mở trước thêm và không chuyển JOY được cho tới khi hoàn xong. Nếu đang chia đợt thì đợt trễ bị cộng thêm một lần như bảng trên.",
            "Dùng nhiều tài khoản để ứng nhiều lần là gian lận, xử lý theo quy chế JOY ở trên.",
          ],
        },
      ],
    },
    {
      id: "quy-che-joy",
      title: "Quy chế sử dụng JOY",
      blocks: [
        {
          type: "steps",
          items: [
            "JOY chỉ có giá trị trong hệ sinh thái Hugo Studio, không phải tiền tệ, không quy đổi ra tiền mặt và không chuyển nhượng ra ngoài hệ thống.",
            "Mọi lần cộng hoặc trừ JOY đều được ghi vào lịch sử ví, kèm lý do và thời điểm. Bạn tra lại được bất cứ lúc nào trong phần Ví.",
            "Trần nhận JOY mỗi ngày tính theo từng nguồn, đặt lại vào 00:00 giờ Việt Nam.",
            "Chuyển JOY cho người khác cần mã PIN sáu số và không vượt trần ngày. Giao dịch đã hoàn tất thì không hoàn lại được.",
            "Đã thanh toán bằng JOY cho một tháng thuê hoặc một lần mua vĩnh viễn thì không hoàn JOY, trừ trường hợp lỗi hệ thống khiến bạn không dùng được tính năng đã trả.",
            "Tạo JOY hoặc thành tích bằng gian lận, khai thác lỗi, dùng công cụ tự động hay nhiều tài khoản là căn cứ để thu hồi JOY và khoá tài khoản.",
            "Quyền đã mua vĩnh viễn không bị mất khi giá thay đổi. Giá mới chỉ áp cho lần thuê hoặc lần mua kế tiếp.",
            `Khi Hugo Studio điều chỉnh bảng giá, mức giá mới hiện ngay trong tài liệu này. Thắc mắc gửi về ${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
  ];
}

export const MEMBER_DOCS = {
  "joy-rules": {
    id: "joy-rules",
    title: "Bảng biểu JOY và quy chế",
    intro: "Kiếm JOY thế nào, mỗi thứ giá bao nhiêu, phí và giới hạn — toàn bộ dưới dạng bảng.",
    sections: joyRulesSections,
  },
  privileges: {
    id: "privileges",
    title: "Đặc quyền thành viên",
    intro: "Hạng thẻ được tính ra sao, mỗi hạng có gì, và cách mở khoá hạng tiếp theo.",
    sections: privilegeSections,
  },
  conditions: {
    id: "conditions",
    title: "Quyền và nghĩa vụ thành viên",
    intro: "Quyền lợi cốt lõi, điều kiện độ tuổi, nghĩa vụ sử dụng an toàn, hạng Star và quy tắc với JOY.",
    sections: conditionSections,
  },
  "rights-access": {
    id: "rights-access",
    title: "Quyền và truy cập",
    intro: "Phạm vi truy cập của từng nhóm tài khoản, quyền thiết bị, trách nhiệm hai bên và cách phản hồi quyết định hạn chế.",
    sections: rightsAccessSections,
  },
};
