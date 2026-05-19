import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dataRoutes from './routes/dataRoutes.js';
import bioRoutes from './routes/bioRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hugo_wishpax';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
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
      console.error('❌ Error seeding admin account:', err);
    }
  })
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// Routes
app.use('/api/data', dataRoutes);
app.use('/api/bios', bioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/partners', partnerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});
