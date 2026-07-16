
import mongoose from 'mongoose';

const paymentLinkSchema = new mongoose.Schema({
  customLinkId: {
    type: String,
    required: true,
    unique: true,
  },
  orderCode: {
    type: Number,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    
    required: true,
  },
  checkoutUrl: {
    type: String,
    required: true,
  },
  bin: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  accountName: {
    type: String,
  },
  qrCode: {
    type: String,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'CANCELLED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);

export default PaymentLink;
