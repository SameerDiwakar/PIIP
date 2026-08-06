const express = require('express');
const UserBehaviorProfile = require('../models/UserBehaviorProfile');
const Transaction = require('../models/Transaction');
const RecommendationFeedback = require('../models/RecommendationFeedback');
const { protect } = require('../middleware/auth');
const { analyzeBehavior } = require('../services/behaviorAnalyzer');
const { findSimilarCompanies, evaluateOpportunity } = require('../services/recommendationService');
const { getMemories, learnFromFeedback } = require('../services/memoryService');

const router = express.Router();

router.use(protect);

router.get('/similar', async (req, res) => {
  try {
    let profile = await UserBehaviorProfile.findOne({ user: req.user._id });
    if (!profile) {
      const txCount = await Transaction.countDocuments({ user: req.user._id });
      if (txCount > 0) profile = await analyzeBehavior(req.user._id);
    }
    const similar = findSimilarCompanies(profile, req.user, Number(req.query.limit) || 6);
    res.json({ companies: similar });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch similar companies' });
  }
});

router.post('/evaluate', async (req, res) => {
  try {
    const { ticker, companyName } = req.body;
    if (!ticker) return res.status(400).json({ error: 'Ticker is required' });

    let profile = await UserBehaviorProfile.findOne({ user: req.user._id });
    if (!profile) {
      const txCount = await Transaction.countDocuments({ user: req.user._id });
      if (txCount > 0) profile = await analyzeBehavior(req.user._id);
    }

    const memories = await getMemories(req.user._id, 10);
    const evaluation = await evaluateOpportunity({
      ticker,
      companyName,
      user: req.user,
      profile,
      memories,
    });

    res.json(evaluation);
  } catch (err) {
    res.status(500).json({ error: 'Evaluation failed: ' + err.message });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { ticker, recommendation, rating, comment } = req.body;
    if (!rating) return res.status(400).json({ error: 'Rating is required' });

    await RecommendationFeedback.create({
      user: req.user._id,
      ticker,
      recommendation,
      rating,
      comment,
    });

    await learnFromFeedback(req.user._id, { ticker, rating, comment, recommendation });

    res.json({ message: 'Feedback recorded. The system will adapt to your preferences.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

module.exports = router;
