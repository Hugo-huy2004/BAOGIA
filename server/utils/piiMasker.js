/**
 * Tiện ích làm mờ (Masking) thông tin định danh cá nhân (PII) trước khi ghi log
 * hoặc xuất dữ liệu chẩn đoán, tránh rò rỉ email / số điện thoại trong log file.
 */

export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***';
  const [user, domain] = parts;
  if (user.length <= 2) return `${user.charAt(0)}***@${domain}`;
  return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
}

export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 6) return '***';
  return `${cleaned.slice(0, 2)}***${cleaned.slice(-4)}`;
}

export default { maskEmail, maskPhone };
