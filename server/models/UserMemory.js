const mongoose = require('mongoose');

const userMemorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['preference', 'pattern', 'mistake', 'success', 'note', 'feedback'],
      default: 'note',
    },
    content: { type: String, required: true, trim: true },
    source: { type: String, enum: ['transaction', 'chat', 'feedback', 'system', 'onboarding'], default: 'system' },
    relatedTicker: { type: String, uppercase: true, trim: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

userMemorySchema.index({ user: 1, createdAt: -1 });
userMemorySchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('UserMemory', userMemorySchema);
