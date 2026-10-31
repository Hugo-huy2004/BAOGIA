import mongoose from 'mongoose';

const ChessRatingSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true, unique: true },
  displayName: { type: String, required: true },
  avatar: { type: String, default: null },
  rating: { type: Number, default: 1500 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  lastPlayedAt: { type: Date, default: null },
  updatedAt: { type: Date, default: Date.now },
});

ChessRatingSchema.index({ rating: -1 });

export default mongoose.model('ChessRating', ChessRatingSchema);
