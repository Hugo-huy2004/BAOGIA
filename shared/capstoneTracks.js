/**
 * Đề tài tốt nghiệp Study with Hugo.
 *
 * Chặng đồ án (bài 71–90) trước đây dạy đúng MỘT sản phẩm cho tất cả mọi người:
 * CRUD `/api/users`. Học xong ai cũng nộp một thứ giống nhau, và không ai phải
 * tự quyết định gì — mà quyết định thiết kế mới là thứ phân biệt người biết code
 * với người làm được sản phẩm.
 *
 * Ở đây bộ khung kỹ thuật vẫn dùng chung (mỗi bài 71–90 là một cột mốc chung),
 * còn ĐỀ TÀI thì mỗi người tự chọn. Mỗi đề tài mang theo:
 *
 *   - `entities`     — dữ liệu phải mô hình hoá, thay cho bảng `users` mẫu.
 *   - `milestones`   — bản dịch từng cột mốc chung sang đúng đề tài đó.
 *   - `extraLessons` — vài bài CHỈ đề tài này có, dạy phần khó riêng của nó.
 *   - `core`         — chức năng bắt buộc để được nghiệm thu.
 *   - `research`     — phần KHÔNG dạy thẳng trong 100 bài, phải tự tìm hiểu.
 *   - `aiFeature`    — chỗ bắt buộc dùng LLM, mỗi đề tài một kiểu khác nhau.
 *
 * Cách canh độ khó: `core` chỉ gồm thứ đã dạy — làm đủ là chắc chắn xong.
 * `research` là ba việc mà 100 bài KHÔNG dạy thẳng nhưng có đủ nền để tự đọc mà
 * làm (khoá lạc quan, xoá mềm kèm nhật ký, phân trang con trỏ…). Không có phần
 * này thì đồ án chỉ là chép lại bài mẫu; có quá nhiều thì thành đánh đố.
 *
 * File không phụ thuộc React/i18n để cả client và server đọc chung một bản.
 */

const track = ({ id, ...rest }) => Object.freeze({
  id,
  ...rest,
  entities: Object.freeze(rest.entities.map((entity) => Object.freeze(entity))),
  milestones: Object.freeze(rest.milestones),
  extraLessons: Object.freeze(rest.extraLessons.map((lesson) => Object.freeze(lesson))),
  core: Object.freeze(rest.core),
  research: Object.freeze(rest.research.map((item) => Object.freeze(item))),
  aiFeature: Object.freeze(rest.aiFeature),
});

