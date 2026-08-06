const mongoose = require('mongoose');

const userBehaviorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    behaviorType: {
      type: String,
      enum: ['momentum', 'value', 'growth', 'contrarian', 'balanced', 'unclassified'],
      default: 'unclassified',
    },
    riskProfile: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive', 'unknown'],
      default: 'unknown',
    },
    averageHoldingPeriod: { type: Number },
    averageHoldingPeriodLabel: { type: String },
    tradingFrequency: { type: String },
    preferredSectors: [{ sector: String, count: Number }],
    preferredTickers: [{ ticker: String, count: Number }],
    marketConditionBias: {
      bull: Number,
      bear: Number,
      sideways: Number,
      volatile: Number,
      unknown: Number,
    },
    sentimentBias: { positive: Number, neutral: Number, negative: Number },
    buySellRatio: { type: Number },
    averagePositionSize: { type: Number },
    totalTransactions: { type: Number },
    winRate: { type: Number },
    averageWin: { type: Number },
    averageLoss: { type: Number },
    profitFactor: { type: Number },
    behavioralScores: {
      discipline: { type: Number, default: 0 },
      patience: { type: Number, default: 0 },
      decisiveness: { type: Number, default: 0 },
      riskManagement: { type: Number, default: 0 },
      consistency: { type: Number, default: 0 },
    },
    lastAnalyzedAt: { type: Date, default: Date.now },
    analysisVersion: { type: String, default: '1.0' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserBehaviorProfile', userBehaviorProfileSchema);
