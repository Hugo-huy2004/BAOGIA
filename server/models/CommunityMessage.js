import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  senderName: { type: String, default: 'Anonymous' },
  senderAvatar: { type: String, default: '' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const CommunityMessageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  senderName: { type: String, default: 'Anonymous' },
  senderAvatar: { type: String, default: '' },
  message: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  // Threads-like Fields
  sentiment: { type: String, enum: ['tích cực', 'tiêu cực'], default: 'tích cực' },
  category: { type: String, enum: ['chia sẻ', 'câu hỏi'], default: 'chia sẻ' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  likes: { type: [String], default: [] }, // Array of emails who liked
  comments: { type: [CommentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

export default mongoose.model('CommunityMessage', CommunityMessageSchema);
