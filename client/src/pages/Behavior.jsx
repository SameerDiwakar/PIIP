import { useEffect, useState } from 'react';
import API from '../api';
import { Brain, RefreshCw, TrendingUp, Clock, Activity, Target, Shield, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const Behavior = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/ai/profile');
      setProfile(res.data.profile);
      setMessage(res.data.message || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await API.post('/ai/analyze');
      setProfile(res.data);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="animate-pulse text-slate-400">Loading behavior profile...</div>;

  if (!profile && message) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Behavior Analysis</h1>
          <p className="text-slate-500 mt-1">Understand your investing patterns</p>
        </div>
        <div className="card p-12 text-center">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{message}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const behaviorTypeColors = {
    momentum: 'bg-primary-100 text-primary-700',
    value: 'bg-success-100 text-success-700',
    growth: 'bg-accent-100 text-accent-700',
    contrarian: 'bg-error-100 text-error-700',
    balanced: 'bg-slate-100 text-slate-700',
    unclassified: 'bg-slate-100 text-slate-500',
  };

  const riskColors = {
    conservative: 'bg-success-100 text-success-700',
    moderate: 'bg-accent-100 text-accent-700',
    aggressive: 'bg-error-100 text-error-700',
    unknown: 'bg-slate-100 text-slate-500',
  };

  const scoreData = [
    { metric: 'Discipline', score: profile.behavioralScores?.discipline || 0 },
    { metric: 'Patience', score: profile.behavioralScores?.patience || 0 },
    { metric: 'Decisiveness', score: profile.behavioralScores?.decisiveness || 0 },
    { metric: 'Risk Mgmt', score: profile.behavioralScores?.riskManagement || 0 },
    { metric: 'Consistency', score: profile.behavioralScores?.consistency || 0 },
  ];

  const sectorData = (profile.preferredSectors || []).slice(0, 6).map((s) => ({ sector: s.sector, count: s.count }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Behavior Analysis</h1>
          <p className="text-slate-500 mt-1">Last analyzed: {new Date(profile.lastAnalyzedAt).toLocaleString()}</p>
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary">
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} /> {analyzing ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm"><Brain className="w-4 h-4" /> Behavior Type</div>
          <span className={`badge text-sm ${behaviorTypeColors[profile.behaviorType]}`}>{profile.behaviorType}</span>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm"><Shield className="w-4 h-4" /> Risk Profile</div>
          <span className={`badge text-sm ${riskColors[profile.riskProfile]}`}>{profile.riskProfile}</span>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm"><Clock className="w-4 h-4" /> Avg Holding Period</div>
          <div className="text-lg font-bold text-slate-900">{profile.averageHoldingPeriod?.toFixed(1) || 0} days</div>
          <div className="text-xs text-slate-500">{profile.averageHoldingPeriodLabel}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm"><Activity className="w-4 h-4" /> Trading Frequency</div>
          <div className="text-lg font-bold text-slate-900 capitalize">{profile.tradingFrequency}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Behavioral Scores</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={scoreData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="score" stroke="#1b7bf5" fill="#1b7bf5" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Preferred Sectors</h2>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="sector" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#1b7bf5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No sector data available.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500 mb-1">Buy/Sell Ratio</div>
          <div className="text-xl font-bold text-slate-900">{profile.buySellRatio?.toFixed(2) || 0}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 mb-1">Win Rate</div>
          <div className="text-xl font-bold text-slate-900">{profile.winRate?.toFixed(1) || 0}%</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 mb-1">Avg Position Size</div>
          <div className="text-xl font-bold text-slate-900">${profile.averagePositionSize?.toFixed(2) || 0}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 mb-1">Profit Factor</div>
          <div className="text-xl font-bold text-slate-900">{profile.profitFactor?.toFixed(2) || 0}</div>
        </div>
      </div>

      {profile.preferredTickers?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Most Traded Tickers</h2>
          <div className="flex flex-wrap gap-2">
            {profile.preferredTickers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-900 text-sm">{t.ticker}</span>
                <span className="text-xs text-slate-500">{t.count} trades</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Behavior;
