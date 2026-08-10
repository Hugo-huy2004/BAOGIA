import { sendCustomEmail } from './emailService.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number(amount || 0));

export const buildDonationThankYouEmail = (donation) => {
  const donorName = escapeHtml(donation.donorName || 'bạn');
  const orderCode = escapeHtml(donation.orderCode);
  const amount = formatMoney(donation.amount);

  return {
    subject: 'Cảm ơn bạn đã đồng hành cùng Hugo Studio',
    html: `
      <div style="background:#f5f7fb;padding:28px 12px;font-family:Arial,sans-serif;color:#18181b">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:20px;overflow:hidden">
          <div style="padding:28px;background:#111827;color:#fff">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd">Hugo Studio</div>
            <h1 style="margin:10px 0 0;font-size:25px;line-height:1.25">Cảm ơn ${donorName} đã đồng hành.</h1>
          </div>
          <div style="padding:28px;line-height:1.65;color:#3f3f46">
            <p>Hugo Studio đã nhận khoản ủng hộ <strong>${amount}</strong> của bạn. Sự đồng hành này giúp duy trì hạ tầng và tiếp tục hoàn thiện các trải nghiệm số dành cho cộng đồng.</p>

            <div style="margin:22px 0;padding:16px;border-radius:14px;background:#f4f7ff">
              <div><strong>Mã giao dịch:</strong> ${orderCode}</div>
              <div><strong>Trạng thái:</strong> Đã nhận thành công</div>
            </div>

            <h2 style="font-size:17px;color:#18181b">Những trải nghiệm đang có</h2>
            <ul style="padding-left:20px">
              <li>Bio .edu và hồ sơ số dành cho sinh viên.</li>
              <li>JOY Wallet, phần thưởng và các tiện ích thành viên.</li>
              <li>HugoPSY, IDE, Radio cùng những công cụ học tập và sáng tạo.</li>
              <li>Arcade, portfolio và dịch vụ thiết kế website của Hugo Studio.</li>
            </ul>

            <h2 style="font-size:17px;color:#18181b">Tầm nhìn</h2>
            <p>Hugo Studio hướng đến một hệ sinh thái số thân thiện, an toàn và lấy người học làm trung tâm; nơi mỗi người có thể xây dựng bản sắc số, rèn kỹ năng thực tiễn và kết nối tích cực.</p>

            <h2 style="font-size:17px;color:#18181b">Điều khoản khoản ủng hộ</h2>
            <p>Khoản ủng hộ là món quà tự nguyện dành cho chủ sở hữu Hugo Studio — Peter Hugo Wishpax Lê. Khoản tiền này không mua, mở khóa hay bảo đảm bất kỳ tính năng, dịch vụ hoặc quyền truy cập nào; Hugo Studio không yêu cầu hay bắt buộc người dùng phải ủng hộ để sử dụng chức năng trên hệ thống.</p>
            <p>Sau khi giao dịch hoàn tất, khoản ủng hộ nhìn chung không được hoàn lại, trừ trường hợp chuyển trùng, lỗi kỹ thuật hoặc trường hợp pháp luật hiện hành có quy định khác. Nếu cần đối soát, vui lòng liên hệ trong thời gian sớm nhất.</p>

            <p style="margin-top:24px">Trân trọng,<br><strong>Peter Hugo Wishpax Lê</strong><br>Hugo Studio</p>
            <p style="font-size:12px;color:#71717a">Liên hệ: <a href="mailto:contact@hugowishpax.studio" style="color:#2563eb">contact@hugowishpax.studio</a></p>
          </div>
        </div>
      </div>
    `,
  };
};

export const sendDonationThankYou = async (donation) => {
  if (!donation?.donorEmail) return { success: false, error: 'missing_email' };
  const template = buildDonationThankYouEmail(donation);
  return sendCustomEmail(donation.donorEmail, template.subject, template.html, null, process.env.EMAIL_CONTACT || null);
};

export { escapeHtml };
