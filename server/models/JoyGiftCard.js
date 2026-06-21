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
    }
  },
  { timestamps: true }
);

const JoyGiftCard = mongoose.model('JoyGiftCard', JoyGiftCardSchema);
export default JoyGiftCard;
