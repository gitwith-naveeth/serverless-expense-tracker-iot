import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { PieChart as PieIcon, Cpu, TrendingUp, Zap, Coffee, BarChart2 } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { transactions, devices } = useRealtime();
  const { user } = useAuth();

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  // 1. Essential vs Non-Essential Aggregation
  const essentialSpent = transactions
    .filter(t => t.transaction_type === 'expense' && t.expense_classification === 'essential')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const nonEssentialSpent = transactions
    .filter(t => t.transaction_type === 'expense' && t.expense_classification === 'non-essential')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const classificationData = [
    { name: 'Essential Expenses', value: essentialSpent, color: '#10b981' },
    { name: 'Non-Essential Expenses', value: nonEssentialSpent, color: '#f59e0b' }
  ];

  // 2. Category-wise Spending
  const categoryMap: { [key: string]: number } = {};
  transactions
    .filter(t => t.transaction_type === 'expense')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
    });

  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    amount: categoryMap[cat]
  }));

  // 3. Hardware vs Web Contribution Stats
  const hardwareTransactions = transactions.filter(t => t.source === 'hardware');
  const webTransactions = transactions.filter(t => t.source === 'web');
  const hardwareEssentialCount = hardwareTransactions.filter(t => t.expense_classification === 'essential').length;
  const hardwareNonEssentialCount = hardwareTransactions.filter(t => t.expense_classification === 'non-essential').length;

  const sourceComparisonData = [
    { name: 'ESP32 Hardware', count: hardwareTransactions.length },
    { name: 'Web App Manual', count: webTransactions.length }
  ];

  // 4. Income-to-Expense Ratio Calculation
  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = essentialSpent + nonEssentialSpent;
  const incomeToExpenseRatio = totalExpense > 0 
    ? (totalIncome / totalExpense).toFixed(2)
    : 'N/A';

  // 5. Sample Trend Data
  const trendData = [
    { month: 'May', essential: 11000, nonEssential: 4500, income: 60000 },
    { month: 'Jun', essential: 13500, nonEssential: 6200, income: 62000 },
    { month: 'Jul', essential: 12000, nonEssential: 5800, income: 60000 },
    { month: 'Aug', essential: 14200, nonEssential: 7100, income: 65000 },
    { month: 'Sep (Current)', essential: essentialSpent || 12500, nonEssential: nonEssentialSpent || 5400, income: totalIncome || 65000 }
  ];

  const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#ec4899', '#8b5cf6'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cloud Analytics & Financial Reports</h1>
          <p className="page-subtitle">
            Serverless cloud analytics breaking down essential needs, non-essential wants, and IoT hardware inputs.
          </p>
        </div>
      </div>

      {/* Analytics Highlights Banner */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Income-to-Expense Ratio
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4', marginTop: '0.25rem' }}>
            {incomeToExpenseRatio} : 1
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            For every {currency}1 spent, you earn {currency}{incomeToExpenseRatio}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Essential vs Non-Essential Breakdown
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginTop: '0.35rem' }}>
            Essential: <span style={{ color: '#34d399' }}>{currency}{essentialSpent.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
            Non-Essential: <span style={{ color: '#fbbf24' }}>{currency}{nonEssentialSpent.toLocaleString()}</span>
          </div>
        </div>

        <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Hardware Contribution
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.25rem' }}>
            {hardwareTransactions.length} Presses
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Essential (Btn 1): {hardwareEssentialCount} | Non-Essential (Btn 2): {hardwareNonEssentialCount}
          </div>
        </div>
      </div>

      {/* Chart Row 1: Essential vs Non-Essential Pie Chart & Monthly Spending Trend */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Pie Chart: Essential vs Non-Essential */}
        <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Essential vs Non-Essential Spending Split
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Spent']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Monthly Spending Trends
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Amount']} />
                <Legend />
                <Area type="monotone" dataKey="essential" name="Essential" stroke="#10b981" fill="rgba(16, 185, 129, 0.2)" />
                <Area type="monotone" dataKey="nonEssential" name="Non-Essential" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2: Category Breakdown Bar Chart & Source Distribution */}
      <div className="grid-2">
        {/* Category Breakdown */}
        <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Spending by Category
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Spent']} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Distribution (Hardware vs Web) */}
        <div className="glass-card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
            Transaction Origin Breakdown (Hardware vs Web)
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceComparisonData}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(val: any) => [val, 'Transactions']} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
