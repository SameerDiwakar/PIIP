import { useEffect, useState } from 'react';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, Activity, Brain, ArrowRight, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      const [analyticsRes, portfolioRes, insightsRes] = await Promise.all([
        API.get('/analytics').catch(() => ({ data: null })),
        API.get('/portfolio').catch(() => ({ data: null })),
        API.post('/ai/insights').catch(() => ({ data: { insights: [] } })),
      ]);
      setStats(analyticsRes.data);
      setPortfolio(portfolioRes.data);
      setInsights(insightsRes.data?.insights || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLoadSampleData = async () => {
    if (!confirm('Load sample investment data? This will replace your existing transactions.')) return;
    setSeeding(true);
    try {
      await API.post('/seed/demo');
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to load sample data');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading your dashboard...</div>;

  const summary = stats?.summary || { totalTransactions: 0, totalInvested: 0, uniqueTickers: 0, uniqueSectors: 0 };
  const totalValue = portfolio?.totalValue || 0;
  const totalCost = portfolio?.totalCost || 0;
  const pnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  const statCards = [
    { label: 'Portfolio Value', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'primary' },
    { label: 'Total P&L', value: `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`, icon: pnl >= 0 ? TrendingUp : TrendingDown, color: pnl >= 0 ? 'success' : 'error' },
    { label: 'Transactions', value: summary.totalTransactions, icon: Activity, color: 'accent' },
    { label: 'Active Positions', value: portfolio?.totalPositions || 0, icon: TrendingUp, color: 'primary' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
        <p className="text-slate-500 mt-1">Here's your investment overview</p>
      </div>

      {summary.totalTransactions === 0 && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-primary-200 bg-primary-50/50">
          <div>
            <h3 className="font-semibold text-slate-900">Get started with sample data</h3>
            <p className="text-sm text-slate-600 mt-1">Load 27 sample transactions, watchlist items, and behavioral memories to explore all features.</p>
          </div>
          <button onClick={handleLoadSampleData} disabled={seeding} className="btn-primary shrink-0">
            <Database className="w-4 h-4" /> {seeding ? 'Loading...' : 'Load Sample Data'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${card.color}-100 text-${card.color}-600`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="text-sm text-slate-500 mt-1">{card.label}</div>
              {card.sub && <div className={`text-sm font-medium mt-1 ${pnl >= 0 ? 'text-success-600' : 'text-error-600'}`}>{card.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">AI Insights</h2>
            <Link to="/ai-chat" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Chat <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {insights.length > 0 ? (
            <ul className="space-y-3">
              {insights.slice(0, 4).map((insight, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Add transactions to unlock AI-powered behavioral insights.</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Sector Allocation</h2>
            <Link to="/portfolio" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {portfolio?.sectorAllocation?.length > 0 ? (
            <div className="space-y-3">
              {portfolio.sectorAllocation.slice(0, 5).map((s) => (
                <div key={s.sector}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{s.sector}</span>
                    <span className="text-slate-500">{((s.value / totalValue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${(s.value / totalValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No portfolio data yet. Add transactions to see allocation.</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Behavior Analysis</h2>
            <p className="text-sm text-slate-500">Understand your investing patterns</p>
          </div>
        </div>
        <Link to="/behavior" className="btn-secondary w-full sm:w-auto">
          View My Behavior Profile <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
