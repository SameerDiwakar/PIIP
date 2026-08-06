const express = require('express');
const { protect } = require('../middleware/auth');
const { analyzeBehavior } = require('../services/behaviorAnalyzer');
const { generateAIResponse, generateInsights } = require('../services/aiService');
const UserBehaviorProfile = require('../models/UserBehaviorProfile');
const Transaction = require('../models/Transaction');
const ChatHistory = require('../models/ChatHistory');

const router = express.Router();

router.use(protect);

router.post('/analyze', async (req, res) => {
  try {
    const profile = await analyzeBehavior(req.user._id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Behavior analysis failed: ' + err.message });
  }
});

router.get('/profile', async (req, res) => {
  try {
    let profile = await UserBehaviorProfile.findOne({ user: req.user._id });
    if (!profile) {
      const txCount = await Transaction.countDocuments({ user: req.user._id });
      if (txCount > 0) {
        profile = await analyzeBehavior(req.user._id);
      } else {
        return res.json({ profile: null, message: 'No transactions yet. Add transactions to generate your behavior profile.' });
      }
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch behavior profile' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, ticker, topic } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    let profile = await UserBehaviorProfile.findOne({ user: req.user._id });
    const recentHistory = await ChatHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('role content -_id');

    await ChatHistory.create({ user: req.user._id, role: 'user', content: message, context: { ticker, topic, behaviorProfileId: profile?._id } });

    const response = await generateAIResponse({
      message,
      user: req.user,
      profile,
      recentHistory,
      ticker,
      topic,
    });

    await ChatHistory.create({
      user: req.user._id,
      role: 'assistant',
      content: response.content,
      context: { ticker, topic, behaviorProfileId: profile?._id },
      tokensUsed: response.tokensUsed,
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'AI chat failed: ' + err.message });
  }
});

router.get('/chat/history', async (req, res) => {
  try {
    const messages = await ChatHistory.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(100)
      .select('role content context createdAt -_id');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

router.post('/insights', async (req, res) => {
  try {
    let profile = await UserBehaviorProfile.findOne({ user: req.user._id });
    if (!profile) {
      const txCount = await Transaction.countDocuments({ user: req.user._id });
      if (txCount === 0) return res.json({ insights: ['Add transactions to unlock personalized insights.'] });
      profile = await analyzeBehavior(req.user._id);
    }
    const insights = await generateInsights(req.user, profile);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
