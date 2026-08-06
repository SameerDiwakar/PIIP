const express = require('express');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: 1 });

    const holdings = {};
    transactions.forEach((t) => {
      if (!holdings[t.ticker]) {
        holdings[t.ticker] = {
          ticker: t.ticker,
          companyName: t.companyName,
          sector: t.sector,
          industry: t.industry,
          totalQuantity: 0,
          totalCost: 0,
          realizedPnl: 0,
          transactions: [],
        };
      }
      const h = holdings[t.ticker];
      h.transactions.push(t);
      if (t.type === 'buy') {
        h.totalQuantity += t.quantity;
        h.totalCost += t.totalValue;
      } else if (t.type === 'sell') {
        h.totalQuantity -= t.quantity;
        if (t.realizedPnl) h.realizedPnl += t.realizedPnl;
      }
    });

    const positions = Object.values(holdings)
      .filter((h) => h.totalQuantity > 0)
      .map((h) => {
        const avgCost = h.totalQuantity > 0 ? h.totalCost / h.totalQuantity : 0;
        return {
          ...h,
          averageCost: avgCost,
          marketValue: h.totalQuantity * avgCost,
          unrealizedPnl: h.realizedPnl,
          allocation: 0,
        };
      });

    const totalPortfolioValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    positions.forEach((p) => {
      p.allocation = totalPortfolioValue > 0 ? (p.marketValue / totalPortfolioValue) * 100 : 0;
    });

    const sectorAllocation = {};
    positions.forEach((p) => {
      const sector = p.sector || 'Unknown';
      if (!sectorAllocation[sector]) sectorAllocation[sector] = { sector, value: 0, count: 0 };
      sectorAllocation[sector].value += p.marketValue;
      sectorAllocation[sector].count += 1;
    });

    res.json({
      positions,
      totalValue: totalPortfolioValue,
      totalCost: positions.reduce((s, p) => s + p.totalCost, 0),
      sectorAllocation: Object.values(sectorAllocation),
      totalPositions: positions.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: 1 });
    const monthlyPerformance = {};
    transactions.forEach((t) => {
      const month = t.date.toISOString().slice(0, 7);
      if (!monthlyPerformance[month]) {
        monthlyPerformance[month] = { month, buys: 0, sells: 0, volume: 0, netInvestment: 0 };
      }
      const m = monthlyPerformance[month];
      if (t.type === 'buy') {
        m.buys += t.totalValue;
        m.netInvestment += t.totalValue;
      } else if (t.type === 'sell') {
        m.sells += t.totalValue;
        m.netInvestment -= t.totalValue;
      }
      m.volume += t.totalValue;
    });
    res.json({ monthly: Object.values(monthlyPerformance) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

module.exports = router;
