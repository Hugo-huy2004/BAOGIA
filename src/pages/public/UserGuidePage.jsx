import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { useHeadMeta } from "../../hooks/useHeadMeta";

export default function UserGuidePage() {
  const { data } = useData();
  const [activeSection, setActiveSection] = useState("chuong-1");

  useHeadMeta({
    title: "Hướng Dẫn Sử Dụng Hệ Thống Chi Tiết | Hugo Studio",
    description: "Tài liệu hướng dẫn sử dụng toàn diện nền tảng Hugo Studio. Hướng dẫn chi tiết cách tạo Bio Link, Bento Grid Portfolio, quản lý số đo hình thể và đặt lịch Booking.",
    keywords: "hướng dẫn sử dụng, tài liệu người dùng, tạo bio link, bento grid portfolio, hướng dẫn đặt lịch booking, số đo hình thể, thiết kế bento",
    canonicalUrl: "https://www.hugowishpax.studio/user-guide"
  });

  const chapters = [
    { id: "chuong-1", title: "Chương I: Tổng Quan Nền Tảng & Triết Lý Thiết Kế", icon: "help_center" },
    { id: "chuong-2", title: "Chương II: Đăng Ký Tài Khoản & Gói Tài Trợ Sinh Viên", icon: "person_add" },
    { id: "chuong-3", title: "Chương III: Thiết Kế Bento Grid Portfolio & Bio Link", icon: "dashboard" },
    { id: "chuong-4", title: "Chương IV: Quản Lý Số Đo Cơ Thể & Bảo Mật Đời Tư", icon: "accessibility" },
    { id: "chuong-5", title: "Chương V: Vận Hành Hệ Thống Đặt Lịch Hẹn (Booking)", icon: "event" },
    { id: "chuong-6", title: "Chương VI: Hướng Dẫn Liên Kết Thanh Toán Dịch Vụ Studio", icon: "payments" },
    { id: "chuong-7", title: "Chương VII: Tối Ưu Hóa Hình Ảnh & Tốc Độ Rerender", icon: "image" },
    { id: "chuong-8", title: "Chương VIII: Quản Lý Bảo Mật Tài Khoản & Session Token", icon: "lock" },
    { id: "chuong-9", title: "Chương IX: Khắc Phục Sự Cố Kỹ Thuật Thường Gặp", icon: "build" },
    { id: "chuong-10", title: "Chương X: Kênh Hỗ Trợ Kỹ Thuật & Gửi Yêu Cầu Hỗ Trợ", icon: "support_agent" }
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
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] py-12 px-4 sm:px-6 transition-colors duration-300 font-sans">
      
      {/* Container to handle sidebar and content */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative">
        
        {/* LEFT COLUMN: STICKY SIDEBAR NAVIGATION (Desktop only) */}
        <aside className="hidden lg:block w-80 shrink-0 h-fit sticky top-6">
          <div className="bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl border border-[#e5e5e7] dark:border-[#2c2c2e] p-6 rounded-3xl shadow-xl space-y-4 max-h-[85vh] overflow-y-auto scrollbar-hide">
            <div className="border-b border-[#e5e5e7] dark:border-[#2c2c2e] pb-3 text-center">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Tài liệu hướng dẫn</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">Hugo Studio User Manual v1.0</span>
            </div>
            <nav className="space-y-1">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => scrollToSection(chapter.id)}
                  className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-all text-xs font-semibold leading-relaxed border ${
                    activeSection === chapter.id
                      ? "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20"
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

        {/* RIGHT COLUMN: MAIN CONTENT PANEL */}
        <div className="flex-1 bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl p-6 sm:p-12 rounded-3xl border border-[#e5e5e7] dark:border-[#2c2c2e] shadow-2xl transition-all duration-300 space-y-8">
          
          {/* Header Title */}
          <div className="space-y-4 text-center pb-6 border-b border-[#e5e5e7] dark:border-[#2c2c2e] relative">
            <span className="absolute top-0 right-0 bg-indigo-500/10 border border-indigo-500/20 text-indigo-550 dark:text-indigo-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              Tài liệu chính thức
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1d1d1f] dark:text-white uppercase leading-snug">
              Cẩm Nang Hướng Dẫn Sử Dụng Toàn Diện Hugo Studio
            </h1>
            <p className="text-xs text-slate-550 dark:text-slate-455 font-bold tracking-wider">
              TÀI LIỆU HƯỚNG DẪN KỸ THUẬT VÀ QUY TRÌNH DÀNH CHO THÀNH VIÊN VÀ KHÁCH HÀNG
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              Ban hành và cập nhật gần nhất: Ngày 02 tháng 06 năm 2026
            </p>
          </div>

          {/* Guide Content Sections */}
          <div className="space-y-12 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 text-justify">

            {/* CHƯƠNG 1 */}
            <section id="chuong-1" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">help_center</span>
                Chương I: Tổng Quan Nền Tảng & Triết Lý Thiết Kế Sản Phẩm
              </h2>
              <div className="space-y-4">
                <p>
                  Chào mừng bạn đến với **Hugo Studio** - Nền tảng thiết kế hồ sơ cá nhân trực tuyến thế hệ mới. Trình thiết kế của chúng tôi được xây dựng trên triết lý tối giản của kiến trúc Bento Grid, kết hợp giữa phong cách trực quan của Apple và khả năng tùy biến vô hạn. Nền tảng này giúp mọi người dùng dễ dàng tạo lập một trang giới thiệu bản thân (Bio Link) và hồ sơ năng lực chuyên nghiệp (Bento Portfolio) chỉ trong vài phút kéo thả mà không cần bất kỳ kỹ năng lập trình nào.
                </p>
                <p>
                  Đối tượng sử dụng cốt lõi của Hugo Studio bao gồm: Các nghệ sĩ, người mẫu chuyên nghiệp (Models), diễn viên (Actors), KOLs, PG/PB, các lập trình viên (Developers), nhà thiết kế đồ họa (Designers), học sinh - sinh viên và các chuyên gia tự do mong muốn xây dựng một danh thiếp điện tử cao cấp, độc bản trên không gian số.
                </p>

                <div className="bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e] p-5 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider text-indigo-500">
                    Triết lý thiết kế và Các tính năng cốt lõi của nền tảng:
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-slate-550 dark:text-slate-400 space-y-2.5">
                    <li>
                      <strong>Cấu trúc Bento Grid thông minh:</strong> Cho phép chia nhỏ trang web thành các khối hình học (pills, squares, rectangles) xếp khít nhau như hộp cơm Bento Nhật Bản. Cơ chế này giúp tối ưu không gian hiển thị thông tin và tương thích tự động 100% với màn hình điện thoại di động lẫn máy tính.
                    </li>
                    <li>
                      <strong>Trực quan hóa số đo hình thể (Measurements):</strong> Hỗ trợ các trường thông tin số đo ba vòng, chiều cao, cân nặng chuyên biệt dành cho người mẫu và KOLs, hiển thị tinh tế và có thể ẩn đi bằng một nút gạt.
                    </li>
                    <li>
                      <strong>Hệ thống Booking tự động:</strong> Giúp Khách hàng gửi lịch làm việc trực tiếp đến Dashboard của Thành viên mà không phải thông qua các ứng dụng đặt lịch cồng kềnh khác.
                    </li>
                    <li>
                      <strong>Độc bản và Tốc độ:</strong> Ứng dụng công nghệ React kết hợp hệ quản trị cơ sở dữ liệu MongoDB Atlas cho thời gian phản hồi và tải trang tức thì dưới 1 giây.
                    </li>
                    <li>
                      <strong>Cam kết 100% Miễn Phí:</strong> Toàn bộ các công cụ thiết kế, kho giao diện cao cấp và tài nguyên lưu trữ của Hugo Studio đều được cung cấp miễn phí cho người dùng đăng ký. Hệ thống tuyệt đối không thực hiện bất kỳ hoạt động thương mại bán gói dịch vụ nào trên trang web.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 2 */}
            <section id="chuong-2" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">person_add</span>
                Chương II: Đăng Ký Tài Khoản & Gói Hỗ Trợ Độc Quyền Dành Cho Sinh Viên
              </h2>
              <div className="space-y-4">
                <p>
                  Để bắt đầu thiết kế Bento Portfolio cho riêng mình, bạn cần thực hiện theo quy trình thiết lập tài khoản tiêu chuẩn sau:
                </p>

                <div className="space-y-4 text-xs">
                  <div className="pl-4 border-l-2 border-slate-350 dark:border-slate-800 space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      Quy trình đăng ký tài khoản tiêu chuẩn:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      1. Truy cập vào trang đăng nhập qua đường dẫn `/login` và chọn tab "Đăng ký".
                      <br />
                      2. Nhập đầy đủ thông tin: Họ tên (hiển thị trên trang hồ sơ), Địa chỉ Email cá nhân (được dùng để nhận mã OTP và quản trị tài khoản), Số điện thoại Zalo (để liên lạc kỹ thuật và liên kết Booking) và Mật khẩu tự thiết lập.
                      <br />
                      3. Sau khi nhấn "Đăng ký", hệ thống sẽ gửi một mã số xác thực dùng một lần (OTP) đến hòm thư Email của bạn. Nhập mã OTP này vào giao diện xác thực để kích hoạt tài khoản chính thức. Mật khẩu của bạn sẽ lập tức được mã hóa SHA-256 an toàn khi ghi nhận vào hệ thống MongoDB.
                    </p>
                  </div>

                  <div className="pl-4 border-l-2 border-indigo-500 space-y-2">
                    <h5 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                      Quy trình tham gia chương trình tài trợ sinh viên (Premium Student):
                    </h5>
                    <p className="text-slate-605 dark:text-slate-400 text-justify">
                      Hugo Studio thấu hiểu học sinh - sinh viên là những đối tượng có nhu cầu rất lớn về một trang giới thiệu bản thân chuyên nghiệp nhưng lại hạn chế về ngân sách. Vì vậy, chúng tôi triển khai chương trình tài trợ đặc biệt **Premium Student tài trợ 100% chi phí**:
                      <br />
                      - <strong>Điều kiện tham gia:</strong> Người dùng có địa chỉ email giáo dục hợp lệ cấp bởi các trường học, đại học, viện đào tạo tại Việt Nam hoặc quốc tế (địa chỉ email có đuôi định dạng dạng `.edu` hoặc `.edu.vn`).
                      <br />
                      - <strong>Các bước kích hoạt:</strong>
                      <br />
                      &nbsp;&nbsp;+ Trong trang Dashboard quản trị cá nhân, chọn mục "Hồ sơ cá nhân" và kéo xuống phần "Xác thực Sinh viên".
                      <br />
                      &nbsp;&nbsp;+ Nhập địa chỉ email giáo dục `.edu` của bạn và nhấn "Gửi yêu cầu xác thực".
                      <br />
                      &nbsp;&nbsp;+ Một mã OTP bảo mật chuyên biệt sẽ được gửi trực tiếp vào hòm thư email giáo dục đó. Nhập mã OTP này lên hệ thống để hoàn tất việc xác thực.
                      <br />
                      &nbsp;&nbsp;+ Sau khi xác thực thành công, tài khoản của bạn sẽ lập tức được nâng lên gói **Premium Student** với thời hạn tối đa là **365 ngày** (1 năm). Bạn sẽ được kích hoạt toàn bộ các tính năng đặc quyền nâng cao như: ẩn nhãn hiệu Hugo Studio, mở khóa các khối bento giới hạn, sử dụng nhạc nền tự phát, mở rộng dung lượng ảnh và xem thống kê chi tiết.
                      <br />
                      &nbsp;&nbsp;+ Sau khi hết thời hạn 365 ngày, hệ thống sẽ tự động gạt tài khoản về gói miễn phí tiêu chuẩn. Bạn chỉ cần thực hiện lại quy trình xác thực email sinh viên mới để tiếp tục được gia hạn thêm 365 ngày miễn phí tiếp theo.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 3 */}
            <section id="chuong-3" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">dashboard</span>
                Chương III: Thiết Kế Bento Grid Portfolio & Bio Link Chuyên Nghiệp
              </h2>
              <div className="space-y-4">
                <p>
                  Trình thiết kế Bento Grid của Hugo Studio hoạt động theo cơ chế khối xếp hình động trực quan. Toàn bộ giao diện trang Bio Link của bạn được xây dựng thông qua việc thêm mới, xóa bỏ và sắp đặt vị trí của các khối Bento (Bento Blocks).
                </p>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 dark:text-white">1. Các loại khối Bento được hỗ trợ trên hệ thống:</h4>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1.5 text-justify">
                      <li><strong>Khối Hồ sơ (Profile Card):</strong> Hiển thị ảnh đại diện (avatar), họ tên, chức danh công việc và văn bản tiểu sử ngắn. Đây là khối cốt lõi định danh trang Bio Link của bạn.</li>
                      <li><strong>Khối Liên kết nhanh (Link Button):</strong> Chứa đường dẫn trỏ tới các trang mạng xã hội (Facebook, Instagram, TikTok, Threads) hoặc liên kết ngoài. Bạn có thể chọn icon đại diện, đặt tiêu đề và viết chú thích ngắn.</li>
                      <li><strong>Khối Chỉ số cơ thể (Body Stats Card):</strong> Hiển thị chiều cao, cân nặng và các số đo vòng một, vòng hai, vòng ba (dành cho người mẫu/KOLs).</li>
                      <li><strong>Khối Nhúng đa phương tiện (Media Embed Card):</strong> Cho phép nhúng mã phát nhạc từ Spotify, SoundCloud hoặc nhúng trực tiếp trình phát video YouTube. Khán giả có thể nghe nhạc hoặc xem video ngay trên trang Bio Link của bạn mà không bị chuyển hướng trang.</li>
                      <li><strong>Khối Đặt lịch hẹn (Booking Card):</strong> Tích hợp biểu mẫu ngắn giúp khách truy cập đặt lịch làm việc với bạn một cách tiện lợi.</li>
                    </ul>
                  </div>

                  <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <h4 className="font-bold text-slate-800 dark:text-white">2. Các bước thiết kế và Tùy biến giao diện chi tiết:</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-justify leading-relaxed">
                      - <strong>Bước 1: Bố cục lưới Bento (Layout Settings):</strong> Truy cập mục "Thiết kế" trong Dashboard. Tại đây, bạn có thể lựa chọn kiểu hiển thị lưới Bento theo cột dọc (dành cho di động) hoặc dạng lưới lưới mở rộng (dành cho máy tính).
                      <br />
                      - <strong>Bước 2: Thay đổi chủ đề (Themes Selection):</strong> Hugo Studio cung cấp sẵn nhiều phong cách chủ đề nghệ thuật:
                      <br />
                      &nbsp;&nbsp;+ <em>Default Theme:</em> Thiết kế sang trọng, tối giản kiểu Apple với các góc bo tròn mềm mại và hiệu ứng kính mờ (Glassmorphism).
                      <br />
                      &nbsp;&nbsp;+ <em>Brutalism Theme:</em> Phong cách thô mộc, góc cạnh hiện đại với phông chữ độ tương phản cực cao và viền đen dày đậm chất nghệ thuật đường phố.
                      <br />
                      &nbsp;&nbsp;+ <em>Flat Theme:</em> Phong cách thiết kế phẳng hiện đại, sử dụng các mảng màu pastel dịu nhẹ và phông chữ thanh lịch.
                      <br />
                      - <strong>Bước 3: Tự cấu hình bảng màu và Phông chữ (Fonts & Colors):</strong> Bạn có thể tự chọn màu nền (hoặc ảnh nền), màu sắc văn bản và phông chữ hiển thị từ kho phông chữ Google Fonts tích hợp sẵn (Inter, Roboto, Outfit, Playfair Display).
                      <br />
                      - <strong>Bước 4: Sắp xếp các khối (Drag and Drop):</strong> Giữ chuột vào biểu tượng kéo thả trên góc mỗi khối Bento và di chuyển đến vị trí mong muốn. Hệ thống sẽ tự động tính toán khoảng cách và dàn trang khít đẹp mắt theo quy luật Bento Grid. Nhấn "Lưu cấu hình" để cập nhật giao diện ngay lập tức.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 4 */}
            <section id="chuong-4" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">accessibility</span>
                Chương IV: Quản Lý Số Đo Cơ Thể & Bảo Vệ Quyền Riêng Tư Thông Tin Đời Tư
              </h2>
              <div className="space-y-4">
                <p>
                  Phân hệ số đo hình thể (Measurements) là công cụ chuyên biệt thiết thực cho các người mẫu, KOLs, PG/PB xây dựng Compcard (danh thiếp người mẫu) trực tuyến. Tuy nhiên, do đây là dữ liệu cá nhân nhạy cảm, chúng tôi thiết kế cơ chế bảo vệ quyền riêng tư cực kỳ nghiêm ngặt tuân thủ Nghị định 13/2023/NĐ-CP:
                </p>

                <div className="space-y-4 text-xs text-justify">
                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      1. Cách thức nhập dữ liệu chỉ số hình thể:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Trong trang Dashboard, chọn mục "Quản lý số đo". Tại đây bạn có thể điền thông tin: Chiều cao (cm), Cân nặng (kg), Vòng một (Chest/Bust), Vòng hai (Waist), Vòng ba (Hips) và Kiểu dáng vóc dáng tổng quan. Hệ thống hỗ trợ cả định dạng số đo hệ mét tiêu chuẩn. Hãy đảm bảo thông tin của bạn là trung thực và cập nhật thường xuyên để phục vụ tốt nhất việc tìm kiếm lịch đặt hẹn từ các thương hiệu thời trang.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      2. Quản lý hiển thị và Cơ chế bảo vệ đời tư cá nhân:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - <strong>Quyền gạt nút hiển thị (Privacy Toggle):</strong> Hệ thống trang bị nút gạt "Công khai khối số đo" (Public Stats Card) trong Dashboard. Khi nút gạt này tắt, toàn bộ thông tin số đo cơ thể của bạn sẽ bị ẩn hoàn toàn trên trang Bio Link công cộng, và chỉ có thể được xem nội bộ bởi chính bạn khi đăng nhập Dashboard. Mọi truy cập trái phép từ bên ngoài sẽ không thể quét được dữ liệu này.
                      <br />
                      - <strong>Lựa chọn gạt ẩn/hiện từng chỉ số:</strong> Bạn có thể tùy chọn ẩn riêng lẻ từng thông số (ví dụ: chỉ cho phép hiện chiều cao và vòng hai, ẩn đi cân nặng và vòng ba) nhằm bảo vệ tốt nhất cảm nhận quyền riêng tư cơ thể của mình.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 5 */}
            <section id="chuong-5" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">event</span>
                Chương V: Vận Hành Hệ Thống Ghi Nhận Đặt Lịch Hẹn (Booking)
              </h2>
              <div className="space-y-4">
                <p>
                  Hugo Studio tích hợp sẵn hệ thống Đặt lịch hẹn làm việc (Booking) chuyên nghiệp giúp tinh giản hóa quy trình tương tác công việc giữa Thành viên và Khách hàng đối tác:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h6 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      Dành cho Thành viên (Người quản lý lịch hẹn):
                    </h6>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - <strong>Thiết lập trạng thái sẵn sàng (Availability Settings):</strong> Bạn có thể bật/tắt chức năng nhận lịch hẹn bất kỳ lúc nào thông qua trang cấu hình Booking. Cài đặt các thông tin: những ngày trong tuần sẵn sàng nhận việc, khung giờ làm việc cố định (ví dụ từ 09:00 đến 17:00), và nội dung yêu cầu cụ thể mà Khách hàng bắt buộc phải điền.
                      <br />
                      - <strong>Phê duyệt lịch hẹn (Dashboard Management):</strong> Khi có yêu cầu đặt lịch hẹn mới, hệ thống sẽ gửi thông báo đến Email quản trị của bạn. Bạn đăng nhập Dashboard để xem chi tiết: Tên khách hàng, số điện thoại Zalo, mục đích công việc và nội dung mô tả công việc. Bạn có quyền nhấn "Chấp nhận" hoặc "Từ chối" lịch hẹn.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h6 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">
                      Dành cho Khách hàng (Người gửi yêu cầu lịch hẹn):
                    </h6>
                    <p className="text-slate-600 dark:text-slate-400 text-justify">
                      - <strong>Gửi biểu mẫu lịch hẹn:</strong> Truy cập Bio Link của Thành viên, nhấp chọn khối Bento "Đặt lịch làm việc". Điền đầy đủ thông tin: Họ tên của bạn, địa chỉ Email để nhận thông báo phản hồi, số điện thoại kết nối Zalo, lựa chọn ngày giờ mong muốn diễn ra công việc và viết nội dung mô tả yêu cầu công việc chi tiết.
                      <br />
                      - <strong>Theo dõi trạng thái:</strong> Sau khi gửi lịch, hệ thống sẽ ghi nhận trạng thái Booking là "PENDING" (Đang chờ duyệt). Khi Thành viên nhấn chấp nhận hoặc từ chối lịch hẹn, một email thông báo tự động từ hệ thống Hugo Studio sẽ gửi về hòm thư của bạn để xác nhận kết quả cuối cùng.
                    </p>
                  </div>
                </div>

                <p className="text-slate-500 dark:text-slate-450 italic text-[11px] border-l-4 border-amber-500 pl-4">
                  * Khuyến cáo an toàn giao dịch: Hugo Studio chỉ đóng vai trò cung cấp giải pháp kỹ thuật lưu trữ và thông tin trung gian truyền tải Booking. Mọi thỏa thuận tài chính, ký kết hợp đồng dịch vụ, thanh toán tiền cát-xê công việc giữa hai bên phải được thực hiện tự do bên ngoài hệ thống. Chúng tôi miễn trừ mọi trách nhiệm giải quyết tranh chấp kinh tế phát sinh liên quan đến hoạt động Booking này.
                </p>
              </div>
            </section>

            {/* CHƯƠNG 6 */}
            <section id="chuong-6" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">payments</span>
                Chương VI: Hướng Dẫn Liên Kết Thanh Toán Dịch Vụ Studio Cá Nhân Của Admin
              </h2>
              <div className="space-y-4">
                <p>
                  Hệ thống thanh toán trực tuyến tích hợp trên Hugo Studio (liên kết API qua PayOS VietQR) là một **tiện ích lập hóa đơn nội bộ độc quyền của Admin** phục vụ hoạt động chụp ảnh và thiết kế nghệ thuật thực tế ngoài đời thực của riêng Admin, hoàn toàn không liên quan đến hoạt động của các gói tài khoản Thành viên thông thường (do website cung cấp công cụ miễn phí 100%):
                </p>

                <div className="space-y-4 text-xs text-justify">
                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      1. Giao diện Cổng thanh toán VietQR & Cách thức quét mã nhanh:
                    </h5>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      - Khi khách hàng trực tiếp đặt lịch chụp hình nghệ thuật hoặc thiết kế mỹ thuật với cá nhân Admin, Admin sẽ tạo một mã liên kết thanh toán (Payment Link) có mã hóa số tiền và lý do thanh toán độc nhất (Ví dụ: `PROFILE_HUGO_9999`) trên Dashboard Admin và gửi đường link trỏ tới giao diện thanh toán `/pay/:id` cho khách hàng.
                      <br />
                      - Khi truy cập liên kết thanh toán, khách hàng có thể lựa chọn các phương thức thanh toán nhanh:
                      <br />
                      &nbsp;&nbsp;+ <strong>VietQR App Banking (Khuyên dùng):</strong> Hệ thống hiển thị mã VietQR tiêu chuẩn quốc gia. Khách hàng chỉ cần mở ứng dụng ngân hàng di động bất kỳ (Vietcombank, Techcombank, MB Bank, v.v.), nhấn vào tính năng Quét mã QR, đưa camera điện thoại lên quét. Hệ thống ngân hàng sẽ tự động điền chính xác 100% Số tài khoản ngân hàng cá nhân của Admin, Số tiền thanh toán (được định dạng chính xác hàng nghìn `.000`) và Nội dung tin nhắn chuyển khoản mà không cần khách hàng nhập thủ công, tránh hoàn toàn sai sót chuyển nhầm tiền hoặc nhập sai nội dung.
                      <br />
                      &nbsp;&nbsp;+ <strong>Momo / Ví điện tử:</strong> Quét mã thanh toán trực tiếp qua ví Momo.
                      <br />
                      &nbsp;&nbsp;+ <strong>Apple Pay:</strong> Cho phép xác thực thanh toán nhanh trên các thiết bị hệ điều hành iOS/macOS có liên kết thẻ ghi nợ/tín dụng hợp lệ.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      2. Quy trình xác thực thanh toán tự động:
                    </h5>
                    <p className="text-slate-605 dark:text-slate-400 leading-relaxed">
                      - Sau khi khách hàng hoàn tất giao dịch chuyển khoản thành công trên ứng dụng Mobile Banking của mình, cổng thanh toán đối tác PayOS sẽ gửi một phản hồi (Webhook/Callback API) trực tiếp tới máy chủ Hugo Studio trong vòng 3 giây để cập nhật tức thì trạng thái giao dịch từ "PENDING" (Đang chờ) thành "PAID" (Đã thanh toán).
                      <br />
                      - Giao diện hóa đơn điện tử ảo (Sponsorship Receipt) trên trang web sẽ tự động chuyển sang màu xanh xác nhận giao dịch thành công. Khách hàng không cần phải gửi ảnh chụp màn hình chuyển khoản qua tin nhắn cho Admin để xác thực thủ công.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 7 */}
            <section id="chuong-7" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">image</span>
                Chương VII: Hướng Dẫn Tối Ưu Hóa Hình Ảnh & Nâng Cao Tốc Độ Tải Trang
              </h2>
              <div className="space-y-4">
                <p>
                  Để trang Bio Link và Bento Grid Portfolio của bạn đạt điểm số hiệu năng tối ưu (Google Core Web Vitals) và hiển thị mượt mà trên thiết bị di động của khách truy cập, việc tối ưu hóa định dạng và kích thước tệp tin hình ảnh tải lên là vô cùng quan trọng:
                </p>

                <div className="space-y-4 text-xs text-justify">
                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      1. Tiêu chuẩn kỹ thuật đối với hình ảnh tải lên hệ thống:
                    </h5>
                    <p className="text-slate-606 dark:text-slate-400 leading-relaxed">
                      - <strong>Định dạng hình ảnh khuyến nghị:</strong> Hãy sử dụng định dạng ảnh thế hệ mới <strong>WebP</strong> hoặc định dạng <strong>PNG</strong> nén. Các định dạng này giữ được chất lượng hiển thị sắc nét nhưng có dung lượng tệp tin cực nhẹ (chỉ bằng 1/3 dung lượng ảnh JPG thông thường).
                      <br />
                      - <strong>Dung lượng tệp tin giới hạn:</strong> Hệ thống giới hạn mỗi ảnh tải lên có dung lượng tối đa là <strong>2MB</strong> đối với tài khoản Free và lên tới <strong>5MB</strong> đối với tài khoản Premium Student. Hãy sử dụng các công cụ nén ảnh trực tuyến miễn phí (như TinyPNG) trước khi tải ảnh lên.
                      <br />
                      - <strong>Kích thước ảnh đại diện (Avatar):</strong> Khuyến nghị cắt ảnh (crop) về tỷ lệ vuông 1:1 với kích thước tối ưu là 400x400 pixels để đảm bảo ảnh tròn hiển thị sắc nét, không bị méo lệch góc.
                    </p>
                  </div>

                  <div className="p-5 bg-[#f5f5f7] dark:bg-[#252528] rounded-2xl border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-2">
                    <h5 className="font-bold text-slate-800 dark:text-white text-xs">
                      2. Kỹ thuật Lazy Loading và Tăng tốc rải trang:
                    </h5>
                    <p className="text-slate-606 dark:text-slate-400 leading-relaxed">
                      - Máy chủ Hugo Studio đã lập trình sẵn cơ chế <strong>Lazy Loading</strong> (Tải chậm hình ảnh). Các hình ảnh nằm ở phần dưới trang web (ngoài tầm nhìn ban đầu của màn hình) sẽ chỉ được tải về thiết bị khi khách truy cập cuộn màn hình xuống phía dưới. Điều này giúp giảm thiểu 80% băng thông tải trang ban đầu, giúp khách hàng xem Bento Portfolio của bạn nhanh chóng ngay cả khi đang sử dụng kết nối mạng 3G/4G yếu.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 8 */}
            <section id="chuong-8" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">lock</span>
                Chương VIII: Quản Lý Bảo Mật Tài Khoản & Session Token Đăng Nhập
              </h2>
              <div className="space-y-4">
                <p>
                  Hugo Studio áp dụng các giao thức an ninh mạng đa lớp để bảo vệ tài khoản của Thành viên trước các nguy cơ tấn công xâm nhập trái phép:
                </p>

                <div className="space-y-4 pl-4 border-l-2 border-indigo-500 text-xs">
                  <p>
                    <strong>a) Quy chuẩn đặt mật khẩu an toàn tối thiểu:</strong>
                    <br />
                    Hệ thống khuyến nghị Thành viên thiết lập mật khẩu có độ dài tối thiểu là 8 ký tự, bao gồm ít nhất 01 chữ cái viết hoa, 01 chữ số và 01 ký tự đặc biệt (như `@`, `#`, `$`, `&`). Tuyệt đối tránh sử dụng các phán đoán mật khẩu yếu như `12345678`, `password` hoặc trùng tên tài khoản của mình. Mật khẩu của bạn được mã hóa an toàn bằng băm mật (Cryptographic Hash) trước khi lưu vào MongoDB, do đó Admin cũng không có khả năng đọc được mật khẩu gốc của bạn.
                  </p>

                  <p>
                    <strong>b) Cơ chế Session Token và Quy tắc tự động đăng xuất sau 14 ngày:</strong>
                    <br />
                    - Khi bạn đăng nhập thành công vào Dashboard, máy chủ sẽ cấp cho trình duyệt một mã <strong>Session Token</strong> mã hóa an toàn lưu trữ trong bộ nhớ Local Storage nhằm duy trì trạng thái đăng nhập.
                    <br />
                    - Để phòng ngừa trường hợp Thành viên đăng nhập tài khoản trên thiết bị lạ (như máy tính trường học, quán cafe internet) mà quên nhấn nút "Đăng xuất", hệ thống thiết lập thời hạn hiệu lực của Session Token tối đa là <strong>14 ngày</strong> (tương đương 336 giờ). Đúng vào lúc 00:00:00 của ngày thứ 14 kể từ thời điểm đăng nhập gần nhất, hệ thống sẽ tự động hủy token này trong cơ sở dữ liệu, buộc trình duyệt thoát tài khoản và yêu cầu bạn nhập mật khẩu đăng nhập lại từ đầu để đảm bảo an toàn tuyệt đối.
                  </p>

                  <p>
                    <strong>c) Yêu cầu xuất dữ liệu hoặc Xóa tài khoản vĩnh viễn:</strong>
                    <br />
                    - Thành viên có quyền yêu cầu xuất bản sao dữ liệu cá nhân của mình đang lưu trên hệ thống bằng cách gửi yêu cầu trong Dashboard.
                    <br />
                    - Khi thực hiện yêu cầu xóa tài khoản, hệ thống sẽ ẩn ngay lập tức Bio Link công cộng của bạn (Soft Delete). Đúng sau 30 ngày dương lịch tiếp theo để Thành viên có thời gian suy nghĩ thay đổi quyết định, hệ thống sẽ tự động quét cơ sở dữ liệu và thực hiện xóa cứng vĩnh viễn (Hard Delete) toàn bộ thông tin đăng ký, ảnh đại diện, số đo cơ thể, dữ liệu lịch hẹn Booking trên máy chủ MongoDB Atlas mà không thể khôi phục lại.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 9 */}
            <section id="chuong-9" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">build</span>
                Chương IX: Khắc Phục Sự Cố Kỹ Thuật Thường Gặp Khi Thiết Kế
              </h2>
              <div className="space-y-4">
                <p>
                  Trong quá trình sử dụng và tùy biến Bento Portfolio, nếu bạn gặp phải các vấn đề kỹ thuật bất thường, hãy bình tĩnh thực hiện theo các hướng dẫn khắc phục sự cố tiêu chuẩn sau:
                </p>

                <div className="space-y-3.5 text-xs text-justify">
                  <p>
                    <strong>1. Không thể tải hình ảnh lên hệ thống (Upload Image Error):</strong>
                    <br />
                    - <em>Nguyên nhân:</em> Do tệp tin hình ảnh có dung lượng vượt quá giới hạn cho phép (2MB đối với gói Free) hoặc định dạng tệp tin không được hỗ trợ (như tệp ảnh gốc RAW, TIFF).
                    <br />
                    - <em>Cách khắc phục:</em> Hãy chuyển đổi hình ảnh của bạn sang định dạng PNG/JPG/WebP và sử dụng các phần mềm nén ảnh trực tuyến để giảm dung lượng file xuống dưới 2MB trước khi thử tải lên lại.
                  </p>

                  <p>
                    <strong>2. Khối Bento nhúng nhạc/video (YouTube, Spotify) không hoạt động:</strong>
                    <br />
                    - <em>Nguyên nhân:</em> Do bạn nhập sai định dạng đường link (URL) của video hoặc bài hát, hoặc do đối tác nhúng chặn quyền phát lại trên các trang web bên thứ ba.
                    <br />
                    - <em>Cách khắc phục:</em> Hãy chắc chắn rằng bạn copy đường dẫn chia sẻ chuẩn. Ví dụ: đối với YouTube phải là dạng link có chứa mã video (như `https://youtube.com/watch?v=...` hoặc `https://youtu.be/...`). Tuyệt đối không tự ý nhúng các đường dẫn nội bộ của kênh quản trị YouTube Studio cá nhân.
                  </p>

                  <p>
                    <strong>3. Thay đổi giao diện lưới Bento Grid nhưng trang công cộng không cập nhật:</strong>
                    <br />
                    - <em>Nguyên nhân:</em> Do trình duyệt của bạn đang lưu bộ nhớ đệm (Cache) của trang Bio Link cũ nhằm tối ưu tốc độ tải trang.
                    <br />
                    - <em>Cách khắc phục:</em> Thực hiện làm mới trang web bằng cách nhấn tổ hợp phím <strong>Ctrl + F5</strong> (trên hệ điều hành Windows) hoặc <strong>Cmd + Shift + R</strong> (trên máy tính macOS) để xóa bộ nhớ đệm trình duyệt và tải lại giao diện thiết kế mới nhất.
                  </p>

                  <p>
                    <strong>4. Email giáo dục (.edu) không nhận được mã OTP xác thực:</strong>
                    <br />
                    - <em>Nguyên nhân:</em> Do hệ thống bảo mật thư điện tử của trường học chặn các email gửi từ hệ thống tự động bên ngoài, hoặc email gửi đến bị chuyển nhầm vào hòm thư rác (Spam).
                    <br />
                    - <em>Cách khắc phục:</em> Hãy kiểm tra kỹ thư mục "Thư rác" (Spam), "Mạng xã hội" hoặc "Nội dung cập nhật" (Promotions) trong hộp thư giáo dục của bạn. Nếu vẫn không nhận được mã, vui lòng gửi phiếu yêu cầu hỗ trợ đến Admin kèm theo ảnh chụp thẻ sinh viên để được duyệt thủ công.
                  </p>
                </div>
              </div>
            </section>

            {/* CHƯƠNG 10 */}
            <section id="chuong-10" className="space-y-4 scroll-mt-20">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2.5 uppercase border-b border-white/5 pb-2">
                <span className="material-symbols-outlined text-indigo-550 dark:text-indigo-400">support_agent</span>
                Chương X: Quy Trình Gửi Phiếu Yêu Cầu Hỗ Trợ & Kênh Tương Tác Chính Thức
              </h2>
              <div className="space-y-4">
                <p>
                  Khi cần hỗ trợ kỹ thuật chuyên sâu (khôi phục tài khoản bị hack, báo lỗi hệ thống, xác thực sinh viên thủ công), Thành viên có thể gửi yêu cầu hỗ trợ chính thức theo các kênh tương tác sau:
                </p>

                <div className="p-6 rounded-2xl bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e] space-y-4 text-xs">
                  <h5 className="font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">
                    Các kênh tiếp nhận và hỗ trợ kỹ thuật chính thức:
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400">
                    - <strong>Tương tác với Trợ lý ảo Bot Culi:</strong> Truy cập biểu tượng Chat Bot ở góc dưới bên phải màn hình để gửi mô tả lỗi nhanh. Bot Culi sẽ tự động phân loại sự cố và hướng dẫn bạn điền phiếu gửi hỗ trợ (Support Tickets) đúng quy định.
                    <br />
                    - <strong>Kênh hỗ trợ trực tiếp từ cá nhân Admin duy nhất:</strong>
                  </p>
                  
                  <div className="space-y-2 pt-1 font-mono">
                    <p className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff]">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      <span>Địa chỉ Email liên hệ: {data?.profile?.emailAddress || "support@hugowishpax.studio"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-455">
                      <span className="material-symbols-outlined text-sm">chat</span>
                      <span>Kênh Zalo hỗ trợ kỹ thuật: {data?.profile?.zaloNumber || "0901234567"}</span>
                    </p>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic border-t border-slate-200 dark:border-slate-800 pt-3 text-justify">
                    * Cam kết thời gian phản hồi (SLA): Bộ phận hỗ trợ kỹ thuật của cá nhân Admin cam kết tiếp nhận sự cố, tiến hành đối soát thông tin tài khoản và xử lý phản hồi chi tiết cho Thành viên qua Email hoặc tin nhắn Zalo trong vòng tối đa **03 ngày làm việc** kể từ thời điểm nhận được phiếu yêu cầu hỗ trợ hợp lệ.
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* Bottom Back Button */}
          <div className="pt-6 border-t border-[#e5e5e7] dark:border-[#2c2c2e] text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 hover:scale-[1.01]"
              style={{ minHeight: 0, minWidth: 0 }}
            >
              Trở Về Trang Chủ
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
