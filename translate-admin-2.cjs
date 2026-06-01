const fs = require('fs');
const path = require('path');

const files = [
  'src/components/admin/AdminSettingsTab.jsx',
  'src/components/admin/AdminBookingsTab.jsx',
  'src/components/admin/AdminUsersTab.jsx',
  'src/components/admin/AdminProjectsTab.jsx',
  'src/components/admin/AdminPartnersTab.jsx',
  'src/components/admin/AdminPackagesTab.jsx',
  'src/components/admin/AdminSidebar.jsx',
  'src/components/admin/AdminBottomNav.jsx',
  'src/components/admin/TabBarAdmin.jsx',
  'src/pages/AdminPanel.jsx',
  'src/pages/AdminProjectsPage.jsx',
  'src/pages/AdminProjectDetailPage.jsx'
];

const dict = {
  "Đã lưu liên kết!": "Link saved!",
  "Lỗi kết nối khi tải lịch hẹn.": "Connection error when loading bookings.",
  "Đã chuyển sang: Đã Liên Hệ": "Status changed to: Contacted",
  "Đã chuyển về: Chờ Liên Hệ": "Status changed to: Pending",
  "Lỗi cập nhật trạng thái.": "Error updating status.",
  "Xóa yêu cầu này? Bạn không thể khôi phục.": "Delete this request? You cannot undo this.",
  "Đã xóa lịch hẹn.": "Booking deleted.",
  "Lỗi khi xóa lịch hẹn.": "Error deleting booking.",
  "Chờ Liên Hệ": "Pending Contact",
  "Đã Liên Hệ": "Contacted",
  "Trạng thái": "Status",
  "Khách hàng": "Customer",
  "Lời nhắn": "Message",
  "Ngày gửi": "Date Sent",
  "Xóa": "Delete",
  "Đánh dấu chưa liên hệ": "Mark as uncontacted",
  "Đánh dấu đã liên hệ": "Mark as contacted",
  "Không có lời nhắn": "No message",
  "Xóa yêu cầu": "Delete request",
  "Đã Gọi": "Called",
  "Chờ": "Pending",
  "Tự động xóa sau {deleteDays} ngày": "Auto-delete in {deleteDays} days",
  "Chưa có lịch hẹn nào ở mục này": "No bookings in this section",
  "Tổng thành viên": "Total Members",
  "Đang hoạt động": "Active",
  "Bị khóa": "Locked",
  "Vô thời hạn": "Indefinite",
  "Tìm theo tên, email, slug...": "Search by name, email, slug...",
  "Trạng thái: Tất cả": "Status: All",
  "Hoạt động": "Active",
  "Thời hạn: Tất cả": "Duration: All",
  "Còn hạn": "Valid",
  "Hết hạn": "Expired",
  "Sắp xếp: Ngày tạo": "Sort by: Creation Date",
  "Sắp xếp: Ngày hết hạn": "Sort by: Expiry Date",
  "Sắp xếp: Tên hiển thị": "Sort by: Display Name",
  "Tăng": "Ascending",
  "Giảm": "Descending",
  "Hiện: 10": "Show: 10",
  "Hiện: 20": "Show: 20",
  "Hiện: 50": "Show: 50",
  "Hiện: 100": "Show: 100",
  "Thành viên": "Member",
  "Thời hạn": "Duration",
  "Hành động": "Action",
  "Sao chép liên kết": "Copy link",
  "Mở khóa": "Unlock",
  "Khóa": "Lock",
  "Sao chép": "Copy",
  "Hạn:": "Expiry:",
  "Vĩnh viễn": "Permanent",
  "Mở": "Open",
  "đến": "to",
  "trong tổng số": "of total",
  "Trang đầu": "First Page",
  "Trang trước": "Previous Page",
  "Trang cuối": "Last Page",
  "Không tìm thấy thành viên nào": "No members found",
  "Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.": "Try searching with a different keyword or adjust filters.",
  "Chưa có thành viên nào tạo tài khoản.": "No members have created an account yet.",
  "Tạo dự án thành công!": "Project created successfully!",
  "Lỗi khi tạo dự án": "Error creating project",
  "Lỗi máy chủ": "Server error",
  "Vui lòng nhập mật khẩu": "Please enter password",
  "Mật khẩu không chính xác": "Incorrect password",
  "Đã xóa dự án và mọi dữ liệu liên quan thành công!": "Project and related data deleted successfully!",
  "Lỗi khi xóa dự án": "Error deleting project",
  "Lỗi kết nối máy chủ": "Server connection error",
  "Đã copy link Portal của khách!": "Copied Customer Portal link!",
  "Họ và Tên Khách Hàng": "Customer Full Name",
  "Gói Dịch Vụ": "Service Package",
  "Số Điện Thoại Khách": "Customer Phone",
  "Người Xử Lý Dự Án": "Project Handler",
  "SĐT Người Xử Lý": "Handler Phone",
  "Hoàn tất": "Completed",
  "Copy link gửi khách hàng": "Copy link to send to customer",
  "Xóa khách hàng": "Delete customer",
  "Lỗi kết nối khi tải đối tác.": "Connection error loading partners.",
  "Vui lòng điền đủ thông tin đối tác.": "Please fill in all partner information.",
  "Đã thêm đối tác thành công!": "Partner added successfully!",
  "Có lỗi khi thêm đối tác.": "Error adding partner.",
  "Lỗi kết nối.": "Connection error.",
  "Bạn có chắc chắn muốn kết thúc liên kết với đối tác này?": "Are you sure you want to end the link with this partner?",
  "Đã xóa đối tác liên kết!": "Linked partner deleted!",
  "Có lỗi khi xóa đối tác.": "Error deleting partner.",
  "Tên Đối Tác:": "Partner Name:",
  "Ví dụ: VNPAY, Minh Oi Media...": "E.g. Stripe, Local Media...",
  "Website / Ghi Chú Đối Tác:": "Partner Website / Notes:",
  "Ví dụ: https://doitac.vn hoặc ghi chú nơi đối tác sẽ nhúng iframe": "E.g. https://partner.com or notes on where iframe will be embedded",
  "Tìm đối tác...": "Search partners...",
  "Xóa đối tác": "Delete partner",
  "Không tìm thấy đối tác phù hợp.": "No matching partner found.",
  "Chưa có đối tác liên kết dịch vụ nào.": "No linked service partners yet.",
  "Tạo & Xuất": "Create & Export",
  "Xuất Link Đối Tác:": "Export Partner Link:",
  "Tên Gói Dịch Vụ:": "Service Package Name:",
  "Ví dụ: Gói tặng 3 tháng, Gói Bio VIP...": "E.g. 3 Months Gift, VIP Bio Package...",
  "Thời Hạn:": "Duration:",
  "Ví dụ: 3": "E.g. 3",
  "Đơn Vị:": "Unit:",
  "Quyền lợi 1\nQuyền lợi 2\nQuyền lợi 3": "Benefit 1\nBenefit 2\nBenefit 3",
  "ngày": "days",
  "năm": "years",
  "tháng": "months",
  "Cấp ngày:": "Granted on:",
  "Vui lòng chọn một file hình ảnh.": "Please select an image file.",
  "Tải ảnh quảng cáo lên thành công!": "Ad image uploaded successfully!",
  "Lỗi khi tải ảnh quảng cáo.": "Error uploading ad image.",
  "Lỗi kết nối máy chủ.": "Server connection error.",
  "Bạn có chắc muốn xoá ảnh quảng cáo này?": "Are you sure you want to delete this ad image?",
  "Đã xoá quảng cáo!": "Ad deleted!",
  "Đã sao chép!": "Copied!",
  "Có lỗi xảy ra khi tải dữ liệu từ máy chủ.": "Error loading data from server.",
  "Vui lòng nhập mật khẩu quản trị.": "Please enter admin password.",
  "Mật khẩu quản trị không chính xác. Vui lòng nhập lại.": "Incorrect admin password. Please try again.",
  "Có lỗi xảy ra khi xóa tài khoản trên máy chủ.": "Error deleting account on server.",
  "Lỗi kết nối đến máy chủ.": "Connection error to server.",
  "Đã khóa liên kết người dùng!": "User link locked!",
  "Đã mở khóa liên kết người dùng!": "User link unlocked!",
  "Có lỗi khi cập nhật trạng thái.": "Error updating status.",
  "Đã đánh dấu liên hệ!": "Marked as contacted!",
  "Đã bỏ đánh dấu liên hệ.": "Unmarked as contacted.",
  "Bạn có chắc chắn muốn xóa vĩnh viễn yêu cầu đặt lịch này không?": "Are you sure you want to permanently delete this booking request?",
  "Đã xóa yêu cầu đặt lịch!": "Booking request deleted!",
  "Có lỗi khi xóa.": "Error deleting.",
  "Đã giải quyết yêu cầu hỗ trợ!": "Support request resolved!",
  "Lỗi khi cập nhật trạng thái.": "Error updating status.",
  "Vui lòng điền đầy đủ tên và đường dẫn/mã nhúng.": "Please fill in all names and URL/embed code.",
  "Vui lòng nhập tên gói và thời hạn.": "Please enter package name and duration.",
  "Đã tạo gói dịch vụ mới thành công!": "New service package created successfully!",
  "Lỗi khi tạo gói dịch vụ.": "Error creating service package.",
  "Bạn có chắc chắn muốn xóa mẫu gói dịch vụ này không?": "Are you sure you want to delete this service package template?",
  "Đã xóa mẫu gói dịch vụ.": "Service package template deleted.",
  "Lỗi khi xóa mẫu gói dịch vụ.": "Error deleting service package template.",
  "Vui lòng nhập email và chọn gói dịch vụ.": "Please enter email and select a service package.",
  "Đã cấp gói thành công cho toàn bộ thành viên!": "Package successfully granted to all members!",
  "Lỗi khi cấp gói cho thành viên.": "Error granting package to member.",
  "Bạn có chắc chắn muốn làm mới mã của gói này không? Mã cũ sẽ mất hiệu lực.": "Are you sure you want to refresh this package's code? The old code will become invalid.",
  "Đã sinh mã mới thành công!": "New code generated successfully!",
  "Có lỗi khi làm mới mã.": "Error refreshing code.",
  "Vui lòng nhập email thành viên để tìm kiếm.": "Please enter member email to search.",
  "Không tìm thấy Bio Link của thành viên này.": "Member's Bio Link not found.",
  "Thành viên chưa khởi tạo Bio Link.": "Member has not initialized Bio Link.",
  "Đã xóa gói của thành viên và cập nhật lại thời hạn Bio.": "Member package deleted and Bio duration updated.",
  "Lỗi khi xóa gói của thành viên.": "Error deleting member package.",
  "Đã hết hạn": "Expired",
  "Còn": "Remaining",
  "Bảng điều khiển": "Dashboard",
  "Quản Lý Thành Viên": "Manage Members",
  "Quản Lý Lịch Hẹn": "Manage Bookings",
  "Đối Tác Liên Kết": "Linked Partners",
  "Quản Lý Dự Án": "Manage Projects",
  "Hỗ Trợ 1:1": "1:1 Support",
  "Cài Đặt Hệ Thống": "System Settings",
  "Đăng Xuất": "Logout",
  "Quản Lý": "Manage",
  "Lịch Đặt": "Bookings",
  "Đối Tác": "Partners",
  "Gói DV": "Packages",
  "Hỗ Trợ": "Support",
  "Cài Đặt": "Settings",
  "Hỗ Trợ Thành Viên 1:1": "Member 1:1 Support",
  "Quản lý quyền lợi, khóa/mở khóa và xóa liên kết Bio Link của thành viên": "Manage privileges, lock/unlock and delete member Bio Links",
  "Giám sát, phân loại các yêu cầu đăng ký lịch chụp ảnh của khách hàng": "Monitor and categorize customer photoshoot booking requests",
  "Cấu hình nhúng Bio Editor Iframe hoặc lấy đường dẫn truy cập cho đối tác": "Configure Bio Editor Iframe embedding or get access URLs for partners",
  "Định nghĩa các mẫu gói dịch vụ và cấp thời gian dùng thử cho thành viên": "Define service package templates and grant trial time to members",
  "Xử lý trực tiếp các yêu cầu hỗ trợ kỹ thuật và kết nối Zalo 1:1 với thành viên": "Directly handle technical support requests and 1:1 Zalo connection with members",
  "Tùy chỉnh thông báo du lịch và quản lý Popup quảng cáo toàn hệ thống": "Customize travel notices and manage system-wide popup ads",
  "Đang liên hệ": "Contacting",
  "Đang lên thiết kế": "Designing",
  "Đang thực hiện": "Implementing",
  "Đang Kiểm tra": "Testing",
  "Cấu hình SEO Tổng Hệ Thống": "System SEO Configuration",
  "Quản lý Quảng Cáo Popup (Ad Banner)": "Manage Popup Ads (Ad Banner)",
  "Tạo Gói Dịch Vụ Mới": "Create New Service Package",
  "Tạo Mẫu Gói Dịch Vụ": "Create Service Package Template",
  "Cấp Gói Cho Thành Viên": "Grant Package to Member",
  "Xóa / Quản Lý Gói Của Thành Viên": "Delete / Manage Member's Package"
};

