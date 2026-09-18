import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/MetricCard';
import { LiveHardwareFeed } from '../components/LiveHardwareFeed';
import { InteractiveHardwareSimulator } from '../components/InteractiveHardwareSimulator';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Coffee,
  Wallet,
  Target,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { transactions, budget, devices } = useRealtime();
  const { user } = useAuth();
  const navigate = useNavigate();

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  // Calculate Aggregates
  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const essentialExpenses = transactions
    .filter(t => t.transaction_type === 'expense' && t.expense_classification === 'essential')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const nonEssentialExpenses = transactions
    .filter(t => t.transaction_type === 'expense' && t.expense_classification === 'non-essential')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;
  const budgetUtilization = budget.total_budget_amount > 0 
    ? Math.min(100, Math.round((totalExpenses / budget.total_budget_amount) * 1000) / 10) 
    : 0;

  const hardwareTxCount = transactions.filter(t => t.source === 'hardware').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.full_name || 'User'}! Real-time financial insights & IoT hardware sync.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/analytics')} className="btn btn-secondary">
            View Cloud Analytics
          </button>
          <button onClick={() => navigate('/add-transaction')} className="btn btn-primary">
            + New Transaction
          </button>
        </div>
      </div>

      {/* Top Stat Metrics Grid */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <MetricCard
          title="Total Income"
          value={`${currency}${totalIncome.toLocaleString()}`}
          subtitle="Monthly inflows"
          icon={TrendingUp}
          iconColor="#22d3ee"
          glowColor="rgba(6, 182, 212, 0.3)"
        />

        <MetricCard
          title="Total Expenses"
          value={`${currency}${totalExpenses.toLocaleString()}`}
          subtitle="All spending"
          icon={TrendingDown}
          iconColor="#ef4444"
          glowColor="rgba(239, 68, 68, 0.3)"
        />

        <MetricCard
          title="Essential Expenses"
          value={`${currency}${essentialExpenses.toLocaleString()}`}
          subtitle="Need-based (Button 1)"
          icon={Zap}
          iconColor="#10b981"
          glowColor="rgba(16, 185, 129, 0.3)"
          badge="Essential"
        />

        <MetricCard
          title="Non-Essential"
          value={`${currency}${nonEssentialExpenses.toLocaleString()}`}
          subtitle="Want-based (Button 2)"
          icon={Coffee}
          iconColor="#f59e0b"
          glowColor="rgba(245, 158, 11, 0.3)"
          badge="Non-Essential"
        />
      </div>

      {/* Secondary Metrics Row (Net Balance, Budget Utilization Gauge, Hardware Stats) */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {/* Net Balance Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Remaining Balance
            </span>
            <Wallet size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: netBalance >= 0 ? '#ffffff' : '#ef4444' }}>
            {currency}{netBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
            Available savings buffer this month
          </div>
        </div>

        {/* Budget Utilization Progress Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Monthly Budget Utilization
            </span>
            <Target size={20} color={budgetUtilization > 85 ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
              {budgetUtilization}%
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              of {currency}{budget.total_budget_amount.toLocaleString()} limit
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            marginTop: '0.65rem',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, budgetUtilization)}%`,
              background: budgetUtilization > 90 ? '#ef4444' : budgetUtilization > 75 ? '#f59e0b' : 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Hardware Contribution Card */}
        <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              IoT Hardware Impact
            </span>
            <Cpu size={20} color="#a78bfa" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
            {hardwareTxCount} Transactions
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
            Logged instantly via ESP32 push buttons
          </div>
        </div>
      </div>

      {/* Live Hardware Activity & Test Simulator Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <InteractiveHardwareSimulator />
      </div>

      {/* Main Content Grid: Recent Transactions Table vs Live Hardware Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
        {/* Recent Transactions List */}
        <div className="glass-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate('/transactions')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Classification</th>
                  <th>Source</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 7).map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{tx.category}</div>
                      {tx.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{tx.description}</div>}
                    </td>
                    <td>
                      {tx.transaction_type === 'income' ? (
                        <span className="badge badge-income">Income</span>
                      ) : tx.expense_classification === 'essential' ? (
                        <span className="badge badge-essential">Essential</span>
                      ) : (
                        <span className="badge badge-non-essential">Non-Essential</span>
                      )}
                    </td>
                    <td>
                      {tx.source === 'hardware' ? (
                        <span className="badge badge-hardware">ESP32 Hardware</span>
                      ) : (
                        <span className="badge badge-web">Web App</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={tx.transaction_type === 'income' ? 'amount-income' : 'amount-expense'}>
                        {tx.transaction_type === 'income' ? '+' : '-'}{currency}{Number(tx.amount).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Hardware Activity Panel */}
        <div>
          <LiveHardwareFeed />
        </div>
      </div>
    </div>
  );
};
