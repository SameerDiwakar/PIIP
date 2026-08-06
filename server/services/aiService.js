const OpenAI = require('openai');

const getClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const buildSystemPrompt = (user, profile) => {
  let prompt = `You are PIIP AI, a personal investment intelligence assistant. You help users understand their investing behavior and make better decisions. Be concise, insightful, and data-driven. Never give licensed financial advice - always include a disclaimer when discussing specific buy/sell recommendations.

User Profile:
- Name: ${user.name}
- Risk Tolerance: ${user.riskTolerance}
- Investment Goals: ${user.investmentGoals?.join(', ') || 'Not specified'}
- Preferred Sectors: ${user.preferredSectors?.join(', ') || 'Not specified'}`;

  if (profile) {
    prompt += `

Behavioral Analysis:
- Behavior Type: ${profile.behaviorType}
- Risk Profile: ${profile.riskProfile}
- Average Holding Period: ${profile.averageHoldingPeriod?.toFixed(1) || 0} days (${profile.averageHoldingPeriodLabel})
- Trading Frequency: ${profile.tradingFrequency}
- Buy/Sell Ratio: ${profile.buySellRatio?.toFixed(2) || 0}
- Win Rate: ${profile.winRate?.toFixed(1) || 0}%
- Profit Factor: ${profile.profitFactor?.toFixed(2) || 0}
- Preferred Sectors: ${profile.preferredSectors?.map((s) => s.sector).join(', ') || 'None'}
- Behavioral Scores:
  - Discipline: ${profile.behavioralScores?.discipline || 0}/100
  - Patience: ${profile.behavioralScores?.patience || 0}/100
  - Decisiveness: ${profile.behavioralScores?.decisiveness || 0}/100
  - Risk Management: ${profile.behavioralScores?.riskManagement || 0}/100
  - Consistency: ${profile.behavioralScores?.consistency || 0}/100`;
  }

  return prompt;
};

const generateAIResponse = async ({ message, user, profile, recentHistory, ticker, topic }) => {
  const client = getClient();
  if (!client) {
    return {
      content: `I'm currently running in offline mode (no OpenAI API key configured). Based on your ${profile ? profile.behaviorType : 'unclassified'} investing profile, here's a general tip: Track your transactions consistently to unlock deeper behavioral insights. ${ticker ? `For ${ticker}, consider your historical patterns and risk tolerance before acting.` : ''} (Disclaimer: This is educational content, not financial advice.)`,
      tokensUsed: 0,
      offline: true,
    };
  }

  const systemPrompt = buildSystemPrompt(user, profile);
  const messages = [{ role: 'system', content: systemPrompt }];

  if (recentHistory && recentHistory.length > 0) {
    [...recentHistory].reverse().forEach((h) => {
      messages.push({ role: h.role, content: h.content });
    });
  }

  let userMessage = message;
  if (ticker) userMessage += `\n\n(Context: User is asking about ${ticker})`;
  if (topic) userMessage += `\n\n(Topic: ${topic})`;
  messages.push({ role: 'user', content: userMessage });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  return {
    content: response.choices[0].message.content,
    tokensUsed: response.usage?.total_tokens || 0,
  };
};

const generateInsights = async (user, profile) => {
  const client = getClient();
  if (!client) {
    return generateOfflineInsights(profile);
  }

  const systemPrompt = `You are PIIP AI. Generate 3-5 concise, actionable behavioral insights based on the user's investment profile. Each insight should be one sentence. Focus on patterns, strengths, weaknesses, and specific recommendations. Return as a JSON array of strings.`;

  const userPrompt = `User: ${user.name}, Risk: ${user.riskTolerance}
Profile: ${JSON.stringify({
    behaviorType: profile.behaviorType,
    riskProfile: profile.riskProfile,
    averageHoldingPeriod: profile.averageHoldingPeriod,
    tradingFrequency: profile.tradingFrequency,
    buySellRatio: profile.buySellRatio,
    winRate: profile.winRate,
    profitFactor: profile.profitFactor,
    preferredSectors: profile.preferredSectors,
    behavioralScores: profile.behavioralScores,
  })}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed.insights || [response.choices[0].message.content];
  } catch (err) {
    return generateOfflineInsights(profile);
  }
};

const generateOfflineInsights = (profile) => {
  const insights = [];
  if (profile.averageHoldingPeriod < 7) {
    insights.push(`Your average holding period of ${profile.averageHoldingPeriod?.toFixed(1)} days suggests a short-term trading style - consider whether this aligns with your long-term goals.`);
  } else if (profile.averageHoldingPeriod > 90) {
    insights.push(`Your ${profile.averageHoldingPeriod?.toFixed(0)}-day average holding period shows patience - a trait correlated with better long-term outcomes.`);
  }
  if (profile.buySellRatio > 2) {
    insights.push(`Your buy/sell ratio of ${profile.buySellRatio?.toFixed(2)} indicates accumulation bias - make sure you have clear exit criteria for positions.`);
  }
  if (profile.winRate < 50 && profile.winRate > 0) {
    insights.push(`Your win rate of ${profile.winRate?.toFixed(1)}% is below 50% - focus on cutting losses early and letting winners run.`);
  }
  if (profile.behavioralScores?.discipline < 50) {
    insights.push(`Your discipline score of ${profile.behavioralScores?.discipline}/100 suggests inconsistent position sizing - consider standardizing your trade sizes.`);
  }
  if (profile.behavioralScores?.patience > 70) {
    insights.push(`Your patience score of ${profile.behavioralScores?.patience}/100 is excellent - this is a key trait of successful long-term investors.`);
  }
  if (insights.length === 0) {
    insights.push('Add more transactions to unlock deeper behavioral insights and personalized recommendations.');
  }
  return insights;
};

module.exports = { generateAIResponse, generateInsights, buildSystemPrompt };
