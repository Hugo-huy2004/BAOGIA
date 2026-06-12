import mongoose from 'mongoose';

const CustomerProjectSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    servicePackage: {
      type: String,
      required: true, // e.g. 'Signature Portfolio', 'Ultimate Web App'
    },
    phone: {
      type: String,
      default: ''
    },
    handlerName: {
      type: String,
      default: ''
    },
    handlerPhone: {
      type: String,
      default: ''
    },
    loginCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Đang liên hệ', 'Đang lên thiết kế', 'Đang thực hiện', 'Đang Kiểm tra', 'Hoàn tất'],
      default: 'Đang liên hệ'
    },
    customerProfile: {
      birthday: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' }
    },
    finalNote: {
      type: String,
      default: ''
    },
    progressNotes: {
      type: [{
        note: { type: String, required: true },
        status: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }],
      default: []
    }
  },
  { timestamps: true }
);

CustomerProjectSchema.index({ 'customerProfile.email': 1, createdAt: -1 });

export default mongoose.model('CustomerProject', CustomerProjectSchema);
