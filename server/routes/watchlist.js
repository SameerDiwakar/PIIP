const express = require('express');
const Watchlist = require('../models/Watchlist');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const items = await Watchlist.find({ user: req.user._id, status: { $ne: 'archived' } }).sort({ priority: -1, addedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/', async (req, res) => {
  try {
    const item = await Watchlist.create({ ...req.body, user: req.user._id });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ticker already on watchlist' });
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await Watchlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Watchlist item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update watchlist item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await Watchlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ error: 'Watchlist item not found' });
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;
