import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { TrendingUp, Shield, Target, DollarSign, ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    riskTolerance: 'moderate',
    investmentGoals: [],
    preferredSectors: [],
    initialCapital: '',
    currency: 'USD',
  });
  const [loading, setLoading] = useState(false);

  const goals = ['Long-term growth', 'Retirement', 'Passive income', 'Capital preservation', 'Speculation', 'Diversification'];
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Goods', 'Real Estate', 'Industrials', 'Utilities'];

  const toggleArrayItem = (key, value) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await API.put('/auth/onboarding', { ...data, initialCapital: Number(data.initialCapital) || 0 });
      updateUser(res.data.user);
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Risk Tolerance',
      icon: Shield,
      content: (
        <div className="space-y-3">
          {['conservative', 'moderate', 'aggressive'].map((r) => (
            <button
              key={r}
              onClick={() => setData({ ...data, riskTolerance: r })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                data.riskTolerance === r ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-medium capitalize text-slate-900">{r}</div>
              <div className="text-sm text-slate-500 mt-1">
                {r === 'conservative' && 'Prefer stability and capital preservation over high returns'}
                {r === 'moderate' && 'Balanced approach between growth and stability'}
                {r === 'aggressive' && 'Comfortable with high volatility for maximum growth potential'}
              </div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Investment Goals',
      icon: Target,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {goals.map((g) => (
            <button
              key={g}
              onClick={() => toggleArrayItem('investmentGoals', g)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                data.investmentGoals.includes(g) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Preferred Sectors',
      icon: TrendingUp,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => toggleArrayItem('preferredSectors', s)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                data.preferredSectors.includes(s) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Initial Capital',
      icon: DollarSign,
      content: (
        <div className="space-y-4">
          <div>
            <label className="label">Starting Investment Capital</label>
            <div className="flex items-center gap-2">
              <select value={data.currency} onChange={(e) => setData({ ...data, currency: e.target.value })} className="input w-24">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
              <input type="number" value={data.initialCapital} onChange={(e) => setData({ ...data, initialCapital: e.target.value })} className="input flex-1" placeholder="10000" />
            </div>
          </div>
          <p className="text-sm text-slate-500">This helps us calculate your portfolio allocation and track performance.</p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
          <p className="text-slate-500 mt-1">Let's personalize your experience</p>
        </div>
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Step {step + 1} of {steps.length}</div>
              <div className="font-semibold text-slate-900">{current.title}</div>
            </div>
          </div>
          <div className="flex gap-1 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="animate-fade-in">{current.content}</div>
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="btn-secondary">Back</button>
            ) : <div />}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary">Continue <ArrowRight className="w-4 h-4" /></button>
            ) : (
              <button onClick={handleFinish} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Get Started'} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
