const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    sector: { type: String, trim: true },
    industry: { type: String, trim: true },
    type: { type: String, enum: ['buy', 'sell', 'hold'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    totalValue: { type: Number },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    marketCondition: {
      type: String,
      enum: ['bull', 'bear', 'sideways', 'volatile', 'unknown'],
      default: 'unknown',
    },
    triggerEvent: { type: String, trim: true },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    tags: [{ type: String }],
    exitPrice: { type: Number },
    exitDate: { type: Date },
    realizedPnl: { type: Number },
  },
  { timestamps: true }
);

transactionSchema.pre('save', function (next) {
  this.totalValue = this.quantity * this.price;
  next();
});

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, ticker: 1 });
transactionSchema.index({ user: 1, sector: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
