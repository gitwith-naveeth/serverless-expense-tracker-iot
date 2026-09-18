import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Trash2, Cpu, Globe, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { transactions, deleteTransaction } = useRealtime();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'income', 'expense'
  const [filterClassification, setFilterClassification] = useState<string>('all'); // 'all', 'essential', 'non-essential'
  const [filterSource, setFilterSource] = useState<string>('all'); // 'all', 'web', 'hardware'
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  // Categories list
  const categoriesList = Array.from(new Set(transactions.map(t => t.category)));

  // Filter transactions logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || tx.transaction_type === filterType;
    const matchesClassification = filterClassification === 'all' || tx.expense_classification === filterClassification;
    const matchesSource = filterSource === 'all' || tx.source === filterSource;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;

    return matchesSearch && matchesType && matchesClassification && matchesSource && matchesCategory;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">
            Full ledger of web-recorded and ESP32 hardware-triggered financial transactions.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-control"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value)}
              className="form-control"
            >
              <option value="all">All Classifications</option>
              <option value="essential">Essential</option>
              <option value="non-essential">Non-Essential</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="form-control"
            >
              <option value="all">All Sources</option>
              <option value="web">Web App</option>
              <option value="hardware">Hardware (ESP32)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-control"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Category & Description</th>
                <th>Classification</th>
                <th>Origin Source</th>
                <th>Device ID</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
                    No transactions match your current filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.timestamp).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{tx.category}</div>
                      {tx.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>{tx.description}</div>}
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
                        <span className="badge badge-hardware">
                          <Cpu size={12} /> Hardware
                        </span>
                      ) : (
                        <span className="badge badge-web">
                          <Globe size={12} /> Web App
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: tx.device_id ? '#a78bfa' : 'var(--text-dim)' }}>
                      {tx.device_id || 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={tx.transaction_type === 'income' ? 'amount-income' : 'amount-expense'} style={{ fontSize: '0.95rem' }}>
                        {tx.transaction_type === 'income' ? '+' : '-'}{currency}{Number(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
