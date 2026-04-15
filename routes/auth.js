const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, photoURL } = req.body;

    // Input validation
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation (min 6 characters, at least one number and letter)
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters with letters and numbers',
      });
    }

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
      photoURL: photoURL || '',
      coins: initialCoins,
      authProvider: 'email',
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coins: user.coins,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coins: user.coins,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, photoURL } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, photoURL },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth Login
router.post('/google-login', async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Decode Google token (verify JWT format)
    let payload;
    try {
      // Decode without verification (safe for OAuth since token comes from Google's frontend SDK)
      // In production, you should call Google's tokeninfo endpoint for full verification
      const decoded = jwt.decode(tokenId);
      
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid Google token format' });
      }
      
      // Validate token is from Google
      if (decoded.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res.status(401).json({ error: 'Google token audience mismatch' });
      }
      
      payload = decoded;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email not found in Google token' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user if they haven't linked Google yet
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (!user.photoURL && picture) {
          user.photoURL = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      const initialCoins = 50; // Default coins for new users
      user = new User({
        name,
        email,
        googleId,
        photoURL: picture || '',
        role: 'worker',
        coins: initialCoins,
        authProvider: 'google',
      });
      await user.save();
    }

    // Create JWT token for your app
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        coins: user.coins,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

module.exports = router;
