import mongoose from 'mongoose';

const OAuthClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    clientId: { type: String, required: true, unique: true, index: true },
    // Chỉ lưu SHA-256 của secret. Secret gốc chỉ xuất hiện đúng một lần lúc
    // tạo/luân chuyển, giống API key của các nền tảng lớn.
    clientSecretHash: { type: String, default: '', select: false },
    clientType: { type: String, enum: ['confidential', 'public'], default: 'confidential' },
    redirectUris: { type: [String], required: true, default: [] },
    // Chỉ dùng cho CORS của public browser client; được suy ra từ redirect URI,
    // admin không nhập tay nên không thể vô tình mở rộng origin.
    allowedOrigins: { type: [String], default: [] },
    allowedScopes: { type: [String], default: ['profile', 'email'] },
    logoUrl: { type: String, default: '', trim: true, maxlength: 1000 },
    homepageUrl: { type: String, default: '', trim: true, maxlength: 1000 },
    privacyUrl: { type: String, default: '', trim: true, maxlength: 1000 },
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
    createdBy: { type: String, default: 'admin' },
    secretRotatedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.OAuthClient || mongoose.model('OAuthClient', OAuthClientSchema);
