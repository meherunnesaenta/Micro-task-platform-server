

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Registration API
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role, photoURL } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Set initial coins
    const initialCoins = role === 'buyer' ? 50 : 10;
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      photoURL,
      coins: initialCoins
    });
    
    await user.save();
    
    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ token, user: { ...user._doc, password: undefined } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { ...user._doc, password: undefined } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware for authentication
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create Task API (Buyer only)
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can create tasks' });
    }
    
    const { task_title, task_detail, required_workers, payable_amount, completion_date, submission_info, task_image_url } = req.body;
    
    const totalAmount = required_workers * payable_amount;
    const buyer = await User.findOne({ email: req.user.email });
    
    if (buyer.coins < totalAmount) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Create task
    const task = new Task({
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url,
      buyer_email: req.user.email,
      buyer_name: buyer.name
    });
    
    await task.save();
    
    // Deduct coins
    buyer.coins -= totalAmount;
    await buyer.save();
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
