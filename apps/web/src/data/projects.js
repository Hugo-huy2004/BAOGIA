/**
 * Nguồn DUY NHẤT của mục "Dự án": khối nổi bật ở /introduction, trang
 * /project và từng trang /project/:slug đều đọc từ đây. Thêm dự án = thêm một
 * phần tử, không sửa trang nào cả.
 *
 * Ảnh nằm ở `public/project-screenshots/<id>/*.webp` — chụp thật từ site đang
 * chạy, đã nén WebP 1600px. Chụp lại thì ghi đè đúng tên tệp, đừng đổi tên.
 *
 * `featured: true` chọn dự án lên khối ba thẻ ở /introduction (WorkStory).
 * Khối đó dựng cho đúng ba thẻ và trang chỉ lấy ba dự án đầu mang cờ này.
 *
 * `repo` là địa chỉ mã nguồn mở, hiện thành liên kết thứ hai ở trang chi tiết.
 *
 * `cover` chọn tấm ảnh làm bìa trên trang /project; bỏ trống thì lấy tấm đầu
 * trong `shots`.
 *
 * `startedAt` ("YYYY-MM") là MỐC XẾP DÒNG THỜI GIAN của trang /project —
 * triển lãm chạy từ dự án đầu tiên tới nay, nên dự án mới chỉ cần ghi đúng mốc
 * này là tự vào đúng chỗ. Nó không hiển thị; chữ hiển thị vẫn là `period`.
 *
 * `kind` là MÃ ("personal" | "client" | "live") chứ không phải chữ hiển thị —
 * nhãn nằm ở `projectsPage.kinds.*` trong i18n. `period` giữ nguyên con số;
 * `{now}` được thay bằng chữ "nay" theo ngôn ngữ đang chọn. Tagline và vai trò
 * cũng nằm trong i18n (`projectsPage.items.<id>`), ở đây chỉ còn bản tiếng Việt
 * làm nguồn đối chiếu.
 */

