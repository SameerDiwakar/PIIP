import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';

const emptyForm = {
  ticker: '', companyName: '', sector: '', industry: '', type: 'buy',
  quantity: '', price: '', date: new Date().toISOString().slice(0, 10),
  notes: '', marketCondition: 'unknown', sentiment: 'neutral', tags: [],
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.ticker = search;
      if (filterType) params.type = filterType;
      const res = await API.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [page, search, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, quantity: Number(form.quantity), price: Number(form.price) };
    try {
      if (editingId) {
        await API.put(`/transactions/${editingId}`, payload);
      } else {
        await API.post('/transactions', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (tx) => {
    setEditingId(tx._id);
    setForm({
      ...emptyForm,
      ...tx,
      date: tx.date ? new Date(tx.date).toISOString().slice(0, 10) : '',
      quantity: String(tx.quantity),
      price: String(tx.price),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await API.delete(`/transactions/${id}`);
    fetchTransactions();
  };

  const typeColors = {
    buy: 'bg-success-100 text-success-700',
    sell: 'bg-error-100 text-error-700',
    hold: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 mt-1">{total} total transactions</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by ticker..." className="input pl-10" />
        </div>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="input sm:w-40">
          <option value="">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="hold">Hold</option>
        </select>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="label">Ticker</label><input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} className="input" placeholder="AAPL" required /></div>
            <div><label className="label">Company Name</label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="input" placeholder="Apple Inc." required /></div>
            <div><label className="label">Sector</label><input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="input" placeholder="Technology" /></div>
            <div><label className="label">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input"><option value="buy">Buy</option><option value="sell">Sell</option><option value="hold">Hold</option></select></div>
            <div><label className="label">Quantity</label><input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" placeholder="10" required /></div>
            <div><label className="label">Price</label><input type="number" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="150.00" required /></div>
            <div><label className="label">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" /></div>
            <div><label className="label">Market Condition</label><select value={form.marketCondition} onChange={(e) => setForm({ ...form, marketCondition: e.target.value })} className="input"><option value="unknown">Unknown</option><option value="bull">Bull</option><option value="bear">Bear</option><option value="sideways">Sideways</option><option value="volatile">Volatile</option></select></div>
            <div><label className="label">Sentiment</label><select value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })} className="input"><option value="neutral">Neutral</option><option value="positive">Positive</option><option value="negative">Negative</option></select></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="label">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows="2" placeholder="Why did you make this trade?" /></div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'} Transaction</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No transactions yet. Click "Add Transaction" to log your first trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ticker</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{tx.ticker}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{tx.companyName}</td>
                    <td className="px-4 py-3"><span className={`badge ${typeColors[tx.type]}`}>{tx.type}</span></td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{tx.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">${tx.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">${tx.totalValue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(tx)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(tx._id)} className="p-1.5 rounded hover:bg-error-50 text-error-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
          <span className="px-4 py-2 text-sm text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-secondary">Next</button>
        </div>
      )}
    </div>
  );
};

export default Transactions;
