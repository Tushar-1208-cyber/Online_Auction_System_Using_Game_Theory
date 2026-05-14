# FOGT Project: Online Auction System Using Game Theory

An advanced MERN-stack online auction platform that integrates game theory principles to create a fair, optimized, and dynamic bidding environment. This project implements theoretical economic models into a functional real-time marketplace.

## 🚀 Features

* **Game Theory Integration**: 
  * **Nash Equilibrium**: Mathematical modeling to predict stable bidding strategies where no participant can benefit by changing their bid unilaterally.
  * **Myerson's Reserve Price**: Revenue-maximizing auction mechanism that calculates optimal reserve prices based on bidder valuation distributions.
  * **Winner's Curse Mitigation**: Provides tools (like the Winner's Curse Calculator) to help bidders avoid overpaying in common-value auctions.
* **Real-time Bidding**: Instantaneous bid updates and auction status changes.
* **Secure Backend**: Robust Node.js & Express.js server handling complex auction logic and game theory calculations.
* **Dynamic Frontend**: Responsive and intuitive React-based user interface.

## 🛠️ Technology Stack

* **Frontend**: React.js
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (Mongoose for modeling)

## 📂 Project Structure

```text
fogt/
├── backend/                # Node.js Express server
│   ├── models/             # Mongoose schemas (e.g., Auction.js)
│   ├── routes/             # API endpoints
│   ├── controllers/        # Business logic & game theory algorithms
│   └── package.json
└── frontend/               # React application
    ├── src/
    │   ├── components/     # UI Components (AuctionDetail, WinnersCurseCalculator)
    │   ├── api/            # API integration points
    │   └── package.json
```

## ⚙️ Installation & Setup

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file with required environment variables (MongoDB URI, etc.)
   npm start # or npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm start # or npm run dev
   ```

## 🧠 Game Theory Concepts Explained

* **Nash Equilibrium**: Ensures the auction mechanism encourages truthful bidding, making the platform reliable for all participants.
* **Optimal Auctions (Myerson)**: The platform assists sellers in setting a reserve price that maximizes their expected revenue while ensuring the item is sold efficiently.
* **Winner's Curse**: Occurs when the winning bid exceeds the intrinsic value of the item. Our calculator provides insights to help bidders make rational decisions based on available information.