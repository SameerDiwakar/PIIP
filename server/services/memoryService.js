const UserMemory = require('../models/UserMemory');
const Transaction = require('../models/Transaction');

const getMemories = async (userId, limit = 20) =>
  UserMemory.find({ user: userId }).sort({ confidence: -1, createdAt: -1 }).limit(limit);

const addMemory = async (userId, { category, content, source, relatedTicker, confidence, metadata }) =>
  UserMemory.create({ user: userId, category, content, source, relatedTicker, confidence, metadata });

const buildMemoriesFromTransactions = async (userId) => {
  const transactions = await Transaction.find({ user: userId, notes: { $exists: true, $ne: '' } })
    .sort({ date: -1 })
    .limit(15);

  const created = [];
  for (const tx of transactions) {
    const exists = await UserMemory.findOne({ user: userId, content: tx.notes, relatedTicker: tx.ticker });
    if (!exists) {
      const memory = await addMemory(userId, {
        category: tx.type === 'sell' && tx.realizedPnl < 0 ? 'mistake' : 'note',
        content: tx.notes,
        source: 'transaction',
        relatedTicker: tx.ticker,
        confidence: 0.85,
        metadata: { transactionType: tx.type, date: tx.date },
      });
      created.push(memory);
    }
  }
  return created;
};

const learnFromFeedback = async (userId, { ticker, rating, comment, recommendation }) => {
  const content = comment
    || (rating === 'helpful'
      ? `Found recommendation for ${ticker || 'general'} helpful: ${recommendation?.slice(0, 100) || ''}`
      : `Did not find recommendation for ${ticker || 'general'} helpful`);

  return addMemory(userId, {
    category: 'feedback',
    content,
    source: 'feedback',
    relatedTicker: ticker,
    confidence: rating === 'helpful' ? 0.9 : 0.7,
    metadata: { rating, recommendation },
  });
};

const formatMemoriesForPrompt = (memories) => {
  if (!memories || memories.length === 0) return '';
  return memories.map((m) => `- [${m.category}] ${m.content}${m.relatedTicker ? ` (${m.relatedTicker})` : ''}`).join('\n');
};

module.exports = { getMemories, addMemory, buildMemoriesFromTransactions, learnFromFeedback, formatMemoriesForPrompt };
