import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AlertTriangle, ArrowUpRight, Database, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const compactMoney = (value: number) => {
    const amount = Number(value || 0);
    if (Math.abs(amount) >= 1000000) return `${currency}${(amount / 1000000).toFixed(1)}m`;
    if (Math.abs(amount) >= 1000) return `${currency}${(amount / 1000).toFixed(1)}k`;
    return money(amount);
  };
  const classificationData = analytics ? [
    { name: 'Essential', value: analytics.summary.essentialExpenses, percentage: analytics.summary.essentialPercentage, color: '#8fb39d' },
    { name: 'Non-essential', value: analytics.summary.nonEssentialExpenses, percentage: analytics.summary.nonEssentialPercentage, color: '#c79761' }
  ] : [];
  const sourceData = analytics ? Object.entries(analytics.sources).map(([name, value]) => ({
    name: name === 'hardware' ? 'ESP32 Hardware' : 'Web App',
    count: value.transactionCount
  })) : [];
  const budgetOverage = analytics ? Math.max(analytics.budget.totalSpent - analytics.budget.totalAllocated, 0) : 0;
  const budgetUtilization = analytics?.budget.utilizationPercentage ?? 0;
  const isOverBudget = budgetOverage > 0 || budgetUtilization > 100;
  const isNearBudget = !isOverBudget && budgetUtilization >= 85;
  const dateRangeInvalid = startDate > endDate;
  const categorySummary = analytics?.categories.slice(0, 5) ?? [];

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cloud Analytics & Financial Reports</h1>
          <p className="page-subtitle">Aggregated securely in Supabase for the selected date range.</p>
        </div>
        <div className="analytics-date-controls" aria-label="Analysis period">
          <label htmlFor="analytics-start-date">From
            <input id="analytics-start-date" type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} />
          </label>
          <label htmlFor="analytics-end-date">To
            <input id="analytics-end-date" type="date" value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} />
          </label>
        </div>
      </div>

      {loading && <div className="analytics-state" role="status"><RefreshCw size={18} /> Loading cloud analytics...</div>}
      {error && <div className="analytics-state analytics-state-error" role="alert"><AlertTriangle size={18} /><span>{error}</span></div>}
      {dateRangeInvalid && <div className="analytics-state analytics-state-error" role="alert"><AlertTriangle size={18} /> Choose a start date before the end date.</div>}
      {!loading && !error && analytics && !dateRangeInvalid && (
        analytics.summary.expenseCount === 0 ? (
          <div className="analytics-empty glass-card">
            <h2>No expenses in this date range</h2>
            <p>Choose another range or record a transaction to see spending analysis. Income data is still reflected in your account.</p>
            <Link to="/add-transaction" className="btn btn-secondary">Record a transaction <ArrowUpRight size={16} /></Link>
          </div>
        ) : (
          <>
            <div className="analytics-metric-grid">
              <div className="analytics-metric"><span className="analytics-label">Total expenses</span><strong>{money(analytics.summary.totalExpenses)}</strong><span>{analytics.summary.expenseCount} transactions</span></div>
              <div className="analytics-metric"><span className="analytics-label">Net savings</span><strong>{money(analytics.summary.netSavings)}</strong><span>Income {money(analytics.summary.totalIncome)}</span></div>
              <div className="analytics-metric"><span className="analytics-label">Income / expense</span><strong>{analytics.summary.incomeToExpenseRatio === null ? 'N/A' : `${analytics.summary.incomeToExpenseRatio.toFixed(2)} : 1`}</strong><span>Average daily spend {money(analytics.summary.averageDailySpending)}</span></div>
              <div className={`analytics-metric analytics-metric-status ${isOverBudget ? 'is-over' : isNearBudget ? 'is-near' : 'is-on-track'}`}>
                <span className="analytics-label">Budget status</span><strong>{budgetUtilization.toFixed(1)}%</strong><span>{isOverBudget ? `Over by ${money(budgetOverage)}` : isNearBudget ? 'Approaching limit' : 'Within planned limit'}</span>
              </div>
            </div>

            <div className={`analytics-budget-alert ${isOverBudget ? 'is-over' : isNearBudget ? 'is-near' : 'is-on-track'}`} role={isOverBudget ? 'alert' : 'status'}>
              <div className="analytics-budget-icon"><AlertTriangle size={19} /></div>
              <div><strong>{isOverBudget ? 'Over budget' : isNearBudget ? 'Budget nearing its limit' : 'Budget on track'}</strong><p>{isOverBudget ? `Spending is ${money(budgetOverage)} above your ${money(analytics.budget.totalAllocated)} budget.` : `${money(analytics.budget.totalSpent)} of ${money(analytics.budget.totalAllocated)} allocated has been used.`}</p></div>
              <Link to={isOverBudget ? '/transactions' : '/budgets'}>Review budget <ArrowUpRight size={15} /></Link>
            </div>

            <section className="analytics-section analytics-primary-section">
              <div className="analytics-section-heading"><div><h2>Monthly cash flow</h2><p>Income, expenses, and savings · Amount in {currency}</p></div><span className="analytics-section-note">{analytics.monthly.length} months</span></div>
              <div className="analytics-chart analytics-chart-primary" role="img" aria-label="Monthly income, expenses, and savings chart">
                <p className="sr-only">Monthly cash flow chart. Latest month is {analytics.monthly[analytics.monthly.length - 1]?.month ?? 'not available'}.</p>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthly}>
                    <CartesianGrid stroke="#2a333b" vertical={false} />
                    <XAxis dataKey="month" stroke="#9ba5ad" tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ba5ad" tickLine={false} axisLine={false} tickFormatter={compactMoney} width={58} />
                    <Tooltip formatter={(value: number) => [money(value), 'Amount']} />
                    <Legend />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#8fb39d" fill="#8fb39d" fillOpacity={0.08} strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#c79761" fill="#c79761" fillOpacity={0.08} strokeWidth={2} />
                    <Area type="monotone" dataKey="savings" name="Savings" stroke="#b8c2c9" fill="#b8c2c9" fillOpacity={0.05} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="analytics-data-summary">{analytics.monthly.length > 0 ? `Latest month: ${analytics.monthly[analytics.monthly.length - 1].month} · Expenses ${money(analytics.monthly[analytics.monthly.length - 1].expenses)} · Savings ${money(analytics.monthly[analytics.monthly.length - 1].savings)}` : 'No monthly data available.'}</div>
            </section>

            <div className="analytics-grid">
              <section className="analytics-section">
                <div className="analytics-section-heading"><div><h2>Essential vs non-essential</h2><p>Spending mix · Amount in {currency}</p></div></div>
                <div className="analytics-chart analytics-chart-secondary" role="img" aria-label="Essential and non-essential spending chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={classificationData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                        {classificationData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [money(value), 'Spent']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="analytics-breakdown">{classificationData.map(item => <div key={item.name}><span><i style={{ backgroundColor: item.color }} />{item.name}</span><strong>{item.percentage.toFixed(1)}% <small>{money(item.value)}</small></strong></div>)}</div>
              </section>

              <section className="analytics-section analytics-category-section">
                <div className="analytics-section-heading"><div><h2>Spending by category</h2><p>Top categories · Amount in {currency}</p></div></div>
                <div className="analytics-chart analytics-chart-secondary analytics-category-chart" role="img" aria-label="Spending by category chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.categories}>
                      <CartesianGrid stroke="#2a333b" horizontal={false} />
                      <XAxis dataKey="name" stroke="#9ba5ad" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ba5ad" tickLine={false} axisLine={false} tickFormatter={compactMoney} width={58} />
                      <Tooltip formatter={(value: number) => [money(value), 'Spent']} />
                      <Bar dataKey="amount" name="Spent" fill="#8fb39d" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="analytics-category-list">{categorySummary.map(category => <div key={category.name}><span>{category.name}</span><strong>{money(category.amount)} <small>{category.percentage.toFixed(1)}%</small></strong></div>)}</div>
              </section>
            </div>

            <section className="analytics-section analytics-origin-section">
              <div className="analytics-section-heading"><div><h2>Transaction origin</h2><p>Transaction count by capture method</p></div></div>
              <div className="analytics-origin-grid">{sourceData.map(source => <div className="analytics-origin-item" key={source.name}><span>{source.name}</span><strong>{source.count}</strong><small>transactions</small></div>)}</div>
            </section>

            <section className="analytics-footer-summary">
              <div><Database size={18} /><div><strong>Cloud and hardware activity</strong><p>{money(analytics.hardware.totalExpenses)} from ESP32 hardware across {analytics.hardware.transactionCount} transactions.</p></div></div>
              <span>{isOverBudget ? `Remaining budget: ${money(analytics.budget.remaining)}` : `Allocated remaining: ${money(analytics.budget.remaining)}`}</span>
            </section>
          </>
        )
      )}
    </div>
  );
};
