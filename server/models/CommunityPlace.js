import mongoose from 'mongoose';

// Venues added by members themselves (their own shop/service) so other
// members can discover them on the map alongside external sources.
const CommunityPlaceSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, enum: ['food', 'cafe', 'play'], required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, default: '', maxlength: 160 },
  services: { type: String, default: '', maxlength: 300 },
  menu: { type: String, default: '', maxlength: 1200 },
  phone: { type: String, default: '', maxlength: 20 },
  website: { type: String, default: '', maxlength: 200 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CommunityPlace', CommunityPlaceSchema);
