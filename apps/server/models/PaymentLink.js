
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
  kind: {
    type: String,
    enum: ['PAYMENT', 'DONATION'],
    default: 'PAYMENT',
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
  donorName: {
    type: String,
    trim: true,
    maxlength: 80,
  },
  donorEmail: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 254,
  },
  donorBankName: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  donorDisplayName: {
    type: String,
    trim: true,
    maxlength: 120,
  },
  publicRecognition: {
    type: Boolean,
    default: false,
  },
  termsVersion: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
  thankYouEmailStatus: {
    type: String,
    enum: ['PENDING', 'SENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
  },
  thankYouEmailSentAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);

export default PaymentLink;
