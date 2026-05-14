const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['seller', 'bidder'],
    default: 'bidder',
  },
  phone: {
    type: String,
  },
  is_verified: {
    type: Number,
    default: 0,
  },
  otp_code: {
    type: String,
  },
  otp_expiry: {
    type: Date,
  },
  balance: {
    type: Number,
    default: 10000,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('User', userSchema);
