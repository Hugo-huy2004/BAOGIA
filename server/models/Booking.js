import mongoose from 'mongoose';
import { decryptText, encryptText } from '../utils/cryptoUtils.js';

const BookingSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    projectType: {
      type: String,
      enum: ['newWebsite', 'portfolio', 'improve', 'student', 'unsure'],
    },
    budget: {
      type: String,
      enum: ['unsure', 'underOne', 'oneToThree', 'threeToEight', 'overEight'],
      default: 'unsure',
    },
    timeline: {
      type: String,
      enum: ['flexible', 'twoWeeks', 'oneMonth', 'twoMonths'],
      default: 'flexible',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1600,
    },
    // Mã ưu đãi khách nhập lúc đặt lịch. Server đã kiểm và đánh dấu đã dùng
    // trước khi lưu, nên hai ô này là kết quả đã xác thực — không phải chữ khách gõ.
    voucherCode: {
      type: String,
      default: ''
    },
    voucherPercent: {
      type: Number,
      default: 0
    },
    contacted: {
      type: Boolean,
      default: false
    },
    contactedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 } // Document auto-deletes when expiresAt <= current time
    }
  },
  { timestamps: true }
);

// A prospective client's phone is sensitive too. Encrypt it at rest while
// keeping the authenticated admin interface unchanged through hydration hooks.
BookingSchema.pre('save', function encryptBookingPhone(next) {
  if (this.isModified('phone') && this.phone) this.phone = encryptText(this.phone);
  next();
});

function decryptBookingPhone(doc) {
  if (doc?.phone) doc.phone = decryptText(doc.phone);
}

BookingSchema.post('init', decryptBookingPhone);
BookingSchema.post('save', decryptBookingPhone);

BookingSchema.index({ email: 1, createdAt: -1 });
BookingSchema.index({ projectType: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', BookingSchema);

export default Booking;
