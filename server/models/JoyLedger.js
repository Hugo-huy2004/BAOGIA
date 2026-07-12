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
      'coder_exam_retake',
      'feature_subscription',
      'bio_theme_rental',
      'file_compression',
      'admin_direct_add',
      'info_bonus',
      'deco_buy',
      'deco_tip_sent',
      'deco_tip_received',
      'deco_rent',
      'deco_visit_sent',
      'deco_visit_received',
      'deco_clean',
      'community_post',
      'community_comment',
      'community_like_received',
      'community_anon_post',
      'lifetime_unlock',
      'lifetime_unlock_all',
      'ide_phase_1_completion',
      'ide_phase_2_completion',
      'ide_phase_3_completion',
      'ide_phase_4_completion',
      'ide_phase_5_completion',
      'ide_phase_6_completion',
      'ide_phase_7_completion'
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
