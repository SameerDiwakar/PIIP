const mongoose = require('mongoose');

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticker: { type: String, uppercase: true, trim: true },
    recommendation: { type: String },
    rating: { type: String, enum: ['helpful', 'not_helpful'], required: true },
    comment: { type: String, trim: true },
    context: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

recommendationFeedbackSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);
