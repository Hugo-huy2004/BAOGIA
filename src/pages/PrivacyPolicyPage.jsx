import React from "react";
import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 bg-white dark:bg-[#12111a] p-8 sm:p-12 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl">
        <div className="space-y-4 text-center pb-6 border-b border-slate-100 dark:border-white/5">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Chính Sách Bảo Mật & Quyền Lợi Khách Hàng</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cập nhật lần cuối: Tháng 5 năm 2026</p>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Giới thiệu chung</h2>
            <p>
              Chào mừng bạn đến với Hugo Studio. Tài liệu này quy định cách thức chúng tôi thu thập, sử dụng, bảo vệ dữ liệu cá nhân của bạn, cũng như các quyền lợi hợp pháp của bạn khi sử dụng các dịch vụ thiết kế website và nền tảng tạo Bio Link của chúng tôi. Việc bạn sử dụng dịch vụ đồng nghĩa với việc bạn chấp thuận các điều khoản trong chính sách này.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Thu thập thông tin cá nhân</h2>
            <p>Để cung cấp dịch vụ Bio Link (bao gồm cả tài khoản miễn phí dành cho sinh viên), chúng tôi yêu cầu các thông tin sau:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Thông tin định danh:</strong> Họ tên, email, và số điện thoại. Đặc biệt với gói sinh viên, chúng tôi yêu cầu xác thực bằng địa chỉ email có đuôi <code>.edu</code>.</li>
              <li><strong>Thông tin hiển thị:</strong> Hình ảnh đại diện, liên kết mạng xã hội, thông tin học vấn, nghề nghiệp, và các nội dung bạn chủ động cung cấp để hiển thị trên trang Bio.</li>
              <li><strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại thiết bị và trình duyệt nhằm mục đích tối ưu hóa hiển thị.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Mục đích sử dụng dữ liệu</h2>
            <p>Toàn bộ thông tin được thu thập chỉ phục vụ cho các mục đích hợp pháp sau:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Xây dựng và định hình hồ sơ điện tử (Bio Link / Portfolio) theo yêu cầu của bạn.</li>
              <li>Xác thực danh tính (đặc biệt là quyền lợi tài trợ cho nhóm Sinh viên).</li>
              <li>Liên hệ, hỗ trợ kỹ thuật và thông báo về các cập nhật bảo mật quan trọng.</li>
              <li>Tối ưu hóa hiệu năng, cải thiện tốc độ tải trang (ví dụ: tự động nén định dạng ảnh WebP để tiết kiệm băng thông nhưng vẫn giữ độ sắc nét).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Cam kết bảo mật thông tin</h2>
            <p>
              Hugo Studio cam kết không mua bán, trao đổi hay tiết lộ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Dữ liệu của bạn được lưu trữ trên hệ thống cơ sở dữ liệu bảo mật cao. Các hình ảnh tải lên được quản lý nghiêm ngặt, đảm bảo tốc độ phân phối và an toàn thông tin.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Quyền lợi và kiểm soát của Khách hàng</h2>
            <p>Với tư cách là chủ sở hữu dữ liệu, bạn có đầy đủ các quyền sau:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Quyền chỉnh sửa:</strong> Bạn có quyền tự do chỉnh sửa, cập nhật hoặc gỡ bỏ thông tin trên Bio Link bất cứ lúc nào thông qua cổng đăng nhập cá nhân.</li>
              <li><strong>Quyền xóa bỏ (Right to be forgotten):</strong> Bạn có quyền xóa hoàn toàn tài khoản và mọi dữ liệu liên quan khỏi hệ thống (bao gồm ảnh đại diện, email, nội dung) vĩnh viễn thông qua tính năng xóa tài khoản trong khu vực quản trị.</li>
              <li><strong>Quyền riêng tư:</strong> Bạn có quyền quyết định những thông tin nào được phép hiển thị công khai trên internet thông qua các thiết lập giao diện.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Thay đổi chính sách</h2>
            <p>
              Chúng tôi bảo lưu quyền cập nhật hoặc thay đổi chính sách này bất kỳ lúc nào để phù hợp với pháp luật và thực tiễn hoạt động. Các thay đổi quan trọng sẽ được thông báo đến bạn thông qua email cung cấp trên hệ thống.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-white/5 text-center">
          <Link to="/" className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm hover:scale-[1.02] active:scale-98 transition-transform duration-200 shadow-lg">
            Trở Về Trang Chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
