const callGeminiAPI = async ({ systemInstruction, contents, responseJson = false }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in server/.env. Please add your GEMINI_API_KEY to server/.env.');
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = Array.from(new Set([primaryModel, 'gemini-1.5-flash', 'gemini-2.0-flash']));

  let lastError = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (responseJson) {
      body.generationConfig.response_mime_type = 'application/json';
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errorBody = await res.text().catch(() => '');
        lastError = new Error(`Gemini API (${model}) Error (HTTP ${res.status}): ${errorBody || res.statusText}`);
        console.warn(`[AI Service] Model ${model} returned HTTP ${res.status}. Retrying with fallback model...`);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI Service] Model ${model} fetch failed (${err.message}). Retrying with fallback model...`);
    }
  }

  throw lastError || new Error('All Gemini API models failed');
};

const buildSystemPrompt = (user, profile, memories) => {
  let prompt = `You are PIIP AI, a personal investment intelligence assistant. You help users understand their investing behavior, trading patterns, and make disciplined financial decisions. Be concise, insightful, and data-driven. Never give licensed financial advice - always include a disclaimer when discussing specific buy/sell recommendations. Format your response cleanly using bullet points, numbered steps, and bold titles where appropriate.

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

  if (memories && memories.length > 0) {
    prompt += `

Long-term Memory (learned from past behavior):
${memories.map((m) => `- [${m.category}] ${m.content}`).join('\n')}`;
  }

  return prompt;
};

const generateSmartOfflineResponse = (message, user, profile, ticker, topic) => {
  const lower = (message || '').toLowerCase().trim();
  const userName = user?.name ? user.name.split(' ')[0] : 'investor';
  const risk = profile?.riskProfile || user?.riskTolerance || 'moderate';
  const behaviorType = profile?.behaviorType || 'balanced';

  // 1. Greetings
  if (/^(hi|hello|hey|greetings|hola|good morning|good afternoon)\b/i.test(lower)) {
    return `Hello ${userName}! I'm PIIP AI, your personal investment intelligence assistant.\n\n` +
      (profile
        ? `Your current profile is classified as **${behaviorType.toUpperCase()}** with a **${risk.toUpperCase()}** risk profile. You can ask me about your trading patterns, discipline, win rate, sector preferences, or specific stock tickers!`
        : `I'm ready to analyze your investing behavior! Log your buy/sell transactions so I can compute your holding periods, win rate, and behavioral scores.`);
  }

  // 2. Behavioral Profile & Trading Patterns
  if (lower.includes('pattern') || lower.includes('behavior') || lower.includes('profile') || lower.includes('trader type') || lower.includes('analyze')) {
    if (!profile) {
      return `I don't have enough transaction data yet to generate a full behavioral profile for you. Try logging some buy and sell transactions first so I can analyze your holding periods, win rate, and behavioral scores!`;
    }
    const scores = profile.behavioralScores || {};
    return `Here is your Personal Behavioral Breakdown:\n\n` +
      `• Investing Style: **${profile.behaviorType?.toUpperCase()}**\n` +
      `• Risk Profile: **${profile.riskProfile?.toUpperCase()}**\n` +
      `• Win Rate: **${profile.winRate?.toFixed(1) || 0}%** | Profit Factor: **${profile.profitFactor?.toFixed(2) || 0}**\n` +
      `• Average Holding Period: **${profile.averageHoldingPeriod?.toFixed(1) || 0} days** (${profile.averageHoldingPeriodLabel || 'N/A'})\n` +
      `• Buy/Sell Ratio: **${profile.buySellRatio?.toFixed(2) || 0}**\n\n` +
      `Behavioral Scores:\n` +
      `• Discipline: **${scores.discipline || 0}/100**\n` +
      `• Patience: **${scores.patience || 0}/100**\n` +
      `• Decisiveness: **${scores.decisiveness || 0}/100**\n` +
      `• Risk Management: **${scores.riskManagement || 0}/100**\n` +
      `• Consistency: **${scores.consistency || 0}/100**\n\n` +
      `Insight: ${profile.averageHoldingPeriod < 7 ? 'You favor fast execution. Keep stop-loss controls tight!' : 'Your patient approach helps mitigate market noise.'}`;
  }

  // 3. How to improve / Discipline / Low scores
  if (lower.includes('discipline') || lower.includes('score') || lower.includes('patience') || lower.includes('improve') || lower.includes('better') || lower.includes('how do i')) {
    const scores = profile?.behavioralScores || {};
    const lowAreas = [];
    if ((scores.riskManagement || 50) < 50) lowAreas.push(`1. **Enhance Risk Management** (Score: ${scores.riskManagement || 0}/100): Set strict stop-loss orders and avoid over-allocating on single positions.`);
    if ((scores.decisiveness || 50) < 50) lowAreas.push(`2. **Improve Decisiveness** (Score: ${scores.decisiveness || 0}/100): Avoid hesitation when profit targets or stop-loss points are reached.`);
    if ((scores.patience || 50) < 50) lowAreas.push(`3. **Increase Patience** (Score: ${scores.patience || 0}/100): Allow high-conviction trades sufficient time to play out rather than over-trading.`);
    if ((scores.discipline || 50) < 50) lowAreas.push(`4. **Build Discipline** (Score: ${scores.discipline || 0}/100): Standardize your trade size across all positions.`);

    if (lowAreas.length > 0) {
      return `To improve your investing behavior, focus on strengthening your key growth areas:\n\n` + lowAreas.join('\n\n');
    }

    return `To improve your investing performance:\n\n` +
      `1. **Standardize Position Sizing:** Avoid over-allocating on single momentum plays.\n\n` +
      `2. **Define Exit Rules:** Set clear target prices and stop-losses before submitting orders.\n\n` +
      `3. **Track Emotional Context:** Record trade reasons in your Reflection journal.`;
  }

  // 4. Platform Info
  if (lower.includes('piip') || lower.includes('platform') || lower.includes('how does')) {
    return `PIIP (Personal Investment Intelligence Platform) helps you decode your trading psychology.\n\n` +
      `• Behavioral Profiling: Classifies your style as Momentum, Value, Growth, or Contrarian.\n` +
      `• 5 Core Scores: Measures Discipline, Patience, Decisiveness, Risk Management, and Consistency.\n` +
      `• Performance Tracking: Analyzes win rates and profit factors.\n` +
      `• Smart Recommendations: Suggests stocks matching your risk profile.`;
  }

  // 5. General fallback
  return `Based on your **${behaviorType.toUpperCase()}** profile and **${risk.toUpperCase()}** risk tolerance:\n\n` +
    `I am PIIP AI, analyzing your investment behavior. ` +
    (profile
      ? `Your win rate is **${profile.winRate?.toFixed(1)}%** with an average holding period of **${profile.averageHoldingPeriod?.toFixed(1)} days**.`
      : `Add transactions to unlock personalized behavioral metrics.`) +
    `\n\nDisclaimer: Educational insights, not financial advice.`;
};