export const CAPSTONE_TRACKS = Object.freeze([
  track({
    id: "library",
    title: "Thư viện sách",
    tagline: "Quản lý đầu sách, bản sao và lượt mượn trả",
    difficulty: "vừa",
    icon: "menu_book",
    summary:
      "Một đầu sách có nhiều bản sao; mượn là giữ một bản sao trong khoảng thời gian. Đề tài này rèn đúng chỗ người mới hay sai: phân biệt 'đầu sách' với 'bản sao', và không cho mượn cùng một bản sao hai lần.",
    entities: [
      { name: "Book", fields: "isbn, title, author, publishedYear, categoryId" },
      { name: "Copy", fields: "bookId, code, condition, status" },
      { name: "Member", fields: "email, fullName, joinedAt" },
      { name: "Loan", fields: "copyId, memberId, borrowedAt, dueAt, returnedAt" },
    ],
    milestones: {
      72: "CRUD cho Book và Copy. `GET /api/books` phân trang, lọc theo tác giả và thể loại.",
      73: "Đăng nhập thủ thư và bạn đọc — hai vai, hai quyền khác nhau.",
      78: "Trạng thái toàn cục giữ giỏ mượn đang chọn và bộ lọc danh mục.",
      83: "Chặn mượn quá số lượng cho phép và chặn mượn bản sao đang có người giữ.",
      85: "Tải ảnh bìa, tự thu nhỏ trước khi lưu.",
    },
    extraLessons: [
      {
        id: "library-1",
        title: "Mô hình đầu sách và bản sao (Work vs Item)",
        why: "Gộp hai khái niệm này vào một bảng là lỗi thiết kế phổ biến nhất của đề tài thư viện, và nó chỉ lộ ra khi hai người cùng muốn mượn 'cuốn đó'.",
      },
      {
        id: "library-2",
        title: "Xung đột thời gian: một bản sao, nhiều lượt mượn",
        why: "Kiểm tra chồng lấn khoảng thời gian bằng SQL, không phải bằng vòng lặp ở tầng ứng dụng.",
      },
    ],
    core: [
      "CRUD đầu sách, bản sao và bạn đọc, có phân trang và tìm kiếm",
      "Mượn — trả, chặn mượn bản sao đang có người giữ",
      "Danh sách sách quá hạn, tính theo ngày đến hạn",
      "Hai vai thủ thư / bạn đọc với quyền khác nhau",
    ],
    research: [
      {
        topic: "Khoá lạc quan (optimistic locking)",
        problem: "Hai thủ thư cùng bấm mượn một bản sao trong cùng một giây thì chuyện gì xảy ra?",
        hint: "Cột version hoặc updatedAt trong mệnh đề WHERE của lệnh UPDATE. Bài 12 đã dạy ACID, phần này là bước tiếp theo.",
      },
      {
        topic: "Xoá mềm kèm nhật ký",
        problem: "Xoá một đầu sách đang có lượt mượn trong lịch sử thì lịch sử đó còn đọc được không?",
        hint: "deletedAt + bảng audit, thay vì DELETE thật.",
      },
      {
        topic: "Tìm kiếm không dấu",
        problem: "Gõ 'nha gia kim' phải ra 'Nhà giả kim'.",
        hint: "Collation của MySQL, hoặc một cột chuẩn hoá được đánh chỉ mục.",
      },
    ],
    aiFeature: {
      title: "Gợi ý sách theo lịch sử mượn",
      spec: "Gửi cho LLM lịch sử mượn của bạn đọc và danh mục hiện có, bắt trả về JSON đúng schema (bài 64) gồm ba gợi ý kèm lý do. Phải xử lý được trường hợp mô hình trả về sách không có trong kho — lọc lại ở phía server, không tin đầu ra.",
    },
  }),

  track({
    id: "shop",
    title: "Cửa hàng trực tuyến",
    tagline: "Sản phẩm, giỏ hàng, đơn hàng và tồn kho",
    difficulty: "vừa",
    icon: "storefront",
    summary:
      "Đề tài kinh điển, và khó đúng ở chỗ ít ai ngờ: tiền và tồn kho. Giá phải chốt tại thời điểm đặt hàng, tồn kho phải trừ nguyên tử, và không bao giờ tính tiền bằng số thực.",
    entities: [
      { name: "Product", fields: "sku, name, priceCents, stock, categoryId" },
      { name: "Cart", fields: "memberId, items[], updatedAt" },
      { name: "Order", fields: "memberId, status, totalCents, placedAt" },
      { name: "OrderItem", fields: "orderId, productId, quantity, unitPriceCents" },
    ],
    milestones: {
      72: "CRUD sản phẩm và danh mục, lọc theo khoảng giá và tình trạng còn hàng.",
      73: "Đăng nhập khách hàng; giỏ hàng của khách vãng lai phải nhập được vào tài khoản sau khi đăng nhập.",
      78: "Giỏ hàng là trạng thái toàn cục, đồng bộ giữa các tab.",
      83: "Giới hạn tần suất đặt hàng, và kiểm tra lại giá ở phía server chứ không nhận giá từ client.",
      85: "Ảnh sản phẩm nhiều kích cỡ, tạo sẵn bản thu nhỏ khi tải lên.",
    },
    extraLessons: [
      {
        id: "shop-1",
        title: "Tiền trong cơ sở dữ liệu: số nguyên đơn vị nhỏ nhất",
        why: "0.1 + 0.2 !== 0.3. Lưu tiền bằng float là lỗi sẽ không lộ ra cho tới lúc đối soát.",
      },
      {
        id: "shop-2",
        title: "Trừ tồn kho nguyên tử và chống đặt trùng",
        why: "UPDATE ... WHERE stock >= ? trong một giao dịch, cộng khoá idempotency cho nút Đặt hàng.",
      },
    ],
    core: [
      "CRUD sản phẩm, danh mục, có phân trang và lọc",
      "Giỏ hàng thêm/sửa/xoá, tính tiền ở phía server",
      "Đặt hàng: trừ tồn kho, chốt giá tại thời điểm đặt",
      "Trang lịch sử đơn hàng của khách và trang quản trị đơn",
    ],
    research: [
      {
        topic: "Khoá idempotency",
        problem: "Khách bấm Đặt hàng hai lần vì mạng chậm — làm sao không sinh hai đơn?",
        hint: "Một khoá do client sinh, server lưu lại và trả về cùng kết quả cho lần gọi lặp.",
      },
      {
        topic: "Trừ tồn kho nguyên tử",
        problem: "Hai người cùng mua cái áo cuối cùng.",
        hint: "Điều kiện nằm trong chính câu UPDATE, không phải đọc-rồi-ghi.",
      },
      {
        topic: "Máy trạng thái đơn hàng",
        problem: "Đơn đã huỷ có được chuyển sang đã giao không?",
        hint: "Khai báo tường minh các bước chuyển hợp lệ, chặn ở tầng dịch vụ.",
      },
    ],
    aiFeature: {
      title: "Trợ lý mô tả sản phẩm",
      spec: "Người bán nhập vài gạch đầu dòng, LLM soạn mô tả và gợi ý thẻ danh mục, trả về JSON đúng schema. Phải có nút để người bán sửa lại trước khi lưu — không tự động đăng thẳng đầu ra của mô hình.",
    },
  }),

  track({
    id: "clinic",
    title: "Đặt lịch phòng khám",
    tagline: "Lịch bác sĩ, khung giờ và hồ sơ khám",
    difficulty: "khó",
    icon: "calendar_month",
    summary:
      "Đề tài nặng nhất về logic: thời gian. Khung giờ không được chồng nhau, múi giờ phải đúng, và huỷ muộn thì trả lại chỗ cho người khác. Chọn đề tài này nếu bạn muốn bị vặn về xử lý ngày giờ.",
    entities: [
      { name: "Doctor", fields: "fullName, specialty, workingHours" },
      { name: "Slot", fields: "doctorId, startsAt, endsAt, status" },
      { name: "Patient", fields: "email, fullName, birthDate" },
      { name: "Appointment", fields: "slotId, patientId, reason, status, createdAt" },
    ],
    milestones: {
      72: "CRUD bác sĩ, chuyên khoa và khung giờ. Danh sách khung giờ trống lọc theo ngày.",
      73: "Ba vai: bệnh nhân, bác sĩ, lễ tân.",
      78: "Trạng thái toàn cục giữ ngày đang xem và bác sĩ đang chọn.",
      84: "Khung giờ vừa bị người khác đặt phải biến mất khỏi màn hình đang mở, không cần tải lại.",
      89: "Kiểm thử tập trung vào biên: đặt trùng, huỷ sát giờ, đổi múi giờ.",
    },
    extraLessons: [
      {
        id: "clinic-1",
        title: "Lưu thời điểm bằng UTC, hiển thị theo múi giờ người xem",
        why: "Lưu 'giờ địa phương' là lỗi không thể sửa về sau khi dữ liệu đã tích lại.",
      },
      {
        id: "clinic-2",
        title: "Chống đặt trùng bằng ràng buộc của cơ sở dữ liệu",
        why: "Kiểm tra ở tầng ứng dụng luôn có khe hở giữa lúc đọc và lúc ghi; ràng buộc duy nhất thì không.",
      },
    ],
    core: [
      "CRUD bác sĩ, khung giờ, bệnh nhân",
      "Đặt lịch — huỷ lịch, chặn đặt trùng khung giờ",
      "Lịch làm việc theo tuần của từng bác sĩ",
      "Ba vai với quyền khác nhau",
    ],
    research: [
      {
        topic: "Ràng buộc duy nhất chống đặt trùng",
        problem: "Hai bệnh nhân cùng bấm đặt một khung giờ.",
        hint: "Chỉ mục duy nhất trên (slotId) khi trạng thái là đã đặt, và bắt lỗi trùng khoá thay vì kiểm tra trước.",
      },
      {
        topic: "Múi giờ và giờ mùa hè",
        problem: "Bệnh nhân ở nước ngoài đặt lịch, xem thấy giờ nào?",
        hint: "Lưu UTC, đổi khi hiển thị bằng Intl.DateTimeFormat.",
      },
      {
        topic: "Chính sách huỷ",
        problem: "Huỷ trước bao lâu thì được trả chỗ, và ai chịu phí?",
        hint: "Quy tắc nghiệp vụ tách khỏi tầng route, có kiểm thử riêng.",
      },
    ],
    aiFeature: {
      title: "Phân loại lý do khám",
      spec: "Bệnh nhân mô tả triệu chứng bằng lời thường, LLM gợi ý chuyên khoa phù hợp, trả JSON đúng schema. BẮT BUỘC kèm cảnh báo đây không phải chẩn đoán y khoa, và luôn có đường dẫn tới lễ tân là người thật.",
    },
  }),

  track({
    id: "community",
    title: "Cộng đồng học tập",
    tagline: "Bài đăng, bình luận và trò chuyện thời gian thực",
    difficulty: "vừa",
    icon: "forum",
    summary:
      "Đề tài nhiều tương tác nhất. Cái khó không nằm ở CRUD mà ở nội dung do người dùng nhập: hiển thị sao cho không dính XSS, và tải bình luận sao cho không sập khi một bài có nghìn phản hồi.",
    entities: [
      { name: "Post", fields: "authorId, title, body, tags[], createdAt" },
      { name: "Comment", fields: "postId, authorId, body, parentId, createdAt" },
      { name: "Reaction", fields: "targetType, targetId, memberId, kind" },
      { name: "Room", fields: "name, memberIds[], lastMessageAt" },
    ],
    milestones: {
      72: "CRUD bài đăng và bình luận, phân trang theo thời gian.",
      73: "Đăng nhập, và chỉ tác giả mới sửa/xoá được bài của mình.",
      77: "Tầng fetch tập trung phải xử lý được lỗi 403 khi sửa bài người khác.",
      84: "Phòng chat thời gian thực bằng WebSocket, có trạng thái đang gõ.",
      83: "Chống spam: giới hạn tần suất đăng bài theo tài khoản, không chỉ theo IP.",
    },
    extraLessons: [
      {
        id: "community-1",
        title: "Hiển thị nội dung người dùng nhập mà không dính XSS",
        why: "Bài 52 dạy nguyên lý; ở đây là thực hành với Markdown và danh sách thẻ cho phép.",
      },
      {
        id: "community-2",
        title: "Bình luận nhiều tầng: lưu phẳng, dựng cây khi đọc",
        why: "Truy vấn đệ quy trong SQL đắt; đường dẫn tổ tiên hoặc dựng cây ở tầng ứng dụng rẻ hơn nhiều.",
      },
    ],
    core: [
      "CRUD bài đăng, bình luận nhiều tầng, thả cảm xúc",
      "Chỉ tác giả sửa/xoá được nội dung của mình",
      "Chat thời gian thực trong phòng",
      "Tìm kiếm bài theo thẻ và từ khoá",
    ],
    research: [
      {
        topic: "Phân trang bằng con trỏ",
        problem: "Dùng OFFSET trên bảng bài đăng đang được thêm liên tục thì người đọc thấy trùng bài.",
        hint: "Con trỏ theo (createdAt, id) thay cho số trang. Bài 72 dạy OFFSET, đây là lý do phải bỏ nó.",
      },
      {
        topic: "Làm sạch HTML",
        problem: "Cho phép in đậm nhưng không cho phép thẻ script.",
        hint: "Danh sách thẻ cho phép ở phía server, không tin việc làm sạch ở client.",
      },
      {
        topic: "Đếm lượt thích không khoá bảng",
        problem: "Một bài viral, hàng nghìn lượt thích trong một phút.",
        hint: "Đếm gộp định kỳ, hoặc bảng đếm riêng.",
      },
    ],
    aiFeature: {
      title: "Kiểm duyệt nội dung tự động",
      spec: "Trước khi đăng, LLM chấm nội dung theo các mức an toàn, trả JSON đúng schema. Nội dung bị gắn cờ KHÔNG bị xoá tự động mà vào hàng chờ để người thật duyệt — quyết định cuối cùng luôn thuộc về con người.",
    },
  }),

  track({
    id: "inventory",
    title: "Kho và đơn nhập hàng",
    tagline: "Tồn kho, nhà cung cấp và báo cáo",
    difficulty: "khó",
    icon: "inventory_2",
    summary:
      "Đề tài thiên về dữ liệu và báo cáo. Điểm mấu chốt: tồn kho không phải một con số để sửa, mà là tổng của các phiếu nhập xuất — sổ cái, không phải ô nhập liệu.",
    entities: [
      { name: "Item", fields: "sku, name, unit, minStock" },
      { name: "Supplier", fields: "name, phone, email, address" },
      { name: "StockEntry", fields: "itemId, delta, reason, refId, createdAt" },
      { name: "PurchaseOrder", fields: "supplierId, status, lines[], placedAt" },
    ],
    milestones: {
      72: "CRUD mặt hàng và nhà cung cấp; tồn kho là truy vấn tổng hợp, không phải cột.",
      73: "Hai vai: thủ kho và quản lý.",
      78: "Trạng thái toàn cục giữ bộ lọc khoảng thời gian của báo cáo.",
      82: "Bảng vài nghìn dòng phải cuộn mượt — dựng ảo hoá danh sách.",
      68: "Bộ dữ liệu mẫu đủ lớn để thấy được vấn đề hiệu năng thật.",
    },
    extraLessons: [
      {
        id: "inventory-1",
        title: "Tồn kho kiểu sổ cái: chỉ ghi thêm, không sửa",
        why: "Sửa thẳng cột tồn kho là mất dấu vết. Ghi phiếu rồi cộng dồn thì luôn giải thích được vì sao ra con số đó.",
      },
      {
        id: "inventory-2",
        title: "Ảnh chụp tồn kho và tối ưu truy vấn báo cáo",
        why: "Cộng dồn từ đầu lịch sử sẽ chậm dần; ảnh chụp định kỳ là cách chuẩn để giữ tốc độ.",
      },
    ],
    core: [
      "CRUD mặt hàng, nhà cung cấp, phiếu nhập",
      "Nhập — xuất kho ghi thành phiếu, tồn kho tính từ phiếu",
      "Cảnh báo mặt hàng dưới mức tồn tối thiểu",
      "Báo cáo nhập xuất tồn theo khoảng thời gian, xuất ra CSV",
    ],
    research: [
      {
        topic: "Ảnh chụp tồn kho định kỳ",
        problem: "Cộng dồn 200.000 phiếu mỗi lần mở báo cáo thì bao lâu ra kết quả?",
        hint: "Chốt số dư theo tháng, chỉ cộng phần phát sinh sau mốc chốt.",
      },
      {
        topic: "Xuất CSV cho dữ liệu lớn",
        problem: "Xuất 100.000 dòng mà không làm sập bộ nhớ máy chủ.",
        hint: "Trả về theo luồng, không dựng cả chuỗi trong RAM.",
      },
      {
        topic: "Chỉ mục cho truy vấn khoảng thời gian",
        problem: "Lọc theo khoảng ngày chậm dần theo lượng dữ liệu.",
        hint: "Chỉ mục ghép và thứ tự cột trong đó. Bài 42 là điểm khởi đầu.",
      },
    ],
    aiFeature: {
      title: "Dự báo nhu cầu nhập hàng",
      spec: "Đưa lịch sử xuất kho cho LLM, yêu cầu trả JSON đúng schema gồm các mặt hàng nên nhập kèm số lượng và lý do. Phải hiển thị rõ đây là gợi ý thống kê, và luôn có số liệu thật đặt cạnh để người dùng đối chiếu.",
    },
  }),
]);

