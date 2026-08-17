import mongoose from 'mongoose';

const CinemaMovieSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    genres: { type: [String], default: ['Hài', 'Kinh Điển'] },
    year: { type: Number, default: 2024 },
    director: { type: String, default: '' },
    duration: { type: String, default: '0 phút' },
    durationSeconds: { type: Number, default: 0 },
    badge: { type: String, default: 'HD' },
    mpaaRating: { type: String, default: 'PG-13' },
    imdbRating: { type: String, default: '9.0' },
    joyReward: { type: Number, default: 100 },
    videoUrl: { type: String, required: true },
    videoFallbackUrl: { type: String, default: '' },
    poster: { type: String, required: true },
    backdrop: { type: String, default: '' },
    views: { type: String, default: '0' },
    rating: { type: Number, default: 5.0 },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    cast: [
      {
        name: { type: String },
        role: { type: String },
        avatar: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.CinemaMovie || mongoose.model('CinemaMovie', CinemaMovieSchema);
