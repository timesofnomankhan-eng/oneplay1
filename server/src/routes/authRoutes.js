const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, firstName, lastName, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ username: username.trim() }, ...(email ? [{ email: email.trim() }] : [])]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.trim(),
      password: hashedPassword,
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      email: email ? email.trim() : undefined,
      balance: 0 // Default balance is 0 PKR
    });

    await newUser.save();

    const jwtSecret = process.env.JWT_SECRET || 'oneplay1_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        idNumber: newUser.idNumber,
        balance: newUser.balance,
        role: newUser.role,
        profilePic: newUser.profilePic
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (user.isCurrentlyBanned()) {
      return res.status(403).json({ 
        message: user.banMessage || 'Your account is currently banned.',
        isBanned: true,
        banUntil: user.banUntil
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'oneplay1_super_secret_jwt_key_2026';
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        idNumber: user.idNumber,
        balance: user.balance,
        role: user.role,
        profilePic: user.profilePic,
        notifications: user.notifications
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