const generateAIResponse = async ({ message, user, profile, recentHistory, ticker, topic, memories }) => {
  if (!process.env.GEMINI_API_KEY) {
    return {
      content: generateSmartOfflineResponse(message, user, profile, ticker, topic),
      tokensUsed: 0,
      offline: true,
    };
  }

  try {
    const systemInstruction = buildSystemPrompt(user, profile, memories);
    const contents = [];

    if (recentHistory && recentHistory.length > 0) {
      [...recentHistory].reverse().forEach((h) => {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      });
    }

    let userMessage = message;
    if (ticker) userMessage += `\n\n(Context: User is asking about ${ticker})`;
    if (topic) userMessage += `\n\n(Topic: ${topic})`;

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const text = await callGeminiAPI({
      systemInstruction,
      contents,
    });

    return {
      content: text,
      tokensUsed: 0,
      provider: 'gemini',
    };
  } catch (err) {
    console.warn('[AI Service] Gemini API error (falling back to smart response):', err.message);
    return {
      content: generateSmartOfflineResponse(message, user, profile, ticker, topic),
      tokensUsed: 0,
      offline: true,
      error: err.message,
    };
  }
};

const generateInsights = async (user, profile) => {
  if (!process.env.GEMINI_API_KEY) {
    return generateOfflineInsights(profile);
  }

  const systemInstruction = `You are PIIP AI. Generate 3-5 concise, actionable behavioral insights based on the user's investment profile. Each insight should be one sentence. Focus on patterns, strengths, weaknesses, and specific recommendations. Return as a JSON object with key "insights" containing an array of strings. Example: {"insights": ["Insight 1", "Insight 2"]}`;

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
    const text = await callGeminiAPI({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      responseJson: true,
    });

    const parsed = JSON.parse(text);
    return parsed.insights || [text];
  } catch (err) {
    console.error('[AI Insights] Gemini error:', err.message);
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

module.exports = { generateAIResponse, generateInsights, buildSystemPrompt, callGeminiAPI };
