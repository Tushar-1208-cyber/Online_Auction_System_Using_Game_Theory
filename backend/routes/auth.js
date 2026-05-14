const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
require('dotenv').config();
const User = require('../models/User');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password, role = 'bidder' } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const hash = bcrypt.hashSync(password, 10);
    
    // Generate 6 digit OTP
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() + 10 * 60000); // 10 mins

    const htmlContent = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to Game Theory Auctions!</h2>
        <p>Your email verification OTP is:</p>
        <h1 style="letter-spacing: 5px; color: #4F46E5;">${otp_code}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail(email, 'Your Auction Verification OTP', htmlContent);

    const user = await User.create({
      username,
      email,
      password: hash,
      role,
      otp_code,
      otp_expiry,
      is_verified: 0
    });

    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, user: { id: user.id, username, email, role, is_verified: 0, balance: 10000 } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/verify-otp', authenticate, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP is required' });

  try {
    const user = await User.findOne({ id: req.user.id });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'User already verified' });
    
    if (user.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    user.is_verified = 1;
    user.otp_code = undefined;
    user.otp_expiry = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during verification' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, is_verified: user.is_verified, balance: user.balance } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('id username email role is_verified balance created_at');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

module.exports = router;
