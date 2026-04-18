
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const submissionRoutes = require('./routes/submissions');
const withdrawalRoutes = require('./routes/withdrawals');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/publicRoutes');
const app = express();

// Security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000','https://microtash.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/json' })); // for Stripe webhook

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});;
