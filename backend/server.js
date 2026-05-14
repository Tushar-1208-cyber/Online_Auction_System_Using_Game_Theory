const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');
const { getDutchCurrentPrice, resolveSealedAuction } = require('./gameTheory/auctionEngine');
const { sendEmail } = require('./utils/mailer');
const User = require('./models/User');
const app = express();
const server = http.createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

// WebSocket handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join:auction', (auctionId) => {
    socket.join(`auction:${auctionId}`);
    console.log(`${socket.id} joined auction:${auctionId}`);
  });

  socket.on('leave:auction', (auctionId) => {
    socket.leave(`auction:${auctionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
// Auto resolve expired auctions — runs every 1 second
// ─────────────────────────────────────────────
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

async function sendEndAuctionEmails(auction, winnerId, winningPrice) {
  try {
    const seller = await User.findOne({ id: auction.seller_id });
    if (seller && seller.email) {
      const sellerHtml = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Your Auction Ended!</h2>
          <p>Your auction <strong>"${auction.title}"</strong> has ended successfully.</p>
          <p>Winning Price: <strong>$${winningPrice}</strong></p>
          <p>We will contact you shortly with the next steps.</p>
        </div>
      `;
      await sendEmail(seller.email, `Item Sold: ${auction.title}`, sellerHtml);
    }

    if (winnerId) {
      const winner = await User.findOne({ id: winnerId });
      if (winner && winner.email) {
        const winnerHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Congratulations! You Won! 🎉</h2>
            <p>You have won the auction for <strong>"${auction.title}"</strong>.</p>
            <p>Winning Bid: <strong>$${winningPrice}</strong></p>
            <p>Please log in to your dashboard to complete the payment.</p>
          </div>
        `;
        await sendEmail(winner.email, `You won the auction: ${auction.title}!`, winnerHtml);
      }
    }
  } catch (err) {
    console.error('Error sending end auction emails:', err);
  }
}

async function resolveExpiredAuctions() {
  try {
    const activeAuctions = await Auction.find({ status: 'active' }).lean();

    const expiredAuctions = activeAuctions.filter(a => new Date(a.end_time) <= new Date());

    for (const auction of expiredAuctions) {
      const bids = await Bid.find({ auction_id: auction.id }).sort({ amount: -1 }).lean();

      if (auction.auction_type === 'sealed_first' || auction.auction_type === 'vickrey') {
        const result = resolveSealedAuction(auction, bids);
        if (result.winnerId && result.winningPrice >= auction.reserve_price) {
          await Auction.findOneAndUpdate(
            { id: auction.id },
            { status: 'ended', winner_id: result.winnerId, current_price: result.winningPrice }
          );
          console.log(`✅ Auction "${auction.title}" ended — Winner ID: ${result.winnerId}, Price: ${result.winningPrice}`);
          await sendEndAuctionEmails(auction, result.winnerId, result.winningPrice);
        } else {
          await Auction.findOneAndUpdate({ id: auction.id }, { status: 'ended' });
          console.log(`⏹ Auction "${auction.title}" ended — No winner`);
        }
        io.to(`auction:${auction.id}`).emit('auction:ended', {
          auctionId: auction.id,
          winnerId: result.winnerId,
          winningPrice: result.winningPrice,
          type: auction.auction_type,
          allBids: result.allBids,
        });

      } else {
        // English or Dutch
        if (bids.length > 0 && bids[0].amount >= auction.reserve_price) {
          await Auction.findOneAndUpdate(
            { id: auction.id },
            { status: 'ended', winner_id: bids[0].bidder_id, current_price: bids[0].amount }
          );
          console.log(`✅ Auction "${auction.title}" ended — Winner ID: ${bids[0].bidder_id}, Price: ${bids[0].amount}`);
          await sendEndAuctionEmails(auction, bids[0].bidder_id, bids[0].amount);
          io.to(`auction:${auction.id}`).emit('auction:ended', {
            auctionId: auction.id,
            winnerId: bids[0].bidder_id,
            winningPrice: bids[0].amount,
            type: auction.auction_type,
          });
        } else {
          await Auction.findOneAndUpdate({ id: auction.id }, { status: 'ended' });
          console.log(`⏹ Auction "${auction.title}" ended — No winner (reserve not met)`);
          io.to(`auction:${auction.id}`).emit('auction:ended', {
            auctionId: auction.id,
            winnerId: null,
            winningPrice: 0,
            type: auction.auction_type,
          });
        }
      }
    }

    // Broadcast Dutch price updates
    const dutchAuctions = activeAuctions.filter(a => a.auction_type === 'dutch');

    for (const auction of dutchAuctions) {
      const price = getDutchCurrentPrice(auction);
      if (price <= 0) {
        await Auction.findOneAndUpdate({ id: auction.id }, { status: 'ended', current_price: 0 });
        io.to(`auction:${auction.id}`).emit('auction:ended', { auctionId: auction.id, winnerId: null, winningPrice: 0 });
      } else {
        io.to(`auction:${auction.id}`).emit('dutch:price-update', { auctionId: auction.id, currentPrice: price });
      }
    }
  } catch (err) {
    console.error('Error resolving expired auctions:', err);
  }
}

// Run every 1 second for instant winner declaration
setInterval(resolveExpiredAuctions, 1000);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Auction server running on http://localhost:${PORT}`);
});
