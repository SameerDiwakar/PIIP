const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    context: {
      ticker: String,
      topic: String,
      behaviorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserBehaviorProfile' },
    },
    tokensUsed: { type: Number },
    feedback: { type: String, enum: ['positive', 'negative', null], default: null },
  },
  { timestamps: true }
);

chatMessageSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', chatMessageSchema);
