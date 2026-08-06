const express = require('express');
const { protect } = require('../middleware/auth');
const { seedForUser } = require('../services/seedService');

const router = express.Router();

router.post('/demo', protect, async (req, res) => {
  try {
    const clearExisting = req.body.clearExisting !== false;
    const result = await seedForUser(req.user._id, clearExisting);
    if (result.skipped) {
      return res.status(409).json(result);
    }
    res.json({
      message: 'Sample data loaded successfully',
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed: ' + err.message });
  }
});

module.exports = router;
