export default function AgeProtectionCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
        <div className="grid place-items-center bg-foreground px-6 py-8 text-background sm:py-10">
          <span className="material-symbols-outlined text-7xl" aria-hidden="true">shield_person</span>
          <strong className="mt-2 text-6xl font-black tracking-[-0.08em]">14+</strong>
          <span className="mt-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-background/65">Điều kiện thành viên</span>
        </div>

        <div className="space-y-4 p-5 sm:p-7">
          <div>
            <p className="text-base font-black text-foreground">Chỉ dành cho người từ đủ 14 tuổi</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Người dưới 14 tuổi không đủ điều kiện tạo hoặc sử dụng tài khoản thành viên Hugo Studio.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-foreground">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">family_restroom</span>
              Thành viên từ 14 đến dưới 18 tuổi
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>• Bắt buộc có sự biết và giám sát của cha mẹ hoặc người giám hộ.</li>
              <li>• Hỗ trợ sẽ bị giới hạn hoặc từ chối nếu yêu cầu đòi hỏi chia sẻ dữ liệu cá nhân nhạy cảm.</li>
              <li>• Chỉ cung cấp dữ liệu tối thiểu trong biểu mẫu chính thức; không gửi thêm qua HugoPSY, chat, Zalo hoặc Bio công khai.</li>
              <li>• Hugo Studio không cung cấp thông tin cá nhân của nhóm tuổi này cho bất kỳ người dùng nào khác — 100%, không có ngoại lệ và không có chế độ chia sẻ tự nguyện.</li>
              <li>• Dữ liệu thiết yếu gửi tới nhà cung cấp hạ tầng (đăng nhập, thanh toán, email) vẫn theo chính sách của bên thứ ba đó.</li>
            </ul>
          </div>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <span className="material-symbols-outlined mt-px text-base" aria-hidden="true">verified_user</span>
            <span>Cam kết không tiết lộ là tuyệt đối vì đó là việc Hugo Studio tự quyết định. Riêng phần kỹ thuật, hệ thống áp dụng mức bảo vệ cao nhất trong khả năng vận hành nhưng không tuyên bố an toàn 100% — mọi dịch vụ trực tuyến đều còn rủi ro.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
