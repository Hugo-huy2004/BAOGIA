import mongoose from 'mongoose';

// Học liệu HugoCoder do admin đăng: video bài học & tài liệu học thuật.
// Hiển thị ở tab Video / Tài liệu của HugoCoderHub với preview trực quan.
const CoderResourceSchema = new mongoose.Schema(
  {
    // 'article' — bài do Hugo Studio biên soạn, có TOÀN VĂN trong `body` và
    // trích dẫn chuẩn Harvard trong `references`. Học viên đọc ngay tại đây,
    // không bị đẩy ra trang ngoài (trang ngoài đổi nội dung hoặc chết link thì
    // bài đọc bắt buộc thành vô nghĩa). 'document' vẫn dành cho link tham khảo.
    type: {
      type: String,
      enum: ['video', 'document', 'article'],
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
    // Bài viết Hugo Studio biên soạn không có link ngoài — toàn văn nằm ở `body`.
    url: {
      type: String,
      default: '',
      trim: true,
      required() { return this.type !== 'article'; }
    },
    // Toàn văn bài viết (Markdown). Chỉ dùng cho type 'article'.
    body: {
      type: String,
      default: '',
      maxlength: 60000,
      required() { return this.type === 'article'; }
    },
    // Trích dẫn chuẩn Harvard, mỗi phần tử là một mục trong danh mục tham khảo:
    // "Vaswani, A. và cộng sự (2017) 'Attention is all you need'…"
    references: {
      type: [{ type: String, maxlength: 600 }],
      default: [],
      validate: [
        function checkArticleHasReferences(list) {
          return this.type !== 'article' || list.length > 0;
        },
        'Bài biên soạn phải có ít nhất một tài liệu tham khảo.'
      ]
    },
    // Số phút đọc tối thiểu để tính là hoàn thành. Bài đọc thay cho câu hỏi
    // trắc nghiệm ở những nội dung không kiểm tra được bằng bốn lựa chọn.
    readingMinutes: {
      type: Number,
      default: 5,
      min: 1,
      max: 60
    },
    author: {
      type: String,
      default: 'Ban biên soạn Hugo Studio',
      maxlength: 120
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
