'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, X } from 'lucide-react';
import { Withdrawal } from '@/lib/types';

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    withdrawn_by: 'Anish',
    withdrawn_from: 'Anish',
    amount: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .order('withdrawal_date', { ascending: false });
    if (data) setWithdrawals(data);
    setLoading(false);
  };

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      withdrawn_by: formData.withdrawn_by,
      withdrawn_from: formData.withdrawn_from,
      amount: parseFloat(formData.amount) || 0,
      withdrawal_date: formData.withdrawal_date,
      description: formData.description,
    };

    const { error: insertError } = await supabase.from('withdrawals').insert([payload]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({
        withdrawn_by: 'Anish',
        withdrawn_from: 'Anish',
        amount: '',
        withdrawal_date: new Date().toISOString().split('T')[0],
        description: '',
      });
      fetchWithdrawals();
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this withdrawal record?')) return;
    await supabase.from('withdrawals').delete().eq('id', id);
    fetchWithdrawals();
  };

  return (
    <div>
      <div className="header">
        <div>
          <div className="page-title">Owner Withdrawals</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Record personal drawings and owner profit distributions
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Record Withdrawal
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Withdrawn By</th>
                <th>From Account</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length > 0 ? (
                withdrawals.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.withdrawal_date)}</td>
                    <td>
                      <strong>{row.withdrawn_by || 'Anish'}</strong>
                    </td>
                    <td>
                      <strong>{row.withdrawn_from || row.withdrawn_by || 'Anish'}</strong>
                    </td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(row.amount)}</td>
                    <td>{row.description || 'N/A'}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading withdrawals...' : 'No withdrawals recorded yet. Click "Record Withdrawal" to log one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Withdrawal Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Record Withdrawal</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddWithdrawal}>
              <div className="form-group">
                <label className="form-label">Withdrawn By *</label>
                <select
                  value={formData.withdrawn_by}
                  onChange={(e) => setFormData({ ...formData, withdrawn_by: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="Anish">Anish (Partner & Co-Founder)</option>
                  <option value="Shrinidhi M">Shrinidhi M (Partner & Co-Founder)</option>
                  <option value="Sajjad">Sajjad (Historical)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Withdrawn From Account *</label>
                <select
                  value={formData.withdrawn_from}
                  onChange={(e) => setFormData({ ...formData, withdrawn_from: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="Arkatva Primary Account">Arkatva Primary Account</option>
                  <option value="Anish">Anish Account</option>
                  <option value="Shrinidhi M">Shrinidhi M Account</option>
                  <option value="Cash">Cash Account</option>
                  <option value="Sajjad">Sajjad Account (Historical)</option>
                </select>
              </div>

              <div className="grid-1-1">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="form-control"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    value={formData.withdrawal_date}
                    onChange={(e) => setFormData({ ...formData, withdrawal_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Reason</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows={3}
                  placeholder="Personal drawing, advance profit share, dividend, etc..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {saving ? 'Saving...' : 'Save Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
