/**
 * Game Theory Auction Engine
 *
 * Implements four classic auction mechanisms studied in mechanism design:
 *
 * 1. English Auction (ascending open-cry)  — dominant strategy: bid up to valuation
 * 2. Dutch Auction  (descending clock)     — strategically equivalent to sealed first-price
 * 3. First-Price Sealed-Bid               — bid below valuation; Nash equilibrium depends on # bidders
 * 4. Vickrey Auction (second-price sealed) — truthful bidding is a dominant strategy (incentive compatible)
 *
 * The Revenue Equivalence Theorem tells us that under risk-neutrality and independent
 * private values, all four formats yield the same expected revenue to the seller.
 */

/**
 * Validate an English auction bid.
 * Returns { valid, error?, newPrice? }
 */
function processEnglishBid(auction, bid, bids) {
  const currentHigh = auction.current_price;
  const minBid = currentHigh + auction.min_increment;

  if (bid.amount < minBid) {
    return { valid: false, error: `Bid must be at least ${minBid.toFixed(2)} (current ${currentHigh.toFixed(2)} + increment ${auction.min_increment})` };
  }

  // Check the bidder is not already the highest bidder
  if (bids.length > 0 && bids[0].bidder_id === bid.bidder_id) {
    return { valid: false, error: 'You are already the highest bidder' };
  }

  return { valid: true, newPrice: bid.amount };
}

/**
 * Process a Dutch auction acceptance.
 * In Dutch auctions, the price drops over time. A bidder "accepts" the current price.
 */
function processDutchBid(auction, bid) {
  if (auction.status !== 'active') {
    return { valid: false, error: 'Auction is no longer active' };
  }

  // The bid amount should match the current (declining) price
  const currentPrice = getDutchCurrentPrice(auction);
  if (currentPrice <= 0) {
    return { valid: false, error: 'Auction price has reached zero' };
  }

  return { valid: true, newPrice: currentPrice, endAuction: true, winnerId: bid.bidder_id };
}

/**
 * Calculate current Dutch auction price based on elapsed time.
 */
function getDutchCurrentPrice(auction) {
  const startTime = new Date(auction.start_time).getTime();
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const intervals = Math.floor(elapsed / Math.max(auction.dutch_interval_sec, 1));
  const drop = intervals * auction.dutch_decrement;
  return Math.max(auction.starting_price - drop, 0);
}

/**
 * Process sealed first-price bid.
 * All bids are hidden until the auction ends. Highest bid wins at their bid price.
 */
function processSealedFirstPriceBid(auction, bid, existingBids) {
  // Each bidder can only bid once in sealed auctions
  const alreadyBid = existingBids.some(b => b.bidder_id === bid.bidder_id);
  if (alreadyBid) {
    return { valid: false, error: 'You have already submitted a sealed bid for this auction' };
  }

  if (bid.amount <= 0) {
    return { valid: false, error: 'Bid must be positive' };
  }

  return { valid: true, sealed: true };
}

/**
 * Process Vickrey (second-price sealed-bid) bid.
 * Identical to sealed first-price in bidding phase— difference is in resolution.
 */
function processVickreyBid(auction, bid, existingBids) {
  return processSealedFirstPriceBid(auction, bid, existingBids);
}

/**
 * Resolve a sealed auction (called when auction time expires).
 * Returns { winnerId, winningPrice, allBids }
 */
function resolveSealedAuction(auction, bids) {
  if (bids.length === 0) {
    return { winnerId: null, winningPrice: 0, allBids: [] };
  }

  const sorted = [...bids].sort((a, b) => b.amount - a.amount);

  if (auction.auction_type === 'sealed_first') {
    // Winner pays their own bid
    return {
      winnerId: sorted[0].bidder_id,
      winningPrice: sorted[0].amount,
      allBids: sorted,
    };
  }

  if (auction.auction_type === 'vickrey') {
    // Winner pays second-highest bid (or their own if only 1 bidder)
    const secondPrice = sorted.length > 1 ? sorted[1].amount : sorted[0].amount;
    return {
      winnerId: sorted[0].bidder_id,
      winningPrice: secondPrice,
      allBids: sorted,
    };
  }

  return { winnerId: null, winningPrice: 0, allBids: sorted };
}

