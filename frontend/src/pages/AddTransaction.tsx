import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { mockCategories } from '../services/mockData';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Zap, Coffee, DollarSign } from 'lucide-react';

export const AddTransaction: React.FC = () => {
  const { addTransaction } = useRealtime();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [classification, setClassification] = useState<'essential' | 'non-essential'>('essential');
  const [category, setCategory] = useState<string>('Food & Groceries');
  const [amount, setAmount] = useState<string>('150');
  const [description, setDescription] = useState<string>('');

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const filteredCategories = mockCategories.filter(c => {
    if (type === 'income') return c.type === 'income';
    return c.type === classification;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addTransaction({
      amount: parsedAmount,
      transaction_type: type,
      expense_classification: type === 'expense' ? classification : null,
      category,
      source: 'web',
      description: description.trim() || `Manual Web ${type} Entry`,
    });

    navigate('/transactions');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.85rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Add New Transaction</h1>
          <p className="page-subtitle">Log income or expense manually from the web application</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Transaction Type Switch */}
          <div className="form-group">
            <label>Transaction Type</label>
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory('Food & Groceries'); }}
                className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.85rem' }}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategory('Monthly Salary'); }}
                className={`btn ${type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.85rem' }}
              >
                Income
              </button>
            </div>
          </div>

          {/* Expense Classification Toggle (Essential vs Non-Essential) */}
          {type === 'expense' && (
            <div className="form-group">
              <label>Expense Classification (High-Level Categorization)</label>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setClassification('essential'); setCategory('Food & Groceries'); }}
                  className={`btn ${classification === 'essential' ? 'btn-essential' : 'btn-secondary'}`}
                  style={{ padding: '0.85rem', gap: '0.5rem' }}
                >
                  <Zap size={18} />
                  <span>Essential Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setClassification('non-essential'); setCategory('Entertainment & Movies'); }}
                  className={`btn ${classification === 'non-essential' ? 'btn-non-essential' : 'btn-secondary'}`}
                  style={{ padding: '0.85rem', gap: '0.5rem' }}
                >
                  <Coffee size={18} />
                  <span>Non-Essential Expense</span>
                </button>
              </div>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-control"
            >
              {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label>Amount ({currency})</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-control"
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description / Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              placeholder="e.g. Supermarket supplies, Swiggy order..."
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
          >
            <PlusCircle size={18} />
            <span>Save Transaction</span>
          </button>
        </form>
      </div>
    </div>
  );
};