export const CAPSTONE_TRACK_IDS = Object.freeze(CAPSTONE_TRACKS.map((item) => item.id));

export const getCapstoneTrack = (trackId) =>
  CAPSTONE_TRACKS.find((item) => item.id === String(trackId || "")) || null;

/** Chặng đồ án bắt đầu ở bài 71 — chọn đề tài trước mốc đó thì không có ý nghĩa. */
export const CAPSTONE_PICK_LESSON = 71;

/**
 * Yêu cầu nghiệm thu, dựng từ phần chung cộng phần riêng của đề tài.
 *
 * Phần chung là những gì 100 bài đã dạy và bài nào cũng phải có; phần riêng lấy
 * từ chính đề tài. Gộp ở đây để trang nộp bài, trang chấm của admin và bảng
 * kiểm của học viên không mỗi nơi liệt kê một kiểu.
 */
export const CAPSTONE_SHARED_REQUIREMENTS = Object.freeze([
  "Backend có kiến trúc tách tầng: route — controller — service — repository (bài 71)",
  "Đủ 5 thao tác CRUD với mã trạng thái đúng ngữ nghĩa và phân trang (bài 72)",
  "Xác thực JWT, mật khẩu băm bằng bcrypt, có phân quyền theo vai (bài 33, 73)",
  "Frontend định tuyến phía client, có route được bảo vệ (bài 76)",
  "Tầng gọi API tập trung, xử lý lỗi toàn cục (bài 77)",
  "Mọi truy vấn tham số hoá; có chống XSS, CSRF và giới hạn tần suất (bài 52, 53, 83)",
  "Giao diện dùng được trên điện thoại, đạt ngưỡng Core Web Vitals (bài 39, 80)",
  "Một tính năng dùng LLM, đầu ra ép về JSON đúng schema (bài 64)",
  "Có kiểm thử đơn vị cho tầng nghiệp vụ và một luồng kiểm thử đầu-cuối (bài 89)",
  "Deploy chạy thật, có tên miền và HTTPS (bài 95, 99)",
  "README ghi rõ cách chạy, biến môi trường và sơ đồ cơ sở dữ liệu (bài 69)",
]);

export function getCapstoneSpec(trackId) {
  const found = getCapstoneTrack(trackId);
  if (!found) return null;
  return {
    track: found,
    shared: CAPSTONE_SHARED_REQUIREMENTS,
    core: found.core,
    research: found.research,
    aiFeature: found.aiFeature,
    // Đủ chung + đủ riêng + một hạng mục tự tìm hiểu. Bắt cả ba hạng mục
    // `research` là quá tay cho một đồ án tốt nghiệp; bỏ hẳn thì đồ án chỉ còn
    // là chép lại bài mẫu.
    minResearchItems: 1,
  };
}
