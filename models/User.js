const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  photoURL: { type: String },
  role: { type: String, enum: ['worker', 'buyer', 'admin'], default: 'worker' },
  coins: { type: Number, default: 0, min: 0 },
  pending_coins: { type: Number, default: 0, min: 0 },
  googleId: { type: String },
  authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);