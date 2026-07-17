import fs from 'fs';

const viPath = 'src/i18n/locales/vi/translation.json';
const enPath = 'src/i18n/locales/en/translation.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!viData.admin.payments) {
  viData.admin.payments = {};
}
Object.assign(viData.admin.payments, {
  tab_title: "Chuyển Khoản",
  form_title: "Chuyển Khoản",
  amount: "Số tiền (VNĐ)",
  amount_placeholder: "VD: 50000",
  reason: "Lý do chuyển khoản",
  reason_placeholder: "Tối đa 25 ký tự",
  submit: "Tiến hành chuyển khoản",
  history_title: "Lịch sử chuyển khoản",
  table_id: "Mã giao dịch",
  table_amount: "Số tiền",
  table_reason: "Lý do",
  table_status: "Trạng thái",
  table_time: "Thời gian",
  table_actions: "Hành động",
  copy_link: "Copy link",
  copied: "Đã copy link!",
  empty: "Chưa có giao dịch nào.",
  success_create: "Tạo link thành công!",
  error_server: "Lỗi kết nối server"
});

if (!enData.admin.payments) {
  enData.admin.payments = {};
}
Object.assign(enData.admin.payments, {
  tab_title: "Transfer",
  form_title: "Transfer",
  amount: "Amount (VND)",
  amount_placeholder: "Ex: 50000",
  reason: "Transfer Reason",
  reason_placeholder: "Max 25 chars",
  submit: "Proceed to Transfer",
  history_title: "Transfer History",
  table_id: "Transaction ID",
  table_amount: "Amount",
  table_reason: "Reason",
  table_status: "Status",
  table_time: "Time",
  table_actions: "Actions",
  copy_link: "Copy link",
  copied: "Link copied!",
  empty: "No transactions yet.",
  success_create: "Transfer link created successfully!",
  error_server: "Server connection error"
});

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
console.log("Translations updated");
