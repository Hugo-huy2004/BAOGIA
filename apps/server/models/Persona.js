import mongoose from 'mongoose';

/**
 * Persona: danh tính hiển thị công khai của một tài khoản (packages/persona) — biệt danh +
 * nhân vật pixel-art. Một bản cho MỌI web/app (Education Hugo, web khách…), khoá theo email
 * tài khoản Hugo Studio. Không chứa tên thật hay ảnh thật.
 */
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  nickname: { type: String, default: '' },
  avatar: { type: mongoose.Schema.Types.Mixed, default: null }, // mã bộ phận/màu đã qua checkAvatar
}, { timestamps: true, minimize: false });

export default mongoose.model('Persona', schema);
