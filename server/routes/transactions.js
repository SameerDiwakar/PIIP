const express = require('express');
const { body } = require('express-validator');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, ticker, sector, type, startDate, endDate } = req.query;
    const query = { user: req.user._id };
    if (ticker) query.ticker = ticker.toUpperCase();
    if (sector) query.sector = new RegExp(sector, 'i');
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);
    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post(
  '/',
  [
    body('ticker').trim().notEmpty().withMessage('Ticker is required'),
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('type').isIn(['buy', 'sell', 'hold']).withMessage('Valid type required'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be positive'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  ],
  validate,
  async (req, res) => {
    try {
      const tx = await Transaction.create({ ...req.body, user: req.user._id });
      res.status(201).json(tx);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
);

router.put('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const items = (req.body.transactions || []).map((t) => ({ ...t, user: req.user._id }));
    if (!items.length) return res.status(400).json({ error: 'No transactions provided' });
    const created = await Transaction.insertMany(items);
    res.status(201).json({ created: created.length, transactions: created });
  } catch (err) {
    res.status(500).json({ error: 'Bulk insert failed' });
  }
});

module.exports = router;
