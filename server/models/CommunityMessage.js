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
  // Built lazily: only when a reader taps "Giải thích thuật ngữ" (saves tokens).
  glossary: { type: [{ term: String, definition: String }], default: [] },
  // Set once the on-demand glossary has been generated (even if empty) so we
  // never pay for the same post twice.
  glossaryAt: { type: Date },
  moderatedAt: { type: Date },
  // Author chose to post anonymously (costs JOY). senderEmail stays in the DB
  // for ownership checks but is masked in feed responses for other readers.
  anonymous: { type: Boolean, default: false },
  // Random Hugo Studio accent colour for the anonymous avatar disc.
  anonColor: { type: String, default: '' },
  // For "câu hỏi" posts: author can flag the thread as answered.
  resolved: { type: Boolean, default: false },
  // AI auto-posted promo/engagement content (posts as "Người ẩn danh" / "Hugo Studio").
  isBot: { type: Boolean, default: false },
  // When set (bot posts only), MongoDB TTL auto-removes the doc at this time (~7 days).
  // User posts leave this unset so they are never auto-deleted.
  expiresAt: { type: Date },
  // Semantic embedding of the post body (for personalised feed + semantic search).
  // select:false so the big vector is never shipped to clients unless asked.
  embedding: { type: [Number], default: [], select: false },
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