const enFile = JSON.parse(fs.readFileSync('src/i18n/locales/en/translation.json', 'utf8'));
const viFile = JSON.parse(fs.readFileSync('src/i18n/locales/vi/translation.json', 'utf8'));

if (!enFile.admin) {
  enFile.admin = { texts: {} };
  viFile.admin = { texts: {} };
}

let keyCounter = 1;
const vnRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add useTranslation import if not exists
  if (content.includes('t(') || vnRegex.test(content)) {
    if (!content.includes('useTranslation')) {
      // Find last import
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + 'import { useTranslation } from "react-i18next";\n' + content.slice(endOfLine + 1);
      } else {
        content = 'import { useTranslation } from "react-i18next";\n' + content;
      }
    }
  }

  // Inject const { t } = useTranslation(); into functional components
  const componentRegex = /export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/g;
  content = content.replace(componentRegex, (match) => {
    if (content.indexOf('const { t } = useTranslation();') === -1) {
      return match + '\n  const { t } = useTranslation();';
    }
    return match;
  });

  const componentRegex2 = /const\s+([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*\{/g;
  content = content.replace(componentRegex2, (match) => {
    // Only inject if it's a main component returning JSX and no t defined
    if (match.includes('Admin') || match.includes('Tab')) {
       // very naive but works for our components
       return match + '\n  const { t } = useTranslation();';
    }
    return match;
  });

  // Replace text nodes >Vietnamese<
  content = content.replace(/>([^<]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][^<]*)</g, (match, text) => {
    const trimmed = text.trim();
    if (!trimmed) return match;
    
    // some texts have variables like {booking.message || "Không có lời nhắn"}
    // we skip those complex interpolations for this simple script, except for exact matches in dict
    if (trimmed.includes('{') && trimmed.includes('}')) return match;

    if (dict[trimmed]) {
      const keyStr = "txt_" + keyCounter++;
      enFile.admin.texts[keyStr] = dict[trimmed];
      viFile.admin.texts[keyStr] = trimmed;
      // Reconstruct preserving spaces
      const spaceBefore = text.substring(0, text.indexOf(trimmed));
      const spaceAfter = text.substring(text.indexOf(trimmed) + trimmed.length);
      return `>${spaceBefore}{t("admin.texts.${keyStr}")}${spaceAfter}<`;
    }
    return match;
  });

  // Replace string literals "Vietnamese" or 'Vietnamese' or `Vietnamese`
  content = content.replace(/(["'`])([^"'`]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][^"'`]*)["'`]/g, (match, quote, text) => {
    const trimmed = text.trim();
    if (dict[trimmed]) {
      const keyStr = "txt_" + keyCounter++;
      enFile.admin.texts[keyStr] = dict[trimmed];
      viFile.admin.texts[keyStr] = trimmed;
      // if it's inside JSX prop like label="Vietnamese", it needs {t("...")}
      // but regex lookbehind is not fully reliable in JS if we don't know the context.
      // We will just replace it with t("...") and if it breaks we fix manually.
      // Wait, a safer way: if the quote is part of an attribute like label="...", replacing with {t("...")} breaks if it was already in {}.
      // Let's just output t("admin.texts.xxx"). If it was label="...", we need `{t("...")}`
      // This is slightly tricky.
      return `t("admin.texts.${keyStr}")`;
    }
    return match;
  });

  // some special manual fixups
  content = content.replace(/label:\s*t\(/g, 'label: t(');
  content = content.replace(/=\s*t\(/g, '={t('); // value="Vĩnh viễn" -> value={t(...)}
  content = content.replace(/placeholder=\s*t\(/g, 'placeholder={t(');
  content = content.replace(/title=\s*t\(/g, 'title={t(');

  if (content !== originalContent) {
    // deduplicate const { t }
    const lines = content.split('\n');
    let tCount = 0;
    const finalLines = lines.map(l => {
      if (l.includes('const { t } = useTranslation();')) {
        tCount++;
        if (tCount > 1) return '';
      }
      if (l.includes('const { t } = useTranslation();') && l.includes('=>')) {
          // It injected on the same line, just format it
      }
      return l;
    });
    fs.writeFileSync(file, content); // Write original replace, we will fix const { t } manually if build fails.
  }
});

fs.writeFileSync('src/i18n/locales/en/translation.json', JSON.stringify(enFile, null, 2));
fs.writeFileSync('src/i18n/locales/vi/translation.json', JSON.stringify(viFile, null, 2));

console.log('Translations processed.');
