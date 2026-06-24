import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { useHeadMeta } from "../../hooks/useHeadMeta";

export default function PrivacyPolicyPage() {
  const { data } = useData();
  const [activeSection, setActiveSection] = useState("chuong-1");

  useHeadMeta({
    title: "Điều Khoản Sử Dụng & Chính Sách Bảo Mật Toàn Diện | Hugo Studio",
    description: "Điều khoản sử dụng và chính sách bảo mật chi tiết của Hugo Studio. Tuyên bố nền tảng cung cấp công cụ miễn phí 100% và cổng thanh toán nội bộ phục vụ dịch vụ nhiếp ảnh cá nhân của Admin.",
    keywords: "chính sách bảo mật, điều khoản sử dụng, Hugo Studio, bảo vệ dữ liệu cá nhân, Nghị định 13, miễn phí 100%, dịch vụ nhiếp ảnh, thanh toán trực tiếp cá nhân",
    canonicalUrl: "https://www.hugowishpax.studio/policy"
  });

  const chapters = [
    { id: "chuong-1", title: "Chương I: Cơ Sở Pháp Lý & Văn Bản Quy Phạm", icon: "gavel" },
    { id: "chuong-2", title: "Chương II: Giải Thích Thuật Ngữ", icon: "menu_book" },
    { id: "chuong-3", title: "Chương III: Phạm Vi Dịch Vụ & Đối Tượng Điều Chỉnh", icon: "lan" },
    { id: "chuong-4", title: "Chương IV: Danh Mục Dữ Liệu Thu Thập", icon: "database" },
    { id: "chuong-5", title: "Chương V: Mục Đích & Biện Pháp Xử Lý Dữ Liệu", icon: "security" },
    { id: "chuong-6", title: "Chương VI: Quy Tắc Mốc Thời Gian & Lưu Trữ Dữ Liệu", icon: "schedule" },
    { id: "chuong-7", title: "Chương VII: Quy Chế Thanh Toán Dịch Vụ Studio Cá Nhân", icon: "credit_card" },
    { id: "chuong-8", title: "Chương VIII: Cam Kết Bảo Mật & Chống Thương Mại Hóa", icon: "shield_heart" },
    { id: "chuong-9", title: "Chương IX: Quyền & Nghĩa Vụ Của Chủ Thể Dữ Liệu", icon: "badge" },
    { id: "chuong-10", title: "Chương X: Giới Hạn & Miễn Trừ Trách Nhiệm Pháp Lý", icon: "block" },
    { id: "chuong-11", title: "Chương XI: Luật Áp Dụng & Giải Quyết Tranh Chấp", icon: "balance" },
    { id: "chuong-12", title: "Chương XII: Điều Khoản Thi Hành & Thông Tin Liên Hệ", icon: "mail" },
    { id: "chuong-13", title: "Chương XIII: Hệ Sinh Thái JOY, Trò Chơi Hóa & Quà Tặng", icon: "stadia_controller" },
    { id: "chuong-14", title: "Chương XIV: Trợ Lý AI HugoPSY & Dữ Liệu Sức Khỏe Tinh Thần", icon: "psychology" },
    { id: "chuong-15", title: "Chương XV: Đăng Nhập Sinh Trắc Học, Thông Báo Đẩy & Thiết Bị", icon: "fingerprint" }
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-black text-foreground py-12 px-4 sm:px-6 transition-colors duration-300 font-sans">
      
      {/* Container to handle sidebar and content */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        
        {/* LEFT COLUMN: STICKY SIDEBAR NAVIGATION (Desktop only) */}
        <aside className="hidden lg:block w-80 shrink-0 h-fit sticky top-6">
          <div className="glass border border-border p-6 rounded-3xl shadow-xl space-y-4 max-h-[85vh] overflow-y-auto scrollbar-hide">
            <div className="border-b border-border pb-3 text-center">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Mục lục điều khoản</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Hugo Studio Legal Version 7.0</span>
            </div>
            <nav className="space-y-1">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => scrollToSection(chapter.id)}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all text-xs font-semibold leading-relaxed border ${
                    activeSection === chapter.id
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "hover:bg-slate-100 dark:hover:bg-white/[0.02] border-transparent text-muted-foreground"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">{chapter.icon}</span>
                  <span className="line-clamp-2">{chapter.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* RIGHT COLUMN: MAIN LEGAL CONTENT PANEL */}
        <div className="flex-1 glass p-6 sm:p-12 rounded-3xl border border-border shadow-2xl transition-all duration-300 space-y-8">
          
          {/* Header Title */}
          <div className="space-y-4 text-center pb-6 border-b border-border relative">
            <span className="absolute top-0 right-0 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              Bản đầy đủ pháp lý
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase leading-snug">
              Chính Sách Bảo Mật & Điều Khoản Sử Dụng Toàn Diện
            </h1>
            <p className="text-xs text-muted-foreground font-bold tracking-wider">
              VĂN BẢN QUY ĐỊNH PHÁP LÝ CHÍNH THỨC CỦA HỆ THỐNG HUGO STUDIO
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              Cập nhật và ban hành áp dụng chính thức: Ngày 24 tháng 06 năm 2026 (Phiên bản 7.0 — bổ sung Hệ sinh thái JOY, HugoPSY AI, HugoChess, HugoArcade, Đăng nhập sinh trắc học)
            </p>
          </div>

          {/* Legal Content Sections */}
          <div className="space-y-12 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 text-justify">

            {/* CHƯƠNG 1 */}
            <section id="chuong-1" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">gavel</span>
                Chương I: Cơ Sở Pháp Lý & Văn Bản Quy Phạm Pháp Luật Chi Tiết
              </h2>
              <div className="space-y-4">
                <p>
                  Văn bản Điều khoản sử dụng và Chính sách Bảo mật này (sau đây gọi tắt là "Điều khoản" hoặc "Quy chế") thiết lập một thỏa thuận ràng buộc pháp lý đầy đủ và tối cao giữa người sử dụng (bao gồm Thành viên đăng ký và Khách hàng tương tác) và cá nhân Quản trị viên (Admin) duy nhất điều hành Hugo Studio. Toàn bộ nội dung quy chế này được biên soạn, đối chiếu và ban hành căn cứ trên tinh thần nghiêm túc tuân thủ các quy định hiện hành của hệ thống luật pháp nước Cộng hòa Xã hội Chủ nghĩa Việt Nam và các công ước pháp luật quốc tế về an ninh mạng, bảo vệ thông tin đời tư cá nhân và giao dịch dân sự tự nguyện.
                </p>
                
                <div className="bg-muted border border-border p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    I. Hệ thống pháp luật áp dụng của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam:
                  </h4>
                  
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      <strong>1. Thừa nhận tính pháp lý của Giao dịch dân sự tự nguyện và Hợp đồng điện tử:</strong>
                      <br />
                      - Căn cứ <strong>Bộ luật Dân sự nước CHXHCN Việt Nam năm 2015 (Luật số 91/2015/QH13)</strong>, đặc biệt tại <em>Điều 117</em> (Điều kiện có hiệu lực của giao dịch dân sự), <em>Điều 119</em> (Hình thức giao dịch dân sự, thừa nhận giao dịch thông qua phương tiện điện tử dưới hình thức thông điệp dữ liệu có giá trị như văn bản), <em>Điều 385</em> (Khái niệm hợp đồng), và <em>Điều 401</em> (Hiệu lực của hợp đồng, xác lập quyền ràng buộc của các điều khoản khi các bên có hành vi đồng ý gián tiếp hoặc trực tiếp thông qua hành động sử dụng dịch vụ).
                      <br />
                      - Căn cứ <strong>Luật Giao dịch điện tử năm 2023</strong> (được thông qua bởi Quốc hội Việt Nam khóa XV), điều chỉnh giá trị pháp lý của thông điệp dữ liệu, việc sử dụng các phương thức xác thực điện tử (như mã OTP gửi qua Email hoặc số điện thoại), và việc giao kết thỏa thuận trên môi trường điện tử. Hành động nhấp vào nút "Đăng ký", "Đồng ý điều khoản" hoặc gửi liên hệ công việc của Thành viên được pháp luật thừa nhận là chữ ký điện tử hợp pháp biểu thị sự cam kết ràng buộc dân sự tự nguyện.
                    </p>

                    <p>
                      <strong>2. Khẳng định Tính Chất Cung Cấp Công Cụ Miễn Phí 100% và Miễn Trừ Phạm Vi Đăng Ký Thương Mại Điện Tử (Nghị định 52/2013/NĐ-CP & Nghị định 85/2021/NĐ-CP):</strong>
                      <br />
                      - Hugo Studio được xây dựng, thiết kế và vận hành dưới dạng một <strong>Dự án giới thiệu nghệ thuật cá nhân phi thương mại</strong> do duy nhất cá nhân Admin sở hữu. Toàn bộ các công cụ thiết kế Bio Link, Bento Portfolio, mẫu giao diện và tính năng cốt lõi trên nền tảng được cung cấp **hoàn toàn miễn phí (100% Free)** cho tất cả Thành viên đăng ký tài khoản. Hệ thống tuyệt đối không thực hiện bán gói dịch vụ, không thu phí nâng cấp tài khoản, không khóa tính năng để đòi hỏi thanh toán trực tuyến từ phía Thành viên.
                      <br />
                      - Phân hệ thanh toán tích hợp trên hệ thống (chức năng tạo link thanh toán VietQR) được thiết kế phục vụ duy nhất một mục đích là **công cụ lập hóa đơn nội bộ của riêng cá nhân Admin** để gửi yêu cầu thanh toán trực tiếp cho các khách hàng cá nhân đặt lịch thực hiện các dịch vụ nghệ thuật thực tế ngoài đời thực của riêng Admin (như dịch vụ chụp ảnh nghệ thuật, chỉ đạo mỹ thuật, chụp hình lookbook).
                      <br />
                      - Vì website không có chức năng buôn bán sản phẩm, không thu phí dịch vụ phần mềm trực tuyến từ người dùng đại trà, và không quản lý/thu phí các gói tài khoản của khách, nên căn cứ theo phạm vi điều chỉnh của <em>Nghị định số 52/2013/NĐ-CP</em> và <em>Nghị định số 85/2021/NĐ-CP</em> về Thương mại điện tử của Việt Nam, website Hugo Studio **không thuộc diện phải thực hiện thủ tục Thông báo hoặc Đăng ký website thương mại điện tử với Bộ Công Thương**.
                    </p>

                    <p>
                      <strong>3. Quy chế Bảo vệ Dữ liệu cá nhân (GDPR của Việt Nam):</strong>
                      <br />
                      - Căn cứ <strong>Nghị định số 13/2023/NĐ-CP</strong> của Chính phủ ban hành ngày 17/04/2023 về Bảo vệ dữ liệu cá nhân (sau đây gọi tắt là "Nghị định 13"). Chúng tôi cam kết thiết lập hệ thống bảo mật, lưu trữ, xử lý thông tin cá nhân của công dân Việt Nam đúng theo các nguyên tắc được quy định tại:
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 9 (Quyền của chủ thể dữ liệu)</em>: Quy định rõ 11 quyền tối cao của người dùng đối với dữ liệu của mình, bao gồm quyền được biết, quyền đồng ý, quyền truy cập, quyền đính chính, quyền xóa dữ liệu, quyền rút lại sự đồng ý, v.v.
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 11 (Đồng ý của chủ thể dữ liệu)</em>: Quy định sự đồng ý phải được thể hiện dưới dạng rõ ràng, tự nguyện, có thể in ấn hoặc lưu giữ bằng văn bản hoặc thông điệp dữ liệu.
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 16 (Xử lý dữ liệu cá nhân nhạy cảm)</em>: Bắt buộc áp dụng biện pháp bảo vệ và thông báo đặc biệt đối với thông tin về số đo hình thể (Measurements) và lịch sử đóng góp tài chính trực tuyến.
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 38 (Trách nhiệm hành chính và hình sự)</em>: Quy định các chế tài xử phạt khi có hành vi vi phạm bảo vệ dữ liệu cá nhân.
                    </p>

                    <p>
                      <strong>4. Quy định về An ninh mạng và An toàn thông tin:</strong>
                      <br />
                      - Căn cứ <strong>Luật An toàn thông tin mạng năm 2015 (Luật số 86/2015/QH13)</strong>, quy định trách nhiệm của cơ quan, tổ chức, cá nhân trong việc bảo vệ thông tin cá nhân trên môi trường mạng và xử lý sự cố an toàn thông tin mạng.
                      <br />
                      - Căn cứ <strong>Luật An ninh mạng năm 2018 (Luật số 24/2018/QH14)</strong>, đặc biệt tại <em>Điều 8</em> (Các hành vi bị nghiêm cấm trên không gian mạng) và <em>Điều 26</em> (Bảo đảm an ninh thông tin trên không gian mạng). Hugo Studio cam kết ngăn chặn các hành vi phát tán mã độc, lừa đảo chiếm đoạt tài sản, phát tán văn hóa phẩm đồi trụy hoặc các nội dung gây ảnh hưởng đến an ninh quốc gia thông qua nền tảng Bio Link của Thành viên.
                    </p>

                    <p>
                      <strong>5. Quy định về Bảo vệ Trẻ em trên Môi trường mạng và Trò chơi điện tử không thưởng (Non-Reward Gamification):</strong>
                      <br />
                      - Căn cứ <strong>Luật Trẻ em năm 2016 (Luật số 102/2016/QH13)</strong> và <strong>Nghị định số 56/2017/NĐ-CP</strong> quy định chi tiết về bảo vệ trẻ em trên môi trường mạng, do nền tảng phục vụ phần lớn đối tượng học sinh, sinh viên (trong đó có thể bao gồm người dùng dưới 18 tuổi), Hugo Studio cam kết không thu thập dữ liệu nhạy cảm của trẻ em khi chưa có sự đồng ý hợp pháp và luôn ưu tiên thiết kế các tính năng trò chơi hóa (HugoArcade, HugoChess) theo hướng giải trí lành mạnh, không cờ bạc, không cá cược, không quy đổi thành tiền thật.
                      <br />
                      - Hệ thống điểm JOY và các vật phẩm trò chơi hóa được trình bày chi tiết tại <em>Chương XIII</em> của văn bản này được xác định rõ là <strong>đơn vị ghi nhận tương tác nội bộ phi tài chính</strong>, không thuộc phạm vi điều chỉnh của <em>Thông tư số 24/2014/TT-NHNN</em> về dịch vụ trung gian thanh toán hay các quy định về tiền điện tử, ví điện tử của Ngân hàng Nhà nước Việt Nam, nhằm tránh mọi rủi ro bị hiểu lầm là mô hình cờ bạc trá hình hoặc phát hành tiền ảo.
                    </p>
                  </div>
                </div>

                <div className="bg-muted border border-border p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    II. Các Hiến chương và Đạo luật Quốc tế được Viện dẫn Đối chiếu:
                  </h4>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      <strong>1. GDPR (General Data Protection Regulation - Quy định Bảo vệ Dữ liệu chung châu Âu):</strong>
                      <br />
                      - Do hệ thống Hugo Studio được cung cấp trên môi trường Internet toàn cầu, bất kỳ cá nhân nào tại bất kỳ quốc gia nào thuộc Liên minh Châu Âu (EU) đều có thể truy cập. Vì vậy, chúng tôi tự nguyện đối chiếu thiết lập hệ thống tuân thủ theo các tiêu chuẩn khắt khe của Quy định số (EU) 2016/679:
                      <br />
                      &nbsp;&nbsp;+ Căn cứ <em>Article 3 (Territorial scope)</em>: Quy định phạm vi áp dụng ngoài lãnh thổ EU khi xử lý dữ liệu của người dùng sống trong EU.
                      <br />
                      &nbsp;&nbsp;+ Căn cứ <em>Article 5 & 6 (Lawfulness of processing)</em>: Cơ sở pháp lý hợp pháp để xử lý dữ liệu dựa trên sự đồng ý tự nguyện (Consent) hoặc thực hiện thỏa thuận sử dụng dịch vụ.
                      <br />
                      &nbsp;&nbsp;+ Căn cứ <em>Article 17 (Right to erasure - 'Right to be forgotten')</em>: Quyền yêu cầu xóa bỏ hoàn toàn dữ liệu cá nhân vĩnh viễn khỏi mọi cơ sở dữ liệu vật lý và đám mây của nhà cung cấp.
                      <br />
                      &nbsp;&nbsp;+ Căn cứ <em>Article 32 (Security of processing)</em>: Nghĩa vụ áp dụng các biện pháp kỹ thuật như mã hóa mật khẩu, tường lửa, cô lập dữ liệu để đảm bảo an toàn tuyệt đối trước các đợt tấn công từ hacker.
                    </p>

                    <p>
                      <strong>2. COPPA (Children's Online Privacy Protection Act - Đạo luật bảo vệ quyền riêng tư trực tuyến của trẻ em Hoa Kỳ):</strong>
                      <br />
                      - Quy định nghiêm ngặt về việc cấm thu thập thông tin cá nhân của trẻ em dưới 13 tuổi mà không có sự đồng ý xác thực từ cha mẹ hoặc người giám hộ hợp pháp. Hugo Studio không chủ động thu thập bất kỳ dữ liệu nào của trẻ vị thành niên và sẽ lập tức tiến hành xóa bỏ tài khoản nếu phát hiện Thành viên đăng ký dưới độ tuổi quy định.
                    </p>

                    <p>
                      <strong>3. CCPA/CPRA (California Consumer Privacy Act - Đạo luật quyền riêng tư người tiêu dùng California):</strong>
                      <br />
                      - Trao cho người dùng sống tại California, Hoa Kỳ các quyền như: Quyền được biết dữ liệu nào đang được thu thập; Quyền yêu cầu xóa bỏ dữ liệu; Quyền từ chối việc mua bán thông tin cá nhân cho bên thứ ba; Quyền không bị phân biệt đối xử khi thực thi các quyền bảo mật này.
                    </p>
                  </div>
                </div>
                
                <p className="text-muted-foreground italic text-[11px] border-l-4 border-amber-500 pl-4">
                  * Khuyến cáo pháp lý đặc biệt: Việc người sử dụng tiếp tục các thao tác điều hướng trên website, thực hiện điền biểu mẫu, tạo lập Bio Link, Bento Portfolio biểu thị rằng người sử dụng đã dành thời gian đọc kỹ, thấu hiểu toàn bộ nội dung và tự nguyện cam kết tuân thủ không điều kiện các thỏa thuận được lập ra tại đây. Nếu không đồng ý với bất kỳ điều khoản nào, xin vui lòng ngừng truy cập website ngay lập tức.
                </p>
              </div>
            </section>

            {/* CHƯƠNG 2 */}
            <section id="chuong-2" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                Chương II: Giải Thích Thuật Ngữ và Định Nghĩa Pháp Lý Chi Tiết
              </h2>
              <div className="space-y-4">
                <p>
                  Để tránh mọi hiểu lầm, tranh chấp phát sinh từ việc giải nghĩa từ ngữ, các thuật ngữ viết hoa hoặc được định nghĩa cụ thể trong văn bản này sẽ được giải thích và quy chiếu pháp lý thống nhất như sau:
                </p>
                
                <div className="space-y-3.5 pl-4 border-l-2 border-slate-300 dark:border-slate-800 text-xs">
                  <p>
                    <strong>1. Chủ thể dữ liệu (Data Subject):</strong> Là cá nhân được dữ liệu cá nhân phản ánh trực tiếp. Ở đây bao gồm hai đối tượng cốt lõi: <em>Thành viên</em> (người sở hữu tài khoản thiết kế hồ sơ hoàn toàn miễn phí) và <em>Khách hàng</em> (cá nhân truy cập Bio Link công cộng của Thành viên nhằm mục đích xem thông tin, đặt lịch hẹn làm việc).
                  </p>
                  
                  <p>
                    <strong>2. Dữ liệu cá nhân (Personal Data):</strong> Là thông tin dưới dạng ký hiệu, chữ viết, chữ số, hình ảnh, âm thanh hoặc dạng tương tự trên môi trường điện tử gắn liền với một con người cụ thể hoặc giúp xác định một con người cụ thể.
                  </p>

                  <p>
                    <strong>3. Dữ liệu cá nhân nhạy cảm (Sensitive Personal Data):</strong> Là dữ liệu cá nhân gắn liền với quyền riêng tư của cá nhân mà khi bị xâm phạm sẽ ảnh hưởng trực tiếp đến quyền và lợi ích hợp pháp của cá nhân đó. Tại Hugo Studio, dữ liệu nhạy cảm bao gồm: Số đo hình thể nhân trắc học của Thành viên (chiều cao, cân nặng, số đo vòng ngực, vòng eo, vòng mông) và thông tin về lịch sử thanh toán các dịch vụ Studio thực tế của khách hàng của Admin.
                  </p>

                  <p>
                    <strong>4. Ban quản trị / Cá nhân Admin duy nhất (The Administrator):</strong> Là chủ thể sở hữu hạ tầng kỹ thuật, mã nguồn, tên miền hệ thống Hugo Studio. Dưới góc độ điều hành và quản trị, hệ thống này được quản lý và xử lý trực tiếp, độc quyền bởi **01 cá nhân Admin duy nhất** (ở đây là nghệ sĩ nhiếp ảnh Peter Hugo Wishpax Le). Không có bất kỳ pháp nhân, hội đồng quản trị, đại diện pháp luật, chi nhánh, công ty con hay tổ chức bên thứ ba nào tham gia điều hành hoặc chịu trách nhiệm liên đới với các hoạt động kỹ thuật của Admin.
                  </p>

                  <p>
                    <strong>5. Thành viên (Member):</strong> Là cá nhân đã hoàn tất quy trình điền biểu mẫu đăng ký tài khoản trực tuyến trên website, được hệ thống cấp quyền truy cập miễn phí vào trang quản trị (Dashboard) để tùy biến, kéo thả các khối Bento Grid, đăng tải ảnh, số đo cơ thể và nhận lịch Booking mà không chịu bất kỳ chi phí nào.
                  </p>

                  <p>
                    <strong>6. Khách hàng (Customer):</strong> Là cá nhân truy cập vào các trang Bio Link hoặc Bento Grid Portfolio công cộng của Thành viên dưới dạng tên miền con (subdomain) hoặc đường dẫn trực tiếp nhằm xem thông tin giới thiệu, liên kết mạng xã hội hoặc gửi yêu cầu đặt lịch làm việc.
                  </p>

                  <p>
                    <strong>7. Xử lý dữ liệu cá nhân (Data Processing):</strong> Là một hoặc nhiều hoạt động tác động tới dữ liệu cá nhân bao gồm: Thu thập, ghi, phân tích, lưu trữ, chỉnh sửa, công khai hiển thị, kết xuất dữ liệu, truy xuất dữ liệu, thu hồi quyền truy cập, mã hóa, sao lưu, chia sẻ, hủy hoặc xóa bỏ hoàn toàn dữ liệu.
                  </p>

                  <p>
                    <strong>8. Bio Link / Bento Grid Portfolio:</strong> Là sản phẩm công nghệ do Hugo Studio cung cấp miễn phí, cho phép Thành viên tạo dựng một trang đích cá nhân (Landing page) chứa các khối nội dung được thiết kế theo phong cách Bento Grid để hiển thị thông tin hình ảnh, liên kết, số đo hình thể và tính năng đặt lịch.
                  </p>

                  <p>
                    <strong>9. Hệ thống Booking đặt lịch (Booking System):</strong> Phân hệ công nghệ được lập trình sẵn trên website cho phép Khách hàng điền thông tin liên hệ và gửi trực tiếp yêu cầu hẹn làm việc đến tài khoản quản lý của Thành viên.
                  </p>

                  <p>
                    <strong>10. Dịch vụ Nhiếp ảnh & Nghệ thuật của Studio (Studio Creative Services):</strong> Các dịch vụ thiết kế, nhiếp ảnh, chỉ đạo nghệ thuật mà cá nhân Admin thực hiện trực tiếp cho khách hàng của mình thông qua các thỏa thuận hợp tác dân sự ngoại tuyến (offline).
                  </p>

                  <p>
                    <strong>11. Cổng tạo liên kết thanh toán VietQR:</strong> Giao diện kết nối API của Admin với đối tác cung ứng cổng trung gian thanh toán PayOS nhằm sinh mã thanh toán hóa đơn VietQR tự động để Admin gửi riêng cho các khách hàng đặt dịch vụ chụp ảnh/nghệ thuật cá nhân của Admin.
                  </p>

                  <p>
                    <strong>12. Bên kiểm soát dữ liệu cá nhân (Data Controller):</strong> Là cá nhân Admin duy nhất của Hugo Studio - bên quyết định mục đích và phương tiện xử lý dữ liệu cá nhân của người dùng.
                  </p>

                  <p>
                    <strong>13. Bên xử lý dữ liệu cá nhân (Data Processor):</strong> Là các đơn vị cung cấp hạ tầng máy chủ đám mây vật lý, hệ quản trị cơ sở dữ liệu MongoDB Atlas lưu trữ dữ liệu người dùng được kiểm soát bởi Admin.
                  </p>

                  <p>
                    <strong>14. Sự cố an ninh dữ liệu (Data Security Breach):</strong> Là các tình huống bất thường dẫn đến dữ liệu cá nhân của người dùng bị truy cập, tiết lộ, thay đổi, phá hủy hoặc mất mát trái phép do hacker tấn công, rò rỉ mã nguồn hoặc lỗi vận hành kỹ thuật.
                  </p>

                  <p>
                    <strong>15. Xác thực OTP điện tử:</strong> Phương thức gửi mã số bí mật dùng một lần có thời hạn hiệu lực ngắn đến địa chỉ email của người dùng để xác nhận quyền sở hữu tài khoản hoặc xác thực các thao tác thay đổi thông tin quan trọng.
                  </p>

                  <p>
                    <strong>16. JOY (Đơn vị tương tác nội bộ phi tài chính):</strong> Là một loại điểm số ghi nhận trong nội bộ hệ thống Hugo Studio, được cấp cho Thành viên thông qua các hoạt động tương tác (chơi game HugoArcade, thi đấu HugoChess, điểm danh, hoàn thành nhiệm vụ đồng hành cùng HugoPSY). JOY <strong>không phải là tiền tệ, không phải tài sản số, không có giá trị quy đổi ra tiền mặt</strong> và không thể chuyển nhượng, mua bán, rút ra ngoài hệ thống dưới bất kỳ hình thức nào.
                  </p>

                  <p>
                    <strong>17. HugoPSY (Trợ lý Đồng hành Sức khỏe Tinh thần bằng AI):</strong> Là tính năng chatbot trò chuyện được vận hành bởi mô hình ngôn ngữ lớn của bên thứ ba (Google Gemini, dự phòng bởi OpenRouter), nhằm mục đích lắng nghe, đồng hành, gợi ý các bài kiểm tra sàng lọc tâm lý phổ biến (PHQ-9, GAD-7, WHO-5, Big Five) và đưa ra phản hồi mang tính hỗ trợ tinh thần. HugoPSY <strong>không phải là dịch vụ y tế, không phải bác sĩ tâm lý hay chuyên gia trị liệu được cấp phép</strong> và không thay thế cho việc thăm khám, chẩn đoán, điều trị y khoa chính thức.
                  </p>

                  <p>
                    <strong>18. HugoChess & HugoArcade (Phân hệ Trò chơi Giải trí):</strong> Là các tính năng trò chơi điện tử trực tuyến (cờ vua đối kháng, các minigame như rắn săn mồi, 2048, sinh tồn, đoán từ) được tích hợp nhằm mục đích giải trí thuần túy, ghi nhận điểm số/JOY mang tính khích lệ, không có yếu tố cá cược hoặc đặt cược tài sản thật.
                  </p>

                  <p>
                    <strong>19. Đăng nhập sinh trắc học / Khóa truy cập (Biometric Login / Passkey - WebAuthn):</strong> Là phương thức xác thực đăng nhập sử dụng chuẩn công nghệ FIDO2/WebAuthn quốc tế, cho phép Thành viên đăng nhập bằng vân tay, khuôn mặt hoặc mã PIN của chính thiết bị cá nhân thay cho việc gõ mật khẩu.
                  </p>

                  <p>
                    <strong>20. Thông báo đẩy (Push Notification):</strong> Là tin nhắn thông báo ngắn được gửi tới thiết bị của Thành viên thông qua trình duyệt hoặc ứng dụng web lũy tiến (PWA) nhằm nhắc nhở lịch hẹn, sự kiện hoặc tương tác mới mà không cần Thành viên đang mở website.
                  </p>

                  <p>
                    <strong>21. Bên xử lý dữ liệu AI bên thứ ba (Third-Party AI Data Processor):</strong> Là các nhà cung cấp dịch vụ mô hình ngôn ngữ lớn nằm ngoài hạ tầng của Hugo Studio (cụ thể là Google Gemini API và OpenRouter) được sử dụng để xử lý nội dung trò chuyện văn bản của Thành viên với HugoPSY nhằm sinh ra phản hồi tự động, được quy định chi tiết về phạm vi dữ liệu được phép gửi đi tại Chương XIV.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 3 */}
            <section id="chuong-3" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">lan</span>
                Chương III: Phạm Vi Dịch Vụ & Đối Tượng Điều Chỉnh Pháp Lý Toàn Diện
              </h2>
              <div className="space-y-4">
                <p>
                  Chương này quy định chi tiết phạm vi cung cấp công nghệ của Hugo Studio, phân định quyền và trách nhiệm pháp lý của cá nhân Admin đối với từng phân hệ tính năng được lập trình trên hệ thống:
                </p>

                <div className="space-y-4">
                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.1 Trình Thiết Kế Bio Link & Bento Grid Portfolio (Hoàn toàn miễn phí):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify space-y-2">
                      - Hugo Studio cung cấp công cụ xây dựng giao diện trực quan thông qua việc sắp đặt các khối thông tin (Bento blocks). Thành viên được quyền đăng tải văn bản, hình ảnh cá nhân, liên kết mạng xã hội (Facebook, Instagram, TikTok, Threads, GitHub) và nhúng nội dung từ bên thứ ba (YouTube, Spotify, Soundcloud). Tất cả tính năng này được cung cấp miễn phí và không yêu cầu bất kỳ khoản phí thành viên nào.
                      <br />
                      - <strong>Quy định về Bản quyền và Sở hữu trí tuệ:</strong> Thành viên chịu trách nhiệm độc quyền trước pháp luật hình sự và dân sự về quyền sở hữu trí tuệ đối với mọi hình ảnh, logo, tên thương hiệu, âm nhạc hoặc tác phẩm nghệ thuật đăng tải trên Bio Link cá nhân của mình. Ban quản trị Hugo Studio tuyệt đối không chịu trách nhiệm liên đới đối với bất kỳ hành vi xâm phạm bản quyền nào do Thành viên thực hiện.
                      <br />
                      - <strong>Quy định xử lý nội dung vi phạm:</strong> Admin giữ quyền kiểm soát tối cao và sẽ tiến hành khóa tài khoản, hạ trang Bio Link ngay lập tức mà không cần báo trước nếu phát hiện Thành viên đăng tải các nội dung: lừa đảo tài chính, cờ bạc trực tuyến, đường link dẫn tới phần mềm độc hại, văn hóa phẩm đồi trụy, phát ngôn thù địch, xúc phạm danh dự nhân phẩm cá nhân/tổ chức khác, hoặc vi phạm nghiêm trọng thuần phong mỹ tục Việt Nam.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.2 Phân Hệ Số Đo Hình Thể Cá Nhân (Measurements Panel):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - Nhằm hỗ trợ các Thành viên hoạt động trong lĩnh vực nghệ thuật, giải trí, thời trang (như Người mẫu, KOLs, PG/PB, Diễn viên) xây dựng hồ sơ năng lực chuyên nghiệp, Hugo Studio tích hợp các trường điền số đo cơ thể bao gồm: Chiều cao, Cân nặng, Vòng 1, Vòng 2, Vòng 3 và Kiểu cơ thể.
                      <br />
                      - Các thông số này cấu thành Dữ liệu cá nhân nhạy cảm của người dùng. Hệ thống thiết lập cơ chế kiểm soát hiển thị riêng tư hoàn chỉnh. Thành viên có quyền tự nguyện quyết định hiển thị công khai các thông số này lên trang Portfolio của mình hoặc ẩn đi trong trang quản trị. Việc Thành viên chọn kích hoạt hiển thị đồng nghĩa với việc chấp nhận cho bất kỳ ai truy cập internet xem các chỉ số này.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.3 Hệ Thống Ghi Nhận Đặt Lịch Hẹn (Booking Engine):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - Phân hệ Booking cho phép Khách hàng gửi yêu cầu làm việc trực tiếp tới Thành viên. Khi Khách hàng hoàn tất biểu mẫu Booking, dữ liệu sẽ được chuyển giao vào cơ sở dữ liệu và hiển thị trên trang quản lý lịch hẹn của Thành viên nhận lịch.
                      <br />
                      - <strong>Tuyên bố miễn trừ trách nhiệm dân sự:</strong> Hugo Studio chỉ đóng vai trò cung cấp giải pháp lưu trữ kỹ thuật trung gian truyền tải thông tin lịch hẹn. Mọi cam kết hợp tác, giao kết hợp đồng, trao đổi tài chính, chất lượng dịch vụ hoặc tranh chấp kinh tế phát sinh sau đó giữa Thành viên và Khách hàng hoàn toàn thuộc về thỏa thuận dân sự cá nhân giữa hai bên. Cá nhân Admin của Hugo Studio tuyệt đối không can thiệp, không chịu trách nhiệm hòa giải và miễn trừ mọi nghĩa vụ bồi thường thiệt hại liên quan.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.4 Giao Diện Tích Hợp Iframe Đối Tác (Partner Sandbox Integration):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - Đối với các nền tảng đối tác nhúng Hugo Studio thông qua thẻ `iframe`, chúng tôi áp dụng các chính sách bảo mật hộp cát (Sandbox Attributes) nghiêm ngặt nhằm cách ly phiên làm việc. Đối tác tích hợp chịu trách nhiệm thiết lập các chính sách CORS hợp lệ và không được phép can thiệp vào cookie bảo mật hoặc token đăng nhập của Thành viên đang lưu trên trình duyệt của Hugo Studio.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.5 Trợ Lý Ảo Bot Culi (Support Assistant System):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - Trợ lý ảo Bot Culi là hệ thống tương tác tự động được tích hợp trên các biểu mẫu liên hệ nhằm hướng dẫn người dùng điền thông tin hỗ trợ kỹ thuật đúng quy trình. Lịch sử trò chuyện và thông tin yêu cầu gửi qua Bot Culi sẽ được ghi nhận thành các phiếu ghi hỗ trợ (Support Tickets) nhằm phục vụ công tác khắc phục sự cố kỹ thuật của Admin.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.6 Trợ Lý Đồng Hành Sức Khỏe Tinh Thần HugoPSY (Miễn phí, giới hạn theo hạn ngạch token):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - HugoPSY là không gian trò chuyện hỗ trợ tinh thần được vận hành theo hai lớp xử lý kết hợp: (i) một bộ phân loại ý định cục bộ (Local Intent Classifier) hoạt động ngay trên trình duyệt/máy chủ nội bộ, trả lời tức thì với hơn 30 chủ đề tâm lý phổ biến mà không cần gửi dữ liệu ra ngoài; và (ii) khi không có chủ đề cục bộ phù hợp, hệ thống chuyển tiếp một phiên bản dữ liệu đã được tối giản nghiêm ngặt (xem Chương XIV) tới mô hình AI của bên thứ ba để sinh phản hồi tự nhiên hơn.
                      <br />
                      - Hạn ngạch xử lý qua AI bên thứ ba được giới hạn theo từng Thành viên (token-based) nhằm đảm bảo công bằng tài nguyên vận hành và được Admin tự nguyện gánh chịu toàn bộ chi phí, không thu phí Thành viên dưới mọi hình thức.
                      <br />
                      - <strong>Tuyên bố miễn trừ y tế:</strong> Mọi nội dung, gợi ý, bài kiểm tra sàng lọc (PHQ-9, GAD-7, WHO-5, Big Five) và phân tích kết quả do HugoPSY cung cấp chỉ mang tính chất tham khảo, hỗ trợ tinh thần ban đầu, <strong>không cấu thành chẩn đoán y khoa</strong>. Trường hợp phát hiện dấu hiệu khủng hoảng tâm lý nghiêm trọng, hệ thống sẽ ưu tiên hiển thị thông tin đường dây nóng hỗ trợ khẩn cấp và khuyến nghị Thành viên liên hệ chuyên gia y tế, tổng đài tâm lý hoặc cơ sở y tế gần nhất.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.7 HugoChess & HugoArcade (Phân Hệ Trò Chơi Giải Trí Tích Lũy JOY):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - HugoChess cho phép Thành viên thi đấu cờ vua trực tuyến với người dùng khác hoặc với máy, ghi nhận điểm xếp hạng (rating) nội bộ mang tính tham khảo giải trí. HugoArcade cung cấp các minigame giải trí ngắn (rắn săn mồi, 2048, sinh tồn, đoán từ, v.v.) tích lũy điểm số JOY và điểm cao (high score) cá nhân.
                      <br />
                      - Chi tiết đầy đủ về bản chất phi tài chính của JOY, thẻ quà tặng (Gift Card) và quy chế trò chơi hóa được quy định toàn diện tại <em>Chương XIII</em> của văn bản này.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.8 Đăng Nhập Sinh Trắc Học & Thông Báo Đẩy (Biometric Login & Push Notification):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - Hệ thống hỗ trợ đăng nhập nhanh bằng sinh trắc học (vân tay/khuôn mặt của thiết bị) theo chuẩn WebAuthn/FIDO2 và gửi thông báo đẩy nhắc nhở qua trình duyệt. Chi tiết kỹ thuật và phạm vi dữ liệu lưu trữ được quy định toàn diện tại <em>Chương XV</em>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 4 */}
            <section id="chuong-4" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">database</span>
                Chương IV: Danh Mục Dữ Liệu Cá Nhân Thu Thập & Phương Thức Thu Thập
              </h2>
              <div className="space-y-4">
                <p>
                  Hugo Studio cam kết tuân thủ nguyên tắc tối thiểu hóa dữ liệu (Data Minimization) quy định tại Nghị định 13/2023/NĐ-CP và GDPR. Chúng tôi chỉ thu thập và xử lý các trường dữ liệu cần thiết tuyệt đối để thiết lập và vận hành các tính năng kỹ thuật của hệ thống. Danh mục dữ liệu bao gồm:
                </p>

                <div className="space-y-4">
                  <div className="pl-4 border-l-2 border-emerald-500 space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      1. Dữ Liệu Cá Nhân Cơ Bản (Cung cấp trực tiếp bởi Thành viên):
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - <strong>Thông tin định danh và tài khoản:</strong> Họ và tên hiển thị công khai; Địa chỉ thư điện tử cá nhân (Email) - bắt buộc sử dụng để tiếp nhận mã OTP đăng ký, xác thực đăng nhập, phục hồi mật khẩu và nhận thông báo lịch Booking; Mật khẩu đăng nhập (hệ thống chỉ lưu bản mã hóa một chiều Hash mật khẩu); Ảnh đại diện (Avatar) tải lên hệ thống.
                      <br />
                      - <strong>Thông tin liên hệ kết nối xã hội:</strong> Số điện thoại cá nhân (để liên kết gọi điện hoặc chat Zalo); Các liên kết mạng xã hội do Thành viên tự điền (Facebook, Instagram, TikTok, LinkedIn, YouTube, v.v.).
                      <br />
                      - <strong>Dữ liệu Email Giáo Dục:</strong> Đối với các Thành viên tham gia chương trình tài trợ sinh viên (Gói tài trợ Premium Student), chúng tôi thu thập địa chỉ email giáo dục (có đuôi dạng `.edu` hoặc `.edu.vn`) để làm cơ sở tự động phê duyệt trạng thái sinh viên hợp lệ và cấp trang portfolio miễn phí trọn vẹn.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-amber-500 space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      2. Dữ Liệu Thanh Toán Dịch Vụ Của Admin (Chỉ thu thập từ Khách hàng của riêng Admin):
                    </h4>
                    <p className="text-xs text-slate-606 dark:text-slate-400 text-justify">
                      - Khi khách hàng trực tiếp đặt dịch vụ thiết kế, nhiếp ảnh nghệ thuật của riêng Admin thực hiện thanh toán hóa đơn thông qua liên kết thanh toán VietQR do Admin gửi riêng, hệ thống ghi nhận thông tin bao gồm: Mã tham chiếu thanh toán của PayOS (Transaction ID), Số tiền chuyển khoản dịch vụ chụp ảnh/nghệ thuật, Tên ngân hàng thực hiện giao dịch, Thời gian giao dịch thành công. Toàn bộ thông tin này được lưu để đối soát tự động báo cáo trạng thái hóa đơn của Admin và hoàn toàn không liên quan đến dữ liệu sử dụng tài khoản của Thành viên thông thường.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-blue-500 space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      3. Dữ Liệu Thu Thập Từ Khách Hàng (Khi gửi Booking cho Thành viên):
                    </h4>
                    <p className="text-xs text-slate-606 dark:text-slate-400 text-justify">
                      - Khi Khách hàng truy cập Bio Link của Thành viên và gửi yêu cầu đặt lịch hẹn, hệ thống thu thập: Họ tên Khách hàng; Địa chỉ Email của Khách hàng; Số điện thoại liên hệ (Zalo); Tiêu đề và nội dung mô tả yêu cầu công việc/sự kiện; Ngày giờ mong muốn diễn ra lịch hẹn. Dữ liệu này được lưu trữ tách biệt và chỉ hiển thị cho duy nhất Thành viên nhận lịch hẹn đó.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-indigo-500 space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      4. Dữ Liệu Kỹ Thuật Tự Động Thu Thập Qua Hệ Thống:
                    </h4>
                    <p className="text-xs text-slate-606 dark:text-slate-400 text-justify">
                      - <strong>Địa chỉ IP (Internet Protocol):</strong> Ghi nhận địa chỉ IP của mọi yêu cầu gửi tới API nhằm phục vụ công tác giám sát an ninh mạng, phát hiện và ngăn chặn các đợt tấn công từ chối dịch vụ (DDoS) hoặc spam tài khoản hàng loạt.
                      <br />
                      - <strong>Dữ liệu thiết bị & Trình duyệt (User Agent):</strong> Loại thiết bị sử dụng (điện thoại di động, máy tính bảng, máy tính cá nhân), hệ điều hành (iOS, Android, Windows, macOS), loại trình duyệt sử dụng (Safari, Chrome, Firefox) để tối ưu hiển thị giao diện.
                      <br />
                      - <strong>Cookie và Session Token:</strong> Sử dụng cookie kỹ thuật và Local Storage để lưu trữ Session Token đã được mã hóa nhằm duy trì trạng thái đăng nhập của Thành viên mà không bắt buộc phải nhập lại mật khẩu trong mỗi phiên làm việc.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-rose-500 space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      5. Dữ Liệu Sức Khỏe Tinh Thần & Trò Chuyện Với HugoPSY (Dữ liệu nhạy cảm — xem chi tiết Chương XIV):
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - <strong>Nội dung trò chuyện thô (Raw Chat):</strong> Toàn bộ tin nhắn văn bản Thành viên trao đổi với HugoPSY, chỉ được lưu trữ tối đa <strong>07 ngày gần nhất</strong> rồi tự động bị xóa vĩnh viễn khỏi hệ thống (xem quy tắc lưu trữ tại Chương VI và Chương XIV).
                      <br />
                      - <strong>Chỉ số sức khỏe tinh thần đã lượng hóa (Indicator Logs):</strong> Kết quả các bài kiểm tra sàng lọc (điểm số PHQ-9, GAD-7, WHO-5, Big Five), nhãn tâm trạng điểm danh hằng ngày (mood check-in) và streak đồng hành. Các chỉ số này được lưu trữ dài hạn dưới dạng số liệu tổng hợp (không lưu nội dung chữ thô) để hệ thống "nhớ" hành trình của Thành viên dù tin nhắn gốc đã bị xóa.
                      <br />
                      - <strong>Tóm tắt sức khỏe tinh thần (Wellness Summary):</strong> Một đoạn văn bản ngắn được hệ thống tự động tổng hợp từ các chỉ số trên (ví dụ: "Streak check-in 5 ngày, tâm trạng gần nhất 4/5, điểm PHQ-9 gần nhất 8 điểm cách đây 2 ngày") — đây là dữ liệu duy nhất đại diện cho lịch sử dài hạn được phép gửi cho AI bên thứ ba.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-purple-500 space-y-2">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      6. Dữ Liệu Trò Chơi Hóa, Điểm JOY & Sinh Trắc Học Thiết Bị:
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - <strong>Số dư và lịch sử JOY (JOY Ledger):</strong> Số điểm JOY hiện có, lịch sử cộng/trừ điểm theo từng hoạt động (chơi game, điểm danh, đổi thẻ quà tặng nội bộ).
                      <br />
                      - <strong>Điểm số trò chơi:</strong> Điểm cao cá nhân tại các minigame HugoArcade, điểm xếp hạng (rating) và lịch sử ván đấu tại HugoChess.
                      <br />
                      - <strong>Thông tin xác thực sinh trắc học (WebAuthn Credential):</strong> Hugo Studio <strong>chỉ lưu trữ một khóa công khai (Public Key) và mã định danh thiết bị</strong> do chuẩn FIDO2/WebAuthn của trình duyệt cấp ra — hệ thống <strong>không bao giờ thu thập, truyền tải hay lưu trữ</strong> hình ảnh vân tay, khuôn mặt hoặc bất kỳ mẫu sinh trắc học gốc nào; toàn bộ dữ liệu sinh trắc học gốc luôn được giữ và xử lý cục bộ trên chính thiết bị của người dùng.
                      <br />
                      - <strong>Mã đăng ký nhận thông báo đẩy (Push Subscription Endpoint):</strong> Một địa chỉ endpoint kỹ thuật do trình duyệt cấp khi Thành viên đồng ý nhận thông báo, dùng để gửi tin nhắn nhắc nhở mà không gắn liền với danh tính cá nhân nào khác ngoài tài khoản đã đăng nhập.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 5 */}
            <section id="chuong-5" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">security</span>
                Chương V: Mục Đích, Biện Pháp & Quy Trình Xử Lý Dữ Liệu Cá Nhân
              </h2>
              <div className="space-y-4">
                <p>
                  Mọi hành vi xử lý dữ liệu tại Hugo Studio đều có mục đích rõ ràng, minh bạch và áp dụng các giải pháp kỹ thuật bảo vệ tối tân nhất hiện nay nhằm ngăn chặn tuyệt đối các nguy cơ thất thoát thông tin:
                </p>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground">1. Mục đích xử lý dữ liệu chi tiết:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-justify">
                      <li>Xác thực quyền đăng nhập tài khoản và khôi phục tài khoản khi xảy ra sự cố quên mật khẩu thông qua mã OTP điện tử gửi tới email đã đăng ký.</li>
                      <li>Khởi tạo, duy trì hiển thị và quản lý trang Bio Link, Bento Portfolio cá nhân hoàn toàn miễn phí của Thành viên trên internet theo đúng tùy biến thiết kế.</li>
                      <li>Đồng bộ hóa dữ liệu lịch hẹn, chuyển tiếp thông tin liên lạc của Khách hàng trực tiếp đến trang quản trị Dashboard của Thành viên để phục vụ công tác trao đổi công việc.</li>
                      <li>Thực hiện kiểm tra tính hợp lệ của địa chỉ email giáo dục nhằm phê duyệt tham gia chương trình tài trợ sinh viên.</li>
                      <li>Lưu trữ tạm thời và đối soát trạng thái giao dịch thanh toán các dịch vụ Studio của riêng Admin qua cổng trung gian thanh toán PayOS.</li>
                      <li>Phát hiện, ngăn chặn kịp thời các hành vi đăng nhập trái phép, spam phá hoại hệ thống, tấn công từ chối dịch vụ hoặc tải lên mã nguồn độc hại.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-foreground uppercase tracking-wider">
                      2. Các biện pháp bảo vệ kỹ thuật đầu cuối (End-to-End Security Measures):
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      Ban quản trị Hugo Studio đã thiết lập và duy trì các cơ chế bảo mật kỹ thuật đa tầng nhằm bảo vệ dữ liệu người dùng trước các truy cập trái phép:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 bg-muted rounded-xl border border-border space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-455">a) Mã hóa Mật khẩu bảo mật mật thiết:</h6>
                        <p className="text-muted-foreground text-justify">
                          Toàn bộ mật khẩu của Thành viên đều được băm một chiều (One-way Cryptographic Hashing) bằng thuật toán <strong>SHA-256</strong> kết hợp với mã muối ngẫu nhiên (Salt) có độ phức tạp cao trước khi lưu vào MongoDB. Cơ chế này đảm bảo ngay cả khi cơ sở dữ liệu bị lộ lọt, kẻ tấn công cũng không thể dịch ngược để đọc mật khẩu gốc dưới dạng văn bản thuần (Plaintext).
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-xl border border-border space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-455">b) Bộ lọc CORS và cách ly máy chủ API:</h6>
                        <p className="text-muted-foreground text-justify">
                          Máy chủ API (Node.js/Express) thiết lập cấu hình chính sách chia sẻ tài nguyên nguồn gốc chéo <strong>CORS (Cross-Origin Resource Sharing)</strong> cực kỳ chặt chẽ. Hệ thống chỉ phê duyệt và tiếp nhận các yêu cầu truy vấn đến từ các tên miền chính thức của Hugo Studio. Mọi yêu cầu API giả mạo hoặc xuất phát từ các nguồn gốc lạ ngoài danh sách sẽ bị từ chối xử lý ngay lập tức tại tầng mạng.
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-xl border border-border space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-455">c) Cơ chế Route Guard & Chặn bypass luồng:</h6>
                        <p className="text-muted-foreground text-justify">
                          Các biểu mẫu hỗ trợ kỹ thuật được bảo vệ nghiêm ngặt bằng cơ chế kiểm soát định tuyến (Route Guard). Hệ thống sẽ chặn kết nối và trả về trang lỗi nếu phát hiện trình duyệt cố tình bỏ qua (bypass) luồng gửi biểu mẫu thông tin tiêu chuẩn hoặc truy cập trực tiếp vào các liên kết xử lý nội bộ mà không có sự chỉ dẫn của Trợ lý ảo Bot Culi.
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-xl border border-border space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-455">d) Nén mã hóa hình ảnh và Lưu trữ đám mây phân quyền:</h6>
                        <p className="text-muted-foreground text-justify">
                          Mọi hình ảnh đại diện, ảnh Portfolio tải lên hệ thống đều được nén tự động và chuyển đổi sang định dạng hình ảnh thế hệ mới <strong>WebP</strong> nhằm tối ưu băng thông. Các tập tin này được lưu giữ trên hệ thống lưu trữ đám mây phân quyền cao, ngăn chặn việc quét tập tin hàng loạt từ bên ngoài thông qua các script tự động.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 6 */}
            <section id="chuong-6" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Chương VI: Quy Tắc Mốc Thời Gian & Lưu Trữ Dữ Liệu Chi Tiết
              </h2>
              <div className="space-y-4">
                <p>
                  Nhằm quản lý hiệu quả tài nguyên lưu trữ của máy chủ, đảm bảo tính ổn định tối đa cho hệ thống và tự động dọn dẹp các tài khoản không hoạt động, Hugo Studio áp dụng các mốc thời gian kỹ thuật như sau:
                </p>

                <div className="space-y-4 text-xs text-justify">
                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground text-xs">
                      a) Hiệu lực sử dụng tài khoản và Bio Link (Miễn Phí 100% Không Giới Hạn):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Tài khoản Thành viên và trang Bio Link/Bento Portfolio được tạo lập trên hệ thống hoàn toàn miễn phí và không bị giới hạn thời hạn sử dụng. Dữ liệu của Thành viên được lưu giữ vĩnh viễn trên máy chủ, ngoại trừ các trường hợp Thành viên chủ động yêu cầu xóa tài khoản hoặc tài khoản bị vô hiệu hóa do vi phạm các quy định cấm đăng tải nội dung trái pháp luật tại Chương III.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground text-xs">
                      b) Quy định về Thời hạn phiên làm việc và Tự động vô hiệu hóa Session Token (Quy tắc 14 Ngày):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Để cân bằng giữa tính tiện dụng (tránh bắt buộc người dùng đăng nhập lại quá thường xuyên) và tính bảo mật an toàn tài khoản (phòng ngừa rò rỉ mã token khi đăng nhập trên thiết bị công cộng hoặc thiết bị của người khác), hệ thống Hugo Studio áp dụng chính sách giới hạn thời gian phiên đăng nhập tối đa là <strong>14 ngày</strong> (tương đương 336 giờ đồng hồ).
                      <br />
                      - Đúng vào mốc 00:00:00 của ngày thứ 14 kể từ thời điểm đăng nhập thành công gần nhất, Session Token được lưu trong cơ sở dữ liệu sẽ tự động chuyển sang trạng thái vô hiệu hóa (Expired). Hệ thống sẽ tự động đăng xuất tài khoản trên trình duyệt của Thành viên và yêu cầu thực hiện lại quy trình xác thực đăng nhập nhằm đảm bảo an toàn tuyệt đối.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground text-xs">
                      c) Quy trình Xử lý và Lưu trữ dữ liệu khi xóa tài khoản:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - <strong>Xóa mềm (Soft Delete):</strong> Khi Thành viên gửi yêu cầu xóa tài khoản trực tuyến qua Dashboard, hệ thống lập tức ẩn hiển thị trang Bio Link và Bento Portfolio công cộng của Thành viên khỏi internet. Dữ liệu tài khoản được chuyển vào trạng thái chờ xóa.
                      <br />
                      - <strong>Xóa cứng vĩnh viễn (Hard Delete):</strong> Đúng 30 ngày kể từ ngày Thành viên xác nhận yêu cầu xóa, hệ thống sẽ tự động quét cơ sở dữ liệu và thực hiện xóa cứng vĩnh viễn không thể phục hồi toàn bộ thông tin đăng ký, ảnh đại diện, số đo cơ thể, dữ liệu lịch hẹn Booking trên máy chủ MongoDB Atlas.
                      <br />
                      - <strong>Ngoại lệ lưu trữ bắt buộc đối với dữ liệu hóa đơn của Admin:</strong> Thông tin lịch sử thanh toán hóa đơn dịch vụ Studio cá nhân của khách hàng trực tiếp của Admin phải được lưu giữ trong thời hạn tối thiểu 05 năm kể từ ngày giao dịch thành công để phục vụ công tác quyết toán thuế thu nhập cá nhân của Admin theo luật thuế Việt Nam. Dữ liệu hóa đơn này được lưu trữ nội bộ riêng biệt và hoàn toàn không liên quan đến dữ liệu của các Thành viên sử dụng Bio Link miễn phí.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground text-xs">
                      d) Quy Tắc Lưu Trữ Đặc Biệt Đối Với Dữ Liệu Trò Chuyện HugoPSY (Quy Tắc 7 Ngày):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Để giảm thiểu rủi ro lưu trữ dữ liệu nhạy cảm về sức khỏe tinh thần lâu dài, toàn bộ <strong>nội dung trò chuyện thô (Raw Chat)</strong> giữa Thành viên và HugoPSY chỉ được hệ thống giữ lại trong vòng <strong>07 ngày gần nhất</strong>. Mỗi khi tải lại phiên trò chuyện, hệ thống tự động quét và xóa vĩnh viễn không thể phục hồi mọi tin nhắn cũ hơn 7 ngày khỏi bộ nhớ lưu trữ của Thành viên.
                      <br />
                      - Riêng các <strong>chỉ số đã lượng hóa</strong> (điểm số bài test, nhãn tâm trạng, streak điểm danh) không thuộc diện bị xóa theo quy tắc 7 ngày này — các chỉ số này được lưu trữ dài hạn dưới dạng số liệu nhằm phục vụ tính năng "ghi nhớ hành trình" cá nhân hóa, theo đúng cơ chế kỹ thuật và phạm vi được mô tả chi tiết tại Chương XIV.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 7 */}
            <section id="chuong-7" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">credit_card</span>
                Chương VII: Quy Chế Thanh Toán Dịch Vụ Studio Cá Nhân & Tuyên Bố Miễn Trừ Thương Mại Điện Tử
              </h2>
              <div className="space-y-4">
                <p>
                  Nhằm làm rõ bản chất phi thương mại điện tử của website và phân tách hoàn toàn các hoạt động thanh toán nội bộ của cá nhân Admin khỏi các tính năng công cụ miễn phí cung cấp cho Thành viên, chúng tôi tuyên bố quy chế tài chính như sau:
                </p>

                <div className="bg-muted border border-border p-6 rounded-2xl space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-450">
                      a) Khẳng định Nền tảng miễn phí 100% - Không quản lý, mua bán gói dịch vụ:
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Hugo Studio khẳng định cung cấp 100% các gói tài khoản (Plus, VIP, Student) và các công cụ kéo thả, Bento blocks cho người sử dụng hoàn toàn **miễn phí**. Website hoàn toàn không tích hợp chức năng mua bán gói dịch vụ phần mềm trực tuyến, không khóa tính năng thu tiền, không bán đặc quyền tài khoản số cho Thành viên đại trà.
                      <br />
                      - Thành viên đăng ký tài khoản không phải chịu bất kỳ nghĩa vụ tài chính nào để sử dụng các tính năng thiết kế hồ sơ năng lực cá nhân.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-450">
                      b) Bản chất Cổng thanh toán tích hợp (Công cụ lập hóa đơn dịch vụ Studio cá nhân ngoài đời thực của Admin):
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Phân hệ tạo liên kết thanh toán VietQR trên hệ thống (kết nối API với cổng đối tác PayOS) được thiết kế và sử dụng **như một công cụ lập hóa đơn và theo dõi công nợ nội bộ dành riêng cho cá nhân Admin** (Peter Hugo Wishpax Le).
                      <br />
                      - Công cụ này được dùng khi Admin thực hiện các dự án thiết kế mỹ thuật, nghệ thuật hoặc thực hiện các hợp đồng chụp ảnh thực tế ngoài đời thực cho các đối tác/khách hàng cá nhân của Admin. Admin sẽ tự tạo link thanh toán VietQR từ hệ thống và gửi đường dẫn trực tiếp cho khách hàng của mình để thanh toán tiền công chụp ảnh, thiết kế mỹ thuật vào tài khoản ngân hàng cá nhân của Admin.
                      <br />
                      - Dòng tiền giao dịch trên hoàn toàn là giao dịch thanh toán dịch vụ cá nhân tự doanh ngoại tuyến của Admin, không phát sinh từ hoạt động kinh doanh trực tuyến trên website Hugo Studio. Vì vậy, website hoàn toàn **miễn trừ phạm vi điều chỉnh của Nghị định 52/2013/NĐ-CP và không thuộc diện phải thông báo hay đăng ký website thương mại điện tử với Bộ Công Thương**.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-red-550">
                      c) Cam kết tuyệt đối Phi Trung gian thanh toán (Không thu hộ / Không chi hộ):
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Hugo Studio cam kết tuyệt đối: **Không thực hiện hoạt động thu hộ tiền; Không chi hộ tiền; Không hỗ trợ nhận chuyển tiền trung gian; Không làm đại lý thu gom tiền trực tuyến; Không nhận ủy thác giữ tiền hay thanh toán hộ** cho bất kỳ thành viên hay bên thứ ba nào.
                      <br />
                      - Khách hàng khi thực hiện đặt lịch hẹn (Booking) với Thành viên trên trang Bio Link công cộng tuyệt đối không thực hiện bất kỳ giao dịch chuyển tiền trực tiếp nào thông qua máy chủ của Hugo Studio. Mọi giao dịch tài chính, thanh toán cát-xê công việc giữa Khách hàng và Thành viên phải được thực hiện độc lập, trực tiếp thông qua các kênh thanh toán riêng của họ ngoài phạm vi kiểm soát của Hugo Studio.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      d) Bảo mật dữ liệu giao dịch thẻ ngân hàng theo Tiêu chuẩn PCI DSS:
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Khi khách hàng trực tiếp của Admin thực hiện thanh toán hóa đơn dịch vụ chụp ảnh/nghệ thuật thông qua mã QR, toàn bộ quy trình xử lý thông tin tài chính đều được chuyển hướng xử lý trực tiếp bởi đối tác trung gian được cấp phép (PayOS).
                      <br />
                      - Hệ thống máy chủ của Hugo Studio cam kết tuyệt đối **không thu thập, không xử lý, không ghi chép, không lưu trữ** bất kỳ thông tin nhạy cảm nào liên quan đến tài khoản ngân hàng cá nhân, số thẻ tín dụng/thẻ ghi nợ quốc tế (Visa, Mastercard, JCB), ngày hết hạn thẻ, hoặc mã số bảo mật CVV/CVC của người dùng. Quy trình xử lý thông tin tài chính này tuân thủ hoàn toàn tiêu chuẩn an toàn bảo mật dữ liệu thẻ quốc tế <strong>PCI DSS</strong> của đối tác PayOS.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-red-550">
                      e) Quyết toán Thuế cá nhân tự doanh và Miễn trừ nghĩa vụ hóa đơn thương mại doanh nghiệp:
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Do các khoản thanh toán được thực hiện trực tiếp vào tài khoản cá nhân của Admin để chi trả cho các dịch vụ nhiếp ảnh/thiết kế mỹ thuật tự doanh, các giao dịch này sẽ được khai báo và quyết toán thuế thu nhập cá nhân tự doanh của Admin theo quy định của pháp luật thuế Việt Nam.
                      <br />
                      - Hệ thống Hugo Studio **không phải là doanh nghiệp và không có nghĩa vụ xuất hóa đơn Giá trị gia tăng (VAT - Hóa đơn đỏ)**. Thay vào đó, biên lai điện tử (Receipt) sẽ được hiển thị trực tiếp để làm căn cứ đối soát giao dịch thành công.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 8 */}
            <section id="chuong-8" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">shield_heart</span>
                Chương VIII: Cam Kết Bảo Mật Tuyệt Đối & Chống Thương Mại Hóa Dữ Liệu
              </h2>
              <div className="space-y-4">
                <p>
                  Quyền riêng tư của người sử dụng là tài sản vô giá và là nguyên tắc đạo đức nghề nghiệp cao nhất trong quá trình vận hành hệ thống Hugo Studio. Chúng tôi cam kết bảo mật dữ liệu của bạn thông qua các tuyên bố pháp lý đanh thép sau:
                </p>

                <div className="space-y-4 pl-4 border-l-2 border-rose-500 text-xs">
                  <p>
                    <strong>a) Cam kết chống thương mại hóa thông tin (Anti-Data Monetization):</strong>
                    <br />
                    Ban quản trị Hugo Studio cam kết tuyệt đối không bán, không cho thuê, không trao đổi, không chia sẻ, không chuyển giao, không tiết lộ dữ liệu cá nhân của bất kỳ Thành viên hay Khách hàng nào cho bất kỳ công ty quảng cáo, đơn vị tiếp thị sản phẩm, tổ chức nghiên cứu thị trường hay bên thứ ba nào khác vì mục đích thương mại hoặc lợi ích tài chính dưới mọi hình thức.
                  </p>

                  <p>
                    <strong>b) Trường hợp ngoại lệ cung cấp thông tin cho Cơ quan Nhà nước có thẩm quyền:</strong>
                    <br />
                    Dữ liệu cá nhân lưu trữ trên máy chủ Hugo Studio chỉ được phép cung cấp hoặc trích xuất cho bên thứ ba khi có văn bản yêu cầu chính thức, hợp pháp từ các cơ quan bảo vệ pháp luật của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam (bao gồm Cơ quan Điều tra An ninh, Cơ quan Cảnh sát điều tra, Tòa án nhân dân các cấp, Viện kiểm sát nhân dân) trong các trường hợp liên quan đến hoạt động điều tra tội phạm công nghệ cao, lừa đảo chiếm đoạt tài sản, đe dọa an ninh quốc gia hoặc vi phạm pháp luật hình sự khác. Trình tự cung cấp thông tin sẽ được Admin kiểm soát nghiêm ngặt nhằm đảm bảo tuân thủ đúng quy định của Bộ luật Tố tụng Hình sự hiện hành.
                  </p>

                  <p>
                    <strong>b.1) Trường hợp ngoại lệ duy nhất khác — Chuyển giao tối giản dữ liệu cho AI bên thứ ba phục vụ HugoPSY:</strong>
                    <br />
                    Để vận hành tính năng trò chuyện AI của HugoPSY, một phần nội dung tương tác buộc phải được gửi tới máy chủ của nhà cung cấp mô hình ngôn ngữ lớn bên thứ ba (Google Gemini API, dự phòng OpenRouter). Đây là ngoại lệ chuyển giao dữ liệu duy nhất ngoài trường hợp yêu cầu của cơ quan nhà nước, và được kiểm soát bằng nguyên tắc tối giản hóa nghiêm ngặt: hệ thống <strong>tuyệt đối không</strong> gửi đi email, số điện thoại, địa chỉ, ngày sinh đầy đủ, số đo hình thể, học vấn, kỹ năng hay bất kỳ định danh cá nhân trực tiếp nào khác trong bio hồ sơ của Thành viên tới các nhà cung cấp này. Chỉ duy nhất tên hiển thị, một số tuổi được suy ra (không kèm ngày sinh) và một đoạn tóm tắt chỉ số sức khỏe tinh thần đã được tổng hợp ẩn danh mới được phép xuất hiện trong dữ liệu gửi đi. Quy chế đầy đủ về việc này được quy định chi tiết, không thể sửa đổi đơn phương, tại <em>Chương XIV</em> của văn bản này.
                  </p>

                  <p>
                    <strong>c) Quy trình xử lý và Ứng phó sự cố rò rỉ dữ liệu (Data Breach Protocol):</strong>
                    <br />
                    - Ngay khi phát hiện hệ thống máy chủ bị xâm nhập trái phép hoặc xảy ra sự cố kỹ thuật dẫn đến rò rỉ dữ liệu cá nhân của người dùng, Ban quản trị sẽ kích hoạt Quy trình ứng phó khẩn cấp trong vòng 02 giờ bao gồm:
                    <br />
                    &nbsp;&nbsp;+ Cô lập cơ sở dữ liệu bị ảnh hưởng, khóa các cổng kết nối API và vá lỗ hổng bảo mật rò rỉ mã nguồn.
                    <br />
                    &nbsp;&nbsp;+ Trong vòng 72 giờ kể từ thời điểm phát hiện sự cố, thực hiện gửi báo cáo bằng văn bản về tình hình sự cố cho Cục An ninh mạng và Phòng, chống tội phạm sử dụng công nghệ cao trực thuộc Bộ Công an theo đúng quy định tại Nghị định 13/2023/NĐ-CP.
                    <br />
                    &nbsp;&nbsp;+ Thực hiện gửi thông báo cảnh báo khẩn cấp cho tất cả các Thành viên có nguy cơ bị ảnh hưởng thông qua địa chỉ Email đã đăng ký để hướng dẫn Thành viên thực hiện quy trình đổi mật khẩu tài khoản và áp dụng các biện pháp tự bảo vệ thông tin.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 9 */}
            <section id="chuong-9" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                Chương IX: Quyền & Nghĩa Vụ Hợp Pháp Của Chủ Thể Dữ Liệu
              </h2>
              <div className="space-y-4">
                <p>
                  Theo quy định tại Điều 9 của Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và các tiêu chuẩn bảo mật quốc tế như GDPR, Thành viên và Khách hàng tương tác trên hệ thống Hugo Studio được bảo đảm các quyền hợp pháp sau đây đối với thông tin cá nhân của mình:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-muted rounded-xl border border-border space-y-1">
                    <h6 className="font-bold text-foreground uppercase tracking-wider">1. Quyền được biết & Quyền đồng ý:</h6>
                    <p className="text-justify text-muted-foreground">
                      Người dùng có quyền được biết rõ ràng, chi tiết mục đích, phạm vi thu thập, phương thức xử lý dữ liệu cá nhân của mình thông qua văn bản này. Mọi hành vi xử lý dữ liệu chỉ được thực hiện khi có sự đồng ý tự nguyện của người dùng bằng cách chủ động tích chọn hộp kiểm đồng ý khi đăng ký tài khoản.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-xl border border-border space-y-1">
                    <h6 className="font-bold text-foreground uppercase tracking-wider">2. Quyền truy cập, chỉnh sửa & Đính chính dữ liệu:</h6>
                    <p className="text-justify text-muted-foreground">
                      Thành viên có quyền đăng nhập vào giao diện quản trị Dashboard cá nhân vào bất kỳ thời điểm nào để xem lại dữ liệu đang lưu trữ trên máy chủ, tự đính chính thông tin bị sai sót (như thay đổi họ tên hiển thị, cập nhật lại số điện thoại Zalo, chỉnh sửa các liên kết mạng xã hội hoặc cập nhật lại số đo cơ thể).
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-xl border border-border space-y-1">
                    <h6 className="font-bold text-foreground uppercase tracking-wider">3. Quyền rút lại sự đồng ý & Quyền yêu cầu xóa:</h6>
                    <p className="text-justify text-muted-foreground">
                      Người dùng có quyền rút lại sự đồng ý cho phép xử lý dữ liệu bất cứ lúc nào bằng cách gửi yêu cầu hủy tài khoản trực tuyến hoặc liên hệ qua kênh hỗ trợ của Admin. Sau khi nhận được yêu cầu, hệ thống cam kết sẽ thực hiện quy trình xóa bỏ dữ liệu vĩnh viễn (Hard Delete) theo đúng thời hạn 30 ngày quy định tại Chương VI.
                    </p>
                  </div>

                  <div className="p-4 bg-muted rounded-xl border border-border space-y-1">
                    <h6 className="font-bold text-foreground uppercase tracking-wider">4. Quyền khiếu nại, tố cáo & Khởi kiện:</h6>
                    <p className="text-justify text-muted-foreground">
                      Người dùng có quyền khiếu nại trực tiếp đến Admin nếu phát hiện dữ liệu của mình bị xử lý sai mục đích cam kết. Ngoài ra, người dùng có quyền gửi đơn tố cáo đến các cơ quan quản lý chuyên trách về bảo vệ dữ liệu cá nhân hoặc khởi kiện ra Tòa án nhân dân để đòi bồi thường thiệt hại thực tế phát sinh.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <h4 className="font-bold text-foreground uppercase tracking-wider">
                    Nghĩa vụ đi kèm của Chủ thể dữ liệu:
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-justify">
                    Để hệ thống hoạt động an toàn và bảo vệ quyền lợi chung, Thành viên đồng ý cam kết thực hiện các nghĩa vụ sau:
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 text-justify space-y-1">
                    <li>Cung cấp thông tin cá nhân đầy đủ, chính xác, trung thực khi đăng ký tài khoản. Tuyệt đối không mạo danh tên tuổi, email, số điện thoại hoặc số đo cơ thể của người khác nhằm mục đích lừa đảo, trục lợi hoặc bôi nhọ uy tín cá nhân đó.</li>
                    <li>Có trách nhiệm chủ động tự bảo mật thông tin mật khẩu đăng nhập, bảo quản thiết bị cá nhân an toàn và không chia sẻ tài khoản đăng nhập cho bất kỳ ai.</li>
                    <li>Tôn trọng quyền riêng tư và dữ liệu cá nhân của các Thành viên khác trên hệ thống. Tuyệt đối không sử dụng các công cụ tự động (cào dữ liệu, crawler) để quét thông tin số điện thoại, hình ảnh hoặc số đo hình thể của các Thành viên khác khi chưa được sự đồng ý của họ.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 10 */}
            <section id="chuong-10" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">block</span>
                Chương X: Giới Hạn & Miễn Trừ Trách Nhiệm Pháp Lý Của Hệ Thống
              </h2>
              <div className="space-y-4">
                <p>
                  Ban quản trị luôn nỗ lực tối đa để bảo vệ an toàn cho hệ thống và thông tin người dùng, tuy nhiên người dùng đồng ý và chấp nhận miễn trừ trách nhiệm pháp lý cho cá nhân Admin của Hugo Studio trong các trường hợp sau:
                </p>

                <div className="space-y-3.5 text-xs text-justify">
                  <p>
                    <strong>1. Sự cố bất khả kháng (Force Majeure Event):</strong>
                    <br />
                    Là các sự cố nằm ngoài tầm kiểm soát kỹ thuật hợp lý của con người bao gồm: Thiên tai, động đất, lũ lụt, chiến tranh, dịch bệnh hoành hành diện rộng; Sự cố đứt cáp quang biển quốc tế làm gián đoạn kết nối Internet; Sự cố sập nguồn điện lưới quốc gia ảnh hưởng đến hoạt động của các trung tâm dữ liệu vật lý (Data Centers) nơi đặt máy chủ lưu trữ; Hoặc các cuộc tấn công mạng quy mô lớn vượt quá khả năng phòng vệ kỹ thuật tiên tiến nhất được chứng minh bằng văn bản xác thực sự cố của nhà cung cấp dịch vụ máy chủ đám mây.
                  </p>

                  <p>
                    <strong>2. Sự cố do lỗi sơ suất tự quản lý từ phía Thành viên:</strong>
                    <br />
                    Chúng tôi hoàn toàn miễn trừ trách nhiệm pháp lý đối với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào liên quan đến việc rò rỉ dữ liệu cá nhân, mất quyền kiểm soát tài khoản, thay đổi nội dung Bio Link hoặc bị xóa tài khoản do hành vi sơ suất tự quản lý của Thành viên bao gồm:
                    <br />
                    - Đăng nhập tài khoản trên thiết bị công cộng mà quên đăng xuất.
                    <br />
                    - Tự ý chia sẻ mật khẩu đăng nhập hoặc mã xác thực OTP gửi qua email cho người khác.
                    <br />
                    - Thiết lập mật khẩu quá đơn giản, dễ đoán (ví dụ: trùng tên tài khoản, sử dụng các chuỗi số liên tục `123456`, ngày sinh của bản thân) khiến hệ thống dễ bị tấn công dò tìm mật khẩu (brute-force).
                  </p>

                  <p>
                    <strong>3. Các tranh chấp giao kết hợp đồng và Tài chính ngoài hệ thống:</strong>
                    <br />
                    Hugo Studio tuyên bố miễn trừ hoàn toàn trách nhiệm giải quyết tranh chấp dân sự, kinh tế hoặc hình sự phát sinh giữa Thành viên và Khách hàng liên quan đến các thỏa thuận công việc, đặt lịch diễn, chất lượng dịch vụ, chậm trễ lịch hẹn, hoặc hành vi lừa đảo chiếm đoạt tiền đặt cọc phát sinh từ việc sử dụng phân hệ Booking. Mọi tranh chấp này phải được hai bên tự thương lượng giải quyết hoặc đưa ra cơ quan công an có thẩm quyền theo quy định của Bộ luật Dân sự hiện hành.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 11 */}
            <section id="chuong-11" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">balance</span>
                Chương XI: Luật Áp Dụng & Cơ Chế Giải Quyết Tranh Chấp Pháp Lý
              </h2>
              <div className="space-y-4">
                <p>
                  Toàn bộ nội dung của văn bản Điều khoản sử dụng và Chính sách Bảo mật này được giải thích, điều chỉnh và áp dụng duy nhất theo hệ thống pháp luật hiện hành của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                </p>
                <p className="text-xs text-justify">
                  Mọi tranh chấp phát sinh trong quá trình sử dụng dịch vụ giữa Thành viên và Ban quản trị hệ thống trước hết sẽ được ưu tiên giải quyết thông qua cơ chế thương lượng, hòa giải thiện chí trên tinh thần tôn trọng quyền lợi của cả hai bên.
                  <br />
                  Trong trường hợp hai bên không thể tự đạt được thỏa thuận hòa giải trong vòng ba mươi (30) ngày kể từ ngày một bên gửi thông báo chính thức bằng văn bản về vụ việc tranh chấp, một trong giải pháp là đưa vụ việc ra khởi kiện tại **Tòa án Nhân dân có thẩm quyền tại Việt Nam** để phân xử theo trình tự và thủ tục do pháp luật tố tụng dân sự Việt Nam quy định. Quyết định cuối cùng có hiệu lực pháp lý của Tòa án là phán quyết bắt buộc thi hành đối với cả hai bên. Chi phí liên quan đến án phí và các chi phí hỗ trợ pháp lý hợp lý khác sẽ do bên thua kiện chịu trách nhiệm chi trả toàn bộ, trừ trường hợp Tòa án có phán quyết phân bổ chi phí khác.
                </p>
              </div>
            </section>

            {/* CHƯƠNG 12 */}
            <section id="chuong-12" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">mail</span>
                Chương XII: Điều Khoản Thi Hành & Thông Tin Liên Hệ Yêu Cầu Khử Dữ Liệu
              </h2>
              <div className="space-y-4">
                <p>
                  Quy chế sử dụng này bắt đầu có hiệu lực thi hành đầy đủ kể từ thời điểm được đăng tải công khai trên trang web chính thức của Hugo Studio. Ban quản trị hệ thống giữ toàn quyền sửa đổi, bổ sung các nội dung của Quy chế này vào bất kỳ thời điểm nào nhằm cập nhật theo sự thay đổi của các văn bản pháp luật Việt Nam hoặc khi có sự nâng cấp các tính năng kỹ thuật mới.
                </p>
                <p className="text-xs text-justify">
                  Khi có sự sửa đổi nội dung quy chế, ban quản trị sẽ cập nhật ngày ban hành ở đầu trang và đăng thông báo công khai nổi bật tại trang quản trị Dashboard của Thành viên. Việc Thành viên tiếp tục duy trì hoạt động tài khoản và sử dụng dịch vụ sau khi các nội dung sửa đổi được đăng tải đồng nghĩa với việc chấp thuận hoàn toàn các nội dung sửa đổi bổ sung đó.
                </p>

                <div className="p-6 rounded-2xl bg-muted border border-border space-y-4">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-xs sm:text-sm">
                    Thông tin liên hệ chính thức thực thi quyền bảo vệ dữ liệu cá nhân:
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Để thực hiện các quyền chủ thể dữ liệu cá nhân hợp pháp của mình (bao gồm: yêu cầu đính chính dữ liệu bị sai sót, yêu cầu xuất bản sao dữ liệu cá nhân để chuyển đi, rút lại sự đồng ý xử lý thông tin hoặc yêu cầu xóa bỏ tài khoản vĩnh viễn khỏi cơ sở dữ liệu), Thành viên vui lòng gửi email yêu cầu chính thức hoặc nhắn tin trực tiếp đến bộ phận hỗ trợ kỹ thuật vận hành bởi cá nhân Admin duy nhất:
                  </p>
                  
                  <div className="space-y-2 pt-1 text-xs font-mono">
                    <p className="flex items-center gap-2 text-primary dark:text-primary">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      <span>Địa chỉ Email liên hệ: {data?.profile?.emailAddress || "support@hugowishpax.studio"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-455">
                      <span className="material-symbols-outlined text-sm">chat</span>
                      <span>Kênh Zalo hỗ trợ kỹ thuật: {data?.profile?.zaloNumber || "0901234567"}</span>
                    </p>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic border-t border-slate-200 dark:border-slate-800 pt-3 text-justify">
                    * Cam kết xử lý yêu cầu (SLA): Cá nhân Admin duy nhất phụ trách kỹ thuật cam kết sẽ tiếp nhận, đối soát thông tin tài khoản của người gửi yêu cầu nhằm tránh mạo danh và thực hiện xử lý kỹ thuật, phản hồi bằng văn bản hoặc thư điện tử xác nhận hoàn tất yêu cầu đính chính, rút lại sự đồng ý hoặc xóa dữ liệu của Thành viên trong thời hạn tối đa ba (03) ngày làm việc kể từ thời điểm nhận được yêu cầu hợp lệ.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 13 */}
            <section id="chuong-13" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">stadia_controller</span>
                Chương XIII: Hệ Sinh Thái JOY, Trò Chơi Hóa (HugoArcade/HugoChess) & Quà Tặng
              </h2>
              <div className="space-y-4">
                <p>
                  Nhằm tăng sự gắn kết và mang lại trải nghiệm giải trí lành mạnh cho Thành viên, Hugo Studio xây dựng một hệ sinh thái trò chơi hóa (Gamification) xoay quanh đơn vị điểm nội bộ <strong>JOY</strong>. Chương này quy định chi tiết, minh bạch và dứt khoát bản chất phi tài chính của toàn bộ hệ sinh thái này.
                </p>

                <div className="space-y-4 text-xs">
                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-red-550">
                      a) Tuyên bố pháp lý cốt lõi: JOY không phải là tiền, không phải tài sản số:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - JOY là điểm số ghi nhận tương tác nội bộ, tồn tại duy nhất trong phạm vi cơ sở dữ liệu của Hugo Studio, không được phát hành dưới dạng token blockchain, không được niêm yết trên bất kỳ sàn giao dịch nào, và <strong>không thể mua bằng tiền thật, không thể bán lại, không thể rút ra thành tiền mặt hoặc bất kỳ tài sản có giá trị quy đổi nào</strong>.
                      <br />
                      - Vì không có giá trị quy đổi tiền thật và không được mua bán trao đổi với bên ngoài, JOY và toàn bộ tính năng liên quan <strong>không thuộc phạm vi điều chỉnh</strong> của các quy định pháp luật về tiền điện tử, ví điện tử trung gian thanh toán (Thông tư 39/2014/TT-NHNN, Thông tư 23/2019/TT-NHNN) hay các quy định về kinh doanh đặt cược, cá cược, trò chơi có thưởng (Nghị định 06/2017/NĐ-CP). Hugo Studio cam kết không bao giờ phát triển cơ chế nạp tiền thật để mua JOY hoặc đổi JOY ra tiền thật trong tương lai dưới mô hình hiện tại.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      b) Cách thức tích lũy JOY:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      Thành viên tích lũy JOY thông qua các hoạt động hoàn toàn miễn phí và tự nguyện: chơi các minigame tại HugoArcade (2048, rắn săn mồi, sinh tồn, đoán từ, v.v.), thi đấu cờ vua tại HugoChess, điểm danh hằng ngày, hoàn thành nhiệm vụ đồng hành với HugoPSY, hoặc các sự kiện khuyến khích tương tác khác do Admin chủ động tổ chức theo từng giai đoạn.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      c) Thẻ Quà Tặng JOY (JOY Gift Card) & Sổ Cái Giao Dịch Nội Bộ (JOY Ledger):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Thành viên có thể sử dụng JOY đã tích lũy để đổi lấy các vật phẩm trang trí hồ sơ, hiệu ứng giao diện hoặc thẻ quà tặng nội bộ (JOY Gift Card) mang tính biểu trưng/giải trí trong phạm vi hệ thống. Mọi giao dịch cộng/trừ JOY đều được ghi lại đầy đủ trong sổ cái nội bộ (JOY Ledger) gắn với tài khoản Thành viên để phục vụ minh bạch hóa lịch sử điểm số khi có khiếu nại hoặc tra soát.
                      <br />
                      - JOY Gift Card không có giá trị sử dụng ngoài hệ thống Hugo Studio và không được bảo đảm quy đổi nếu tài khoản bị khóa do vi phạm Điều khoản tại Chương III. Việc chuyển nhượng JOY/JOY Gift Card giữa các tài khoản — nếu có — chỉ được thực hiện thông qua chính cơ chế chuyển nhượng nội bộ do Admin chủ động thiết kế và kiểm soát trực tiếp trên hệ thống (nếu được mở), tuyệt đối không thông qua bất kỳ thỏa thuận, giao dịch hay trung gian nào ngoài hệ thống — xem nguyên tắc cấm mua bán cá nhân chi tiết tại điểm (d) dưới đây.
                    </p>
                  </div>

                  <div className="p-6 bg-red-500/5 rounded-2xl border-2 border-red-500/30 space-y-3">
                    <h5 className="font-black text-red-600 dark:text-red-450 uppercase tracking-wider text-[12px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">block</span>
                      d) Cấm Tuyệt Đối Hành Vi Mua Bán, Trao Đổi, Quy Đổi JOY Giữa Các Cá Nhân (Anti Peer-to-Peer Trading):
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 text-justify font-semibold">
                      Hugo Studio tuyên bố dứt khoát: <strong>không chấp thuận, không công nhận và không bảo vệ về mặt pháp lý</strong> dưới bất kỳ hình thức nào đối với các giao dịch dân sự tự phát giữa hai hay nhiều Thành viên nhằm mua bán, trao đổi, quy đổi điểm JOY hoặc JOY Gift Card lấy tiền mặt, chuyển khoản ngân hàng, thẻ nạp điện thoại, hàng hóa, dịch vụ hoặc bất kỳ lợi ích vật chất nào khác ngoài phạm vi kỹ thuật do Admin trực tiếp kiểm soát.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-justify">
                      <li>
                        <strong>Nghiêm cấm các hành vi cụ thể sau:</strong> rao bán JOY/JOY Gift Card lấy tiền thật trên hệ thống Hugo Studio hoặc trên bất kỳ nền tảng mạng xã hội/diễn đàn/nhóm chat bên ngoài nào; nhận chuyển khoản hoặc thanh toán hộ để "tặng" JOY cho người khác; thỏa thuận đổi JOY ngang giá với tiền tệ hoặc tài sản số khác (tiền điện tử, voucher, thẻ game); lập nhiều tài khoản giả (tài khoản rác) để cày JOY rồi gộp/bán lại cho tài khoản khác nhằm mục đích thương mại hóa.
                      </li>
                      <li>
                        <strong>Lý do của lệnh cấm:</strong> JOY được thiết kế là đặc quyền khích lệ giải trí nội bộ, miễn phí, không có giá trị quy đổi pháp lý (xem điểm a). Việc cho phép cá nhân tự ý mua bán sẽ biến JOY thành một dạng "tiền ảo trá hình" ngoài tầm kiểm soát của Admin, kéo theo rủi ro gian lận giữa các Thành viên, rủi ro bị xếp vào nhóm hoạt động cờ bạc/kinh doanh tiền ảo trái phép theo pháp luật Việt Nam, và xung đột trực tiếp với tuyên bố pháp lý tại điểm (a) của chương này.
                      </li>
                      <li>
                        <strong>Chế tài xử lý vi phạm:</strong> Khi phát hiện hoặc nhận được báo cáo hợp lý về hành vi mua bán JOY giữa các cá nhân, Admin có quyền, không cần báo trước: tịch thu (trừ về 0) toàn bộ số dư JOY liên quan đến giao dịch vi phạm của các tài khoản tham gia; tạm khóa hoặc chấm dứt vĩnh viễn tài khoản của các bên liên quan theo mức độ vi phạm; và từ chối giải quyết mọi khiếu nại tài chính phát sinh từ các giao dịch mua bán JOY tự phát đó, do bản chất các giao dịch này không được Hugo Studio công nhận là hợp pháp ngay từ đầu.
                      </li>
                      <li>
                        <strong>Miễn trừ trách nhiệm của Admin đối với tranh chấp dân sự giữa các cá nhân:</strong> Mọi tổn thất tài chính phát sinh từ việc một Thành viên tự ý chuyển tiền thật cho Thành viên khác để "mua" JOY — bao gồm cả trường hợp bị lừa đảo, không nhận được JOY như thỏa thuận — là tranh chấp dân sự thuần túy giữa các cá nhân, nằm hoàn toàn ngoài phạm vi kiểm soát và trách nhiệm pháp lý của Admin/Hugo Studio, tương tự nguyên tắc miễn trừ đã quy định đối với phân hệ Booking tại Chương III.
                      </li>
                    </ol>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      e) Tính năng Donate/Ủng hộ (Tip/Buy Me A Coffee) cho cá nhân Admin:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Tiện ích widget donate hiển thị trên giao diện cho phép người dùng tự nguyện gửi một khoản ủng hộ nhỏ trực tiếp cho cá nhân Admin nhằm duy trì chi phí vận hành hạ tầng máy chủ (bao gồm cả chi phí gọi API AI cho HugoPSY). Đây là hành vi tặng cho tự nguyện mang tính dân sự cá nhân, không phải giao dịch mua bán hàng hóa/dịch vụ, không phát sinh nghĩa vụ đối ứng nào từ phía Admin, và hoàn toàn tách biệt khỏi cơ chế JOY.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      f) Quyền điều chỉnh và miễn trừ bảo đảm về JOY:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Admin giữ toàn quyền điều chỉnh tỷ lệ tích điểm, danh mục vật phẩm đổi thưởng, hoặc tạm ngưng/chấm dứt toàn bộ hệ thống JOY vào bất kỳ thời điểm nào vì lý do kỹ thuật hoặc vận hành mà không phát sinh nghĩa vụ bồi thường cho Thành viên, do bản chất JOY là đặc quyền khích lệ giải trí miễn phí, không phải tài sản được pháp luật bảo hộ như tài sản dân sự thông thường.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 14 */}
            <section id="chuong-14" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">psychology</span>
                Chương XIV: Trợ Lý AI HugoPSY, Dữ Liệu Sức Khỏe Tinh Thần & Bên Xử Lý AI Bên Thứ Ba
              </h2>
              <div className="space-y-4">
                <p>
                  Đây là chương quan trọng nhất liên quan đến quyền riêng tư của Thành viên khi sử dụng HugoPSY. Do dữ liệu sức khỏe tinh thần được xếp vào nhóm <strong>dữ liệu cá nhân nhạy cảm</strong> theo <em>Điều 16, Nghị định 13/2023/NĐ-CP</em>, Hugo Studio cam kết áp dụng các biện pháp bảo vệ nghiêm ngặt hơn mức tiêu chuẩn thông thường, được công khai minh bạch tuyệt đối tại chương này.
                </p>

                <div className="space-y-4 text-xs">
                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-450">
                      a) Kiến trúc xử lý hai lớp — Ưu tiên tối đa xử lý nội bộ (Local-First):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Phần lớn các lượt trò chuyện với HugoPSY được xử lý hoàn toàn bằng một bộ phân loại ý định cục bộ (Local Intent Classifier) chạy trên hạ tầng do Hugo Studio kiểm soát trực tiếp, dựa trên hơn 30 nhóm chủ đề tâm lý — cô đơn, mâu thuẫn gia đình/bạn bè, chia tay, tự ti, trì hoãn, nóng giận, hoảng loạn, mất mát, lo âu tương lai và nhiều chủ đề khác — mà <strong>không cần gửi bất kỳ dữ liệu nào ra bên ngoài hệ thống</strong>.
                      <br />
                      - Chỉ khi không có chủ đề cục bộ phù hợp, hệ thống mới chuyển tiếp yêu cầu tới mô hình AI bên thứ ba để sinh phản hồi linh hoạt hơn, theo đúng nguyên tắc tối giản dữ liệu được quy định tại điểm (b) dưới đây.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-450">
                      a.1) Diễn giải chi tiết cơ chế vận hành kỹ thuật từng bước (How It Works):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      Để Thành viên hiểu rõ "phía sau" của một lượt trò chuyện với HugoPSY diễn ra như thế nào, Hugo Studio công khai minh bạch trình tự xử lý kỹ thuật như sau:
                      <br />
                      &nbsp;&nbsp;<strong>Bước 1 — Nhận diện ý định (Intent Classification):</strong> Khi Thành viên gửi một tin nhắn, hệ thống trước tiên chạy thuật toán so khớp văn bản nội bộ (dựa trên độ tương đồng song-gram Sørensen-Dice kết hợp các quy tắc biểu thức nhanh) để xác định tin nhắn có khớp với một trong hơn 30 chủ đề tâm lý đã được biên soạn sẵn hay không (cô đơn, mâu thuẫn gia đình/bạn bè, chia tay, tự ti, trì hoãn, nóng giận, hoảng loạn, mất mát, lo âu tương lai, sắp xếp không gian sống, chi tiêu có ý thức, v.v.).
                      <br />
                      &nbsp;&nbsp;<strong>Bước 2a — Khớp chủ đề cục bộ (đa số trường hợp):</strong> Nếu khớp, hệ thống trả lời ngay bằng nội dung đã biên soạn trước, được lập trình hiển thị thành 2-3 tin nhắn ngắn gửi liên tiếp có độ trễ ngẫu nhiên (giả lập cảm giác đang gõ chữ thật) nhằm tạo trải nghiệm gần gũi, tự nhiên hơn một khối văn bản dài. Toàn bộ quá trình này không phát sinh bất kỳ kết nối nào tới máy chủ AI bên thứ ba.
                      <br />
                      &nbsp;&nbsp;<strong>Bước 2b — Chuyển tiếp AI bên thứ ba (khi không khớp chủ đề cục bộ):</strong> Hệ thống dựng gói dữ liệu tối giản (xem điểm b), kèm tối đa 8 lượt trao đổi gần nhất và bản tóm tắt sức khỏe tinh thần, rồi gửi yêu cầu tới Google Gemini API. Phản hồi được truyền ngược về theo cơ chế truyền trực tuyến (streaming) — Thành viên thấy chữ xuất hiện dần thay vì chờ toàn bộ câu trả lời. Nếu Gemini gặp lỗi, hết hạn ngạch hoặc quá tải, hệ thống tự động chuyển sang gọi OpenRouter làm phương án dự phòng mà Thành viên không cần thực hiện thêm hành động nào.
                      <br />
                      &nbsp;&nbsp;<strong>Bước 3 — Hạn ngạch token cá nhân hóa:</strong> Mỗi tài khoản được cấp một hạn ngạch số lượt gọi AI bên thứ ba theo ngày/theo phiên (do Admin tự nguyện chi trả toàn bộ chi phí vận hành). Khi vượt hạn ngạch, hệ thống ưu tiên trả lời bằng các chủ đề cục bộ đã biên soạn sẵn hoặc thông báo Thành viên thử lại sau, không khóa tài khoản, không thu phí bổ sung.
                      <br />
                      &nbsp;&nbsp;<strong>Bước 4 — Ghi nhận chỉ số (không ghi nhận nội dung thô dài hạn):</strong> Nếu cuộc trò chuyện liên quan đến việc hoàn thành một bài kiểm tra sàng lọc (PHQ-9, GAD-7, WHO-5, Big Five) hoặc một lượt điểm danh tâm trạng, hệ thống trích xuất đúng con số kết quả để lưu vào nhật ký chỉ số dài hạn; nội dung chữ thô của cuộc trò chuyện vẫn tuân theo quy tắc xóa sau 7 ngày tại Chương VI.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-red-550">
                      b) Danh sách Bên xử lý AI bên thứ ba & Nguyên tắc tối giản dữ liệu tuyệt đối (Strict Allow-List):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Hugo Studio sử dụng <strong>Google Gemini API</strong> làm nhà cung cấp AI chính, và <strong>OpenRouter</strong> làm phương án dự phòng khi Gemini gặp sự cố hoặc vượt hạn ngạch. Cả hai đều là bên xử lý dữ liệu (Data Processor) độc lập, vận hành theo chính sách bảo mật riêng của họ đối với dữ liệu được gửi tới.
                      <br />
                      - Hệ thống tuyệt đối <strong>không gửi đi nguyên trạng hồ sơ (Bio) của Thành viên</strong>. Trước khi gửi bất kỳ yêu cầu nào tới AI bên thứ ba, hệ thống luôn dựng lại một gói dữ liệu tối giản theo cơ chế danh sách cho phép nghiêm ngặt (allow-list), chỉ chứa đúng ba (03) loại thông tin sau và không gì khác:
                      <br />
                      &nbsp;&nbsp;+ <strong>Tên hiển thị (Display Name)</strong> — không kèm họ tên đầy đủ trên giấy tờ nếu khác với tên hiển thị Thành viên tự đặt.
                      <br />
                      &nbsp;&nbsp;+ <strong>Một số tuổi được suy ra (Age)</strong> — được tính toán từ năm sinh ngay trên thiết bị/máy chủ nội bộ, sau đó loại bỏ hoàn toàn ngày, tháng sinh trước khi gửi đi; ngày sinh đầy đủ <strong>không bao giờ</strong> được chuyển tới AI bên thứ ba.
                      <br />
                      &nbsp;&nbsp;+ <strong>Tóm tắt sức khỏe tinh thần đã tổng hợp (Wellness Summary)</strong> — một đoạn văn bản ngắn do hệ thống tự sinh từ các chỉ số đã lượng hóa (streak điểm danh, tâm trạng gần nhất, điểm bài test gần nhất), không chứa nguyên văn nội dung trò chuyện.
                      <br />
                      - Các trường dữ liệu sau <strong>không bao giờ</strong> rời khỏi hệ thống nội bộ của Hugo Studio dưới bất kỳ hình thức nào: địa chỉ email, số điện thoại, địa chỉ nhà, ngày sinh đầy đủ, số đo hình thể, trình độ học vấn, kỹ năng cá nhân, chức danh công việc, đường dẫn trang Bio Link (slug) và ảnh đại diện. Mã định danh tài khoản (email) chỉ được dùng nội bộ phía máy chủ để giới hạn hạn ngạch token, không được đính kèm trong nội dung gửi tới AI.
                      <br />
                      - HugoPSY được lập trình với nguyên tắc bảo mật chủ động: AI <strong>không được phép chủ động hỏi xin</strong> số điện thoại, địa chỉ nhà hoặc ngày sinh của Thành viên trong bất kỳ tình huống trò chuyện nào.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      c) Lịch sử trò chuyện gửi kèm mỗi yêu cầu AI:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Để AI hiểu mạch trò chuyện, một số lượt trao đổi gần nhất (tối đa 8 lượt, nằm trong phạm vi dữ liệu 7 ngày tại Chương VI) được gửi kèm theo mỗi yêu cầu. Toàn bộ các nhà cung cấp AI bên thứ ba được lựa chọn dựa trên chính sách công khai của họ về việc không sử dụng dữ liệu API doanh nghiệp để huấn luyện lại mô hình nền tảng theo mặc định; Thành viên có quyền yêu cầu Admin cung cấp đường dẫn chính sách bảo mật hiện hành của các nhà cung cấp này khi có yêu cầu hợp lệ.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-450">
                      d) Cơ chế phát hiện khủng hoảng & Ưu tiên an toàn người dùng:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Khi hệ thống phát hiện các dấu hiệu ngôn từ liên quan đến khủng hoảng tâm lý nghiêm trọng hoặc nguy cơ tự gây hại, HugoPSY sẽ ưu tiên hiển thị nguyên vẹn, không chia nhỏ, không trì hoãn một thông điệp duy nhất chứa thông tin đường dây nóng hỗ trợ khẩn cấp và khuyến nghị tìm kiếm trợ giúp chuyên môn ngay lập tức, thay vì tiếp tục đối thoại thông thường.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      e) Quyền riêng tư đặc biệt đối với Thành viên là học sinh, sinh viên chưa đủ 18 tuổi:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Do phần lớn người dùng nền tảng là học sinh, sinh viên, Hugo Studio khuyến nghị Thành viên dưới 18 tuổi nên có sự đồng hành hoặc trao đổi với phụ huynh/người giám hộ về việc sử dụng HugoPSY khi gặp các vấn đề tâm lý nghiêm trọng, và cam kết không bao giờ sử dụng dữ liệu sức khỏe tinh thần thu thập được cho bất kỳ mục đích quảng cáo, phân tích hành vi thương mại hoặc bán cho bên thứ ba dưới mọi hình thức.
                    </p>
                  </div>

                  <div className="p-6 bg-red-500/5 rounded-2xl border-2 border-red-500/30 space-y-3">
                    <h5 className="font-black text-red-600 dark:text-red-450 uppercase tracking-wider text-[12px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">emergency</span>
                      f) Tuyên Bố Miễn Trừ Trách Nhiệm Y Khoa Toàn Diện & Dứt Khoát (Comprehensive Medical Disclaimer):
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 text-justify font-semibold">
                      Đây là tuyên bố pháp lý quan trọng nhất của toàn bộ Chương XIV. Bằng việc bắt đầu sử dụng tính năng HugoPSY, Thành viên xác nhận đã đọc, hiểu rõ và đồng ý vô điều kiện với toàn bộ nội dung miễn trừ dưới đây:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-justify">
                      <li>
                        <strong>HugoPSY không phải là dịch vụ y tế, không phải là bác sĩ, không phải là chuyên gia tâm lý được cấp phép hành nghề.</strong> Toàn bộ nội dung trả lời, lời khuyên, bài tập gợi ý, kết quả phân tích bài kiểm tra sàng lọc (PHQ-9, GAD-7, WHO-5, Big Five) do HugoPSY cung cấp — bất kể được tạo ra từ bộ phân loại ý định cục bộ hay từ mô hình AI bên thứ ba (Google Gemini/OpenRouter) — chỉ mang tính chất <strong>tham khảo, hỗ trợ tinh thần ban đầu và mang tính giải trí/đồng hành</strong>, hoàn toàn <strong>không cấu thành, không thay thế và không được hiểu là chẩn đoán y khoa, kết luận tâm thần học, kê đơn điều trị hay tư vấn chuyên môn chính thức</strong> dưới bất kỳ hình thức nào.
                      </li>
                      <li>
                        <strong>Bản chất xác suất của công nghệ trí tuệ nhân tạo:</strong> Thành viên hiểu và chấp nhận rằng mô hình ngôn ngữ lớn (Large Language Model) có thể đưa ra phản hồi không chính xác, lỗi thời, thiếu ngữ cảnh hoặc không phù hợp với tình huống cá nhân cụ thể (hiện tượng "ảo giác AI" - AI hallucination) do đặc tính kỹ thuật vốn có của công nghệ sinh văn bản dựa trên xác suất, không phải sự thấu hiểu y khoa thực sự của con người.
                      </li>
                      <li>
                        <strong>Tuyệt đối không trì hoãn việc thăm khám chuyên môn:</strong> Trong mọi trường hợp Thành viên có dấu hiệu rối loạn tâm lý nghiêm trọng, ý nghĩ hoặc hành vi tự gây hại, tự tử, loạn thần, hoặc bất kỳ tình trạng khẩn cấp về sức khỏe tâm thần nào, Thành viên có nghĩa vụ <strong>liên hệ ngay lập tức</strong> với bác sĩ tâm thần, chuyên gia tâm lý được cấp phép, cơ sở y tế gần nhất, đường dây nóng hỗ trợ khẩn cấp quốc gia, hoặc gọi số điện thoại cấp cứu <strong>115</strong>. Tuyệt đối không sử dụng HugoPSY là kênh duy nhất hoặc kênh thay thế cho việc can thiệp y tế khẩn cấp.
                      </li>
                      <li>
                        <strong>Miễn trừ trách nhiệm pháp lý của Admin:</strong> Cá nhân Admin và hệ thống Hugo Studio <strong>không chịu bất kỳ trách nhiệm pháp lý, dân sự hay hình sự nào</strong> đối với mọi hậu quả trực tiếp hoặc gián tiếp phát sinh từ việc Thành viên sử dụng, dựa vào, hoặc hành động theo nội dung phản hồi của HugoPSY, bao gồm nhưng không giới hạn ở: quyết định cá nhân về sức khỏe, tài chính, quan hệ xã hội, hoặc bất kỳ thiệt hại thực tế nào khác. Việc miễn trừ này không áp dụng đối với nghĩa vụ bảo mật dữ liệu cá nhân đã cam kết tại các điểm (a)-(e) phía trên.
                      </li>
                      <li>
                        <strong>Tính năng tự nguyện, không bắt buộc:</strong> Việc sử dụng HugoPSY là hoàn toàn tự nguyện. Thành viên có quyền ngừng sử dụng tính năng này vào bất kỳ thời điểm nào mà không ảnh hưởng đến các quyền lợi khác trên hệ thống Hugo Studio.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 15 */}
            <section id="chuong-15" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-primary">fingerprint</span>
                Chương XV: Đăng Nhập Sinh Trắc Học, Thông Báo Đẩy & Bảo Mật Thiết Bị
              </h2>
              <div className="space-y-4">
                <p>
                  Chương này quy định chi tiết về hai tính năng tiện ích nâng cao liên quan trực tiếp đến thiết bị cá nhân của Thành viên: đăng nhập sinh trắc học và thông báo đẩy.
                </p>

                <div className="space-y-4 text-xs">
                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-450">
                      a) Đăng nhập sinh trắc học theo chuẩn WebAuthn/FIDO2 — Không lưu trữ dữ liệu sinh trắc học gốc:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Khi Thành viên kích hoạt đăng nhập bằng vân tay hoặc khuôn mặt, toàn bộ quá trình xác thực sinh trắc học (quét vân tay, nhận diện khuôn mặt) diễn ra <strong>hoàn toàn cục bộ trên chính thiết bị</strong> của Thành viên (chip bảo mật/Secure Enclave của điện thoại, máy tính), tuân theo chuẩn công nghệ quốc tế FIDO2/WebAuthn.
                      <br />
                      - Máy chủ Hugo Studio <strong>không bao giờ nhận, xử lý hoặc lưu trữ</strong> hình ảnh vân tay, khuôn mặt hay bất kỳ mẫu sinh trắc học gốc nào. Hệ thống chỉ lưu giữ duy nhất một <strong>khóa công khai mật mã (Public Key)</strong> không thể dùng để khôi phục lại dữ liệu sinh trắc học gốc, cùng một mã định danh thiết bị để xác minh khi đăng nhập lần sau.
                      <br />
                      - Thành viên có thể chủ động gỡ bỏ phương thức đăng nhập sinh trắc học của bất kỳ thiết bị nào khỏi tài khoản của mình tại trang Cài đặt bất cứ lúc nào.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      b) Thông báo đẩy (Push Notification) qua Ứng dụng Web Lũy Tiến (PWA):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Thành viên có quyền tự nguyện cấp hoặc từ chối quyền nhận thông báo đẩy thông qua hộp thoại xin phép tiêu chuẩn của trình duyệt. Khi đồng ý, trình duyệt cấp một địa chỉ endpoint kỹ thuật duy nhất cho thiết bị đó, được lưu gắn với tài khoản để gửi nhắc nhở lịch hẹn, sự kiện hoặc tương tác mới.
                      <br />
                      - Thành viên có thể thu hồi quyền nhận thông báo bất kỳ lúc nào thông qua cài đặt trình duyệt hoặc trang Cài đặt thông báo trong Dashboard; sau khi thu hồi, địa chỉ endpoint liên quan sẽ bị xóa khỏi hệ thống trong lần đồng bộ kế tiếp.
                    </p>
                  </div>

                  <div className="p-5 bg-muted rounded-2xl border border-border space-y-2">
                    <h5 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      c) Quản lý phiên đăng nhập đa thiết bị:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - Thành viên có thể đăng nhập đồng thời trên nhiều thiết bị; mỗi thiết bị duy trì một Session Token độc lập tuân theo quy tắc hết hạn 14 ngày tại Chương VI. Thành viên có quyền chủ động đăng xuất từ xa một thiết bị cụ thể nếu nghi ngờ thiết bị đó bị truy cập trái phép.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Bottom Agree Button */}
          <div className="pt-6 border-t border-border text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 hover:scale-[1.01]"
              style={{ minHeight: 0, minWidth: 0 }}
            >
              Đồng Ý Điều Khoản & Trở Về Trang Chủ
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
