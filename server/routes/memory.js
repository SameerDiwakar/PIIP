const express = require('express');
const { protect } = require('../middleware/auth');
const { getMemories, buildMemoriesFromTransactions } = require('../services/memoryService');
const ChatHistory = require('../models/ChatHistory');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const memories = await getMemories(req.user._id, Number(req.query.limit) || 30);
    res.json({ memories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const created = await buildMemoriesFromTransactions(req.user._id);
    const memories = await getMemories(req.user._id);
    res.json({ created: created.length, memories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync memories' });
  }
});

router.post('/chat-feedback', async (req, res) => {
  try {
    const { messageId, feedback } = req.body;
    if (!feedback || !['positive', 'negative'].includes(feedback)) {
      return res.status(400).json({ error: 'Valid feedback required' });
    }
    await ChatHistory.findOneAndUpdate(
      { user: req.user._id, _id: messageId },
      { feedback }
    );
    res.json({ message: 'Feedback saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

module.exports = router;
