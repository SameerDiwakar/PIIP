import { useEffect, useState } from 'react';
import API from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const COLORS = ['#1b7bf5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, perfRes] = await Promise.all([
          API.get('/portfolio'),
          API.get('/portfolio/performance'),
        ]);
        setPortfolio(portRes.data);
        setPerformance(perfRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse text-slate-400">Loading portfolio...</div>;
  if (!portfolio || portfolio.totalPositions === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
        <div className="card p-12 text-center">
          <p className="text-slate-500">No active positions yet. Add buy transactions to build your portfolio.</p>
        </div>
      </div>
    );
  }

  const sectorData = portfolio.sectorAllocation.map((s) => ({ name: s.sector, value: s.value }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
        <p className="text-slate-500 mt-1">{portfolio.totalPositions} active positions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-sm text-slate-500">Total Value</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Total Cost</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">${portfolio.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500">Unrealized P&L</div>
          <div className={`text-2xl font-bold mt-1 ${portfolio.totalValue - portfolio.totalCost >= 0 ? 'text-success-600' : 'text-error-600'}`}>
            {portfolio.totalValue - portfolio.totalCost >= 0 ? '+' : ''}${(portfolio.totalValue - portfolio.totalCost).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Sector Allocation</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => e.name}>
                {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Monthly Activity</h2>
          {performance?.monthly?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="buys" name="Buys" fill="#10b981" />
                <Bar dataKey="sells" name="Sells" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">Not enough data for chart.</p>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Positions</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ticker</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Avg Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Value</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {portfolio.positions.map((p) => (
                <tr key={p.ticker} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{p.ticker}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.companyName}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{p.totalQuantity}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">${p.averageCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">${p.marketValue.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-slate-600">{p.allocation.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
