const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAuctions = await Auction.countDocuments();
    const totalBids = await Bid.countDocuments();

    res.json({
      totalUsers,
      totalAuctions,
      totalBids
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching admin stats' });
  }
});

module.exports = router;
