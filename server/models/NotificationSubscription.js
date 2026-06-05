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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const NotificationSubscription = mongoose.model('NotificationSubscription', notificationSubscriptionSchema);
export default NotificationSubscription;
