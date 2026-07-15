import mongoose from 'mongoose';

const LocalRecommendationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  addressName: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  url: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, // Tự động xóa sau 24 giờ
    index: true
  }
});

export default mongoose.model('LocalRecommendation', LocalRecommendationSchema);
