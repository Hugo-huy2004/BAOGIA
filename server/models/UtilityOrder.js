import mongoose from 'mongoose';

const UtilityOrderSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UtilityProduct',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  priceJoy: {
    type: Number,
    required: true
  },
  purchaseCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['completed', 'fulfilled', 'cancelled'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UtilityOrderSchema.index({ email: 1, createdAt: -1 });

const UtilityOrder = mongoose.model('UtilityOrder', UtilityOrderSchema);
export default UtilityOrder;
