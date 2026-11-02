import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { supabase, isConfigured } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface AnalyticsResponse {
  summary: {
    totalExpenses: number;
    totalIncome: number;
    netSavings: number;
    expenseCount: number;
    averageDailySpending: number;
    incomeToExpenseRatio: number | null;
    savingsPercentage: number | null;
    essentialExpenses: number;
    nonEssentialExpenses: number;
    essentialPercentage: number;
    nonEssentialPercentage: number;
  };
  daily: { date: string; amount: number; transactionCount: number }[];
  categories: { name: string; amount: number; transactionCount: number; percentage: number }[];
  monthly: { month: string; expenses: number; income: number; savings: number }[];
  sources: Record<string, { transactionCount: number; amount: number }>;
  budget: {
    totalAllocated: number;
    totalSpent: number;
    remaining: number;
    utilizationPercentage: number;
  };
  hardware: {
    totalExpenses: number;
    transactionCount: number;
    essentialExpenses: number;
    nonEssentialExpenses: number;
    devices: { deviceId: string; deviceName: string; status: string; transactionCount: number; amount: number }[];
  };
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - 30);
    return formatDate(date);
  });
  const [endDate, setEndDate] = useState(() => formatDate(today));
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      if (!isConfigured) {
        setError('Connect Supabase to load cloud analytics.');
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Sign in to load your analytics.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/analytics/overview?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(`${endDate}T23:59:59.999Z`)}`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });
      const body = await response.json();
      if (!response.ok) {
        if (active) setError(body.error || 'Unable to load cloud analytics.');
      } else if (active) {
        setAnalytics(body as AnalyticsResponse);
      }
      if (active) setLoading(false);
    };

    loadAnalytics().catch(() => {
      if (active) {
        setError('Unable to load cloud analytics. Please try again.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [startDate, endDate]);

  const money = (value: number) => `${currency}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const classificationData = analytics ? [
    { name: 'Essential Expenses', value: analytics.summary.essentialExpenses, color: '#10b981' },
    { name: 'Non-Essential Expenses', value: analytics.summary.nonEssentialExpenses, color: '#f59e0b' }
  ] : [];
  const sourceData = analytics ? Object.entries(analytics.sources).map(([name, value]) => ({
    name: name === 'hardware' ? 'ESP32 Hardware' : 'Web App',
    count: value.transactionCount
  })) : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cloud Analytics & Financial Reports</h1>
          <p className="page-subtitle">Aggregated securely in Supabase for the selected date range.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label>From <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
          <label>To <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} /></label>
        </div>
      </div>

      {loading && <div className="glass-card">Loading cloud analytics...</div>}
      {error && <div className="glass-card" style={{ color: '#fca5a5' }}>{error}</div>}
      {!loading && !error && analytics && (
        <>
          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card"><div className="metric-label">Total Expenses</div><div className="metric-value">{money(analytics.summary.totalExpenses)}</div><div className="metric-caption">{analytics.summary.expenseCount} transactions</div></div>
            <div className="glass-card"><div className="metric-label">Net Savings</div><div className="metric-value">{money(analytics.summary.netSavings)}</div><div className="metric-caption">Income {money(analytics.summary.totalIncome)}</div></div>
            <div className="glass-card"><div className="metric-label">Income / Expense</div><div className="metric-value">{analytics.summary.incomeToExpenseRatio === null ? 'N/A' : `${analytics.summary.incomeToExpenseRatio.toFixed(2)} : 1`}</div><div className="metric-caption">Average daily spend {money(analytics.summary.averageDailySpending)}</div></div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3>Essential vs Non-Essential Spending</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={classificationData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5}>
                      {classificationData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [money(value), 'Spent']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3>Monthly Income, Expenses & Savings</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthly}>
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip formatter={(value: number) => [money(value), 'Amount']} />
                    <Legend />
                    <Area type="monotone" dataKey="income" stroke="#06b6d4" fill="rgba(6,182,212,0.15)" />
                    <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="rgba(245,158,11,0.15)" />
                    <Area type="monotone" dataKey="savings" stroke="#10b981" fill="rgba(16,185,129,0.15)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3>Spending by Category</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.categories}>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} angle={-15} textAnchor="end" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip formatter={(value: number) => [money(value), 'Spent']} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
              <h3>Transaction Origin</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData}>
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3>Budget & ESP32 Summary</h3>
            <p>Budget utilization: {analytics.budget.utilizationPercentage.toFixed(1)}% ({money(analytics.budget.totalSpent)} of {money(analytics.budget.totalAllocated)})</p>
            <p>Hardware expenses: {money(analytics.hardware.totalExpenses)} across {analytics.hardware.transactionCount} transactions. Remaining budget: {money(analytics.budget.remaining)}.</p>
          </div>
        </>
      )}
      {!loading && !error && analytics && analytics.summary.expenseCount === 0 && (
        <div className="glass-card">No transactions exist in this date range. Choose another range or record a transaction.</div>
      )}
    </div>
  );
};
