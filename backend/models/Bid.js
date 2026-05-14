const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bidSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  auction_id: {
    type: String,
    required: true,
  },
  bidder_id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  is_sealed: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Bid', bidSchema);
