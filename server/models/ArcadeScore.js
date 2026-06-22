import mongoose from 'mongoose';

const ArcadeScoreSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  game: { type: String, enum: ['2048', 'caro', 'wordguess', 'survivor', 'slasher', 'geometry'], required: true },
  displayName: { type: String, default: '' },
  avatar: { type: String, default: null },
  bestScore: { type: Number, default: 0 },
  lastScore: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  lastPlayedAt: { type: Date, default: null },
  // Win/loss tally per difficulty tier — drives the per-match JOY reward table.
  record: {
    easy:   { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 } },
    medium: { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 } },
    hard:   { wins: { type: Number, default: 0 }, losses: { type: Number, default: 0 } },
  },
  // Date-keyed daily JOY cap reset, mirrors CompanionHistory's activeSecondsDate pattern.
  // joyAwardedToday is now a signed running NET JOY total for today (can go negative),
  // not a count — see ARCADE_DAILY_NET_JOY_CAP in arcadeRoutes.js.
  joyAwardedDate: { type: String, default: '' },
  joyAwardedToday: { type: Number, default: 0 },
});

ArcadeScoreSchema.index({ email: 1, game: 1 }, { unique: true });
ArcadeScoreSchema.index({ game: 1, bestScore: -1 });

export default mongoose.model('ArcadeScore', ArcadeScoreSchema);
