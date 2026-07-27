import mongoose from 'mongoose';

const PromoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 1
  },
  maxUses: {
    type: Number,
    default: -1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  minOrderJoy: {
    type: Number,
    default: 0
  },
  applicableCategory: {
    type: String,
    default: 'all'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

const PromoCode = mongoose.model('PromoCode', PromoCodeSchema);
export default PromoCode;
