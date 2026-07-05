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
  senderSlug: { type: String, default: '' }, // Bio slug so the feed can link to the author's public bio
  message: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  // Threads-like Fields
  sentiment: { type: String, enum: ['tích cực', 'tiêu cực'], default: 'tích cực' },
  category: { type: String, enum: ['chia sẻ', 'câu hỏi'], default: 'chia sẻ' },
  // Posts start 'pending' — an AI moderation queue must approve before they go public.
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectReason: { type: String, default: '' },
  // AI-generated glossary explaining jargon/terms found in the post (for HSSV).
  glossary: { type: [{ term: String, definition: String }], default: [] },
  moderatedAt: { type: Date },
  // For "câu hỏi" posts: author can flag the thread as answered.
  resolved: { type: Boolean, default: false },
  // AI auto-posted promo/engagement content (posts as "Người ẩn danh" / "Hugo Studio").
  isBot: { type: Boolean, default: false },
  // When set (bot posts only), MongoDB TTL auto-removes the doc at this time (~7 days).
  // User posts leave this unset so they are never auto-deleted.
  expiresAt: { type: Date },
  likes: { type: [String], default: [] }, // Array of emails who liked
  comments: { type: [CommentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// TTL index: only docs with a Date `expiresAt` in the past are purged (bot posts).
CommunityMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Feed query (approved, newest-first) and the bot's daily-count query.
CommunityMessageSchema.index({ status: 1, createdAt: -1 });
CommunityMessageSchema.index({ isBot: 1, createdAt: 1 });

export default mongoose.model('CommunityMessage', CommunityMessageSchema);
