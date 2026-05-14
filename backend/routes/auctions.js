const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Auction = require('../models/Auction');
const User = require('../models/User');
const Bid = require('../models/Bid');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getStrategyInsights, getDutchCurrentPrice, resolveSealedAuction } = require('../gameTheory/auctionEngine');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

// List auctions with optional filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status = 'active', type, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.auction_type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const auctions = await Auction.find(query).sort({ created_at: -1 }).lean();

    // Map sellers, winners, and bid counts manually since we use UUIDs instead of ObjectIds
    for (let a of auctions) {
      const seller = await User.findOne({ id: a.seller_id });
      a.seller_name = seller ? seller.username : 'Unknown';
      
      if (a.winner_id) {
        const winner = await User.findOne({ id: a.winner_id });
        a.winner_name = winner ? winner.username : null;
      }

      a.bid_count = await Bid.countDocuments({ auction_id: a.id });

      if (a.auction_type === 'dutch' && a.status === 'active') {
        a.current_price = getDutchCurrentPrice(a);
      }
    }

    res.json(auctions);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching auctions' });
  }
});

// Get single auction with details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const auction = await Auction.findOne({ id: req.params.id }).lean();
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    const seller = await User.findOne({ id: auction.seller_id });
    auction.seller_name = seller ? seller.username : 'Unknown';

    if (auction.winner_id) {
      const winner = await User.findOne({ id: auction.winner_id });
      auction.winner_name = winner ? winner.username : null;
    }

    if (auction.auction_type === 'dutch' && auction.status === 'active') {
      auction.current_price = getDutchCurrentPrice(auction);
    }

    let bids = await Bid.find({ auction_id: auction.id }).sort({ amount: -1, created_at: 1 }).lean();
    
    // Add bidder names
    for (let b of bids) {
      const bidder = await User.findOne({ id: b.bidder_id });
      b.bidder_name = bidder ? bidder.username : 'Unknown';
    }

    if ((auction.auction_type === 'sealed_first' || auction.auction_type === 'vickrey') && auction.status === 'active') {
      bids.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      bids = bids.map(b => ({ ...b, amount: '***sealed***' }));
    }

    const bidCount = bids.length;
    const insights = getStrategyInsights(auction, bidCount);

    res.json({ auction, bids, bidCount, insights });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching auction' });
  }
});

// Create auction
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  const { title, description, auction_type, starting_price, reserve_price, min_increment, dutch_decrement, dutch_interval_sec, duration_minutes } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || '');

  if (!title || !auction_type || !starting_price || !duration_minutes) {
    return res.status(400).json({ error: 'title, auction_type, starting_price, and duration_minutes are required' });
  }

  const validTypes = ['english', 'dutch', 'sealed_first', 'vickrey'];
  if (!validTypes.includes(auction_type)) {
    return res.status(400).json({ error: `auction_type must be one of: ${validTypes.join(', ')}` });
  }

  if (auction_type === 'dutch' && (!dutch_decrement || !dutch_interval_sec)) {
    return res.status(400).json({ error: 'Dutch auctions require dutch_decrement and dutch_interval_sec' });
  }

  const endTime = new Date(Date.now() + duration_minutes * 60000);

  try {
    const auction = await Auction.create({
      title,
      description: description || '',
      image_url: image_url || '',
      auction_type,
      starting_price,
      current_price: starting_price,
      reserve_price: reserve_price || 0,
      min_increment: min_increment || 1,
      dutch_decrement: dutch_decrement || 0,
      dutch_interval_sec: dutch_interval_sec || 0,
      seller_id: req.user.id,
      end_time: endTime
    });

    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating auction' });
  }
});

// Resolve expired auctions (called periodically or on-demand)
router.post('/:id/resolve', async (req, res) => {
  try {
    const auction = await Auction.findOne({ id: req.params.id }).lean();
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    if (auction.status !== 'active') return res.json({ message: 'Auction already resolved' });

    if (new Date(auction.end_time) > new Date()) {
      return res.status(400).json({ error: 'Auction has not ended yet' });
    }

    const bids = await Bid.find({ auction_id: auction.id }).sort({ amount: -1 }).lean();

    if (auction.auction_type === 'sealed_first' || auction.auction_type === 'vickrey') {
      const result = resolveSealedAuction(auction, bids);
      if (result.winnerId && result.winningPrice >= auction.reserve_price) {
        await Auction.findOneAndUpdate(
          { id: auction.id },
          { status: 'ended', winner_id: result.winnerId, current_price: result.winningPrice }
        );
      } else {
        await Auction.findOneAndUpdate({ id: auction.id }, { status: 'ended' });
      }
      return res.json({ resolved: true, ...result });
    }

    if (bids.length > 0 && bids[0].amount >= auction.reserve_price) {
      await Auction.findOneAndUpdate(
        { id: auction.id },
        { status: 'ended', winner_id: bids[0].bidder_id, current_price: bids[0].amount }
      );
    } else {
      await Auction.findOneAndUpdate({ id: auction.id }, { status: 'ended' });
    }

    res.json({ resolved: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error resolving auction' });
  }
});

// Game theory strategy calculator
router.get('/:id/strategy', async (req, res) => {
  try {
    const auction = await Auction.findOne({ id: req.params.id }).lean();
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    const bidCount = await Bid.countDocuments({ auction_id: req.params.id });
    const insights = getStrategyInsights(auction, bidCount);

    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: 'Server error calculating strategy' });
  }
});

// Delete auction
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const auction = await Auction.findOne({ id: req.params.id });
    if (!auction) return res.status(404).json({ error: 'Auction not found' });

    if (auction.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the seller can delete this auction' });
    }

    const bidCount = await Bid.countDocuments({ auction_id: req.params.id });
    if (bidCount > 0) {
      return res.status(400).json({ error: 'Cannot delete an auction that has bids' });
    }

    await Auction.deleteOne({ id: req.params.id });
    res.json({ message: 'Auction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting auction' });
  }
});

module.exports = router;
