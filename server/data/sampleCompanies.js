const SAMPLE_COMPANIES = [
  { ticker: 'AAPL', companyName: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', marketCap: 'large', style: 'growth', description: 'Leading consumer tech with strong ecosystem and services revenue.' },
  { ticker: 'MSFT', companyName: 'Microsoft Corp.', sector: 'Technology', industry: 'Software', marketCap: 'large', style: 'growth', description: 'Cloud and enterprise software leader with recurring revenue.' },
  { ticker: 'NVDA', companyName: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors', marketCap: 'large', style: 'momentum', description: 'AI and GPU leader with high growth and volatility.' },
  { ticker: 'GOOGL', companyName: 'Alphabet Inc.', sector: 'Technology', industry: 'Internet', marketCap: 'large', style: 'growth', description: 'Search, cloud, and AI platform with diversified revenue.' },
  { ticker: 'AMZN', companyName: 'Amazon.com Inc.', sector: 'Technology', industry: 'E-Commerce', marketCap: 'large', style: 'growth', description: 'E-commerce and AWS cloud infrastructure giant.' },
  { ticker: 'META', companyName: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media', marketCap: 'large', style: 'momentum', description: 'Social media and metaverse investments with ad-driven revenue.' },
  { ticker: 'TSLA', companyName: 'Tesla Inc.', sector: 'Technology', industry: 'Automotive', marketCap: 'large', style: 'momentum', description: 'EV and energy company with high volatility and growth narrative.' },
  { ticker: 'AMD', companyName: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors', marketCap: 'large', style: 'momentum', description: 'CPU/GPU competitor benefiting from AI and data center demand.' },
  { ticker: 'JPM', companyName: 'JPMorgan Chase & Co.', sector: 'Finance', industry: 'Banking', marketCap: 'large', style: 'value', description: 'Leading US bank with diversified financial services.' },
  { ticker: 'V', companyName: 'Visa Inc.', sector: 'Finance', industry: 'Payments', marketCap: 'large', style: 'value', description: 'Global payments network with strong margins and moat.' },
  { ticker: 'JNJ', companyName: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Pharmaceuticals', marketCap: 'large', style: 'value', description: 'Diversified healthcare with stable dividends.' },
  { ticker: 'UNH', companyName: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Managed Care', marketCap: 'large', style: 'growth', description: 'Largest US health insurer with scale advantages.' },
  { ticker: 'XOM', companyName: 'Exxon Mobil Corp.', sector: 'Energy', industry: 'Oil & Gas', marketCap: 'large', style: 'value', description: 'Integrated energy major with commodity exposure.' },
  { ticker: 'PG', companyName: 'Procter & Gamble Co.', sector: 'Consumer Goods', industry: 'Household Products', marketCap: 'large', style: 'value', description: 'Defensive consumer staples with global brands.' },
  { ticker: 'CRM', companyName: 'Salesforce Inc.', sector: 'Technology', industry: 'Software', marketCap: 'large', style: 'growth', description: 'CRM cloud leader with enterprise SaaS model.' },
  { ticker: 'PLTR', companyName: 'Palantir Technologies', sector: 'Technology', industry: 'Software', marketCap: 'mid', style: 'momentum', description: 'AI/data analytics platform with government and commercial clients.' },
  { ticker: 'SNOW', companyName: 'Snowflake Inc.', sector: 'Technology', industry: 'Cloud Computing', marketCap: 'mid', style: 'growth', description: 'Cloud data warehouse with consumption-based pricing.' },
  { ticker: 'SQ', companyName: 'Block Inc.', sector: 'Finance', industry: 'Fintech', marketCap: 'mid', style: 'momentum', description: 'Payments and Cash App fintech with crypto exposure.' },
  { ticker: 'NFLX', companyName: 'Netflix Inc.', sector: 'Technology', industry: 'Streaming', marketCap: 'large', style: 'growth', description: 'Global streaming leader with content moat.' },
  { ticker: 'BRK.B', companyName: 'Berkshire Hathaway', sector: 'Finance', industry: 'Conglomerate', marketCap: 'large', style: 'value', description: 'Buffett-led conglomerate with diversified holdings.' },
];

const findCompany = (ticker) => SAMPLE_COMPANIES.find((c) => c.ticker === ticker.toUpperCase());

const getCompaniesBySector = (sector) =>
  SAMPLE_COMPANIES.filter((c) => c.sector.toLowerCase() === sector.toLowerCase());

const getCompaniesByStyle = (style) =>
  SAMPLE_COMPANIES.filter((c) => c.style === style);

module.exports = { SAMPLE_COMPANIES, findCompany, getCompaniesBySector, getCompaniesByStyle };
