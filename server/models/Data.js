import mongoose from 'mongoose';

const DataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: 'default',
      index: true
    },
    profile: {
      fullName: String,
      shortName: String,
      title: String,
      introBadge: String,
      headline: String,
      subtitle: String,
      country: String,
      birthday: String,
      education: String,
      storyTitle: String,
      storyContent: String,
      avatarUrl: String,
      meetingQrUrl: String,
      bankName: String,
      accountNumber: String,
      accountHolder: String,
      zaloNumber: String,
      emailAddress: String
    },
    hobbies: [{
      id: String,
      icon: String,
      title: String,
      desc: String
    }],
    gallery: [{
      id: String,
      url: String,
      title: String,
      category: String,
      desc: String
    }],
    dongThap: {
      badge: String,
      emoji: String,
      title: String,
      intro: String,
      content: String,
      photos: [{
        id: String,
        url: String,
        caption: String
      }]
    },
    catholicism: {
      badge: String,
      emoji: String,
      title: String,
      intro: String,
      mainImageUrl: String,
      content: String,
      hierarchyImageUrl: String,
      popeImageUrl: String,
      popeName: String,
      popeDesc: String,
      hugoServicePhotos: [{
        url: String,
        caption: String
      }],
      faq: [{
        q: String,
        a: String
      }]
    },
    pricing: {
      tiers: {
        portfolio: Number,
        single_page: Number,
        basic: Number,
        plus: Number,
        premium: Number
      },
      addons: {
        cms: Number,
        biometric: Number,
        sound: Number,
        seo: Number,
        anims: Number,
        copyright: Number
      }
    },
    partnerIframe: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Data = mongoose.model('Data', DataSchema);

export default Data;
