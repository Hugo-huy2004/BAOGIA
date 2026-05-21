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
    },
    advertisement: {
      imageUrl: { type: String, default: '' },
      linkUrl: { type: String, default: '' },
      isActive: { type: Boolean, default: false }
    },
    systemSettings: {
      maintenanceMode: { type: Boolean, default: false },
      enableHBot: { type: Boolean, default: true },
      vacationMode: { type: Boolean, default: false },
      allowRegistration: { type: Boolean, default: true },
      allowBooking: { type: Boolean, default: true },
      primaryColor: { type: String, default: '#3B82F6' },
      globalSeo: {
        title: { type: String, default: 'Hugo Studio - Professional Bio & Booking Platform' },
        description: { type: String, default: 'Nền tảng quản lý bio, booking và portfolio chuyên nghiệp cho influencer, freelancer và entrepreneur.' },
        keywords: { type: String, default: 'Hugo Studio, Tạo bio, Bio page, Booking platform' },
      }
    }
  },
  { timestamps: true }
);

const Data = mongoose.model('Data', DataSchema);

export default Data;
