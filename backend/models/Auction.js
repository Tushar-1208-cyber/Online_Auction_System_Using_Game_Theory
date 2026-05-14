const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const auctionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  image_url: {
    type: String,
    default: '',
  },
  auction_type: {
    type: String,
    required: true,
    enum: ['english', 'dutch', 'sealed_first', 'vickrey'],
  },
  starting_price: {
    type: Number,
    required: true,
  },
  current_price: {
    type: Number,
    required: true,
  },
  reserve_price: {
    type: Number,
    default: 0,
  },
  min_increment: {
    type: Number,
    default: 1,
  },
  dutch_decrement: {
    type: Number,
    default: 0,
  },
  dutch_interval_sec: {
    type: Number,
    default: 0,
  },
  seller_id: {
    type: String,
    required: true,
  },
  winner_id: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled'],
    default: 'active',
  },
  start_time: {
    type: Date,
    default: Date.now,
  },
  end_time: {
    type: Date,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Auction', auctionSchema);
