import React from "react";
import { Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { useHeadMeta } from "../../hooks/useHeadMeta";

export default function PrivacyPolicyPage() {
  const { data } = useData();

  useHeadMeta({
    title: "Chính Sách Bảo Mật | Hugo Studio",
    description: "Chính sách bảo mật và điều khoản dịch vụ chi tiết của Hugo Studio tuân thủ theo Nghị định 13/2023/NĐ-CP của pháp luật Việt Nam.",
    keywords: "chính sách bảo mật, điều khoản sử dụng, điều khoản dịch vụ, Hugo Studio, bảo vệ dữ liệu cá nhân",
    canonicalUrl: "https://www.hugowishpax.studio/policy"
  });

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] py-12 px-4 sm:px-6 transition-colors duration-300 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-[#e5e5e7] dark:border-[#2c2c2e] shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="space-y-3 text-center pb-6 border-b border-[#e5e5e7] dark:border-[#2c2c2e]">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1d1d1f] dark:text-white uppercase">
            Chính Sách Bảo Mật & Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
            HỆ THỐNG QUẢN LÝ THÀNH VIÊN & NỀN TẢNG THIẾT KẾ BIO LINK
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            Cập nhật lần cuối: Ngày 20 tháng 05 năm 2026
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 text-justify">
          
          {/* Căn cứ pháp lý */}
          <section className="space-y-3 p-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e]">
            <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white flex items-center gap-2 uppercase">
              <span className="material-symbols-outlined text-[#007aff]">gavel</span>
              Căn cứ pháp lý thiết lập chính sách
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chính sách bảo mật và điều khoản dịch vụ này được xây dựng và ban hành tuân thủ chặt chẽ các quy định pháp luật của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li>Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ dữ liệu cá nhân (GDPR Việt Nam);</li>
              <li>Bộ luật Dân sự nước CHXHCN Việt Nam năm 2015;</li>
              <li>Luật An toàn thông tin mạng năm 2015 và Luật An ninh mạng năm 2018;</li>
              <li>Luật Giao dịch điện tử năm 2005 (bao gồm các sửa đổi bổ sung hiện hành).</li>
            </ul>
          </section>

          {/* 1. Phạm vi dịch vụ */}
          <section className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white uppercase flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#007aff] rounded-full inline-block" />
              1. Phạm vi dịch vụ & Đối tượng điều chỉnh
            </h3>
            <p>
              Tài liệu này quy định quyền, nghĩa vụ và trách nhiệm pháp lý ràng buộc giữa người dùng đăng ký tài khoản (sau đây gọi là "Thành viên") và ban quản trị hệ thống. Chính sách này áp dụng đối với toàn bộ các phân hệ chức năng trong dự án bao gồm:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Trình chỉnh sửa Bio Link & Bento Portfolio:</strong> Công cụ thiết lập trang hồ sơ cá nhân hóa, tùy chỉnh màu sắc, liên kết mạng xã hội, nhúng video/âm nhạc và sắp xếp các thẻ Bento.</li>
              <li><strong>Hệ thống quản lý thông số cơ bản (Measurements):</strong> Cho phép người dùng đăng tải các thông số nhân trắc học (chiều cao, cân nặng, số đo ba vòng) phục vụ cho mục đích xây dựng Portfolio chuyên nghiệp.</li>
              <li><strong>Hệ thống đặt lịch hẹn (Booking System):</strong> Nền tảng ghi nhận yêu cầu và đồng bộ thông tin đặt lịch làm việc của khách hàng đối với Thành viên.</li>
              <li><strong>Tích hợp đối tác (Partner integration):</strong> Cho phép các website đối tác nhúng trình soạn thảo Bio Link qua giao thức an toàn (Iframe sandbox).</li>
              <li><strong>Trợ lý ảo thông minh (Bot Culi):</strong> Hệ thống hỏi đáp tự động hỗ trợ điều hướng và điền thông tin nhanh.</li>
            </ul>
          </section>

          {/* 2. Dữ liệu thu thập */}
          <section className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white uppercase flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#007aff] rounded-full inline-block" />
              2. Thu thập và Phân loại thông tin cá nhân
            </h3>
            <p>
              Chúng tôi chỉ thực hiện thu thập các trường thông tin cần thiết nhất để vận hành hệ thống và cung cấp dịch vụ kỹ thuật tối ưu:
            </p>
            <div className="space-y-3 pl-4 border-l-2 border-[#e5e5e7] dark:border-[#2c2c2e]">
              <p>
                <strong>a) Thông tin định danh tài khoản:</strong> Họ và tên, địa chỉ email (bao gồm cả tài khoản email giáo dục .edu/.edu.vn phục vụ chương trình tài trợ Bio Link sinh viên), ảnh đại diện (avatar) và mật khẩu đã mã hóa một chiều (SHA-256).
              </p>
              <p>
                <strong>b) Thông tin liên hệ & Portfolio:</strong> Số điện thoại liên hệ (Zalo), các đường dẫn mạng xã hội, thông tin giới thiệu bản thân, chỉ số chiều cao, cân nặng và các số đo hình thể (nếu người dùng cấu hình hiển thị Portfolio).
              </p>
              <p>
                <strong>c) Dữ liệu Booking của Khách hàng:</strong> Khi khách hàng đặt lịch với bạn qua hệ thống, chúng tôi thu thập tên, số điện thoại, email của khách hàng và thời gian lịch hẹn để phục vụ việc liên lạc và đồng bộ.
              </p>
              <p>
                <strong>d) Dữ liệu kỹ thuật tự động:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành thiết bị và cookie phiên làm việc nhằm kiểm soát an ninh hệ thống và ngăn ngừa truy cập bất hợp pháp.
              </p>
            </div>
          </section>

          {/* 3. Quy tắc mốc thời gian */}
          <section className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white uppercase flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#007aff] rounded-full inline-block" />
              3. Quy tắc tính thời hạn sử dụng & Phiên làm việc (Rule 00:00)
            </h3>
            <p>
              Để bảo đảm công bằng, rõ ràng và tối ưu băng thông máy chủ, thời hạn dịch vụ và thời gian lưu trữ phiên đăng nhập được tính toán chính xác theo các quy chuẩn sau:
            </p>
            <div className="space-y-3 pl-4 border-l-2 border-[#e5e5e7] dark:border-[#2c2c2e]">
              <p>
                <strong>a) Khái niệm ngày sử dụng trọn vẹn:</strong> Căn cứ Bộ luật Dân sự 2015, bất kỳ thời điểm kích hoạt gói dịch vụ (Bio Plus, Bio VIP) hay thay đổi cấu hình nào phát sinh trong ngày dương lịch hiện tại sẽ được tính tròn là 01 ngày sử dụng kể từ lúc phát sinh cho đến đúng 00:00:00 của ngày tiếp theo.
              </p>
              <p>
                <strong>b) Thời hạn phiên đăng nhập (Session Token):</strong> Trạng thái đăng nhập của Thành viên được duy trì tối đa 14 ngày. Trình duyệt sẽ tự động xóa token phiên và yêu cầu đăng nhập lại vào lúc 00:00:00 của ngày thứ 14 để đảm bảo an toàn thiết bị.
              </p>
              <p>
                <strong>c) Gói tài trợ Sinh viên:</strong> Có thời hạn tối đa là 365 ngày (1 năm). Hệ thống sẽ tự động gửi thông báo gia hạn hoặc tạm khóa tính năng nâng cao vào lúc 00:00:00 của ngày thứ 365.
              </p>
            </div>
          </section>

          {/* 4. Bảo mật kỹ thuật & Quyền riêng tư */}
          <section className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white uppercase flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#007aff] rounded-full inline-block" />
              4. Bảo mật kỹ thuật & Hạn chế quyền truy cập
            </h3>
            <p>
              Nhằm đảm bảo an toàn tuyệt đối và ngăn ngừa rò rỉ dữ liệu của Thành viên:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kiểm soát CORS nghiêm ngặt:</strong> Máy chủ API chỉ phản hồi và tiếp nhận các yêu cầu từ các địa chỉ tên miền được cấu hình cụ thể trong danh sách cho phép (Allowed Origins). Mọi truy cập trái phép từ bên thứ ba sẽ bị chặn hoàn toàn ở tầng middleware.</li>
              <li><strong>Cơ chế khóa bảo vệ định tuyến (Route Guard):</strong> Các trang biểu mẫu gửi yêu cầu hỗ trợ trực tiếp được tích hợp cờ định vị an toàn. Trình duyệt sẽ lập tức từ chối kết nối và điều hướng về trang chủ nếu người dùng nhập URL trực tiếp thay vì đi qua luồng hướng dẫn chính thống từ trợ lý ảo Culi.</li>
              <li><strong>Xóa bỏ dữ liệu vĩnh viễn:</strong> Khi Thành viên thực hiện yêu cầu xóa thông tin cá nhân hoặc hủy tài khoản, toàn bộ dữ liệu lưu trên MongoDB và các tệp hình ảnh nén (WebP) trên kho lưu trữ đám mây sẽ được dọn sạch hoàn toàn và không thể khôi phục.</li>
            </ul>
          </section>

          {/* 5. Cam kết chia sẻ thông tin */}
          <section className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f] dark:text-white uppercase flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#007aff] rounded-full inline-block" />
              5. Cam kết an toàn & Chống chia sẻ dữ liệu
            </h3>
            <p>
              Chúng tôi cam kết bảo vệ toàn vẹn thông tin của bạn. Hệ thống tuyệt đối không thực hiện bán, chuyển nhượng, trao đổi hoặc cung cấp thông tin cá nhân của người dùng cho bất kỳ bên thứ ba nào vì mục đích thương mại hay quảng cáo. Thông tin chỉ được cung cấp khi có yêu cầu bằng văn bản chính thức từ cơ quan pháp luật có thẩm quyền của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam trong các trường hợp phục vụ công tác điều tra an ninh.
            </p>
          </section>

          {/* 6. Thông tin liên hệ */}
          <section className="space-y-3 p-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#252528] border border-[#e5e5e7] dark:border-[#2c2c2e]">
            <h4 className="font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider text-xs sm:text-sm">
              Thông tin liên hệ & Giải quyết khiếu nại
            </h4>
            <p className="text-xs">
              Mọi thắc mắc, đóng góp ý kiến hoặc yêu cầu thực thi các quyền chủ thể dữ liệu (bao gồm yêu cầu chỉnh sửa hoặc xóa thông tin), vui lòng liên hệ bộ phận hỗ trợ kỹ thuật trực thuộc ban quản trị:
            </p>
            <div className="space-y-1.5 pt-2 text-xs font-mono">
              <p className="flex items-center gap-2 text-[#007aff] dark:text-[#0a84ff]">
                <span className="material-symbols-outlined text-sm">mail</span>
                <span>Email: {data?.profile?.emailAddress || "support@hugowishpax.studio"}</span>
              </p>
              <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>Zalo Support: {data?.profile?.zaloNumber || "0901234567"}</span>
              </p>
            </div>
          </section>

        </div>

        {/* Back Button */}
        <div className="pt-6 border-t border-[#e5e5e7] dark:border-[#2c2c2e] text-center">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#007aff] hover:bg-[#0071e3] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95"
            style={{ minHeight: 0, minWidth: 0 }}
          >
            Đồng Ý & Trở Về Trang Chủ
          </Link>
        </div>

      </div>
    </div>
  );
}
