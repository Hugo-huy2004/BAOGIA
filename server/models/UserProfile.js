import mongoose from 'mongoose';

// Per-user "chân dung số" (User Understanding Layer). Built incrementally from
// behaviour signals (posts / likes / comments / searches / survey answers) — no
// model training, just weighted interest counters + an activity-hour histogram,
// plus an optional interest embedding for personalised ranking.
const UserProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  // topic -> weight (decayed over time so recent interest counts more)
  interests: { type: Map, of: Number, default: {} },
  // Embedding of the user's top interests (for cosine ranking of the feed).
  interestEmbedding: { type: [Number], default: [], select: false },
  interestEmbeddingAt: { type: Date },
  // Histogram of activity by hour-of-day (0..23) → best time to notify.
  activeHours: { type: [Number], default: () => new Array(24).fill(0) },
  engagementCount: { type: Number, default: 0 },
  lastSignalAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('UserProfile', UserProfileSchema);
