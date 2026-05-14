const express = require('express');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get dashboard data for the logged-in user
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. My Created Auctions
    const myAuctions = await Auction.find({ seller_id: userId }).sort({ created_at: -1 }).lean();

    // 2. My Active Bids (Auctions I have bid on)
    const myBids = await Bid.find({ bidder_id: userId }).sort({ created_at: -1 }).lean();
    const activeAuctionIds = [...new Set(myBids.map(b => b.auction_id))];
    const myActiveAuctions = await Auction.find({ id: { $in: activeAuctionIds }, status: 'active' }).lean();

    // 3. Auctions I have won
    const wonAuctions = await Auction.find({ winner_id: userId, status: 'ended' }).lean();

    res.json({
      myAuctions,
      myActiveAuctions,
      wonAuctions
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
});

module.exports = router;
