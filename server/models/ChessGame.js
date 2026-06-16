import mongoose from 'mongoose';

const PlayerInfoSchema = new mongoose.Schema({
  email: { type: String, default: null },
  displayName: { type: String },
  rating: { type: Number },
  guestId: { type: String, default: null },
  avatarUrl: { type: String, default: "" },
}, { _id: false });

const ChessGameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  white: { type: PlayerInfoSchema },
  black: { type: PlayerInfoSchema },
  result: {
    type: String,
    enum: ['1-0', '0-1', '1/2-1/2', '*'],
    default: '*',
  },
  reason: {
    type: String,
    enum: ['checkmate', 'resign', 'timeout', 'draw', 'stalemate', 'abort', null],
    default: null,
  },
  moves: [{ type: String }], // SAN notation
  pgn: { type: String, default: '' },
  timeControl: { type: Number }, // seconds
  playedAt: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 0 },
});

ChessGameSchema.index({ 'white.email': 1, playedAt: -1 });
ChessGameSchema.index({ 'black.email': 1, playedAt: -1 });

export default mongoose.model('ChessGame', ChessGameSchema);
