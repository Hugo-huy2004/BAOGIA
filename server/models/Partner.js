import mongoose from 'mongoose';
import crypto from 'crypto';

const createAccessToken = () => crypto.randomBytes(32).toString('hex');

const PartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    iframeUrl: {
      type: String,
      required: true
    },
    accessToken: {
      type: String,
      required: true,
      unique: true,
      default: createAccessToken
    }
  },
  { timestamps: true }
);

const Partner = mongoose.model('Partner', PartnerSchema);

export default Partner;
