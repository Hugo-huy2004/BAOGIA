import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dataRoutes from './routes/dataRoutes.js';
import bioRoutes from './routes/bioRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hugo_wishpax';

// Middleware
const allowedOrigins = process.env.CLIENT_URLS.split(",");

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Security Headers (Helmet protects against well known web vulnerabilities)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://img.vietqr.io"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CDN Edge Cache middleware (Bỏ đi, sẽ set trực tiếp trong route để không bị ghi đè)

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Response Compression (Significantly reduces payload size)
app.use(compression());

// Rate Limiting (Queue algorithm to prevent DDoS and spam)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Quá nhiều truy cập từ IP này, vui lòng thử lại sau 15 phút.' }
});
app.use('/api', globalLimiter);

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 200, // Tối ưu connection pool cho 1 triệu user
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    
    // Khởi chạy Bloom Filter (Tập hợp các slug hợp lệ để chặn O(1))
    try {
      const Bio = (await import('./models/Bio.js')).default;
      const bios = await Bio.find({}, 'slug');
      global.validSlugs = new Set(bios.map(b => b.slug));
      console.log(`🛡️ Bloom Filter initialized with ${global.validSlugs.size} slugs`);
    } catch(err) {
      console.error('Bloom filter error:', err);
    }

    try {
      const Admin = (await import('./models/Admin.js')).default;
      const count = await Admin.countDocuments();
      if (count === 0) {
        await Admin.create({
          username: 'fff54767e0dfd8c560629c4be9bd186ea0682d509128989eccda5c166f295258', // Hashed "HugoStudioAdmin"
          password: 'ac5828f24a8a65e366395faa1d58abe1e2dda05853e45bdb0ae696712e3f1bb3'  // Hashed "Hugo123@"
        });
        console.log('👥 Default admin account seeded successfully in MongoDB');
      }
    } catch (err) {
      console.error('Error seeding admin account:', err);
    }
  })
  .catch(err => console.error(' MongoDB connection failed:', err));

import customerRoutes from './routes/customerRoutes.js';

// Routes
app.use('/api/data', dataRoutes);
app.use('/api/bios', bioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer-projects', customerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Nodemon watch trigger