/**
 * Compute Nash Equilibrium bid suggestion for first-price sealed-bid
 * Under symmetric independent private values with n bidders, each with
 * value v drawn from Uniform[0, V], the symmetric BNE bidding function is:
 *    b(v) = v * (n-1)/n
 */
function nashEquilibriumBid(valuation, numBidders) {
  if (numBidders <= 1) return valuation;
  return valuation * (numBidders - 1) / numBidders;
}

/**
 * Get strategic insights for the current auction.
 */
function getStrategyInsights(auction, numBidders) {
  const n = Math.max(numBidders, 2);

  switch (auction.auction_type) {
    case 'english':
      return {
        type: 'English (Ascending)',
        dominantStrategy: 'Bid up to your true valuation, then stop.',
        insight: 'In an English auction, the dominant strategy is to remain in the bidding until your valuation is reached. The winner pays just above the second-highest valuation.',
        expectedRevenue: `With ${n} bidders, expected revenue equals the expected second-highest valuation.`,
        bayesianNash: 'Staying until your value is weakly dominant — no complex calculation required.',
        riskNote: 'Winner\'s Curse is unlikely here since you observe competing bids.',
      };

    case 'dutch':
      return {
        type: 'Dutch (Descending)',
        dominantStrategy: 'Strategically equivalent to first-price sealed-bid.',
        insight: `Accept when the price drops to roughly ${((n - 1) / n * 100).toFixed(0)}% of your valuation (with ${n} bidders). Waiting longer risks someone else accepting first.`,
        expectedRevenue: 'By Revenue Equivalence Theorem, expected revenue matches English auction under risk-neutrality.',
        bayesianNash: `Optimal acceptance price ≈ v × ${n - 1}/${n} where v = your private valuation.`,
        riskNote: 'Risk-averse bidders tend to accept earlier, increasing seller revenue.',
      };

    case 'sealed_first':
      return {
        type: 'First-Price Sealed-Bid',
        dominantStrategy: 'Shade your bid below your true valuation.',
        insight: `With ${n} bidders and uniform prior, Nash Equilibrium bid = valuation × ${n - 1}/${n}. Bid ${((n - 1) / n * 100).toFixed(0)}% of what the item is worth to you.`,
        expectedRevenue: 'Revenue Equivalence: same expected seller revenue as English/Vickrey.',
        bayesianNash: `b(v) = v × (n-1)/n = v × ${(n - 1) / n}`,
        riskNote: 'Risk-averse bidders bid higher → higher seller revenue than English auction.',
        calculator: true,
      };

    case 'vickrey':
      return {
        type: 'Vickrey (Second-Price Sealed-Bid)',
        dominantStrategy: 'Bid your TRUE valuation. This is a dominant strategy!',
        insight: 'The Vickrey auction is incentive-compatible: bidding truthfully is optimal regardless of what others do. You pay the second-highest bid, so overbidding risks overpaying and underbidding risks losing.',
        expectedRevenue: 'Revenue Equivalence holds. Expected revenue = expected second-highest value.',
        bayesianNash: 'b(v) = v (truthful bidding is the dominant strategy equilibrium).',
        riskNote: 'No winner\'s curse concern. Strategy-proof mechanism ideal for risk-averse bidders.',
      };

    default:
      return { type: 'Unknown', insight: 'No strategy data available.' };
  }
}

/**
 * Compute expected payoff for a bidder.
 * In first-price with n bidders, uniform [0,V]:
 *   E[payoff] = (v - b) × (b/V)^{n-1}
 */
function expectedPayoff(valuation, bidAmount, numBidders, maxVal = 10000) {
  if (bidAmount >= valuation) return 0; // overbidding → negative payoff if you win
  const n = Math.max(numBidders, 2);
  const winProb = Math.pow(bidAmount / maxVal, n - 1);
  return (valuation - bidAmount) * winProb;
}

module.exports = {
  processEnglishBid,
  processDutchBid,
  getDutchCurrentPrice,
  processSealedFirstPriceBid,
  processVickreyBid,
  resolveSealedAuction,
  nashEquilibriumBid,
  getStrategyInsights,
  expectedPayoff,
};
