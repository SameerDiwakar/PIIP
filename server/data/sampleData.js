const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const SAMPLE_TRANSACTIONS = [
  { ticker: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors', type: 'buy', quantity: 15, price: 450, totalValue: 6750, date: daysAgo(320), notes: 'Strong AI momentum, riding the data center wave', marketCondition: 'bull', sentiment: 'positive', tags: ['momentum', 'AI'] },
  { ticker: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors', type: 'buy', quantity: 10, price: 520, date: daysAgo(280), notes: 'Adding on dip after earnings beat', marketCondition: 'volatile', sentiment: 'positive' },
  { ticker: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', type: 'buy', quantity: 25, price: 175, date: daysAgo(300), notes: 'Core long-term holding, services growth story', marketCondition: 'sideways', sentiment: 'positive', tags: ['core'] },
  { ticker: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', type: 'buy', quantity: 10, price: 185, date: daysAgo(200), notes: 'Accumulating on weakness before product launch', marketCondition: 'bear', sentiment: 'positive' },
  { ticker: 'TSLA', companyName: 'Tesla Inc.', sector: 'Technology', industry: 'Automotive', type: 'buy', quantity: 20, price: 220, date: daysAgo(250), notes: 'EV leader, high conviction momentum play', marketCondition: 'bull', sentiment: 'positive', tags: ['momentum'] },
  { ticker: 'TSLA', companyName: 'Tesla Inc.', sector: 'Technology', industry: 'Automotive', type: 'sell', quantity: 10, price: 280, date: daysAgo(180), notes: 'Taking partial profits after 27% gain', marketCondition: 'bull', sentiment: 'positive', realizedPnl: 600 },
  { ticker: 'AMD', companyName: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors', type: 'buy', quantity: 30, price: 120, date: daysAgo(220), notes: 'Semiconductor rotation play, cheaper than NVDA', marketCondition: 'bull', sentiment: 'positive' },
  { ticker: 'AMD', companyName: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors', type: 'sell', quantity: 15, price: 105, date: daysAgo(150), notes: 'Cut loss early — should have waited for earnings', marketCondition: 'bear', sentiment: 'negative', realizedPnl: -225 },
  { ticker: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Technology', industry: 'Software', type: 'buy', quantity: 20, price: 380, date: daysAgo(270), notes: 'Azure cloud growth, stable compounder', marketCondition: 'bull', sentiment: 'positive', tags: ['core'] },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.', sector: 'Technology', industry: 'Internet', type: 'buy', quantity: 15, price: 140, date: daysAgo(240), notes: 'Search moat + AI investments undervalued', marketCondition: 'sideways', sentiment: 'positive' },
  { ticker: 'META', companyName: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media', type: 'buy', quantity: 12, price: 320, date: daysAgo(190), notes: 'Efficiency year paying off, ad revenue strong', marketCondition: 'bull', sentiment: 'positive' },
  { ticker: 'META', companyName: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media', type: 'sell', quantity: 6, price: 480, date: daysAgo(90), notes: 'Great trade — sold half at 50% gain', marketCondition: 'bull', sentiment: 'positive', realizedPnl: 960 },
  { ticker: 'JPM', companyName: 'JPMorgan Chase & Co.', sector: 'Finance', industry: 'Banking', type: 'buy', quantity: 10, price: 155, date: daysAgo(210), notes: 'Diversifying into finance, rate environment favorable', marketCondition: 'bull', sentiment: 'neutral', tags: ['diversification'] },
  { ticker: 'V', companyName: 'Visa Inc.', sector: 'Finance', industry: 'Payments', type: 'buy', quantity: 8, price: 260, date: daysAgo(170), notes: 'Payments network moat, low volatility anchor', marketCondition: 'sideways', sentiment: 'positive' },
  { ticker: 'UNH', companyName: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Managed Care', type: 'buy', quantity: 5, price: 520, date: daysAgo(160), notes: 'Healthcare exposure for diversification', marketCondition: 'sideways', sentiment: 'neutral' },
  { ticker: 'XOM', companyName: 'Exxon Mobil Corp.', sector: 'Energy', industry: 'Oil & Gas', type: 'buy', quantity: 20, price: 105, date: daysAgo(140), notes: 'Energy hedge against tech concentration', marketCondition: 'volatile', sentiment: 'neutral' },
  { ticker: 'XOM', companyName: 'Exxon Mobil Corp.', sector: 'Energy', industry: 'Oil & Gas', type: 'sell', quantity: 20, price: 115, date: daysAgo(60), notes: 'Quick flip on oil spike — not my usual style', marketCondition: 'volatile', sentiment: 'positive', realizedPnl: 200 },
  { ticker: 'PLTR', companyName: 'Palantir Technologies', sector: 'Technology', industry: 'Software', type: 'buy', quantity: 50, price: 18, date: daysAgo(120), notes: 'Speculative AI play, small position size', marketCondition: 'bull', sentiment: 'positive', tags: ['speculative'] },
  { ticker: 'PLTR', companyName: 'Palantir Technologies', sector: 'Technology', industry: 'Software', type: 'sell', quantity: 25, price: 22, date: daysAgo(45), notes: 'Trimmed speculative position after 22% gain', marketCondition: 'bull', sentiment: 'positive', realizedPnl: 100 },
  { ticker: 'CRM', companyName: 'Salesforce Inc.', sector: 'Technology', industry: 'Software', type: 'buy', quantity: 10, price: 210, date: daysAgo(100), notes: 'SaaS leader at reasonable valuation', marketCondition: 'sideways', sentiment: 'positive' },
  { ticker: 'NFLX', companyName: 'Netflix Inc.', sector: 'Technology', industry: 'Streaming', type: 'buy', quantity: 8, price: 450, date: daysAgo(80), notes: 'Password sharing crackdown driving subs', marketCondition: 'bull', sentiment: 'positive' },
  { ticker: 'SQ', companyName: 'Block Inc.', sector: 'Finance', industry: 'Fintech', type: 'buy', quantity: 15, price: 65, date: daysAgo(70), notes: 'Fintech exposure, high risk/reward', marketCondition: 'bear', sentiment: 'negative' },
  { ticker: 'SQ', companyName: 'Block Inc.', sector: 'Finance', industry: 'Fintech', type: 'sell', quantity: 15, price: 58, date: daysAgo(30), notes: 'Stopped out — fintech too volatile for me', marketCondition: 'bear', sentiment: 'negative', realizedPnl: -105 },
  { ticker: 'SNOW', companyName: 'Snowflake Inc.', sector: 'Technology', industry: 'Cloud Computing', type: 'buy', quantity: 12, price: 155, date: daysAgo(55), notes: 'Cloud data play, watching consumption trends', marketCondition: 'sideways', sentiment: 'neutral' },
  { ticker: 'AMZN', companyName: 'Amazon.com Inc.', sector: 'Technology', industry: 'E-Commerce', type: 'buy', quantity: 10, price: 175, date: daysAgo(40), notes: 'AWS re-acceleration thesis', marketCondition: 'bull', sentiment: 'positive' },
  { ticker: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors', type: 'hold', quantity: 25, price: 880, date: daysAgo(15), notes: 'Holding core AI position through volatility', marketCondition: 'volatile', sentiment: 'positive' },
  { ticker: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', type: 'hold', quantity: 35, price: 195, date: daysAgo(10), notes: 'Long-term compounder, no plans to sell', marketCondition: 'sideways', sentiment: 'positive' },
  { ticker: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Technology', industry: 'Software', type: 'hold', quantity: 20, price: 420, date: daysAgo(8), notes: 'Steady enterprise growth, hold indefinitely', marketCondition: 'bull', sentiment: 'positive' },
];

const SAMPLE_WATCHLIST = [
  { ticker: 'AMD', companyName: 'Advanced Micro Devices', sector: 'Technology', notes: 'Waiting for pullback to re-enter after last loss', targetPrice: 110, alertPriceLow: 105, priority: 'high' },
  { ticker: 'SNOW', companyName: 'Snowflake Inc.', sector: 'Technology', notes: 'Monitoring consumption metrics before adding', targetPrice: 180, alertPriceHigh: 170, priority: 'medium' },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway', sector: 'Finance', notes: 'Value anchor for portfolio balance', targetPrice: 420, priority: 'low' },
  { ticker: 'JNJ', companyName: 'Johnson & Johnson', sector: 'Healthcare', notes: 'Defensive healthcare play for downturn', targetPrice: 165, alertPriceLow: 155, priority: 'medium' },
  { ticker: 'PG', companyName: 'Procter & Gamble Co.', sector: 'Consumer Goods', notes: 'Consumer staples diversification', targetPrice: 170, priority: 'low' },
];

const SAMPLE_MEMORIES = [
  { category: 'pattern', content: 'Tends to buy tech stocks during bull markets and add on dips', source: 'system', confidence: 0.9 },
  { category: 'success', content: 'Best results from partial profit-taking on momentum trades (META, PLTR)', source: 'system', relatedTicker: 'META', confidence: 0.85 },
  { category: 'mistake', content: 'Cut AMD position too early — patience would have recovered the loss', source: 'transaction', relatedTicker: 'AMD', confidence: 0.88 },
  { category: 'mistake', content: 'Fintech (SQ) too volatile — stick to established payment networks like V', source: 'transaction', relatedTicker: 'SQ', confidence: 0.9 },
  { category: 'preference', content: 'Prefers accumulating core positions (AAPL, MSFT, NVDA) over frequent trading', source: 'system', confidence: 0.92 },
  { category: 'pattern', content: 'Reacts quickly to earnings beats with additional buys', source: 'system', confidence: 0.8 },
  { category: 'note', content: 'Uses energy stocks (XOM) as short-term hedges, not long-term holds', source: 'transaction', relatedTicker: 'XOM', confidence: 0.85 },
];

module.exports = { SAMPLE_TRANSACTIONS, SAMPLE_WATCHLIST, SAMPLE_MEMORIES };
