import mongoose from 'mongoose';

const UtilityProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    priceJoy: {
      type: Number,
      required: true,
      min: 1
    },
    icon: {
      type: String,
      default: 'redeem'
    },
    category: {
      type: String,
      default: 'general'
    },
    active: {
      type: Boolean,
      default: true
    },
    stock: {
      type: Number,
      default: -1
    },
    imageUrl: {
      type: String,
      default: ''
    },
    // Drives type-specific fulfillment on purchase — see POST /api/utility-store/purchase
    productType: {
      type: String,
      enum: ['general', 'system_validity', 'psy_study_tokens'],
      default: 'general'
    },
    // productType === 'system_validity': days added to Bio.expiresAt on purchase
    extendDays: {
      type: Number,
      default: 0
    },
    // productType === 'psy_study_tokens': which bonus pool + how much to grant
    tokenType: {
      type: String,
      enum: ['chat', 'call'],
      default: 'chat'
    },
    tokenAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const UtilityProduct = mongoose.model('UtilityProduct', UtilityProductSchema);
export default UtilityProduct;
