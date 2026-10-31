import mongoose from 'mongoose';

const notificationSubscriptionSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    index: true 
  },
  subscription: {
    endpoint: { 
      type: String, 
      required: true,
      unique: true // Ensure we don't duplicate the same browser endpoint
    },
    expirationTime: { 
      type: Number, 
      default: null 
    },
    keys: {
      p256dh: { 
        type: String, 
        required: true 
      },
      auth: { 
        type: String, 
        required: true 
      }
    }
  },
  // Tên miền đăng ký: 'edu' = education.hugowishpax.studio (service worker riêng).
  site: { type: String, enum: ['www', 'edu'], default: 'www', index: true },
  device: {
    locale: { type: String, default: '' },
    timezone: { type: String, default: '' },
    platform: { type: String, default: '' },
    standalone: { type: Boolean, default: false }
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const NotificationSubscription = mongoose.model('NotificationSubscription', notificationSubscriptionSchema);
export default NotificationSubscription;
