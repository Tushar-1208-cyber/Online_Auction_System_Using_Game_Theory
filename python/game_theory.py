"""
Game Theory Auction Engine - Python Implementation
====================================================
Implements four classic auction mechanisms:
1. English Auction (ascending open-cry)
2. Dutch Auction (descending clock)
3. First-Price Sealed-Bid
4. Vickrey Auction (second-price sealed)

Mathematical Foundation:
- Revenue Equivalence Theorem
- Bayesian Nash Equilibrium
- Expected Utility Theory
"""

import json
import sys
import math


# ─────────────────────────────────────────────
#  NASH EQUILIBRIUM
# ─────────────────────────────────────────────

def nash_equilibrium_bid(valuation: float, num_bidders: int) -> float:
    """
    Symmetric Bayesian Nash Equilibrium for first-price sealed-bid auction.
    Under uniform independent private values [0, V] with n bidders:
        b(v) = v * (n-1) / n
    """
    if num_bidders <= 1:
        return valuation
    return valuation * (num_bidders - 1) / num_bidders


# ─────────────────────────────────────────────
#  EXPECTED PAYOFF
# ─────────────────────────────────────────────

def expected_payoff(valuation: float, bid: float,
                    num_bidders: int, max_val: float = 10000.0) -> float:
    """
    Expected payoff for a bidder in first-price sealed-bid auction.
    E[payoff] = (v - b) * (b / V)^(n-1)
    where V = max valuation, n = number of bidders
    """
    if bid >= valuation:
        return 0.0
    n = max(num_bidders, 2)
    win_probability = math.pow(bid / max_val, n - 1)
    return (valuation - bid) * win_probability


# ─────────────────────────────────────────────
#  BID SHADING ANALYSIS
# ─────────────────────────────────────────────

def bid_shading_analysis(valuation: float, num_bidders: int) -> list:
    """
    Analyze expected payoff across different bid fractions.
    Returns a list of dicts with bid fraction, bid amount, and expected payoff.
    """
    results = []
    fraction = 0.50
    while fraction <= 1.01:
        bid = valuation * fraction
        payoff = expected_payoff(valuation, bid, num_bidders)
        results.append({
            "bidFraction": round(fraction, 2),
            "bid": round(bid, 2),
            "expectedPayoff": round(payoff, 4),
        })
        fraction = round(fraction + 0.05, 2)
    return results


# ─────────────────────────────────────────────
#  WIN PROBABILITY
# ─────────────────────────────────────────────

def win_probability(bid: float, num_bidders: int,
                    max_val: float = 10000.0) -> float:
    """
    Probability of winning given a bid amount.
    P(win) = (b / V)^(n-1)
    """
    n = max(num_bidders, 2)
    return math.pow(bid / max_val, n - 1)


# ─────────────────────────────────────────────
#  REVENUE EQUIVALENCE
# ─────────────────────────────────────────────

def revenue_equivalence(num_bidders: int, max_val: float = 10000.0) -> float:
    """
    Expected seller revenue under Revenue Equivalence Theorem.
    With n bidders, uniform [0, V]:
        E[revenue] = V * (n-1) / (n+1)
    """
    if num_bidders < 2:
        return 0.0
    return max_val * (num_bidders - 1) / (num_bidders + 1)


# ─────────────────────────────────────────────
#  AUCTION TYPE STRATEGY
# ─────────────────────────────────────────────

