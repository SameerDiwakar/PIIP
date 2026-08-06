require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Watchlist = require('../models/Watchlist');
const UserMemory = require('../models/UserMemory');
const ChatHistory = require('../models/ChatHistory');
const UserBehaviorProfile = require('../models/UserBehaviorProfile');
const { SAMPLE_TRANSACTIONS, SAMPLE_WATCHLIST, SAMPLE_MEMORIES } = require('../data/sampleData');
const { analyzeBehavior } = require('../services/behaviorAnalyzer');

const seedForUser = async (userId, clearExisting = false) => {
  if (clearExisting) {
    await Promise.all([
      Transaction.deleteMany({ user: userId }),
      Watchlist.deleteMany({ user: userId }),
      UserMemory.deleteMany({ user: userId }),
      ChatHistory.deleteMany({ user: userId }),
      UserBehaviorProfile.deleteMany({ user: userId }),
    ]);
  }

  const existingTx = await Transaction.countDocuments({ user: userId });
  if (existingTx > 0 && !clearExisting) {
    return { skipped: true, message: 'User already has data. Use clearExisting to replace.' };
  }

  const transactions = await Transaction.insertMany(
    SAMPLE_TRANSACTIONS.map((t) => ({
      ...t,
      user: userId,
      totalValue: t.totalValue ?? t.quantity * t.price,
    }))
  );

  const watchlist = await Watchlist.insertMany(
    SAMPLE_WATCHLIST.map((w) => ({ ...w, user: userId }))
  );

  const memories = await UserMemory.insertMany(
    SAMPLE_MEMORIES.map((m) => ({ ...m, user: userId }))
  );

  const profile = await analyzeBehavior(userId);

  return {
    transactions: transactions.length,
    watchlist: watchlist.length,
    memories: memories.length,
    profile: profile.behaviorType,
  };
};

const seedDemoUser = async () => {
  const demoEmail = 'demo@piip.com';
  let user = await User.findOne({ email: demoEmail });

  if (!user) {
    user = await User.create({
      name: 'Demo Investor',
      email: demoEmail,
      password: 'demo1234',
      riskTolerance: 'moderate',
      investmentGoals: ['Long-term growth', 'Diversification'],
      preferredSectors: ['Technology', 'Finance', 'Healthcare'],
      initialCapital: 50000,
      currency: 'USD',
      onboardingComplete: true,
    });
  } else {
    user.riskTolerance = 'moderate';
    user.investmentGoals = ['Long-term growth', 'Diversification'];
    user.preferredSectors = ['Technology', 'Finance', 'Healthcare'];
    user.onboardingComplete = true;
    await user.save();
  }

  const result = await seedForUser(user._id, true);
  return { user: { email: user.email, name: user.name }, ...result };
};

module.exports = { seedForUser, seedDemoUser };
