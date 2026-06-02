import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { useHeadMeta } from "../../hooks/useHeadMeta";

export default function PrivacyPolicyPage() {
  const { data } = useData();
  const [activeSection, setActiveSection] = useState("chuong-1");

  useHeadMeta({
    title: "Điều Khoản Dịch Vụ & Chính Sách Bảo Mật Toàn Diện | Hugo Studio",
    description: "Điều khoản sử dụng và chính sách bảo mật chi tiết của Hugo Studio tuân thủ Nghị định 13/2023/NĐ-CP, Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP và tiêu chuẩn quốc tế GDPR, COPPA.",
    keywords: "chính sách bảo mật, điều khoản sử dụng, điều khoản dịch vụ, Hugo Studio, bảo vệ dữ liệu cá nhân, Nghị định 13, GDPR Việt Nam, e-commerce policy",
    canonicalUrl: "https://www.hugowishpax.studio/policy"
  });

  const chapters = [
    { id: "chuong-1", title: "Chương I: Cơ Sở Pháp Lý & Văn Bản Quy Phạm", icon: "gavel" },
    { id: "chuong-2", title: "Chương II: Giải Thích Thuật Ngữ", icon: "menu_book" },
    { id: "chuong-3", title: "Chương III: Phạm Vi Dịch Vụ & Đối Tượng Điều Chỉnh", icon: "lan" },
    { id: "chuong-4", title: "Chương IV: Danh Mục Dữ Liệu Thu Thập", icon: "database" },
    { id: "chuong-5", title: "Chương V: Mục Đích & Biện Pháp Xử Lý Dữ Liệu", icon: "security" },
    { id: "chuong-6", title: "Chương VI: Quy Tắc Mốc Thời Gian (00:00 & 14 Ngày)", icon: "schedule" },
    { id: "chuong-7", title: "Chương VII: Quy Chế Giao Dịch & Cổng Thanh Toán Cá Nhân", icon: "credit_card" },
    { id: "chuong-8", title: "Chương VIII: Cam Kết Bảo Mật & Chống Thương Mại Hóa", icon: "shield_heart" },
    { id: "chuong-9", title: "Chương IX: Quyền & Nghĩa Vụ Của Chủ Thể Dữ Liệu", icon: "badge" },
    { id: "chuong-10", title: "Chương X: Giới Hạn & Miễn Trừ Trách Nhiệm Pháp Lý", icon: "block" },
    { id: "chuong-11", title: "Chương XI: Luật Áp Dụng & Giải Quyết Tranh Chấp", icon: "balance" },
    { id: "chuong-12", title: "Chương XII: Điều Khoản Thi Hành & Thông Tin Liên Hệ", icon: "mail" }
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // offset for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] py-12 px-4 sm:px-6 transition-colors duration-300 font-sans">
      
      {/* Container to handle sidebar and content */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        
        {/* LEFT COLUMN: STICKY SIDEBAR NAVIGATION (Desktop only) */}
        <aside className="hidden lg:block w-80 shrink-0 h-fit sticky top-6">
          <div className="bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border border-[#e5e5e7] dark:border-[#2c2c2e] p-6 rounded-3xl shadow-xl space-y-4 max-h-[85vh] overflow-y-auto scrollbar-hide">
            <div className="border-b border-[#e5e5e7] dark:border-[#2c2c2e] pb-3 text-center">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Mục lục điều khoản</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Hugo Studio Legal Version 4.0</span>
            </div>
            <nav className="space-y-1">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => scrollToSection(chapter.id)}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all text-xs font-semibold leading-relaxed border ${
                    activeSection === chapter.id
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "hover:bg-slate-100 dark:hover:bg-white/[0.02] border-transparent text-slate-500 dark:text-slate-400"
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
        <div className="flex-1 bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl p-6 sm:p-12 rounded-3xl border border-[#e5e5e7] dark:border-[#2c2c2e] shadow-2xl transition-all duration-300 space-y-8">
          
          {/* Header Title */}
          <div className="space-y-4 text-center pb-6 border-b border-[#e5e5e7] dark:border-[#2c2c2e] relative">
            <span className="absolute top-0 right-0 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              Bản đầy đủ pháp lý
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1d1d1f] dark:text-white uppercase leading-snug">
              Chính Sách Bảo Mật & Điều Khoản Sử Dụng Dịch Vụ Toàn Diện
            </h1>
            <p className="text-xs text-slate-550 dark:text-slate-450 font-bold tracking-wider">
              VĂN BẢN QUY ĐỊNH PHÁP LÝ CHÍNH THỨC CỦA HỆ THỐNG HUGO STUDIO
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              Cập nhật và ban hành áp dụng chính thức: Ngày 02 tháng 06 năm 2026
            </p>
          </div>

          {/* Legal Content Sections */}
          <div className="space-y-12 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 text-justify">

            {/* CHƯƠNG 1 */}
            <section id="chuong-1" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">gavel</span>
                Chương I: Cơ Sở Pháp Lý & Văn Bản Quy Phạm Pháp Luật Chi Tiết
              </h2>
              <div className="space-y-4">
                <p>
                  Văn bản Điều khoản sử dụng và Chính sách Bảo mật này (sau đây gọi tắt là "Điều khoản" hoặc "Quy chế") thiết lập một thỏa thuận ràng buộc pháp lý đầy đủ và tối cao giữa người sử dụng (bao gồm Thành viên đăng ký và Khách hàng tương tác) và cá nhân Quản trị viên (Admin) duy nhất điều hành Hugo Studio. Toàn bộ nội dung quy chế này được biên soạn, đối chiếu và ban hành căn cứ trên tinh thần nghiêm túc tuân thủ các quy định hiện hành của hệ thống luật pháp nước Cộng hòa Xã hội Chủ nghĩa Việt Nam và các công ước pháp luật quốc tế về an ninh mạng, thương mại điện tử và bảo vệ thông tin đời tư cá nhân.
                </p>
                
                <div className="bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e] p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    I. Hệ thống pháp luật áp dụng của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam:
                  </h4>
                  
                  <div className="space-y-3 text-xs text-slate-650 dark:text-slate-400">
                    <p>
                      <strong>1. Thừa nhận tính pháp lý của Giao dịch điện tử và Hợp đồng trực tuyến:</strong>
                      <br />
                      - Căn cứ <strong>Bộ luật Dân sự nước CHXHCN Việt Nam năm 2015 (Luật số 91/2015/QH13)</strong>, đặc biệt tại <em>Điều 117</em> (Điều kiện có hiệu lực của giao dịch dân sự), <em>Điều 119</em> (Hình thức giao dịch dân sự, thừa nhận giao dịch thông qua phương tiện điện tử dưới hình thức thông điệp dữ liệu có giá trị như văn bản), <em>Điều 385</em> (Khái niệm hợp đồng), và <em>Điều 401</em> (Hiệu lực của hợp đồng, xác lập quyền ràng buộc của các điều khoản khi các bên có hành vi đồng ý gián tiếp hoặc trực tiếp).
                      <br />
                      - Căn cứ <strong>Luật Giao dịch điện tử năm 2023</strong> (được thông qua bởi Quốc hội Việt Nam khóa XV), điều chỉnh giá trị pháp lý của thông điệp dữ liệu, việc sử dụng các phương thức xác thực điện tử (như mã OTP gửi qua Email hoặc số điện thoại), và việc giao kết hợp đồng trên môi trường điện tử. Hành động nhấp vào nút "Đăng ký" hoặc "Đồng ý điều khoản" của Thành viên được pháp luật thừa nhận là chữ ký điện tử hợp pháp biểu thị sự cam kết ràng buộc dân sự.
                    </p>

                    <p>
                      <strong>2. Quy chế Bảo vệ Dữ liệu cá nhân (GDPR của Việt Nam):</strong>
                      <br />
                      - Căn cứ <strong>Nghị định số 13/2023/NĐ-CP</strong> của Chính phủ ban hành ngày 17/04/2023 về Bảo vệ dữ liệu cá nhân (sau đây gọi tắt là "Nghị định 13"). Chúng tôi cam kết thiết lập hệ thống bảo mật, lưu trữ, xử lý thông tin cá nhân của công dân Việt Nam đúng theo các nguyên tắc được quy định tại:
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 9 (Quyền của chủ thể dữ liệu)</em>: Quy định rõ 11 quyền tối cao của người dùng đối với dữ liệu của mình, bao gồm quyền được biết, quyền đồng ý, quyền truy cập, quyền đính chính, quyền xóa dữ liệu, quyền rút lại sự đồng ý, v.v.
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 11 (Đồng ý của chủ thể dữ liệu)</em>: Quy định sự đồng ý phải được thể hiện dưới dạng rõ ràng, tự nguyện, có thể in ấn hoặc lưu giữ bằng văn bản hoặc thông điệp dữ liệu.
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 16 (Xử lý dữ liệu cá nhân nhạy cảm)</em>: Bắt buộc áp dụng biện pháp bảo vệ và thông báo đặc biệt đối với thông tin về số đo hình thể (Measurements) và lịch sử giao dịch thanh toán trực tuyến.
                      <br />
                      &nbsp;&nbsp;+ <em>Điều 38 (Trách nhiệm hành chính và hình sự)</em>: Quy định các chế tài xử phạt khi có hành vi vi phạm bảo vệ dữ liệu cá nhân.
                    </p>

                    <p>
                      <strong>3. Quy định về Hoạt động Thương mại điện tử trực tuyến:</strong>
                      <br />
                      - Căn cứ <strong>Nghị định số 52/2013/NĐ-CP</strong> ngày 16/05/2013 của Chính phủ về Thương mại điện tử và <strong>Nghị định số 85/2021/NĐ-CP</strong> sửa đổi, bổ sung một số điều của Nghị định 52. Các văn bản này quy định chặt chẽ về việc công khai thông tin chủ sở hữu website, minh bạch biểu phí các gói dịch vụ nâng cấp (như Premium Bio Plus/Bio VIP), cơ chế xử lý khiếu nại của khách hàng mua hàng trực tuyến và bảo mật thông tin thanh toán tài chính của người tiêu dùng.
                    </p>

                    <p>
                      <strong>4. Quy định về An ninh mạng và An toàn thông tin:</strong>
                      <br />
                      - Căn cứ <strong>Luật An toàn thông tin mạng năm 2015 (Luật số 86/2015/QH13)</strong>, quy định trách nhiệm của cơ quan, tổ chức, cá nhân trong việc bảo vệ thông tin cá nhân trên môi trường mạng và xử lý sự cố an toàn thông tin mạng.
                      <br />
                      - Căn cứ <strong>Luật An ninh mạng năm 2018 (Luật số 24/2018/QH14)</strong>, đặc biệt tại <em>Điều 8</em> (Các hành vi bị nghiêm cấm trên không gian mạng) và <em>Điều 26</em> (Bảo đảm an ninh thông tin trên không gian mạng). Hugo Studio cam kết ngăn chặn các hành vi phát tán mã độc, lừa đảo chiếm đoạt tài sản, phát tán văn hóa phẩm đồi trụy hoặc các nội dung gây ảnh hưởng đến an ninh quốc gia thông qua nền tảng Bio Link của Thành viên.
                    </p>
                  </div>
                </div>

                <div className="bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e] p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                    II. Các Hiến chương và Đạo luật Quốc tế được Viện dẫn Đối chiếu:
                  </h4>
                  <div className="space-y-3 text-xs text-slate-655 dark:text-slate-400">
                    <p>
                      <strong>1. GDPR (General Data Protection Regulation - Quy định Bảo vệ Dữ liệu chung châu Âu):</strong>
                      <br />
                      - Do hệ thống Hugo Studio được cung cấp trên môi trường Internet toàn cầu, bất kỳ cá nhân nào tại bất kỳ quốc gia nào thuộc Liên minh Châu Âu (EU) đều có thể truy cập. Vì vậy, chúng tôi tự nguyện đối chiếu thiết lập hệ thống tuân thủ theo các tiêu chuẩn khắt khe của Quy định số (EU) 2016/679:
                      <br />
                      &nbsp;&nbsp;+ Căn cứ <em>Article 3 (Territorial scope)</em>: Quy định phạm vi áp dụng ngoài lãnh thổ EU khi xử lý dữ liệu của người dùng sống trong EU.
                      <br />
                      &nbsp;&nbsp;+ Căn cứ <em>Article 6 (Lawfulness of processing)</em>: Cơ sở pháp lý hợp pháp để xử lý dữ liệu dựa trên sự đồng ý tự nguyện (Consent) hoặc thực hiện hợp đồng.
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
                
                <p className="text-slate-500 dark:text-slate-450 italic text-[11px] border-l-4 border-amber-500 pl-4">
                  * Khuyến cáo pháp lý đặc biệt: Việc người sử dụng tiếp tục các thao tác điều hướng trên website, thực hiện điền biểu mẫu, tạo lập Bio Link, Bento Portfolio hoặc thanh toán nâng cấp tài khoản biểu thị rằng người sử dụng đã dành thời gian đọc kỹ, thấu hiểu toàn bộ nội dung và tự nguyện cam kết tuân thủ không điều kiện các thỏa thuận được lập ra tại đây. Nếu không đồng ý với bất kỳ điều khoản nào, xin vui lòng ngừng truy cập website ngay lập tức.
                </p>
              </div>
            </section>

            {/* CHƯƠNG 2 */}
            <section id="chuong-2" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">menu_book</span>
                Chương II: Giải Thích Thuật Ngữ và Định Nghĩa Pháp Lý Chi Tiết
              </h2>
              <div className="space-y-4">
                <p>
                  Để tránh mọi hiểu lầm, tranh chấp phát sinh từ việc giải nghĩa từ ngữ, các thuật ngữ viết hoa hoặc được định nghĩa cụ thể trong văn bản này sẽ được giải thích và quy chiếu pháp lý thống nhất như sau:
                </p>
                
                <div className="space-y-3.5 pl-4 border-l-2 border-slate-350 dark:border-slate-800 text-xs">
                  <p>
                    <strong>1. Chủ thể dữ liệu (Data Subject):</strong> Là cá nhân được dữ liệu cá nhân phản ánh trực tiếp. Ở đây bao gồm hai đối tượng cốt lõi: <em>Thành viên</em> (người sở hữu tài khoản thiết kế hồ sơ) và <em>Khách hàng</em> (cá nhân truy cập Bio Link công cộng của Thành viên nhằm mục đích xem thông tin, đặt lịch hẹn làm việc).
                  </p>
                  
                  <p>
                    <strong>2. Dữ liệu cá nhân (Personal Data):</strong> Là thông tin dưới dạng ký hiệu, chữ viết, chữ số, hình ảnh, âm thanh hoặc dạng tương tự trên môi trường điện tử gắn liền với một con người cụ thể hoặc giúp xác định một con người cụ thể.
                  </p>

                  <p>
                    <strong>3. Dữ liệu cá nhân nhạy cảm (Sensitive Personal Data):</strong> Là dữ liệu cá nhân gắn liền với quyền riêng tư của cá nhân mà khi bị xâm phạm sẽ ảnh hưởng trực tiếp đến quyền và lợi ích hợp pháp của cá nhân đó. Tại Hugo Studio, dữ liệu nhạy cảm bao gồm: Số đo hình thể nhân trắc học của Thành viên (chiều cao, cân nặng, số đo vòng ngực, vòng eo, vòng mông) và thông tin về lịch sử giao dịch thanh toán (mã tham chiếu giao dịch, lịch sử chuyển khoản, số tiền giao dịch).
                  </p>

                  <p>
                    <strong>4. Ban quản trị / Cá nhân Admin duy nhất (The Administrator):</strong> Là chủ thể sở hữu hạ tầng kỹ thuật, mã nguồn, tên miền hệ thống Hugo Studio. Dưới góc độ điều hành và quản trị, hệ thống này được quản lý và xử lý trực tiếp, độc quyền bởi **01 cá nhân Admin duy nhất**. Không có bất kỳ pháp nhân, hội đồng quản trị, đại diện pháp luật, chi nhánh, công ty con hay tổ chức bên thứ ba nào tham gia điều hành hoặc chịu trách nhiệm liên đới với các hoạt động kỹ thuật của Admin.
                  </p>

                  <p>
                    <strong>5. Thành viên (Member):</strong> Là cá nhân đã hoàn tất quy trình điền biểu mẫu đăng ký tài khoản trực tuyến trên website, được hệ thống cấp quyền truy cập vào trang quản trị (Dashboard) để tùy biến, kéo thả các khối Bento Grid, đăng tải ảnh, số đo cơ thể và nhận lịch Booking.
                  </p>

                  <p>
                    <strong>6. Khách hàng (Customer):</strong> Là cá nhân truy cập vào các trang Bio Link hoặc Bento Grid Portfolio công cộng của Thành viên dưới dạng tên miền con (subdomain) hoặc đường dẫn trực tiếp nhằm xem thông tin giới thiệu, liên kết mạng xã hội hoặc gửi yêu cầu đặt lịch làm việc.
                  </p>

                  <p>
                    <strong>7. Xử lý dữ liệu cá nhân (Data Processing):</strong> Là một hoặc nhiều hoạt động tác động tới dữ liệu cá nhân bao gồm: Thu thập, ghi, phân tích, lưu trữ, chỉnh sửa, công khai hiển thị, kết xuất dữ liệu, truy xuất dữ liệu, thu hồi quyền truy cập, mã hóa, sao lưu, chia sẻ, hủy hoặc xóa bỏ hoàn toàn dữ liệu.
                  </p>

                  <p>
                    <strong>8. Bio Link / Bento Grid Portfolio:</strong> Là sản phẩm công nghệ do Hugo Studio cung cấp, cho phép Thành viên tạo dựng một trang đích cá nhân (Landing page) chứa các khối nội dung được thiết kế theo phong cách Bento Grid để hiển thị thông tin hình ảnh, liên kết, số đo hình thể và tính năng đặt lịch.
                  </p>

                  <p>
                    <strong>9. Hệ thống Booking đặt lịch (Booking System):</strong> Phân hệ công nghệ được lập trình sẵn trên website cho phép Khách hàng điền thông tin liên hệ và gửi trực tiếp yêu cầu hẹn làm việc đến tài khoản quản lý của Thành viên.
                  </p>

                  <p>
                    <strong>10. Cổng thanh toán liên kết:</strong> Giao diện kết nối API với đối tác cung ứng cổng trung gian thanh toán đã được Ngân hàng Nhà nước cấp phép (ở đây cụ thể là đối tác PayOS) nhằm sinh mã VietQR tự động để Thành viên chuyển khoản nâng cấp tài khoản.
                  </p>

                  <p>
                    <strong>11. Bên kiểm soát dữ liệu cá nhân (Data Controller):</strong> Là cá nhân Admin duy nhất của Hugo Studio - bên quyết định mục đích và phương tiện xử lý dữ liệu cá nhân của người dùng.
                  </p>

                  <p>
                    <strong>12. Bên xử lý dữ liệu cá nhân (Data Processor):</strong> Là các đơn vị cung cấp hạ tầng máy chủ đám mây vật lý, hệ quản trị cơ sở dữ liệu MongoDB Atlas lưu trữ dữ liệu người dùng được kiểm soát bởi Admin.
                  </p>

                  <p>
                    <strong>13. Sự cố an ninh dữ liệu (Data Security Breach):</strong> Là các tình huống bất thường dẫn đến dữ liệu cá nhân của người dùng bị truy cập, tiết lộ, thay đổi, phá hủy hoặc mất mát trái phép do hacker tấn công, rò rỉ mã nguồn hoặc lỗi vận hành kỹ thuật.
                  </p>

                  <p>
                    <strong>14. Gói dịch vụ Premium (Plus/VIP):</strong> Các gói nâng cấp có trả phí bản quyền của hệ thống nhằm kích hoạt đầy đủ các tính năng nâng cao như: ẩn nhãn hiệu Hugo Studio, thêm Bento blocks không giới hạn, sử dụng nhạc nền tự phát, mở rộng lưu trữ hình ảnh chất lượng cao và xem thống kê lượt truy cập chi tiết.
                  </p>

                  <p>
                    <strong>15. Xác thực OTP điện tử:</strong> Phương thức gửi mã số bí mật dùng một lần có thời hạn hiệu lực ngắn đến địa chỉ email của người dùng để xác nhận quyền sở hữu tài khoản hoặc xác thực các thao tác thay đổi thông tin quan trọng.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 3 */}
            <section id="chuong-3" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">lan</span>
                Chương III: Phạm Vi Dịch Vụ & Đối Tượng Điều Chỉnh Pháp Lý Toàn Diện
              </h2>
              <div className="space-y-4">
                <p>
                  Chương này quy định chi tiết phạm vi cung cấp công nghệ của Hugo Studio, phân định quyền và trách nhiệm pháp lý của cá nhân Admin đối với từng phân hệ tính năng được lập trình trên hệ thống:
                </p>

                <div className="space-y-4">
                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e]">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.1 Trình Thiết Kế Bio Link & Bento Grid Portfolio:
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify space-y-2">
                      - Hugo Studio cung cấp công cụ xây dựng giao diện trực quan thông qua việc sắp đặt các khối thông tin (Bento blocks). Thành viên được quyền đăng tải văn bản, hình ảnh cá nhân, liên kết mạng xã hội (Facebook, Instagram, TikTok, Threads, GitHub) và nhúng nội dung từ bên thứ ba (YouTube, Spotify, Soundcloud).
                      <br />
                      - <strong>Quy định về Bản quyền và Sở hữu trí tuệ:</strong> Thành viên chịu trách nhiệm độc quyền trước pháp luật hình sự và dân sự về quyền sở hữu trí tuệ đối với mọi hình ảnh, logo, tên thương hiệu, âm nhạc hoặc tác phẩm nghệ thuật đăng tải trên Bio Link cá nhân của mình. Ban quản trị Hugo Studio tuyệt đối không chịu trách nhiệm liên đới đối với bất kỳ hành vi xâm phạm bản quyền nào do Thành viên thực hiện.
                      <br />
                      - <strong>Quy định xử lý nội dung vi phạm:</strong> Admin giữ quyền kiểm soát tối cao và sẽ tiến hành khóa tài khoản, hạ trang Bio Link ngay lập tức mà không cần báo trước nếu phát hiện Thành viên đăng tải các nội dung: lừa đảo tài chính, cờ bạc trực tuyến, đường link dẫn tới phần mềm độc hại, văn hóa phẩm đồi trụy, phát ngôn thù địch, xúc phạm danh dự nhân phẩm cá nhân/tổ chức khác, hoặc vi phạm nghiêm trọng thuần phong mỹ tục Việt Nam.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e]">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.2 Phân Hệ Số Đo Hình Thể Cá Nhân (Measurements Panel):
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - Nhằm hỗ trợ các Thành viên hoạt động trong lĩnh vực nghệ thuật, giải trí, thời trang (như Người mẫu, KOLs, PG/PB, Diễn viên) xây dựng hồ sơ năng lực chuyên nghiệp, Hugo Studio tích hợp các trường điền số đo cơ thể bao gồm: Chiều cao, Cân nặng, Vòng 1, Vòng 2, Vòng 3 và Kiểu cơ thể.
                      <br />
                      - Các thông số này cấu thành Dữ liệu cá nhân nhạy cảm của người dùng. Hệ thống thiết lập cơ chế kiểm soát hiển thị riêng tư hoàn chỉnh. Thành viên có quyền tự nguyện quyết định hiển thị công khai các thông số này lên trang Portfolio của mình hoặc ẩn đi trong trang quản trị. Việc Thành viên chọn kích hoạt hiển thị đồng nghĩa với việc chấp nhận cho bất kỳ ai truy cập internet xem các chỉ số này.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e]">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.3 Hệ Thống Ghi Nhận Đặt Lịch Hẹn (Booking Engine):
                    </h5>
                    <p className="text-xs text-slate-605 dark:text-slate-400 text-justify">
                      - Phân hệ Booking cho phép Khách hàng gửi yêu cầu làm việc trực tiếp tới Thành viên. Khi Khách hàng hoàn tất biểu mẫu Booking, dữ liệu sẽ được chuyển giao vào cơ sở dữ liệu và hiển thị trên trang quản lý lịch hẹn của Thành viên nhận lịch.
                      <br />
                      - <strong>Tuyên bố miễn trừ trách nhiệm dân sự:</strong> Hugo Studio chỉ đóng vai trò cung cấp giải pháp lưu trữ kỹ thuật trung gian truyền tải thông tin lịch hẹn. Mọi cam kết hợp tác, giao kết hợp đồng, trao đổi tài chính, chất lượng dịch vụ hoặc tranh chấp kinh tế phát sinh sau đó giữa Thành viên và Khách hàng hoàn toàn thuộc về thỏa thuận dân sự cá nhân giữa hai bên. Cá nhân Admin của Hugo Studio tuyệt đối không can thiệp, không chịu trách nhiệm hòa giải và miễn trừ mọi nghĩa vụ bồi thường thiệt hại liên quan.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e]">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.4 Giao Diện Tích Hợp Iframe Đối Tác (Partner Sandbox Integration):
                    </h5>
                    <p className="text-xs text-slate-605 dark:text-slate-400 text-justify">
                      - Đối với các nền tảng đối tác nhúng Hugo Studio thông qua thẻ `iframe`, chúng tôi áp dụng các chính sách bảo mật hộp cát (Sandbox Attributes) nghiêm ngặt nhằm cách ly phiên làm việc. Đối tác tích hợp chịu trách nhiệm thiết lập các chính sách CORS hợp lệ và không được phép can thiệp vào cookie bảo mật hoặc token đăng nhập của Thành viên đang lưu trên trình duyệt của Hugo Studio.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e]">
                    <h5 className="font-bold text-slate-855 dark:text-white text-xs mb-2 uppercase tracking-wide">
                      3.5 Trợ Lý Ảo Bot Culi (Support Assistant System):
                    </h5>
                    <p className="text-xs text-slate-605 dark:text-slate-400 text-justify">
                      - Trợ lý ảo Bot Culi là hệ thống tương tác tự động được tích hợp trên các biểu mẫu liên hệ nhằm hướng dẫn người dùng điền thông tin hỗ trợ kỹ thuật đúng quy trình. Lịch sử trò chuyện và thông tin yêu cầu gửi qua Bot Culi sẽ được ghi nhận thành các phiếu ghi hỗ trợ (Support Tickets) nhằm phục vụ công tác khắc phục sự cố kỹ thuật của Admin.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 4 */}
            <section id="chuong-4" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">database</span>
                Chương IV: Danh Mục Dữ Liệu Cá Nhân Thu Thập & Phương Thức Thu Thập
              </h2>
              <div className="space-y-4">
                <p>
                  Hugo Studio cam kết tuân thủ nguyên tắc tối thiểu hóa dữ liệu (Data Minimization) quy định tại Nghị định 13/2023/NĐ-CP và GDPR. Chúng tôi chỉ thu thập và xử lý các trường dữ liệu cần thiết tuyệt đối để thiết lập và vận hành các tính năng kỹ thuật của hệ thống. Danh mục dữ liệu bao gồm:
                </p>

                <div className="space-y-4">
                  <div className="pl-4 border-l-2 border-emerald-500 space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                      1. Dữ Liệu Cá Nhân Cơ Bản (Cung cấp trực tiếp bởi Thành viên):
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 text-justify">
                      - <strong>Thông tin định danh và tài khoản:</strong> Họ và tên hiển thị công khai; Địa chỉ thư điện tử cá nhân (Email) - bắt buộc sử dụng để tiếp nhận mã OTP đăng ký, xác thực đăng nhập, phục hồi mật khẩu và nhận thông báo lịch Booking; Mật khẩu đăng nhập (hệ thống chỉ lưu bản mã hóa một chiều Hash mật khẩu); Ảnh đại diện (Avatar) tải lên hệ thống.
                      <br />
                      - <strong>Thông tin liên hệ kết nối xã hội:</strong> Số điện thoại cá nhân (để liên kết gọi điện hoặc chat Zalo); Các liên kết mạng xã hội do Thành viên tự điền (Facebook, Instagram, TikTok, LinkedIn, YouTube, v.v.).
                      <br />
                      - <strong>Dữ liệu Email Giáo Dục:</strong> Đối với các Thành viên tham gia chương trình tài trợ sinh viên (Gói Premium Student), chúng tôi thu thập địa chỉ email giáo dục (có đuôi dạng `.edu` hoặc `.edu.vn`) để làm cơ sở tự động phê duyệt tính trạng sinh viên hợp lệ.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-amber-500 space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                      2. Dữ Liệu Cá Nhân Nhạy Cảm (Tự nguyện điền bởi Thành viên):
                    </h4>
                    <p className="text-xs text-slate-606 dark:text-slate-400 text-justify">
                      - <strong>Thông số nhân trắc học hình thể:</strong> Chiều cao (cm), Cân nặng (kg), Số đo Vòng 1 - Vòng 2 - Vòng 3 (cm), Kiểu dáng cơ thể. Dữ liệu này chỉ được lưu trữ khi Thành viên chủ động điền vào mục Thiết lập số đo trong trang quản trị.
                      <br />
                      - <strong>Lịch sử giao dịch tài chính:</strong> Khi Thành viên tiến hành thanh toán nâng cấp tài khoản, chúng tôi ghi nhận thông tin bao gồm: Mã tham chiếu giao dịch của PayOS (Transaction ID), Số tiền chuyển khoản, Tên ngân hàng thực hiện giao dịch, Thời gian giao dịch thành công. Toàn bộ thông tin này được lưu để thực hiện đối soát tự động kích hoạt tài khoản.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-blue-500 space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                      3. Dữ Liệu Thu Thập Từ Khách Hàng (Khi gửi Booking):
                    </h4>
                    <p className="text-xs text-slate-606 dark:text-slate-400 text-justify">
                      - Khi Khách hàng truy cập Bio Link của Thành viên và gửi yêu cầu đặt lịch hẹn, hệ thống thu thập: Họ tên Khách hàng; Địa chỉ Email của Khách hàng; Số điện thoại liên hệ (Zalo); Tiêu đề và nội dung mô tả yêu cầu công việc/sự kiện; Ngày giờ mong muốn diễn ra lịch hẹn. Dữ liệu này được lưu trữ tách biệt và chỉ hiển thị cho duy nhất Thành viên nhận lịch hẹn đó.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-indigo-500 space-y-2">
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
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
                </div>
              </div>
            </section>

            {/* CHƯƠNG 5 */}
            <section id="chuong-5" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">security</span>
                Chương V: Mục Đích, Biện Pháp & Quy Trình Xử Lý Dữ Liệu Cá Nhân
              </h2>
              <div className="space-y-4">
                <p>
                  Mọi hành vi xử lý dữ liệu tại Hugo Studio đều có mục đích rõ ràng, minh bạch và áp dụng các giải pháp kỹ thuật bảo vệ tối tân nhất hiện nay nhằm ngăn chặn tuyệt đối các nguy cơ thất thoát thông tin:
                </p>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">1. Mục đích xử lý dữ liệu chi tiết:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-justify">
                      <li>Xác thực quyền đăng nhập tài khoản và khôi phục tài khoản khi xảy ra sự cố quên mật khẩu thông qua mã OTP điện tử gửi tới email đã đăng ký.</li>
                      <li>Khởi tạo, duy trì hiển thị và quản lý trang Bio Link, Bento Portfolio cá nhân của Thành viên trên internet theo đúng tùy biến thiết kế.</li>
                      <li>Đồng bộ hóa dữ liệu lịch hẹn, chuyển tiếp thông tin liên lạc của Khách hàng trực tiếp đến trang quản trị Dashboard của Thành viên để phục vụ công tác trao đổi công việc.</li>
                      <li>Thực hiện kiểm tra tính hợp lệ của địa chỉ email giáo dục nhằm phê duyệt tham gia gói tài trợ sinh viên.</li>
                      <li>Lưu trữ tạm thời và đối soát trạng thái giao dịch thanh toán nâng cấp tài khoản qua cổng trung gian thanh toán PayOS.</li>
                      <li>Phát hiện, ngăn chặn kịp thời các hành vi đăng nhập trái phép, spam phá hoại hệ thống, tấn công từ chối dịch vụ hoặc tải lên mã nguồn độc hại.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      2. Các biện pháp bảo vệ kỹ thuật đầu cuối (End-to-End Security Measures):
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      Ban quản trị Hugo Studio đã thiết lập và duy trì các cơ chế bảo mật kỹ thuật đa tầng nhằm bảo vệ dữ liệu người dùng trước các truy cập trái phép:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-450">a) Mã hóa Mật khẩu bảo mật mật thiết:</h6>
                        <p className="text-slate-500 dark:text-slate-400 text-justify">
                          Toàn bộ mật khẩu của Thành viên đều được băm một chiều (One-way Cryptographic Hashing) bằng thuật toán <strong>SHA-256</strong> kết hợp với mã muối ngẫu nhiên (Salt) có độ phức tạp cao trước khi lưu vào MongoDB. Cơ chế này đảm bảo ngay cả khi cơ sở dữ liệu bị lộ lọt, kẻ tấn công cũng không thể dịch ngược để đọc mật khẩu gốc dưới dạng văn bản thuần (Plaintext).
                        </p>
                      </div>

                      <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-450">b) Bộ lọc CORS và cách ly máy chủ API:</h6>
                        <p className="text-slate-500 dark:text-slate-400 text-justify">
                          Máy chủ API (Node.js/Express) thiết lập cấu hình chính sách chia sẻ tài nguyên nguồn gốc chéo <strong>CORS (Cross-Origin Resource Sharing)</strong> cực kỳ chặt chẽ. Hệ thống chỉ phê duyệt và tiếp nhận các yêu cầu truy vấn đến từ các tên miền chính thức của Hugo Studio. Mọi yêu cầu API giả mạo hoặc xuất phát từ các nguồn gốc lạ ngoài danh sách sẽ bị từ chối xử lý ngay lập tức tại tầng mạng.
                        </p>
                      </div>

                      <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-450">c) Cơ chế Route Guard & Chặn bypass luồng:</h6>
                        <p className="text-slate-500 dark:text-slate-400 text-justify">
                          Các biểu mẫu hỗ trợ kỹ thuật được bảo vệ nghiêm ngặt bằng cơ chế kiểm soát định tuyến (Route Guard). Hệ thống sẽ chặn kết nối và trả về trang lỗi nếu phát hiện trình duyệt cố tình bỏ qua (bypass) luồng gửi biểu mẫu thông tin tiêu chuẩn hoặc truy cập trực tiếp vào các liên kết xử lý nội bộ mà không có sự chỉ dẫn của Trợ lý ảo Bot Culi.
                        </p>
                      </div>

                      <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1.5">
                        <h6 className="font-bold text-emerald-600 dark:text-emerald-450">d) Nén mã hóa hình ảnh và Lưu trữ đám mây phân quyền:</h6>
                        <p className="text-slate-500 dark:text-slate-400 text-justify">
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
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">schedule</span>
                Chương VI: Quy Tắc Mốc Thời Gian và Thời Hạn Lưu Trữ Dữ Liệu Chi Tiết
              </h2>
              <div className="space-y-4">
                <p>
                  Nhằm quản lý hiệu quả tài nguyên lưu trữ của máy chủ, đảm bảo tính công bằng tối đa cho mọi Thành viên và thiết lập cơ chế tự động xóa dữ liệu rác, Hugo Studio áp dụng các quy tắc mốc thời gian chặt chẽ như sau:
                </p>

                <div className="space-y-4 text-xs text-justify">
                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      a) Cách tính ngày sử dụng dịch vụ nâng cấp (Áp dụng Quy tắc mốc thời gian 00:00:00):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Chiểu theo các quy định về cách tính thời hạn được thiết lập tại Bộ luật Dân sự năm 2015, thời hạn sử dụng các gói Premium (Plus/VIP) được tính dựa trên lịch dương lịch. Bất kỳ sự thay đổi trạng thái kích hoạt nâng cấp gói dịch vụ nào diễn ra vào bất kỳ thời điểm nào trong ngày hiện tại sẽ được hệ thống tính trọn vẹn là 01 ngày sử dụng kể từ thời điểm giao dịch được ghi nhận thành công trên cơ sở dữ liệu cho đến đúng 00:00:00 của ngày dương lịch tiếp theo. Hệ thống tự động khấu trừ số ngày sử dụng còn lại của tài khoản Thành viên vào thời điểm 00:00:00 mỗi đêm.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      b) Quy định về Thời hạn phiên làm việc và Tự động vô hiệu hóa Session Token (Quy tắc 14 Ngày):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Để cân bằng giữa tính tiện dụng (tránh bắt buộc người dùng đăng nhập lại quá thường xuyên) và tính bảo mật an toàn tài khoản (phòng ngừa rò rỉ mã token khi đăng nhập trên thiết bị công cộng hoặc thiết bị của người khác), hệ thống Hugo Studio áp dụng chính sách giới hạn thời gian phiên đăng nhập tối đa là <strong>14 ngày</strong> (tương đương 336 giờ đồng hồ).
                      <br />
                      - Đúng vào mốc 00:00:00 của ngày thứ 14 kể từ thời điểm đăng nhập thành công gần nhất, Session Token được lưu trong cơ sở dữ liệu sẽ tự động chuyển sang trạng thái vô hiệu hóa (Expired). Hệ thống sẽ tự động đăng xuất tài khoản trên trình duyệt của Thành viên và yêu cầu thực hiện lại quy trình xác thực đăng nhập nhằm đảm bảo an toàn tuyệt đối.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      c) Mốc thời hạn áp dụng cho Gói tài trợ Sinh viên (Quy tắc 365 Ngày):
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Các tài khoản được phê duyệt nâng cấp lên gói Premium Student theo diện tài trợ giáo dục sẽ có thời hạn kích hoạt tối đa là <strong>365 ngày</strong> (01 năm dương lịch).
                      <br />
                      - Hệ thống lập trình kiểm tra tự động sẽ quét thời hạn kích hoạt của các tài khoản sinh viên. Vào đúng mốc 00:00:00 của ngày thứ 365 kể từ thời điểm gói tài trợ được xác nhận kích hoạt thành công, hệ thống sẽ tự động thu hồi các quyền lợi Premium nâng cao và đưa tài khoản trở về Gói Free tiêu chuẩn. Thành viên muốn tiếp tục sử dụng diện tài trợ bắt buộc phải thực hiện lại quy trình gửi yêu cầu xác thực email giáo dục mới.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      d) Quy trình Xử lý và Lưu trữ dữ liệu khi xóa tài khoản:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - <strong>Xóa mềm (Soft Delete):</strong> Khi Thành viên gửi yêu cầu xóa tài khoản trực tuyến qua Dashboard, hệ thống lập tức ẩn hiển thị trang Bio Link và Bento Portfolio công cộng của Thành viên khỏi internet. Dữ liệu tài khoản được chuyển vào trạng thái chờ xóa.
                      <br />
                      - <strong>Xóa cứng vĩnh viễn (Hard Delete):</strong> Đúng 30 ngày kể từ ngày Thành viên xác nhận yêu cầu xóa, hệ thống sẽ tự động quét cơ sở dữ liệu và thực hiện xóa cứng vĩnh viễn không thể phục hồi toàn bộ thông tin đăng ký, ảnh đại diện, số đo cơ thể, dữ liệu lịch hẹn Booking trên máy chủ MongoDB Atlas.
                      <br />
                      - <strong>Ngoại lệ lưu trữ bắt buộc theo luật định:</strong> Hugo Studio buộc phải lưu trữ thông tin về lịch sử giao dịch thanh toán nâng cấp tài khoản của Thành viên trong thời hạn tối thiểu 05 năm kể từ ngày giao dịch thành công. Đây là nghĩa vụ pháp lý bắt buộc được quy định tại Luật Kế toán và các Nghị định về Thương mại điện tử của Việt Nam phục vụ công tác thanh tra thuế và đối soát tài chính của cơ quan chức năng, dữ liệu này chỉ được lưu trữ nội bộ và tuyệt đối không hiển thị hay sử dụng cho bất kỳ mục đích nào khác.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 7 */}
            <section id="chuong-7" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">credit_card</span>
                Chương VII: Quy Chế Giao Dịch Tài Chính & Cổng Thanh Toán Cá Nhân Nghiêm Ngặt
              </h2>
              <div className="space-y-4">
                <p>
                  Để đảm bảo tính minh bạch tài chính tối đa, loại trừ mọi rủi ro pháp lý liên quan đến hoạt động huy động vốn trái phép, rửa tiền hoặc kinh doanh dịch vụ thanh toán không phép, Hugo Studio long trọng công bố quy chế giao dịch tài chính với các điều khoản đặc thù như sau:
                </p>

                <div className="bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e] p-6 rounded-2xl space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      a) Khẳng định Quyền sở hữu Cổng thanh toán Cá nhân duy nhất (Tuyên bố 1 Admin):
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Cổng nhận tiền chuyển khoản trực tuyến được tích hợp trên website Hugo Studio (được kết nối thông qua giải pháp công nghệ tạo mã VietQR của đối tác PayOS) thuộc quyền sở hữu, quản lý và sử dụng trực tiếp của **01 Quản trị viên (Admin) duy nhất** dưới tư cách cá nhân.
                      <br />
                      - Hệ thống Hugo Studio được phát triển, vận hành độc lập bởi cá nhân Admin này, không chịu sự điều hành, sở hữu hay góp vốn của bất kỳ tổ chức kinh tế, công ty cổ phần, nhóm cổ đông hoặc liên doanh bên thứ ba nào. Mọi dòng tiền phát sinh từ việc người dùng trả phí nâng cấp bản quyền dịch vụ sẽ được chuyển trực tiếp vào tài khoản ngân hàng cá nhân của Admin duy nhất này.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px] text-red-550">
                      b) Cam kết tuyệt đối Phi Trung gian thanh toán (Không thu hộ / Không chi hộ):
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Hugo Studio là công cụ phần mềm trực tuyến hỗ trợ thiết kế trang Bio Link cá nhân, hoàn toàn **không phải là đơn vị cung ứng dịch vụ trung gian thanh toán** theo quy định của Ngân hàng Nhà nước Việt Nam.
                      <br />
                      - Ban quản trị cam kết tuyệt đối: **Không thực hiện hoạt động thu hộ tiền; Không chi hộ tiền; Không hỗ trợ nhận chuyển tiền trung gian; Không làm đại lý thu gom tiền trực tuyến; Không nhận ủy thác giữ tiền hay thanh toán hộ** cho bất kỳ Thành viên hay dịch vụ thương mại của bên thứ ba nào.
                      <br />
                      - Khách hàng khi thực hiện đặt lịch hẹn (Booking) với Thành viên trên trang Bio Link công cộng tuyệt đối không thực hiện bất kỳ giao dịch chuyển tiền trực tiếp nào thông qua máy chủ của Hugo Studio. Mọi giao dịch tài chính, thanh toán cát-xê công việc giữa Khách hàng và Thành viên phải được thực hiện độc lập, trực tiếp thông qua các kênh thanh toán riêng của họ ngoài phạm vi kiểm soát của Hugo Studio.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      c) Bảo mật dữ liệu giao dịch thẻ ngân hàng theo Tiêu chuẩn PCI DSS:
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Khi Thành viên thực hiện thanh toán nâng cấp tài khoản, toàn bộ giao diện thanh toán, xử lý mã QR và xác thực chuyển khoản đều do hệ thống của cổng thanh toán đối tác PayOS xử lý trực tiếp.
                      <br />
                      - Hệ thống máy chủ của Hugo Studio cam kết tuyệt đối **không thu thập, không xử lý, không ghi chép, không lưu trữ** bất kỳ thông tin nhạy cảm nào liên quan đến tài khoản ngân hàng cá nhân, số thẻ tín dụng/thẻ ghi nợ quốc tế (Visa, Mastercard, JCB), ngày hết hạn thẻ, hoặc mã số bảo mật CVV/CVC của người dùng. Quy trình xử lý thông tin tài chính này tuân thủ hoàn toàn tiêu chuẩn an toàn bảo mật dữ liệu thẻ quốc tế <strong>PCI DSS</strong> của đối tác PayOS.
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h5 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      d) Tuân thủ Quy chế Công khai Biểu phí và Hoàn tiền (Refund Policy):
                    </h5>
                    <p className="text-justify text-slate-600 dark:text-slate-400">
                      - Biểu phí nâng cấp các gói Premium (Plus/VIP) được hiển thị công khai, rõ ràng, minh bạch tại bảng giá dịch vụ trên website theo quy định của Nghị định 52/2013/NĐ-CP về thương mại điện tử.
                      <br />
                      - <strong>Chính sách không hoàn tiền:</strong> Do đặc thù dịch vụ của Hugo Studio là sản phẩm phần mềm số hóa được kích hoạt tự động ngay lập tức ngay sau khi nhận được tiền thanh toán, Thành viên đồng ý rằng phí bản quyền nâng cấp dịch vụ đã thanh toán sẽ **không được hoàn lại** dưới bất kỳ hình thức nào, trừ trường hợp lỗi kỹ thuật nghiêm trọng phát sinh từ phía máy chủ Hugo Studio dẫn đến việc Thành viên hoàn toàn không thể sử dụng các tính năng nâng cao trong vòng 07 ngày liên tục và Admin không thể khắc phục được sự cố.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 8 */}
            <section id="chuong-8" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">shield_heart</span>
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
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">badge</span>
                Chương IX: Quyền & Nghĩa Vụ Hợp Pháp Của Chủ Thể Dữ Liệu
              </h2>
              <div className="space-y-4">
                <p>
                  Theo quy định tại Điều 9 của Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và các tiêu chuẩn bảo mật quốc tế như GDPR, Thành viên và Khách hàng tương tác trên hệ thống Hugo Studio được bảo đảm các quyền hợp pháp sau đây đối với thông tin cá nhân của mình:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1">
                    <h6 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">1. Quyền được biết & Quyền đồng ý:</h6>
                    <p className="text-justify text-slate-550 dark:text-slate-400">
                      Người dùng có quyền được biết rõ ràng, chi tiết mục đích, phạm vi thu thập, phương thức xử lý dữ liệu cá nhân của mình thông qua văn bản này. Mọi hành vi xử lý dữ liệu chỉ được thực hiện khi có sự đồng ý tự nguyện của người dùng bằng cách chủ động tích chọn hộp kiểm đồng ý khi đăng ký tài khoản.
                    </p>
                  </div>

                  <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1">
                    <h6 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">2. Quyền truy cập, chỉnh sửa & Đính chính dữ liệu:</h6>
                    <p className="text-justify text-slate-550 dark:text-slate-400">
                      Thành viên có quyền đăng nhập vào giao diện quản trị Dashboard cá nhân vào bất kỳ thời điểm nào để xem lại dữ liệu đang lưu trữ trên máy chủ, tự đính chính thông tin bị sai sót (như thay đổi họ tên hiển thị, cập nhật lại số điện thoại Zalo, chỉnh sửa các liên kết mạng xã hội hoặc cập nhật lại số đo cơ thể).
                    </p>
                  </div>

                  <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1">
                    <h6 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">3. Quyền rút lại sự đồng ý & Quyền yêu cầu xóa:</h6>
                    <p className="text-justify text-slate-550 dark:text-slate-400">
                      Người dùng có quyền rút lại sự đồng ý cho phép xử lý dữ liệu bất cứ lúc nào bằng cách gửi yêu cầu hủy tài khoản trực tuyến hoặc liên hệ qua kênh hỗ trợ của Admin. Sau khi nhận được yêu cầu, hệ thống cam kết sẽ thực hiện quy trình xóa bỏ dữ liệu vĩnh viễn (Hard Delete) theo đúng thời hạn 30 ngày quy định tại Chương VI.
                    </p>
                  </div>

                  <div className="p-4 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-1">
                    <h6 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">4. Quyền khiếu nại, tố cáo & Khởi kiện:</h6>
                    <p className="text-justify text-slate-550 dark:text-slate-400">
                      Người dùng có quyền khiếu nại trực tiếp đến Admin nếu phát hiện dữ liệu của mình bị xử lý sai mục đích cam kết. Ngoài ra, người dùng có quyền gửi đơn tố cáo đến các cơ quan quản lý chuyên trách về bảo vệ dữ liệu cá nhân hoặc khởi kiện ra Tòa án nhân dân để đòi bồi thường thiệt hại thực tế phát sinh.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider">
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
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">block</span>
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
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">balance</span>
                Chương XI: Luật Áp Dụng & Cơ Chế Giải Quyết Tranh Chấp Pháp Lý
              </h2>
              <div className="space-y-4">
                <p>
                  Toàn bộ nội dung của văn bản Điều khoản sử dụng và Chính sách Bảo mật này được giải thích, điều chỉnh và áp dụng duy nhất theo hệ thống pháp luật hiện hành của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                </p>
                <p className="text-xs text-justify">
                  Mọi tranh chấp phát sinh trong quá trình sử dụng dịch vụ giữa Thành viên và Ban quản trị hệ thống trước hết sẽ được ưu tiên giải quyết thông qua cơ chế thương lượng, hòa giải thiện chí trên tinh thần tôn trọng quyền lợi của cả hai bên.
                  <br />
                  Trong trường hợp hai bên không thể tự đạt được thỏa thuận hòa giải trong vòng ba mươi (30) ngày kể từ ngày một bên gửi thông báo chính thức bằng văn bản về vụ việc tranh chấp, một trong hai bên có quyền đưa vụ việc ra khởi kiện tại **Tòa án Nhân dân có thẩm quyền tại Việt Nam** để phân xử theo trình tự và thủ tục do pháp luật tố tụng dân sự Việt Nam quy định. Quyết định cuối cùng có hiệu lực pháp lý của Tòa án là phán quyết bắt buộc thi hành đối với cả hai bên. Chi phí liên quan đến án phí và các chi phí hỗ trợ pháp lý hợp lý khác sẽ do bên thua kiện chịu trách nhiệm chi trả toàn bộ, trừ trường hợp Tòa án có phán quyết phân bổ chi phí khác.
                </p>
              </div>
            </section>

            {/* CHƯƠNG 12 */}
            <section id="chuong-12" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-[#007aff]">mail</span>
                Chương XII: Điều Khoản Thi Hành & Thông Tin Liên Hệ Yêu Cầu Khử Dữ Liệu
              </h2>
              <div className="space-y-4">
                <p>
                  Quy chế sử dụng này bắt đầu có hiệu lực thi hành đầy đủ kể từ thời điểm được đăng tải công khai trên trang web chính thức của Hugo Studio. Ban quản trị hệ thống giữ toàn quyền sửa đổi, bổ sung các nội dung của Quy chế này vào bất kỳ thời điểm nào nhằm cập nhật theo sự thay đổi của các văn bản pháp luật Việt Nam hoặc khi có sự nâng cấp các tính năng kỹ thuật mới.
                </p>
                <p className="text-xs text-justify">
                  Khi có sự sửa đổi nội dung quy chế, ban quản trị sẽ cập nhật ngày ban hành ở đầu trang và đăng thông báo công khai nổi bật tại trang quản trị Dashboard của Thành viên. Việc Thành viên tiếp tục duy trì hoạt động tài khoản và sử dụng dịch vụ sau khi các nội dung sửa đổi được đăng tải đồng nghĩa với việc chấp thuận hoàn toàn các nội dung sửa đổi bổ sung đó.
                </p>

                <div className="p-6 rounded-2xl bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-4">
                  <h4 className="font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider text-xs sm:text-sm">
                    Thông tin liên hệ chính thức thực thi quyền bảo vệ dữ liệu cá nhân:
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Để thực hiện các quyền chủ thể dữ liệu cá nhân hợp pháp của mình (bao gồm: yêu cầu đính chính dữ liệu bị sai sót, yêu cầu xuất bản sao dữ liệu cá nhân để chuyển đi, rút lại sự đồng ý xử lý thông tin hoặc yêu cầu xóa bỏ tài khoản vĩnh viễn khỏi cơ sở dữ liệu), Thành viên vui lòng gửi email yêu cầu chính thức hoặc nhắn tin trực tiếp đến bộ phận hỗ trợ kỹ thuật vận hành bởi cá nhân Admin duy nhất:
                  </p>
                  
                  <div className="space-y-2 pt-1 text-xs font-mono">
                    <p className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff]">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      <span>Địa chỉ Email liên hệ: {data?.profile?.emailAddress || "support@hugowishpax.studio"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450">
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

          </div>

          {/* Bottom Agree Button */}
          <div className="pt-6 border-t border-[#e5e5e7] dark:border-[#2c2c2e] text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-[#007aff] hover:bg-[#0071e3] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 hover:scale-[1.01]"
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
