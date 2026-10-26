import mongoose from 'mongoose';

// Bảng tin Today kiểu Threads (26/10/2026). Một model cho cả bài gốc lẫn bình
// luận: bình luận chỉ là bài có `parentKey`, nên bấm vào bình luận là đi sâu
// thêm một tầng y như bài gốc.
//
// Khoá (`key`) của một nút trong cây: id bài thành viên, hoặc `a:<id bài báo>`.
// Bài báo không nằm trong DB — khi có người thả tim/bình luận lần đầu, một
// "bóng" (`articleKey`, không tác giả) được tạo để giữ lượt tim và số bình luận.
const TodayPostSchema = new mongoose.Schema(
  {
    authorEmail: { type: String, default: null, index: true },
    articleKey: { type: String, default: undefined, unique: true, sparse: true },
    text: { type: String, default: '' },
    poll: {
      type: new mongoose.Schema({
        options: [{ _id: false, text: String, votes: { type: [String], default: [] } }],
        endsAt: Date,
      }, { _id: false }),
      default: undefined,
    },
    // Chỉ bài gốc mới có. Công khai thì để trống (không ghi gì), "Chỉ mình tôi" = 'private'.
    audience: { type: String, enum: ['private'], default: undefined },
    parentKey: { type: String, default: null },
    // Mọi tổ tiên — xoá một bài là xoá luôn cả nhánh bình luận bên dưới.
    // Mảng rỗng/ngày trống để `undefined` cho khỏi ghi trường thừa vào mỗi bài.
    ancestors: { type: [String], default: undefined, index: true },
    // ponytail: tim lưu thẳng email trong mảng; tách collection riêng khi một bài vượt vài nghìn tim.
    likes: { type: [String], default: undefined },
    likeCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    editedAt: { type: Date, default: undefined },
  },
  { timestamps: true }
);

TodayPostSchema.index({ parentKey: 1, createdAt: -1 });

export default mongoose.model('TodayPost', TodayPostSchema);