export const projects = [
  {
    id: "hugo-studio",
    title: "Hugo Studio",
    cover: "cover",
    tagline: "Một cổng vào duy nhất, cài về máy như một ứng dụng.",
    kind: "personal",
    startedAt: "2026-04",
    period: "04/2026 – {now}",
    role: "Product owner · Thiết kế & lập trình toàn phần · Vận hành",
    url: "https://www.hugowishpax.studio",
    urlLabel: "hugowishpax.studio",
    stack: ["React", "Vite", "Tailwind", "Node.js", "MongoDB", "WebSocket", "PWA", "Capacitor"],
    techNote:
      "Trình duyệt viết bằng React với Vite và Tailwind. Máy chủ là Node.js với MongoDB, thêm WebSocket cho ví điểm và thông báo tức thời. Capacitor đóng gói khi cần một bản chạy như ứng dụng gốc. Không dựng trên nền tảng có sẵn nào — chọn như vậy vì mọi thứ dùng chung một lớp định danh, mà lớp đó phải do mình kiểm soát.",
    // KHÔNG đếm số app / game ở đây: con số đổi theo tháng, viết vào là sai ngay
    // lần ra mắt sau. Nói về cách hệ thống được dựng, không nói về kích thước.
    summary:
      "Mọi chuyện bắt đầu từ một câu hỏi phiền phức: vì sao mỗi công cụ mình cần lại bắt lập một tài khoản mới? Hugo Studio là câu trả lời — một cổng vào, một lần đăng nhập, cài thẳng về máy như một ứng dụng.",
    highlights: [
      {
        title: "Khởi đầu từ chỗ bực mình",
        body:
          "Những công cụ đầu tiên viết ra là vì tự mình cần trước: một chỗ ghi việc, một chỗ học, một chỗ nghỉ tay. Càng viết càng thấy cái phiền không nằm ở từng công cụ, mà ở khoảng trống giữa chúng — mỗi cái một tài khoản, một cách đăng nhập, một nơi lưu dữ liệu.",
      },
      {
        title: "Nên phải có một cái khung",
        body:
          "Thay vì làm thêm sản phẩm rời, phần được dựng trước là cái khung: một lớp định danh, một ví điểm, một kênh thông báo thời gian thực, một bộ vỏ giao diện dùng chung. Từ đó trở đi, thêm một ứng dụng mới là thêm nội dung vào khung, không phải dựng lại từ móng.",
      },
      {
        title: "Cài về máy, không qua chợ ứng dụng",
        body:
          "Cái khung ấy chạy dưới dạng PWA: mở toàn màn hình, có biểu tượng trên màn hình chính, nhận thông báo đẩy, và vẫn dùng được khi mạng chập chờn. Một bản sửa lỗi đến tay người dùng trong vài phút, không phải chờ ai duyệt.",
      },
      {
        title: "Và tự trực đêm",
        body:
          "Một lần vượt hạn mức nhà cung cấp hoá ra đến từ một vòng lặp gọi API mỗi mười giây. Giãn xuống năm phút, rồi chia lại kiến trúc theo đúng cách tính phí của từng nền tảng. Tự làm thì tự chịu, và đó là phần dạy nhiều nhất.",
      },
    ],
    closing:
      "Hệ thống vẫn lớn lên mỗi tuần. Phần đáng kể nhất không phải thứ nhìn thấy trên màn hình, mà là cái khung bên dưới — thứ khiến ứng dụng thứ mười tốn ít công hơn ứng dụng thứ nhất.",
    shots: [
      { src: "apps", caption: "Lưới ứng dụng — Một cổng vào duy nhất cho toàn bộ hệ sinh thái." },
      { src: "tasks", caption: "Nhiệm vụ hàng ngày — Nuôi dưỡng Hạt mầm và tích điểm JOYlu." },
      { src: "arcade", caption: "Hugo Arcade — Trung tâm trò chơi tích hợp." },
      { src: "assault", caption: "Biên đội Boss 3D — Trò chơi hành động không gian trực tiếp trên web." },
      { src: "2048", caption: "2048 Mega — Minigame với giao diện tối giản, hiện đại." },
    ],
    featured: true,
  },
  {
    id: "chanh-toa",
    title: "Xứ Đoàn Chánh Tòa Mỹ Tho",
    tagline: "Cổng thông tin giáo xứ: tra giờ lễ 27 giáo phận, Kinh Thánh trọn bộ, vấn đáp đức tin.",
    kind: "live",
    startedAt: "2026-08",
    period: "08/2026 – {now}",
    role: "Thiết kế & lập trình toàn phần",
    url: "https://chanhtoa.tnttgiaophanmytho.online",
    urlLabel: "chanhtoa.tnttgiaophanmytho.online",
    repo: "https://github.com/HuynhDutruong/FAQ",
    stack: ["Next.js", "React", "TypeScript", "Tailwind", "Node.js", "Firebase", "Firestore", "Graph API Facebook", "Sharp"],
    techNote:
      "Next.js với React và TypeScript, giao diện dựng bằng Tailwind, phần máy chủ chạy trên Node.js, dữ liệu nằm ở Firebase và Firestore, ảnh xử lý bằng Sharp. Bài viết lấy từ fanpage giáo xứ qua Graph API của Facebook. Chọn kết xuất phía máy chủ vì phần lớn nội dung là thứ Google cần đọc được: giờ lễ, từng chương Kinh Thánh, từng câu hỏi đức tin.",
    summary:
      "Giờ lễ là thứ thay đổi liên tục mà không ai báo. Đi xa một chút, muốn dự lễ, người ta phải hỏi quanh. Trang này ra đời để câu hỏi ấy có một chỗ trả lời.",
    highlights: [
      {
        title: "Câu hỏi thường gặp nhất",
        body:
          "Bật định vị là thấy nhà thờ gần nhất và lễ kế tiếp còn bao lâu, với dữ liệu phủ 27 giáo phận. Vì giờ lễ đổi luôn, chính giáo dân sửa được ngay tại thẻ đó — thông tin sống được là nhờ người dùng, không nhờ một lần nhập liệu.",
      },
      {
        title: "Rồi tới những câu ngại hỏi",
        body:
          "Sau giờ lễ là những thắc mắc người ta ngại hỏi trực tiếp: bí tích, luân lý, hôn nhân. Mỗi câu có một lời đáp ngắn để đọc lướt, và một bản dài kèm nguồn giáo lý cho người muốn đi tới cùng.",
      },
      {
        title: "Trọn bộ Lời Chúa, chia theo chương",
        body:
          "Cựu Ước và Tân Ước đầy đủ, mỗi sách một tranh minh hoạ, mỗi chương một địa chỉ riêng để gửi thẳng cho người khác. Phần kinh nguyện đếm lượt đọc và giữ chuỗi ngày — thứ giữ thói quen bền hơn mọi lời nhắc.",
      },
      {
        title: "Nối thẳng với fanpage của giáo xứ",
        body:
          "Giáo xứ vốn đăng tin trên trang Facebook của mình, và không ai muốn đăng lại lần thứ hai. Máy chủ gọi Graph API của Facebook theo lịch, lấy bài mới cùng ảnh, nén lại bằng Sharp rồi lưu vào Firestore — đăng trên fanpage một lần là tin xuất hiện ở cả hai nơi. Khoá truy cập nằm lại trên máy chủ, chặn thêm bằng Firestore rules, và không bao giờ đi xuống trình duyệt; mọi yêu cầu ghi đều phải kèm định danh quản trị viên.",
      },
    ],
    closing:
      "Trang đang chạy thật, giáo dân mở mỗi ngày. Với một cổng thông tin giáo xứ, thành công không phải lượt truy cập, mà là không còn ai phải gọi điện hỏi mấy giờ có lễ.",
    shots: [
      { src: "home", caption: "Trang chủ — Lời Chúa hôm nay, lịch phụng vụ, bài viết của xứ đoàn." },
      { src: "gio-le", caption: "Tra cứu giờ lễ toàn quốc, đếm ngược tới lễ kế tiếp." },
      { src: "kinh-thanh", caption: "Kinh Thánh trọn bộ 73 cuốn, mỗi sách một bức tranh." },
      { src: "van-dap", caption: "Vấn đáp giáo lý — 32 câu chia theo 7 chủ đề." },
      { src: "kinh-nguyen", caption: "Kinh nguyện cốt lõi, có đếm lượt và chuỗi ngày." },
      { src: "gioi-thieu", caption: "Giới thiệu — lịch sử giáo xứ kể thành bốn chương." },
    ],
    featured: true,
  },
  {
    id: "hwj",
    title: "HWJ — Atelier Heritage",
    tagline: "Nền tảng trang sức cao cấp, định giá bám giá vàng – bạc thời gian thực.",
    kind: "personal",
    startedAt: "2026-01",
    period: "01–04/2026",
    role: "Thiết kế & lập trình toàn phần",
    url: "https://hwj-demo.hugowishpax.studio",
    urlLabel: "hwj-demo.hugowishpax.studio",
    repo: "https://github.com/Hugo-huy2004/HWJ_demo",
    stack: ["React", "Tailwind", "JavaScript", "Node.js", "MongoDB", "Cloudinary", "Google OAuth", "API giá kim loại"],
    techNote:
      "Làm toàn phần: React và Tailwind ở phía trình duyệt; phía máy chủ dùng Node.js với MongoDB cho tài khoản, lịch hẹn tư vấn và giỏ hàng; ảnh sản phẩm để trên Cloudinary; đăng nhập qua Google OAuth; giá bán lấy từ API giá kim loại nên bám theo giá vàng – bạc thời gian thực.",
    summary:
      "Một món trang sức đắt hơn chiếc xe máy. Giao diện bán nó trông như thế nào? Câu trả lời ở đây là một tờ tạp chí — chữ serif cỡ lớn, nhiều khoảng trắng, và không một nút “MUA NGAY” nào.",
    highlights: [
      {
        title: "Bắt đầu bằng một nghi ngờ",
        body:
          "Lưới thẻ sản phẩm, nhãn giảm giá, nút đỏ — bộ công cụ quen thuộc của thương mại điện tử được dựng cho hàng hoá mua nhanh. Đặt nó cạnh một món cần cân nhắc hàng tháng trời, nó tự phản lại chính món hàng.",
      },
      {
        title: "Nên trang được dựng như một ấn phẩm",
        body:
          "Tiêu đề serif rất lớn, lưới rộng, tông kem và vàng cổ. Sản phẩm không nằm trong lưới thẻ mà nằm trong một bài viết có chương mục, đi đúng nhịp đọc của tập gấp nhà đấu giá.",
      },
      {
        title: "Từ vựng thay cho nút bấm",
        body:
          "“Acquisition Consultation” thay cho “Thêm vào giỏ”. “Registry no.” thay cho mã sản phẩm. Ở phân khúc này, chữ nghĩa định vị món hàng nhiều hơn màu sắc, và một lời mời ngồi xuống nói chuyện thì đúng chỗ hơn một lệnh mua.",
      },
      {
        title: "Nhưng giá thì không được phép đẹp suông",
        body:
          "Giá vàng và bạc lấy thẳng từ API thị trường, hiện thành bảng bán ra – mua lại theo chỉ. Phía sau trang giấy là phần máy chủ lo tài khoản, lịch hẹn tư vấn và giỏ hàng — đủ để một cuộc hỏi mua đi hết quãng đường của nó.",
      },
    ],
    closing:
      "Đây là dự án tự đặt đề bài cho mình, và bài học lớn nhất nằm ở chỗ ít ai gọi là kỹ thuật: ở phân khúc cao, tiết chế bán được nhiều hơn thúc giục.",
    shots: [
      { src: "home", caption: "Trang chủ — \"The Art of Preservation\"." },
      { src: "collections", caption: "Bộ sưu tập, bày theo nhịp một bài tạp chí." },
      { src: "valuation", caption: "Bảng định giá vàng – bạc, cập nhật theo thị trường." },
      { src: "product", caption: "Trang một món — thông số, chất liệu và giá suy từ giá kim loại." },
      { src: "heritage", caption: "Dòng thời gian nhà xưởng, kể theo chương." },
      { src: "appointment", caption: "Đặt lịch tư vấn sở hữu, thay cho nút mua ngay." },
    ],
    featured: true,
  },
  {
    id: "minh-oi-media",
    title: "Mình Ơi Media",
    tagline: "Website studio phóng sự cưới — bảng giá, portfolio và luồng liên hệ.",
    kind: "client",
    startedAt: "2026-03",
    period: "03–04/2026",
    role: "Thiết kế & lập trình toàn phần",
    url: "https://minhoimedia.digital",
    urlLabel: "minhoimedia.digital",
    repo: "https://github.com/Hugo-huy2004/job_01_MinhOi_Media_studio",
    stack: ["HTML", "CSS", "JavaScript", "Responsive"],
    techNote:
      "HTML, CSS và JavaScript thuần, không khung nào cả. Một trang giới thiệu năm gói dịch vụ không cần đến React; bỏ khung đi thì trang nhẹ, mở nhanh trên mạng 4G, và khách hàng tự sửa được chữ trong tệp mà không cần gọi cho ai.",
    summary:
      "Khách chọn studio cưới bằng cách mở ba trang cùng lúc. Trang nào bắt nhắn tin mới nói giá, trang đó bị đóng trước. Toàn bộ thiết kế ở đây đi ra từ một quan sát đó.",
    highlights: [
      {
        title: "Khách hỏi giá trước khi hỏi tên",
        body:
          "Ngành cưới quen giấu giá để ép khách liên hệ. Ở đây năm gói dịch vụ nằm ngay trên đường đi, mỗi gói liệt kê đủ thứ khách nhận được — người đọc tự loại mình ra hoặc tự thấy mình hợp, trước khi ai phải trả lời tin nhắn nào.",
      },
      {
        title: "Ảnh nói trước, chữ nói sau",
        body:
          "Màn hình đầu tiên là một tấm ảnh cưới khổ lớn, không phải khẩu hiệu. Với một studio, tấm ảnh đầu tiên chính là toàn bộ phần chứng minh năng lực; mọi câu chữ đứng sau đó chỉ làm nhiệm vụ giải thích.",
      },
      {
        title: "Màn hình dọc là mặc định",
        body:
          "Gần như ai cũng xem trang này trên điện thoại, trong lúc nhắn tin cho nhau chọn studio. Bảng giá vì thế xếp lại thành một cột, không có bảng ngang nào bắt kéo qua kéo lại.",
      },
      {
        title: "Và không cần đến một khung nào",
        body:
          "HTML, CSS, JavaScript thuần. Một trang giới thiệu năm gói không cần React; bỏ khung đi thì trang nhẹ, mở nhanh trên 4G, và chính chủ studio sửa được chữ trong tệp mà không phải gọi cho ai.",
      },
    ],
    closing:
      "Dự án làm trực tiếp với khách, từ buổi trao đổi yêu cầu tới lúc bàn giao. Thứ khách giữ lại được sau đó là một trang họ tự chăm được.",
    shots: [
      { src: "home", caption: "Trang chủ — ảnh khổ lớn dẫn trước, thương hiệu đè lên." },
      { src: "bang-gia", caption: "Bảng giá năm gói, liệt kê rõ thứ khách nhận được." },
      { src: "goi-dich-vu", caption: "Từng gói liệt kê đủ thứ khách nhận được." },
    ],
    featured: false,
  },
  {
    id: "l3go-coffee",
    title: "L3GO Coffee",
    tagline: "Website quán cà phê — thực đơn 68 món, chọn theo tâm trạng.",
    kind: "personal",
    startedAt: "2026-05",
    period: "2026",
    role: "Thiết kế UI/UX",
    stack: ["React", "Tailwind", "Responsive"],
    techNote:
      "React và Tailwind. Phần mình đảm nhận là giao diện và trải nghiệm: hệ thống màu, nhịp chữ, luồng xem thực đơn và cách ảnh không gian được cắt. Phần dựng dữ liệu và triển khai do Jason Phan lo.",
    // Làm cùng Jason Phan: mình phụ trách UI/UX, phần backend không thuộc mình.
    partner: "Jason Phan",
    url: "https://legocoffee.hwagfu.dev",
    urlLabel: "legocoffee.hwagfu.dev",
    summary:
      "Một quán ba tầng ở Cần Thơ, cầu thang xoắn và tường gạch kính màu. Người ta chọn quán bằng chỗ ngồi chứ không bằng vị cà phê — nên trang web phải cho thấy không gian trước khi khách quyết định đi.",
    highlights: [
      {
        title: "Không gian mới là sản phẩm",
        body:
          "Ảnh cầu thang xoắn, tường gạch kính và mặt lưới đèn đêm được để khổ lớn, không băm nhỏ thành thư viện ảnh. Người đọc cần cảm được chỗ ngồi của mình ở đâu trước khi quan tâm quán bán gì.",
      },
      {
        title: "Thực đơn dài, nhưng không ai đọc hết",
        body:
          "Sáu mươi tám món, và không ai đọc hết một bảng cà phê – trà – đá xay. Bộ lọc vì thế xếp theo cảm giác người ta đang muốn: cần tỉnh, muốn dịu lòng, ngồi lâu với bạn. Chọn theo tâm trạng nhanh hơn chọn theo danh mục.",
      },
      {
        title: "Phần mình làm, phần bạn ấy làm",
        body:
          "Dự án làm cùng Jason Phan. Phần mình đảm nhận là UI/UX: hệ thống màu, nhịp chữ, luồng xem thực đơn và cách cắt ảnh không gian. Phần dựng dữ liệu và triển khai thuộc về bạn ấy — ranh giới rõ từ đầu nên không ai giẫm chân ai.",
      },
    ],
    closing:
      "Một dự án ngắn, nhưng là lần thấy rõ nhất rằng phần khó của thực đơn không phải bày món, mà là giúp người ta thôi phân vân.",
    note:
      "Bài viết chi tiết về dự án nằm trong thư viện của Jason Phan: hwagfu.dev/en/library/projects/l3go-coffee",
    shots: [
      { src: "home", caption: "Trang chủ — \"Món đúng mood. Gốc đúng gu.\"" },
      { src: "thuc-don", caption: "Thực đơn lọc theo tâm trạng, không theo danh mục." },
      { src: "khong-gian", caption: "Trang không gian — quán ba tầng, cầu thang xoắn." },
    ],
    featured: false,
  },
  {
    id: "m-hike",
    title: "M-Hike",
    cover: "cover",
    tagline: "Ứng dụng đi bộ đường dài cho iOS và Android: đi được cả khi mất sóng.",
    kind: "personal",
    startedAt: "2026-06",
    period: "06–09/2026",
    role: "Thiết kế & lập trình toàn phần",
    url: "https://hiking.hugowishpax.studio",
    urlLabel: "hiking.hugowishpax.studio",
    repo: "https://github.com/Hugo-huy2004/Hiking_App",
    note: "Đây là ứng dụng di động cho iOS và Android; đường dẫn ở trên là bản chạy thử trên trình duyệt để xem nhanh, không cần cài.",
    stack: ["React Native", "Expo", "TypeScript", "SQLite", "Firebase", "Java", "Android", "Leaflet", "Open-Meteo"],
    techNote:
      "Hai bản, cùng một sản phẩm. Bản đa nền tảng viết bằng React Native trên Expo với TypeScript, điều hướng theo tệp bằng Expo Router, bản đồ Leaflet và thời tiết từ Open-Meteo. Bản Android thuần viết bằng Java với SQLiteOpenHelper và giao diện XML. Cả hai dùng SQLite làm kho chính và Firebase Realtime Database để đồng bộ khi có mạng.",
    summary:
      "Giữa rừng thì điện thoại mất sóng, mà đó lại đúng lúc cần tới nó nhất. M-Hike được dựng quanh một điều kiện duy nhất: mọi thứ phải chạy được khi không có mạng, và tự đồng bộ khi mạng quay lại.",
    highlights: [
      {
        title: "Ngoài vùng phủ sóng vẫn dùng được",
        body:
          "SQLite trên máy là kho dữ liệu chính, không phải bộ nhớ đệm: tạo chuyến, ghi chép, xem lại đều không cần mạng. Firebase Realtime Database chỉ là lớp đồng bộ chạy nền, để mở máy khác lên vẫn thấy đúng chuyến ấy.",
      },
      {
        title: "Ghi lại thứ nhìn thấy, ngay tại chỗ",
        body:
          "Mỗi chuyến đi có nhật ký riêng: gặp con gì, đường ra sao, trời thế nào, kèm ảnh và đánh giá. Ghi chép gắn chặt vào chuyến — xoá chuyến thì ghi chép đi theo, không để lại dữ liệu mồ côi trong máy.",
      },
      {
        title: "Đường đi tự vẽ lại",
        body:
          "GPS ghi lại quãng đường, nhịp bước và độ cao, rồi phát lại thành một hành trình chia theo pha: khởi động, giữ nhịp, nửa đường, nước rút, kết thúc. Kế hoạch tập luyện sinh ra từ chỉ số cơ thể theo khuyến nghị của WHO, và trong ứng dụng có ghi rõ đây là hướng dẫn chung, không thay lời khuyên y tế.",
      },
      {
        title: "Và một nút cho lúc xấu nhất",
        body:
          "Màn hình SOS lấy toạ độ GPS, dựng sẵn tin nhắn và cuộc gọi cấp cứu, kèm liên kết bản đồ gửi được cho người khác. Nền đen tuyền để tiết kiệm pin, còn cạnh màn hình nháy tín hiệu Morse cho đội tìm kiếm ban đêm.",
      },
    ],
    closing:
      "Sản phẩm bài tập của môn phát triển ứng dụng di động tại Đại học Greenwich Việt Nam, làm thành hai bản — Android thuần và React Native — để so đến nơi đến chốn chứ không chọn bừa một bên.",
    shots: [
      { src: "home", caption: "Trang chủ — thời tiết, buổi tập hôm nay và chuyến kế tiếp." },
      { src: "hikes", caption: "Danh sách chuyến: đã đi, đã lên lịch, đánh dấu yêu thích." },
      { src: "hike-detail", caption: "Một chuyến — độ khó, quãng đường, thời tiết trực tiếp, năng lượng ước tính." },
      { src: "stats", caption: "Thống kê quãng đường, tỷ lệ hoàn thành và sáu tháng gần nhất." },
      { src: "profile", caption: "Hồ sơ cơ thể và các lối đi nhanh: SOS, bản đồ, kế hoạch tập." },
      { src: "sos", caption: "Màn hình cấp cứu — toạ độ GPS, gọi 115, chia sẻ vị trí." },
    ],
    featured: false,
  },
];

/** Ảnh nào cũng ở một chỗ, nên đường dẫn dựng bằng công thức. */
export const shotUrl = (projectId, name) => `/project-screenshots/${projectId}/${name}${name.includes('.') ? '' : '.webp'}`;

export const featuredProjects = projects.filter((p) => p.featured);

export const findProject = (id) => projects.find((p) => p.id === id);
