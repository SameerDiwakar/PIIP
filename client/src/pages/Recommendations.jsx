import { useEffect, useState } from 'react';
import API from '../api';
import { Search, Sparkles, ThumbsUp, ThumbsDown, TrendingUp, Target, Loader2 } from 'lucide-react';

const actionColors = {
  'Consider Buy': 'bg-success-100 text-success-700 border-success-200',
  Hold: 'bg-accent-100 text-accent-700 border-accent-200',
  Pass: 'bg-slate-100 text-slate-600 border-slate-200',
};

const Recommendations = () => {
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/recommendations/similar').then((r) => setSimilar(r.data.companies || [])).catch(() => {}),
      API.get('/memory').then((r) => setMemories(r.data.memories || [])).catch(() => {}),
    ]).finally(() => setLoadingSimilar(false));
  }, []);

  const handleEvaluate = async (e) => {
    e?.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    setEvaluation(null);
    setFeedbackSent(false);
    try {
      const res = await API.post('/recommendations/evaluate', { ticker: ticker.trim(), companyName });
      setEvaluation(res.data);
    } catch (err) {
      setEvaluation({ error: err.response?.data?.error || 'Evaluation failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSimilarClick = (company) => {
    setTicker(company.ticker);
    setCompanyName(company.companyName);
    setEvaluation(null);
  };

  const handleFeedback = async (rating) => {
    if (!evaluation || evaluation.error) return;
    try {
      await API.post('/recommendations/feedback', {
        ticker: evaluation.ticker,
        recommendation: evaluation.reasoning,
        rating,
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Personalized Recommendations</h1>
        <p className="text-slate-500 mt-1">Evaluate new opportunities based on your unique investing behavior</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary-600" /> Evaluate an Opportunity
        </h2>
        <form onSubmit={handleEvaluate} className="flex flex-col sm:flex-row gap-3">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (e.g. NVDA)"
            className="input sm:w-36"
            required
          />
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name (optional)"
            className="input flex-1"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analyze
          </button>
        </form>
      </div>

      {evaluation && !evaluation.error && (
        <div className="card p-6 border-2 border-primary-100 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900">{evaluation.companyName}</h3>
                <span className="text-sm font-mono text-slate-500">{evaluation.ticker}</span>
              </div>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold border ${actionColors[evaluation.action] || actionColors.Hold}`}>
                {evaluation.action}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-3xl font-bold text-primary-600">{evaluation.fitScore}</div>
              <div className="text-xs text-slate-500">Fit Score / 100</div>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed mb-4">{evaluation.reasoning}</p>

          {evaluation.keyFactors?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {evaluation.keyFactors.map((f, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">{f.factor}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${f.score}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{f.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!feedbackSent ? (
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">Was this helpful?</span>
              <button onClick={() => handleFeedback('helpful')} className="p-2 rounded-lg hover:bg-success-50 text-success-600"><ThumbsUp className="w-4 h-4" /></button>
              <button onClick={() => handleFeedback('not_helpful')} className="p-2 rounded-lg hover:bg-error-50 text-error-600"><ThumbsDown className="w-4 h-4" /></button>
            </div>
          ) : (
            <p className="text-sm text-success-600 pt-3 border-t border-slate-100">Thanks! Your feedback helps PIIP learn your preferences.</p>
          )}
        </div>
      )}

      {evaluation?.error && (
        <div className="card p-4 bg-error-50 text-error-700 text-sm">{evaluation.error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" /> Similar Companies For You
          </h2>
          {loadingSimilar ? (
            <div className="animate-pulse text-slate-400 text-sm">Loading recommendations...</div>
          ) : similar.length > 0 ? (
            <div className="space-y-3">
              {similar.map((c) => (
                <button
                  key={c.ticker}
                  onClick={() => handleSimilarClick(c)}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{c.ticker}</span>
                    <span className="text-xs font-medium text-primary-600">{c.fitScore}/100 fit</span>
                  </div>
                  <div className="text-sm text-slate-600">{c.companyName}</div>
                  <div className="text-xs text-slate-400 mt-1">{c.sector} · {c.style} · {c.reason}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Add transactions or load sample data to get personalized company recommendations.</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" /> Your Investment Memory
          </h2>
          {memories.length > 0 ? (
            <ul className="space-y-3">
              {memories.slice(0, 8).map((m, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className={`badge shrink-0 text-xs ${
                    m.category === 'success' ? 'bg-success-100 text-success-700' :
                    m.category === 'mistake' ? 'bg-error-100 text-error-700' :
                    m.category === 'preference' ? 'bg-primary-100 text-primary-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{m.category}</span>
                  <span className="text-slate-700">{m.content}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Your long-term memory builds as you trade and provide feedback.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
