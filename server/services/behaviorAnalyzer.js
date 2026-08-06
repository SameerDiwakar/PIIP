const Transaction = require('../models/Transaction');
const UserBehaviorProfile = require('../models/UserBehaviorProfile');

const classifyHoldingPeriod = (days) => {
  if (days < 1) return 'intraday';
  if (days < 7) return 'short-term';
  if (days < 30) return 'medium-term';
  if (days < 180) return 'long-term';
  return 'very-long-term';
};

const classifyTradingFrequency = (txCount, dateRangeDays) => {
  if (dateRangeDays === 0) return 'unknown';
  const perWeek = (txCount / dateRangeDays) * 7;
  if (perWeek > 5) return 'very-high';
  if (perWeek > 2) return 'high';
  if (perWeek > 0.5) return 'moderate';
  if (perWeek > 0.1) return 'low';
  return 'very-low';
};

const classifyBehaviorType = (analysis) => {
  const { buySellRatio, averageHoldingPeriod, preferredSectors, sentimentBias } = analysis;
  if (averageHoldingPeriod < 7 && buySellRatio > 1.5) return 'momentum';
  if (averageHoldingPeriod > 90 && buySellRatio < 0.5) return 'value';
  if (preferredSectors.length > 0 && preferredSectors[0].sector.match(/tech|growth|innovation/i)) return 'growth';
  if (sentimentBias && sentimentBias.negative > sentimentBias.positive) return 'contrarian';
  return 'balanced';
};

const classifyRiskProfile = (analysis, user) => {
  if (user.riskTolerance && user.riskTolerance !== 'moderate') return user.riskTolerance;
  const { averagePositionSize, averageHoldingPeriod, buySellRatio } = analysis;
  let score = 0;
  if (averagePositionSize > 10000) score += 2;
  else if (averagePositionSize > 1000) score += 1;
  if (averageHoldingPeriod < 7) score += 2;
  else if (averageHoldingPeriod < 30) score += 1;
  if (buySellRatio > 2) score += 1;
  if (score >= 4) return 'aggressive';
  if (score >= 2) return 'moderate';
  return 'conservative';
};

const calculateBehavioralScores = (transactions, analysis) => {
  const scores = { discipline: 0, patience: 0, decisiveness: 0, riskManagement: 0, consistency: 0 };

  if (analysis.averageHoldingPeriod > 30) scores.patience = Math.min(100, Math.round(analysis.averageHoldingPeriod / 2));
  else scores.patience = Math.round(analysis.averageHoldingPeriod * 2);

  const buyCount = transactions.filter((t) => t.type === 'buy').length;
  const sellCount = transactions.filter((t) => t.type === 'sell').length;
  scores.decisiveness = Math.min(100, Math.round((sellCount / Math.max(buyCount, 1)) * 100));

  const sectorCount = analysis.preferredSectors.length;
  scores.consistency = sectorCount > 0 ? Math.max(20, Math.round(100 - sectorCount * 10)) : 0;

  const positionSizes = transactions.map((t) => t.totalValue || t.quantity * t.price).filter((v) => v > 0);
  if (positionSizes.length > 1) {
    const avg = positionSizes.reduce((s, v) => s + v, 0) / positionSizes.length;
    const variance = positionSizes.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / positionSizes.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 1;
    scores.discipline = Math.max(0, Math.min(100, Math.round(100 - cv * 50)));
  }

  scores.riskManagement = Math.min(100, Math.round((sellCount / Math.max(transactions.length, 1)) * 100));

  return scores;
};

