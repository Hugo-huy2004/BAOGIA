/**
 * Thu hồi phiên đăng nhập của thành viên: xoá vị trí tin cậy nên lần vào sau
 * phải xác thực lại, và ghi vết vào lịch sử tài khoản.
 *
 * Dùng chung cho nút "Đăng xuất cưỡng chế" trong Admin Dashboard và lệnh
 * "Đăng xuất <email>" của bot Telegram — hai đường vào, một hành vi.
 */
export async function revokeMemberSession(bio, actor = 'Admin') {
  bio.trustedLocation = { lat: null, lng: null, updatedAt: null };
  bio.history.push({
    type: 'warning',
    icon: 'logout',
    title: 'Thu hồi phiên đăng nhập bởi Admin',
    detail: `${actor} đã cưỡng chế đăng xuất và yêu cầu xác thực lại.`,
    timestamp: new Date(),
  });
  if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
  await bio.save();
  return bio;
}

export default { revokeMemberSession };
