import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    // Mốc thu hồi phiên. Token admin sống 14 ngày và JWT thì không rút lại được
    // — đăng xuất trước đây chỉ xoá cookie ở TRÌNH DUYỆT, còn token đã bị chép
    // ra thì vẫn dùng được tới hết hạn. requireAdmin từ chối mọi token phát
    // TRƯỚC mốc này, nên đăng xuất (hoặc đổi mật khẩu) là cắt sạch mọi phiên.
    sessionsValidFrom: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Admin = mongoose.model('Admin', AdminSchema);

export default Admin;
