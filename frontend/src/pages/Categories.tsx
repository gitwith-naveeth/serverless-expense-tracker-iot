import React, { useState } from 'react';
import { mockCategories } from '../services/mockData';
import { Category } from '../types';
import { Tags, Plus, Zap, Coffee, DollarSign } from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'essential' | 'non-essential' | 'income'>('essential');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: Category = {
      id: 'cat-' + Date.now(),
      name: newCatName.trim(),
      type: newCatType,
      icon: newCatType === 'essential' ? 'Zap' : newCatType === 'non-essential' ? 'Coffee' : 'DollarSign',
      is_default: false,
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCatName('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-subtitle">Manage essential, non-essential, and income category tags.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Create Category Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem' }}>
            Add Custom Category
          </h3>
          <form onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Gym & Fitness, Cloud Subscriptions..."
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Classification Type</label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="form-control"
              >
                <option value="essential">Essential Need</option>
                <option value="non-essential">Non-Essential Want</option>
                <option value="income">Income Stream</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              <Plus size={18} /> Add Category
            </button>
          </form>
        </div>

        {/* Existing Categories List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.25rem' }}>
            Active Categories ({categories.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {cat.type === 'essential' ? <Zap size={18} color="#34d399" /> :
                   cat.type === 'non-essential' ? <Coffee size={18} color="#fbbf24" /> :
                   <DollarSign size={18} color="#22d3ee" />}
                  <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>{cat.name}</span>
                </div>

                <span className={
                  cat.type === 'essential' ? 'badge badge-essential' :
                  cat.type === 'non-essential' ? 'badge badge-non-essential' :
                  'badge badge-income'
                }>
                  {cat.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
