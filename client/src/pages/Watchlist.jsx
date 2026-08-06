import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Trash2, X, Eye, Bell } from 'lucide-react';

const emptyForm = { ticker: '', companyName: '', sector: '', notes: '', targetPrice: '', alertPriceHigh: '', alertPriceLow: '', priority: 'medium' };

const Watchlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await API.get('/watchlist');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
      alertPriceHigh: form.alertPriceHigh ? Number(form.alertPriceHigh) : undefined,
      alertPriceLow: form.alertPriceLow ? Number(form.alertPriceLow) : undefined,
    };
    try {
      await API.post('/watchlist', payload);
      setForm(emptyForm);
      setShowForm(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove from watchlist?')) return;
    await API.delete(`/watchlist/${id}`);
    fetchItems();
  };

  const priorityColors = { high: 'bg-error-100 text-error-700', medium: 'bg-accent-100 text-accent-700', low: 'bg-slate-100 text-slate-700' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Watchlist</h1>
          <p className="text-slate-500 mt-1">{items.length} stocks on your radar</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Add to Watchlist</h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="label">Ticker</label><input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} className="input" placeholder="AAPL" required /></div>
            <div><label className="label">Company Name</label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="input" placeholder="Apple Inc." /></div>
            <div><label className="label">Sector</label><input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="input" placeholder="Technology" /></div>
            <div><label className="label">Target Price</label><input type="number" step="any" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} className="input" placeholder="200.00" /></div>
            <div><label className="label">Alert High</label><input type="number" step="any" value={form.alertPriceHigh} onChange={(e) => setForm({ ...form, alertPriceHigh: e.target.value })} className="input" placeholder="210.00" /></div>
            <div><label className="label">Alert Low</label><input type="number" step="any" value={form.alertPriceLow} onChange={(e) => setForm({ ...form, alertPriceLow: e.target.value })} className="input" placeholder="180.00" /></div>
            <div><label className="label">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="label">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows="2" placeholder="Why are you watching this stock?" /></div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">Add to Watchlist</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Your watchlist is empty. Add stocks you want to monitor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{item.ticker}</span>
                    <span className={`badge ${priorityColors[item.priority]}`}>{item.priority}</span>
                  </div>
                  <div className="text-sm text-slate-500">{item.companyName || '—'}</div>
                </div>
                <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded hover:bg-error-50 text-error-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              {item.sector && <div className="text-xs text-slate-400 mb-3">{item.sector}</div>}
              {item.notes && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.notes}</p>}
              <div className="space-y-1 text-sm">
                {item.targetPrice && <div className="flex justify-between"><span className="text-slate-500">Target:</span><span className="font-medium text-slate-900">${item.targetPrice}</span></div>}
                {item.alertPriceHigh && <div className="flex justify-between items-center"><span className="text-slate-500 flex items-center gap-1"><Bell className="w-3 h-3" /> High:</span><span className="font-medium text-success-600">${item.alertPriceHigh}</span></div>}
                {item.alertPriceLow && <div className="flex justify-between items-center"><span className="text-slate-500 flex items-center gap-1"><Bell className="w-3 h-3" /> Low:</span><span className="font-medium text-error-600">${item.alertPriceLow}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
