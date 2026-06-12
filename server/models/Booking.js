import mongoose from 'mongoose';

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

BookingSchema.index({ email: 1, createdAt: -1 });
BookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', BookingSchema);

export default Booking;