def get_auction_strategy(auction_type: str, num_bidders: int) -> dict:
    """
    Return game theory strategy insights for each auction type.
    """
    n = max(num_bidders, 2)
    optimal_fraction = round((n - 1) / n, 4)

    strategies = {
        "english": {
            "type": "English (Ascending)",
            "dominantStrategy": "Bid up to your true valuation, then stop.",
            "insight": (
                "In an English auction, the dominant strategy is to remain "
                "in the bidding until your valuation is reached. "
                "The winner pays just above the second-highest valuation."
            ),
            "bayesianNash": "Staying until your value is weakly dominant — no complex calculation required.",
            "riskNote": "Winner's Curse is unlikely here since you observe competing bids.",
        },
        "dutch": {
            "type": "Dutch (Descending)",
            "dominantStrategy": "Strategically equivalent to first-price sealed-bid.",
            "insight": (
                f"Accept when the price drops to roughly "
                f"{round(optimal_fraction * 100, 1)}% of your valuation "
                f"(with {n} bidders). Waiting longer risks someone else accepting first."
            ),
            "bayesianNash": f"Optimal acceptance price ≈ v × {n-1}/{n} where v = your private valuation.",
            "riskNote": "Risk-averse bidders tend to accept earlier, increasing seller revenue.",
        },
        "sealed_first": {
            "type": "First-Price Sealed-Bid",
            "dominantStrategy": "Shade your bid below your true valuation.",
            "insight": (
                f"With {n} bidders and uniform prior, Nash Equilibrium bid = "
                f"valuation × {n-1}/{n}. Bid {round(optimal_fraction * 100, 1)}% "
                f"of what the item is worth to you."
            ),
            "bayesianNash": f"b(v) = v × (n-1)/n = v × {optimal_fraction}",
            "riskNote": "Risk-averse bidders bid higher → higher seller revenue than English auction.",
        },
        "vickrey": {
            "type": "Vickrey (Second-Price Sealed-Bid)",
            "dominantStrategy": "Bid your TRUE valuation. This is a dominant strategy!",
            "insight": (
                "The Vickrey auction is incentive-compatible: bidding truthfully "
                "is optimal regardless of what others do. You pay the second-highest "
                "bid, so overbidding risks overpaying and underbidding risks losing."
            ),
            "bayesianNash": "b(v) = v (truthful bidding is the dominant strategy equilibrium).",
            "riskNote": "No winner's curse concern. Strategy-proof mechanism ideal for risk-averse bidders.",
        },
    }
    return strategies.get(auction_type, {"type": "Unknown", "insight": "No strategy data available."})


# ─────────────────────────────────────────────
#  MAIN — Called by Node.js via child_process
# ─────────────────────────────────────────────

def main():
    """
    Entry point when called from Node.js.
    Reads JSON input from stdin, returns JSON output to stdout.

    Input:  { "action": "...", ...params }
    Output: { ...result }
    """
    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}))
        sys.exit(1)

    action = data.get("action")

    # ── Nash Calculator ──────────────────────
    if action == "nash_calculator":
        valuation   = float(data.get("valuation", 0))
        num_bidders = int(data.get("num_bidders", 2))

        nash_bid    = nash_equilibrium_bid(valuation, num_bidders)
        payoff      = expected_payoff(valuation, nash_bid, num_bidders)
        analysis    = bid_shading_analysis(valuation, num_bidders)
        opt_frac    = (num_bidders - 1) / num_bidders

        result = {
            "valuation":          valuation,
            "numBidders":         num_bidders,
            "nashEquilibriumBid": round(nash_bid, 2),
            "expectedPayoff":     round(payoff, 4),
            "optimalFraction":    round(opt_frac, 4),
            "analysis":           analysis,
            "explanation": (
                f"With {num_bidders} bidders, the symmetric Bayesian Nash Equilibrium "
                f"for first-price sealed-bid is to bid "
                f"{round(opt_frac * 100, 1)}% of your valuation = {round(nash_bid, 2)}"
            ),
            "engine": "Python 3",
        }
        print(json.dumps(result))

    # ── Strategy Insights ────────────────────
    elif action == "strategy":
        auction_type = data.get("auction_type", "english")
        num_bidders  = int(data.get("num_bidders", 2))
        strategy     = get_auction_strategy(auction_type, num_bidders)
        strategy["engine"] = "Python 3"
        print(json.dumps(strategy))

    # ── Win Probability ──────────────────────
    elif action == "win_probability":
        bid         = float(data.get("bid", 0))
        num_bidders = int(data.get("num_bidders", 2))
        prob        = win_probability(bid, num_bidders)
        print(json.dumps({
            "bid":            bid,
            "numBidders":     num_bidders,
            "winProbability": round(prob, 6),
            "engine":         "Python 3",
        }))

    # ── Revenue Equivalence ──────────────────
    elif action == "revenue_equivalence":
        num_bidders = int(data.get("num_bidders", 2))
        revenue     = revenue_equivalence(num_bidders)
        print(json.dumps({
            "numBidders":      num_bidders,
            "expectedRevenue": round(revenue, 2),
            "engine":          "Python 3",
        }))

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
