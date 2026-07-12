import mongoose from 'mongoose';

// Học liệu HugoCoder do admin đăng: video bài học & tài liệu học thuật.
// Hiển thị ở tab Video / Tài liệu của HugoCoderHub với preview trực quan.
const CoderResourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['video', 'document'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000
    },
    // Video: link YouTube/mp4. Tài liệu: link PDF/Drive/trang học thuật.
    url: {
      type: String,
      required: true,
      trim: true
    },
    // Gắn với chặng để lọc: basic|intermediate|advanced|security|project|devops|all
    stageId: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'security', 'project', 'devops', 'all'],
      default: 'all',
      index: true
    },
    // Nguồn học thuật: tên sách/tác giả/kênh (vd: "MDN Web Docs", "Eloquent JavaScript — Marijn Haverbeke")
    source: {
      type: String,
      default: '',
      maxlength: 200
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

CoderResourceSchema.index({ type: 1, stageId: 1, createdAt: -1 });

export default mongoose.model('CoderResource', CoderResourceSchema);
