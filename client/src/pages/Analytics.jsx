import { useEffect, useState } from 'react';
import API from '../api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = ['#1b7bf5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-slate-400">Loading analytics...</div>;
  if (!data || data.summary.totalTransactions === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <div className="card p-12 text-center">
          <p className="text-slate-500">No data to analyze yet. Add transactions to see your analytics.</p>
        </div>
      </div>
    );
  }

  const sectorData = data.sectorBreakdown.map((s) => ({ name: s.sector, value: s.value }));
  const typeData = [
    { name: 'Buy', value: data.typeBreakdown.buy },
    { name: 'Sell', value: data.typeBreakdown.sell },
    { name: 'Hold', value: data.typeBreakdown.hold },
  ];
  const typeColors = { Buy: '#10b981', Sell: '#ef4444', Hold: '#94a3b8' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Deep dive into your trading activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500">Total Invested</div>
          <div className="text-xl font-bold text-slate-900 mt-1">${data.summary.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Total Returned</div>
          <div className="text-xl font-bold text-slate-900 mt-1">${data.summary.totalReturned.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Unique Tickers</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.summary.uniqueTickers}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Unique Sectors</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{data.summary.uniqueSectors}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Sector Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => e.name}>
                {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Transaction Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {typeData.map((entry, i) => <Cell key={i} fill={typeColors[entry.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Monthly Activity</h2>
        {data.monthlyActivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name="Transactions" stroke="#1b7bf5" strokeWidth={2} />
              <Line type="monotone" dataKey="value" name="Volume ($)" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">Not enough data for trend analysis.</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Sector Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Sector</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Transactions</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.sectorBreakdown.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.sector}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{s.count}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">${s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
