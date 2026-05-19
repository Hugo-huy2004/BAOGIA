import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-10 bg-white dark:bg-[#12111a] p-8 sm:p-14 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="space-y-4 text-center pb-8 border-b border-slate-100 dark:border-white/5">
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            CHÍNH SÁCH BẢO MẬT & ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Thiết lập dựa trên các quy định pháp luật hiện hành của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            Cập nhật lần cuối: Ngày 20 tháng 05 năm 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 text-justify">
          
          {/* Căn cứ pháp lý */}
          <section className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-xl">gavel</span>
              CĂN CỨ PHÁP LÝ THIẾT LẬP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hugo Studio xây dựng chính sách bảo mật và điều khoản này tuân thủ nghiêm ngặt các quy định pháp lý của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam, bao gồm nhưng không giới hạn ở:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li>Bộ luật Dân sự nước CHXHCN Việt Nam năm 2015;</li>
              <li>Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân;</li>
              <li>Luật An toàn thông tin mạng năm 2015;</li>
              <li>Luật An ninh mạng năm 2018;</li>
              <li>Luật Giao dịch điện tử năm 2005 (và các văn bản sửa đổi, bổ sung tương ứng).</li>
            </ul>
          </section>

          {/* 1. Giới thiệu chung */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. Quyền sở hữu và Điều khoản sử dụng</h3>
            <p>
              Chào mừng quý khách đến với Hugo Studio. Tài liệu này là sự thỏa thuận pháp lý ràng buộc giữa quý khách (sau đây gọi là "Người dùng" hoặc "Khách hàng") và Hugo Studio về việc sử dụng các dịch vụ tạo Bio Link cá nhân, thiết kế Bento Portfolio, và các dịch vụ đi kèm. Bằng cách đăng ký tài khoản, đăng nhập hoặc tiếp tục trải nghiệm trang web, người dùng thừa nhận đã đọc, hiểu rõ và đồng ý tuân thủ tuyệt đối các nội dung quy định tại đây.
            </p>
          </section>

          {/* 2. Thu thập thông tin cá nhân */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. Thu thập và Phân loại dữ liệu cá nhân</h3>
            <p>
              Theo quy định của Nghị định 13/2023/NĐ-CP, chúng tôi chỉ thu thập và xử lý các thông tin cá nhân cần thiết phục vụ cho việc cung cấp dịch vụ công nghệ:
            </p>
            <div className="space-y-3.5 pl-2 border-l-2 border-emerald-500/50">
              <p>
                <strong>a) Dữ liệu cá nhân cơ bản lưu trữ trên máy chủ (Database):</strong> Họ và tên hiển thị, địa chỉ email đăng nhập (chỉ chấp nhận các tài khoản sử dụng email giáo dục trường học có đuôi `.edu` hoặc `.edu.vn` để được kích hoạt đặc quyền miễn phí), số điện thoại liên hệ, liên kết mạng xã hội, các nội dung bento tab, hình ảnh đại diện cá nhân do chính người dùng đăng tải.
              </p>
              <p>
                <strong>b) Dữ liệu kỹ thuật & Nhật ký hoạt động:</strong> Địa chỉ IP, loại thiết bị truy cập, hệ điều hành và thời gian đăng nhập nhằm đảm bảo an toàn hệ thống và phòng ngừa tấn công mạng.
              </p>
            </div>
          </section>

          {/* 3. Quy định thời hạn sử dụng và Quy tắc 00:00 */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. Quy tắc tính toán Thời hạn dịch vụ và Phiên đăng nhập</h3>
            <p>
              Căn cứ theo nguyên tắc xác định thời hạn quy định tại Bộ luật Dân sự 2015, để tối ưu hóa tài nguyên máy chủ và mang lại sự rõ ràng minh bạch trong vận hành, Hugo Studio áp dụng quy tắc tính thời hạn sử dụng dịch vụ dựa trên mốc thời gian chuyển giao ngày mới (mốc 00:00):
            </p>
            <div className="space-y-3 pl-2 border-l-2 border-emerald-500/50">
              <p>
                <strong>a) Định nghĩa "1 ngày sử dụng":</strong> Bất kỳ thời điểm kích hoạt gói dịch vụ hay đăng nhập tài khoản nào xảy ra trong ngày dương lịch hiện tại, dù là đầu ngày (00:01) hay cuối ngày (23:59), thì thời gian sử dụng thực tế từ lúc kích hoạt cho đến 00:00:00 (nửa đêm) của ngày mới sẽ được tính tròn là 01 ngày sử dụng.
              </p>
              <p>
                <strong>b) Áp dụng đối với Phiên Đăng Nhập (14 ngày):</strong> Thời gian lưu trữ trạng thái đăng nhập (Token session) tối đa là 14 ngày. Trình duyệt của bạn sẽ tự động đăng xuất vào lúc 00:00:00 của ngày thứ 14 kể từ ngày đăng nhập đầu tiên để bảo vệ an toàn danh tính của bạn.
              </p>
              <p>
                <strong>c) Áp dụng đối với Gói Dịch Vụ Bio Link (365 ngày):</strong> Gói đặc quyền sinh viên được tài trợ sử dụng trong vòng 12 tháng (tương đương 365 ngày). Thời điểm hết hiệu lực của trang Bio sẽ được làm tròn về đúng mốc 00:00:00 của ngày hết hạn thứ 365 (tính theo ngày dương lịch Việt Nam).
              </p>
            </div>
          </section>

          {/* 4. Mục đích xử lý dữ liệu */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">4. Mục đích và Phạm vi xử lý dữ liệu</h3>
            <p>
              Dữ liệu của Khách hàng chỉ được sử dụng cho các mục đích nội bộ hợp pháp dưới đây:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Thiết lập cấu hình hiển thị trang thông tin cá nhân (Bio Link) theo yêu cầu cá nhân hóa của chủ tài khoản.</li>
              <li>Xác thực danh tính chủ thể và kiểm soát việc phân bổ các gói tài trợ miễn phí cho đối tượng thụ hưởng hợp lệ (Sinh viên sở hữu email giáo dục).</li>
              <li>Thông báo các bản cập nhật bảo mật kỹ thuật quan trọng hoặc phản hồi các yêu cầu trợ giúp kỹ thuật.</li>
              <li>Nén dữ liệu hình ảnh (định dạng WebP thông minh) để cải thiện tốc độ truyền tải trang và giảm thiểu băng thông lưu trữ.</li>
            </ul>
          </section>

          {/* 5. Quyền của chủ thể dữ liệu */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">5. Quyền hạn của Chủ thể dữ liệu</h3>
            <p>
              Tuân thủ Chương II Nghị định 13/2023/NĐ-CP, người dùng tại Hugo Studio được bảo đảm các quyền năng pháp lý tối cao đối với thông tin cá nhân của mình:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Quyền được biết & Tiếp cận:</strong> Người dùng có quyền truy cập trang quản trị cá nhân bất cứ lúc nào để kiểm tra thông tin đang được lưu giữ.</li>
              <li><strong>Quyền Chỉnh sửa & Cập nhật:</strong> Người dùng có thể chủ động sửa đổi toàn bộ thông tin trên Bio Link, đổi tên hiển thị, cập nhật ảnh đại diện hoặc thay đổi các liên kết mạng xã hội theo ý muốn thời gian thực.</li>
              <li><strong>Quyền Yêu cầu Xóa bỏ dữ liệu (Quyền được lãng quên):</strong> Tại trang quản trị tài khoản, người dùng có quyền tự hủy kích hoạt Bio và yêu cầu xóa toàn bộ thông tin, hình ảnh đại diện khỏi bộ lưu trữ đám mây. Hệ thống sẽ tiến hành xóa sạch và không thể khôi phục để bảo đảm quyền riêng tư tuyệt đối.</li>
            </ul>
          </section>

          {/* 6. Biện pháp bảo vệ và Chia sẻ thông tin */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">6. An toàn thông tin và Cam kết không chia sẻ dữ liệu</h3>
            <p>
              Chúng tôi thực thi các biện pháp bảo mật công nghệ tiêu chuẩn quốc tế:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Mã hóa các thông tin nhạy cảm trước khi lưu trữ trong cơ sở dữ liệu.</li>
              <li>Sử dụng chứng chỉ bảo mật SSL/TLS để mã hóa đường truyền thông tin giữa trình duyệt của người dùng và máy chủ.</li>
              <li><strong>Cam kết tuyệt đối:</strong> Hugo Studio cam kết không bán, không chuyển nhượng, không chia sẻ hay cung cấp thông tin cá nhân của bạn cho bất kỳ tổ chức hay cá nhân thứ ba nào vì mục đích thương mại, ngoại trừ các trường hợp khẩn cấp để ngăn chặn hành vi vi phạm pháp luật hoặc khi có yêu cầu bằng văn bản chính thức của cơ quan tiến hành tố tụng có thẩm quyền của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.</li>
            </ul>
          </section>

          {/* 7. Thông tin liên hệ */}
          <section className="space-y-3 text-xs sm:text-sm p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Thông tin liên hệ & Giải quyết khiếu nại</h4>
            <p>
              Mọi câu hỏi, phản ánh hoặc yêu cầu xử lý quyền liên quan đến thông tin cá nhân, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật của Hugo Studio qua địa chỉ email chính thức:
            </p>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              📧 hugowishpax@gmail.com
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="pt-8 border-t border-slate-100 dark:border-white/5 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:scale-[1.02] active:scale-98 transition-transform duration-200 shadow-xl"
          >
            Đồng Ý & Trở Về Trang Chủ
          </Link>
        </div>

      </div>
    </main>
  );
}
