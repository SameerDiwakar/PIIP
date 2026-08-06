const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { validate } = require('../middleware/validate');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const requireAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Not authorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authorized' });
  }
};

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const user = await User.create({ name, email, password });
      const token = signToken(user._id);
      res.status(201).json({ token, user });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const token = signToken(user._id);
      res.json({ token, user });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/onboarding', requireAuth, async (req, res) => {
  try {
    const { riskTolerance, investmentGoals, preferredSectors, initialCapital, currency } = req.body;
    if (riskTolerance) req.user.riskTolerance = riskTolerance;
    if (investmentGoals) req.user.investmentGoals = investmentGoals;
    if (preferredSectors) req.user.preferredSectors = preferredSectors;
    if (initialCapital !== undefined) req.user.initialCapital = initialCapital;
    if (currency) req.user.currency = currency;
    req.user.onboardingComplete = true;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Onboarding update failed' });
  }
});

module.exports = router;
