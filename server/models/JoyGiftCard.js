import mongoose from 'mongoose';

const JoyGiftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    redeemed: {
      type: Boolean,
      default: false
    },
    redeemedBy: {
      type: String,
      default: ''
    },
    redeemedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: String,
      default: 'admin'
    },
    note: {
      type: String,
      default: ''
    },
    // Gift cards are valid for 365 days from issuance — set at creation time
    // (see joyGiftCardRoutes.js) rather than computed from createdAt at read
    // time, so the expiry date is stable even if the card sits unredeemed.
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

const JoyGiftCard = mongoose.model('JoyGiftCard', JoyGiftCardSchema);
export default JoyGiftCard;
