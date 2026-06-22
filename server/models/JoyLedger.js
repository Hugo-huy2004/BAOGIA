import mongoose from 'mongoose';

const JoyLedgerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: [
      'referral_referrer',
      'referral_referee',
      'chess_win',
      'chess_match',
      'companion',
      'gift_code',
      'store_purchase',
      'admin_adjustment',
      'checkin',
      'companion_unlock',
      'daily_challenge',
      'arcade_score',
      'focus_session',
      'aura_theme_rent',
      'joy_gift_sent',
      'joy_gift_received',
      'ide_learning',
      'feature_subscription',
      'bio_theme_rental',
      'file_compression',
      'admin_direct_add'
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  refId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

JoyLedgerSchema.index({ email: 1, createdAt: -1 });

const JoyLedger = mongoose.model('JoyLedger', JoyLedgerSchema);
export default JoyLedger;
