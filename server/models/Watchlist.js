const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, trim: true },
    sector: { type: String, trim: true },
    notes: { type: String, trim: true },
    targetPrice: { type: Number },
    alertPriceHigh: { type: Number },
    alertPriceLow: { type: Number },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['watching', 'alerted', 'archived'], default: 'watching' },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

watchlistSchema.index({ user: 1, ticker: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
