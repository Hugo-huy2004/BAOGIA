import mongoose from 'mongoose';

const StoreCartItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'UtilityProduct' },
  productName: { type: String, required: true },
  priceJoy:    { type: Number, required: true },
  icon:        { type: String, default: 'redeem' },
  productType: { type: String, default: 'general' },
  quantity:    { type: Number, default: 1, min: 1 },
  addedAt:     { type: Date, default: Date.now }
}, { _id: false });

const StoreCartSchema = new mongoose.Schema({
  email:         { type: String, required: true, unique: true, index: true },
  items:         { type: [StoreCartItemSchema], default: [] },
  promoCode:     { type: String, default: null },
  promoDiscount: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-expire carts older than 30 days
StoreCartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const StoreCart = mongoose.model('StoreCart', StoreCartSchema);
export default StoreCart;
