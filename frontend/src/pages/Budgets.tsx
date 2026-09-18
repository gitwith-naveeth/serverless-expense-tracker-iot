import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { Target, Zap, Coffee, AlertTriangle, CheckCircle2, Save } from 'lucide-react';

export const Budgets: React.FC = () => {
  const { budget, transactions, updateBudget } = useRealtime();
  const { user } = useAuth();

  const [totalBudget, setTotalBudget] = useState<number>(budget.total_budget_amount);
  const [essentialBudget, setEssentialBudget] = useState<number>(budget.essential_budget);
  const [nonEssentialBudget, setNonEssentialBudget] = useState<number>(budget.non_essential_budget);

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  // Spending calculations
  const totalSpent = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const essentialSpent = transactions
    .filter(t => t.transaction_type === 'expense' && t.expense_classification === 'essential')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const nonEssentialSpent = transactions
    .filter(t => t.transaction_type === 'expense' && t.expense_classification === 'non-essential')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalPct = budget.total_budget_amount > 0 ? Math.round((totalSpent / budget.total_budget_amount) * 100) : 0;
  const essentialPct = budget.essential_budget > 0 ? Math.round((essentialSpent / budget.essential_budget) * 100) : 0;
  const nonEssentialPct = budget.non_essential_budget > 0 ? Math.round((nonEssentialSpent / budget.non_essential_budget) * 100) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudget(totalBudget, essentialBudget, nonEssentialBudget);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Budget Manager</h1>
          <p className="page-subtitle">
            Set and track spending limits for essential needs and non-essential wants.
          </p>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {/* Total Budget Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Overall Monthly Limit</h3>
            <Target size={20} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
            {currency}{totalSpent.toLocaleString()}{' '}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              / {currency}{budget.total_budget_amount.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            <span>Utilized</span>
            <span style={{ fontWeight: 700, color: totalPct > 100 ? '#ef4444' : totalPct > 80 ? '#f59e0b' : '#34d399' }}>{totalPct}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, totalPct)}%`, background: totalPct > 100 ? '#ef4444' : totalPct > 80 ? '#f59e0b' : '#6366f1', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Essential Budget Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Essential Expenses Budget</h3>
            <Zap size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
            {currency}{essentialSpent.toLocaleString()}{' '}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              / {currency}{budget.essential_budget.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            <span>Utilized</span>
            <span style={{ fontWeight: 700, color: essentialPct > 100 ? '#ef4444' : '#34d399' }}>{essentialPct}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, essentialPct)}%`, background: '#10b981', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Non-Essential Budget Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Non-Essential Wants Budget</h3>
            <Coffee size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>
            {currency}{nonEssentialSpent.toLocaleString()}{' '}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              / {currency}{budget.non_essential_budget.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            <span>Utilized</span>
            <span style={{ fontWeight: 700, color: nonEssentialPct > 100 ? '#ef4444' : '#fbbf24' }}>{nonEssentialPct}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, nonEssentialPct)}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Configure Budget Form */}
      <div className="glass-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem' }}>
          Configure Monthly Targets
        </h3>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Total Monthly Expense Limit ({currency})</label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="form-control"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Essential Budget Target ({currency})</label>
              <input
                type="number"
                value={essentialBudget}
                onChange={(e) => setEssentialBudget(Number(e.target.value))}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Non-Essential Budget Target ({currency})</label>
              <input
                type="number"
                value={nonEssentialBudget}
                onChange={(e) => setNonEssentialBudget(Number(e.target.value))}
                className="form-control"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            <Save size={18} /> Save Budget Settings
          </button>
        </form>
      </div>
    </div>
  );
};
