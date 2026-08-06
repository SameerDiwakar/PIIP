const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: 1 });
    const total = transactions.length;
    if (total === 0) {
      return res.json({
        summary: { totalTransactions: 0, totalInvested: 0, totalReturned: 0, uniqueTickers: 0, uniqueSectors: 0 },
        sectorBreakdown: [],
        monthlyActivity: [],
        typeBreakdown: { buy: 0, sell: 0, hold: 0 },
      });
    }

    const totalInvested = transactions.filter((t) => t.type === 'buy').reduce((s, t) => s + t.totalValue, 0);
    const totalReturned = transactions.filter((t) => t.type === 'sell').reduce((s, t) => s + t.totalValue, 0);
    const uniqueTickers = new Set(transactions.map((t) => t.ticker)).size;
    const uniqueSectors = new Set(transactions.filter((t) => t.sector).map((t) => t.sector)).size;

    const sectorMap = {};
    transactions.forEach((t) => {
      const sector = t.sector || 'Unknown';
      if (!sectorMap[sector]) sectorMap[sector] = { sector, count: 0, value: 0 };
      sectorMap[sector].count += 1;
      sectorMap[sector].value += t.totalValue;
    });

    const monthMap = {};
    transactions.forEach((t) => {
      const month = t.date.toISOString().slice(0, 7);
      if (!monthMap[month]) monthMap[month] = { month, count: 0, value: 0 };
      monthMap[month].count += 1;
      monthMap[month].value += t.totalValue;
    });

    const typeBreakdown = { buy: 0, sell: 0, hold: 0 };
    transactions.forEach((t) => { typeBreakdown[t.type] += 1; });

    res.json({
      summary: { totalTransactions: total, totalInvested, totalReturned, uniqueTickers, uniqueSectors },
      sectorBreakdown: Object.values(sectorMap).sort((a, b) => b.value - a.value),
      monthlyActivity: Object.values(monthMap),
      typeBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
