const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { authenticate } = require('../middleware/auth');
const {
  processEnglishBid,
  processDutchBid,
  processSealedFirstPriceBid,
  processVickreyBid,
  nashEquilibriumBid,
  expectedPayoff,
} = require('../gameTheory/auctionEngine');
const { callPython } = require('./pythonBridge');

const router = express.Router();

// ─────────────────────────────────────────────
//  Place a Bid
// ─────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { auction_id, amount } = req.body;

  if (!auction_id || amount == null) {
    return res.status(400).json({ error: 'auction_id and amount are required' });
  }

  try {
    const auction = await Auction.findOne({ id: auction_id }).lean();
    if (!auction) return res.status(404).json({ error: 'Auction not found' });
    if (auction.status !== 'active') return res.status(400).json({ error: 'Auction is not active' });
    if (new Date(auction.end_time) < new Date()) return res.status(400).json({ error: 'Auction has ended' });
    if (auction.seller_id === req.user.id) return res.status(400).json({ error: 'Cannot bid on your own auction' });

    const existingBids = await Bid.find({ auction_id }).sort({ amount: -1 }).lean();

    const bid = { bidder_id: req.user.id, amount: parseFloat(amount) };
    let result;

    switch (auction.auction_type) {
      case 'english':
        result = processEnglishBid(auction, bid, existingBids);
        break;
      case 'dutch':
        result = processDutchBid(auction, bid);
        break;
      case 'sealed_first':
        result = processSealedFirstPriceBid(auction, bid, existingBids);
        break;
      case 'vickrey':
        result = processVickreyBid(auction, bid, existingBids);
        break;
      default:
        return res.status(400).json({ error: 'Unknown auction type' });
    }

    if (!result.valid) {
      return res.status(400).json({ error: result.error });
    }

    const isSealed = (auction.auction_type === 'sealed_first' || auction.auction_type === 'vickrey') ? 1 : 0;

    const newBid = await Bid.create({
      auction_id,
      bidder_id: req.user.id,
      amount: bid.amount,
      is_sealed: isSealed
    });

    if (result.newPrice != null) {
      await Auction.findOneAndUpdate({ id: auction_id }, { current_price: result.newPrice });
    }

    if (result.endAuction) {
      await Auction.findOneAndUpdate(
        { id: auction_id },
        { status: 'ended', winner_id: req.user.id, current_price: result.newPrice }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`auction:${auction_id}`).emit('bid:new', {
        bidId: newBid.id,
        auction_id,
        bidder_id: req.user.id,
        bidder_name: req.user.username,
        amount: isSealed ? null : bid.amount,
        is_sealed: isSealed,
        newPrice: result.newPrice,
        endAuction: result.endAuction || false,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      id: newBid.id,
      auction_id,
      amount: bid.amount,
      newPrice: result.newPrice,
      endAuction: result.endAuction || false,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error processing bid' });
  }
});

// ─────────────────────────────────────────────
//  Nash Calculator — Powered by Python 🐍
// ─────────────────────────────────────────────
router.post('/nash-calculator', authenticate, async (req, res) => {
  const { valuation, num_bidders, auction_type } = req.body;

  if (!valuation || !num_bidders) {
    return res.status(400).json({ error: 'valuation and num_bidders are required' });
  }

  const v = parseFloat(valuation);
  const n = parseInt(num_bidders);

  try {
    const result = await callPython({
      action: 'nash_calculator',
      valuation: v,
      num_bidders: n,
    });

    res.json(result);

  } catch (pythonError) {
    console.warn('Python engine failed, falling back to JS:', pythonError.message);

    const nashBid = nashEquilibriumBid(v, n);
    const payoff  = expectedPayoff(v, nashBid, n);

    const bidRange = [];
    for (let frac = 0.5; frac <= 1.0; frac += 0.05) {
      const testBid = v * frac;
      bidRange.push({
        bidFraction: frac.toFixed(2),
        bid: testBid.toFixed(2),
        expectedPayoff: expectedPayoff(v, testBid, n).toFixed(2),
      });
    }

    res.json({
      valuation: v,
      numBidders: n,
      nashEquilibriumBid: nashBid.toFixed(2),
      expectedPayoff: payoff.toFixed(2),
      optimalFraction: ((n - 1) / n).toFixed(4),
      analysis: bidRange,
      explanation: `With ${n} bidders, the symmetric Bayesian Nash Equilibrium for first-price sealed-bid is to bid ${((n - 1) / n * 100).toFixed(1)}% of your valuation = ${nashBid.toFixed(2)}`,
      engine: 'JavaScript (fallback)',
    });
  }
});

module.exports = router;
