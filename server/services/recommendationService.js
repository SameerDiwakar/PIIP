const { SAMPLE_COMPANIES, findCompany } = require('../data/sampleCompanies');
const { formatMemoriesForPrompt } = require('./memoryService');
const { callGeminiAPI } = require('./aiService');

const scoreCompanyFit = (company, profile, user) => {
  let score = 50;
  const preferredSectors = profile?.preferredSectors?.map((s) => s.sector.toLowerCase()) || [];
  const userSectors = user?.preferredSectors?.map((s) => s.toLowerCase()) || [];

  if (preferredSectors.includes(company.sector.toLowerCase()) || userSectors.includes(company.sector.toLowerCase())) {
    score += 25;
  }

  if (profile?.behaviorType === company.style) score += 20;
  if (profile?.behaviorType === 'momentum' && company.style === 'momentum') score += 15;
  if (profile?.behaviorType === 'value' && company.style === 'value') score += 15;
  if (profile?.behaviorType === 'growth' && company.style === 'growth') score += 15;

  const tradedTickers = profile?.preferredTickers?.map((t) => t.ticker) || [];
  if (tradedTickers.includes(company.ticker)) score -= 30;

  if (profile?.riskProfile === 'aggressive' && company.style === 'momentum') score += 10;
  if (profile?.riskProfile === 'conservative' && company.style === 'value') score += 10;

  return Math.min(100, Math.max(0, score));
};

const findSimilarCompanies = (profile, user, limit = 6) => {
  const scored = SAMPLE_COMPANIES.map((company) => ({
    ...company,
    fitScore: scoreCompanyFit(company, profile, user),
    reason: buildFitReason(company, profile, user),
  }));

  return scored
    .filter((c) => c.fitScore >= 55)
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, limit);
};

const buildFitReason = (company, profile, user) => {
  const reasons = [];
  const topSector = profile?.preferredSectors?.[0]?.sector;
  if (topSector && company.sector === topSector) reasons.push(`matches your preferred ${topSector} sector`);
  if (profile?.behaviorType === company.style) reasons.push(`aligns with your ${profile.behaviorType} investing style`);
  if (user?.preferredSectors?.includes(company.sector)) reasons.push('in your stated sector preferences');
  if (reasons.length === 0) reasons.push('diversifies your portfolio');
  return reasons.join(', ');
};

const evaluateOffline = (company, profile, user, memories) => {
  const fitScore = scoreCompanyFit(company, profile, user);
  let action = 'Hold';
  if (fitScore >= 75) action = 'Consider Buy';
  else if (fitScore < 40) action = 'Pass';

  const reasoning = [
    `${company.companyName} (${company.ticker}) is a ${company.marketCap}-cap ${company.sector} stock with a ${company.style} profile.`,
    `Fit score: ${fitScore}/100 based on your ${profile?.behaviorType || 'balanced'} style and ${profile?.riskProfile || user?.riskTolerance || 'moderate'} risk tolerance.`,
    buildFitReason(company, profile, user) + '.',
  ];

  if (memories?.length) {
    reasoning.push(`Your past notes suggest: "${memories[0].content.slice(0, 120)}..."`);
  }

  reasoning.push('Disclaimer: This is educational analysis based on your behavioral profile, not financial advice.');

  return {
    ticker: company.ticker,
    companyName: company.companyName,
    action,
    fitScore,
    reasoning: reasoning.join(' '),
    keyFactors: [
      { factor: 'Sector Fit', score: preferredSectorScore(company, profile, user) },
      { factor: 'Style Match', score: profile?.behaviorType === company.style ? 90 : 50 },
      { factor: 'Risk Alignment', score: riskAlignmentScore(company, profile, user) },
    ],
    offline: true,
  };
};

const preferredSectorScore = (company, profile, user) => {
  const sectors = [...(profile?.preferredSectors?.map((s) => s.sector) || []), ...(user?.preferredSectors || [])];
  return sectors.some((s) => s.toLowerCase() === company.sector.toLowerCase()) ? 90 : 40;
};

const riskAlignmentScore = (company, profile, user) => {
  const risk = profile?.riskProfile || user?.riskTolerance || 'moderate';
  if (risk === 'aggressive' && company.style === 'momentum') return 85;
  if (risk === 'conservative' && company.style === 'value') return 85;
  if (risk === 'moderate') return 70;
  return 50;
};

const evaluateOpportunity = async ({ ticker, companyName, user, profile, memories }) => {
  let company = findCompany(ticker);
  if (!company) {
    company = {
      ticker: ticker.toUpperCase(),
      companyName: companyName || ticker.toUpperCase(),
      sector: 'Unknown',
      industry: 'Unknown',
      marketCap: 'unknown',
      style: 'balanced',
      description: 'Company not in sample catalog — analysis based on your profile only.',
    };
  }

  if (!process.env.GEMINI_API_KEY) return evaluateOffline(company, profile, user, memories);

  const memoryText = formatMemoriesForPrompt(memories);
  const systemInstruction = `You are PIIP AI, a personal investment intelligence assistant. Evaluate investment opportunities based on the user's unique behavioral profile and memory. Return JSON with: action (Consider Buy | Hold | Pass), fitScore (0-100), reasoning (2-3 sentences), keyFactors (array of {factor, score}). Never give licensed financial advice — include educational disclaimer in reasoning.`;

  const userPrompt = `Evaluate ${company.companyName} (${company.ticker}):
Company: ${JSON.stringify(company)}
User: ${user.name}, Risk: ${user.riskTolerance}, Goals: ${user.investmentGoals?.join(', ') || 'N/A'}
Behavior Profile: ${JSON.stringify({
    behaviorType: profile?.behaviorType,
    riskProfile: profile?.riskProfile,
    averageHoldingPeriod: profile?.averageHoldingPeriod,
    tradingFrequency: profile?.tradingFrequency,
    preferredSectors: profile?.preferredSectors,
    winRate: profile?.winRate,
    behavioralScores: profile?.behavioralScores,
  })}
User Memory:
${memoryText || 'No memories yet.'}`;

  try {
    const text = await callGeminiAPI({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      responseJson: true,
    });

    const parsed = JSON.parse(text);
    return {
      ticker: company.ticker,
      companyName: company.companyName,
      action: parsed.action || 'Hold',
      fitScore: parsed.fitScore || scoreCompanyFit(company, profile, user),
      reasoning: parsed.reasoning || '',
      keyFactors: parsed.keyFactors || [],
      provider: 'gemini',
    };
  } catch (err) {
    console.error('[Evaluate Opportunity] Gemini error:', err.message);
    return evaluateOffline(company, profile, user, memories);
  }
};

module.exports = { findSimilarCompanies, evaluateOpportunity, scoreCompanyFit };