const analyzeBehavior = async (userId) => {
  const transactions = await Transaction.find({ user: userId }).sort({ date: 1 });
  if (transactions.length === 0) {
    throw new Error('No transactions to analyze');
  }

  const buys = transactions.filter((t) => t.type === 'buy');
  const sells = transactions.filter((t) => t.type === 'sell');
  const buySellRatio = buys.length > 0 ? buys.length / Math.max(sells.length, 1) : 0;

  const holdingPeriods = [];
  const tickerBuys = {};
  buys.forEach((b) => {
    if (!tickerBuys[b.ticker]) tickerBuys[b.ticker] = [];
    tickerBuys[b.ticker].push(b);
  });
  sells.forEach((s) => {
    const matchingBuys = tickerBuys[s.ticker] || [];
    if (matchingBuys.length > 0) {
      const buy = matchingBuys.shift();
      const days = (s.date - buy.date) / (1000 * 60 * 60 * 24);
      holdingPeriods.push(days);
    }
  });
  const averageHoldingPeriod = holdingPeriods.length > 0
    ? holdingPeriods.reduce((s, d) => s + d, 0) / holdingPeriods.length
    : 0;

  const sectorMap = {};
  transactions.forEach((t) => {
    const sector = t.sector || 'Unknown';
    sectorMap[sector] = (sectorMap[sector] || 0) + 1;
  });
  const preferredSectors = Object.entries(sectorMap)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);

  const tickerMap = {};
  transactions.forEach((t) => {
    tickerMap[t.ticker] = (tickerMap[t.ticker] || 0) + 1;
  });
  const preferredTickers = Object.entries(tickerMap)
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const marketConditionBias = { bull: 0, bear: 0, sideways: 0, volatile: 0, unknown: 0 };
  transactions.forEach((t) => {
    marketConditionBias[t.marketCondition || 'unknown'] += 1;
  });

  const sentimentBias = { positive: 0, neutral: 0, negative: 0 };
  transactions.forEach((t) => {
    sentimentBias[t.sentiment || 'neutral'] += 1;
  });

  const positionSizes = transactions.map((t) => t.totalValue || t.quantity * t.price).filter((v) => v > 0);
  const averagePositionSize = positionSizes.length > 0
    ? positionSizes.reduce((s, v) => s + v, 0) / positionSizes.length
    : 0;

  const dateRange = transactions.length > 1
    ? (transactions[transactions.length - 1].date - transactions[0].date) / (1000 * 60 * 60 * 24)
    : 0;

  const realizedPnls = sells.filter((s) => s.realizedPnl !== undefined && s.realizedPnl !== null);
  const wins = realizedPnls.filter((s) => s.realizedPnl > 0);
  const losses = realizedPnls.filter((s) => s.realizedPnl < 0);
  const winRate = realizedPnls.length > 0 ? (wins.length / realizedPnls.length) * 100 : 0;
  const averageWin = wins.length > 0 ? wins.reduce((s, t) => s + t.realizedPnl, 0) / wins.length : 0;
  const averageLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.realizedPnl, 0) / losses.length) : 0;
  const profitFactor = averageLoss > 0 ? (averageWin * wins.length) / (averageLoss * losses.length) : 0;

  const analysis = {
    buySellRatio,
    averageHoldingPeriod,
    preferredSectors,
    preferredTickers,
    marketConditionBias,
    sentimentBias,
    averagePositionSize,
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
  };

  const behaviorType = classifyBehaviorType(analysis);
  const tradingFrequency = classifyTradingFrequency(transactions.length, dateRange);
  const behavioralScores = calculateBehavioralScores(transactions, analysis);

  const user = require('../models/User');
  const userDoc = await user.findById(userId);
  const riskProfile = classifyRiskProfile(analysis, userDoc);

  const profileData = {
    user: userId,
    behaviorType,
    riskProfile,
    averageHoldingPeriod,
    averageHoldingPeriodLabel: classifyHoldingPeriod(averageHoldingPeriod),
    tradingFrequency,
    preferredSectors,
    preferredTickers,
    marketConditionBias,
    sentimentBias,
    buySellRatio,
    averagePositionSize,
    totalTransactions: transactions.length,
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
    behavioralScores,
    lastAnalyzedAt: new Date(),
    analysisVersion: '1.0',
  };

  const profile = await UserBehaviorProfile.findOneAndUpdate(
    { user: userId },
    profileData,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return profile;
};

module.exports = { analyzeBehavior, classifyHoldingPeriod, classifyBehaviorType, classifyRiskProfile };
