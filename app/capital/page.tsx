'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Trash2, X, TrendingUp, Landmark, ShieldCheck, Wallet, ArrowDownRight } from 'lucide-react';
import { CapitalInjection } from '@/lib/types';

export default function CapitalPage() {
  const [injections, setInjections] = useState<CapitalInjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    brought_in_by: 'Anish (Partner)',
    deposited_to: 'Arkatva Primary Account',
    amount: '',
    deposit_date: new Date().toISOString().split('T')[0],
    category: 'Partner Capital Investment',
    payment_mode: 'Bank Transfer',
    reference_number: '',
    description: '',
  });

  useEffect(() => {
    fetchCapital();
  }, []);

  const fetchCapital = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('capital_injections')
        .select('*')
        .order('deposit_date', { ascending: false });

      if (!fetchErr && data) {
        setInjections(data);
      }
    } catch (err) {
      console.error('Error loading capital injections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      brought_in_by: formData.brought_in_by.trim() || 'Anish (Owner)',
      deposited_to: formData.deposited_to.trim() || 'Arkatva Primary Account',
      amount: parseFloat(formData.amount) || 0,
      deposit_date: formData.deposit_date,
      category: formData.category,
      payment_mode: formData.payment_mode,
      reference_number: formData.reference_number.trim() || null,
      description: formData.description.trim() || null,
    };

    if (payload.amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      setSaving(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from('capital_injections').insert([payload]);
      if (insertError) {
        setError(insertError.message);
      } else {
        setShowModal(false);
        setFormData({
          brought_in_by: 'Anish (Owner)',
          deposited_to: 'Arkatva Primary Account',
          amount: '',
          deposit_date: new Date().toISOString().split('T')[0],
          category: 'Owner Capital Investment',
          payment_mode: 'Bank Transfer',
          reference_number: '',
          description: '',
        });
        fetchCapital();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record cash inflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this capital injection record?')) return;
    try {
      await supabase.from('capital_injections').delete().eq('id', id);
      fetchCapital();
    } catch (err) {
      console.error('Failed to delete capital record:', err);
    }
  };

  // Calculations
  const totalCapital = injections.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonthCapital = injections
    .filter((item) => item.deposit_date?.startsWith(currentMonthPrefix))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const filteredInjections = injections.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.brought_in_by?.toLowerCase().includes(q) ||
      item.deposited_to?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.reference_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="header">
        <div>
          <div className="page-title">Cash Brought In (Capital Inflows)</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Record owner capital injections, partner funding, and business liquidity infusions
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Record Cash Brought In
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-title">
            <span>Total Capital Injected</span>
            <TrendingUp size={16} color="var(--success)" />
          </div>
          <div className="stat-card-value" style={{ color: '#ffffff' }}>
            {formatCurrency(totalCapital)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>This Month Inflow</span>
            <ArrowDownRight size={16} color="#38bdf8" />
          </div>
          <div className="stat-card-value" style={{ color: '#38bdf8' }}>
            {formatCurrency(thisMonthCapital)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Total Entries</span>
            <Landmark size={16} color="var(--text-muted)" />
          </div>
          <div className="stat-card-value">{injections.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Primary Recipient</span>
            <Wallet size={16} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginTop: '0.5rem' }}>
            Arkatva Primary Account
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ maxWidth: '360px', width: '100%' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by contributor, account, ref no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Showing {filteredInjections.length} of {injections.length} record(s)
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Brought In By</th>
                <th>Deposited To</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Reference</th>
                <th>Amount (₹)</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInjections.length > 0 ? (
                filteredInjections.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.deposit_date)}</td>
                    <td>
                      <strong style={{ color: '#ffffff' }}>{row.brought_in_by || 'Anish (Owner)'}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info">{row.deposited_to || 'Arkatva Primary Account'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {row.category || 'Capital Investment'}
                      </span>
                    </td>
                    <td>{row.payment_mode || 'Bank Transfer'}</td>
                    <td>
                      {row.reference_number ? (
                        <code style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                          {row.reference_number}
                        </code>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem' }}>
                      + {formatCurrency(row.amount)}
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.description || 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Delete Entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    {loading ? (
                      'Loading capital inflows...'
                    ) : (
                      <div>
                        <TrendingUp size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '0.25rem' }}>
                          No Cash Inflow Records Found
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                          Click &quot;Record Cash Brought In&quot; to log owner capital or business investments.
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Cash Brought In */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Record Cash Brought In</div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger-border)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleAddCapital}>
              <div className="form-group">
                <label className="form-label">Brought In By *</label>
                <select
                  value={formData.brought_in_by}
                  onChange={(e) => setFormData({ ...formData, brought_in_by: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="Anish (Partner)">Anish (Partner & Co-Founder)</option>
                  <option value="Shrinidhi M (Partner)">Shrinidhi M (Partner & Co-Founder)</option>
                  <option value="Arkatva Treasury">Arkatva Treasury</option>
                  <option value="External / Other">External / Other Contributor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deposited To Account *</label>
                <select
                  value={formData.deposited_to}
                  onChange={(e) => setFormData({ ...formData, deposited_to: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="Arkatva Primary Account">Arkatva Primary Account</option>
                  <option value="Anish Account">Anish Account</option>
                  <option value="Shrinidhi M Account">Shrinidhi M Account</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="Cash in Hand">Cash in Hand</option>
                  <option value="UPI Account">UPI Account</option>
                  <option value="Other">Other</option>
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
                  <label className="form-label">Deposit Date *</label>
                  <input
                    type="date"
                    value={formData.deposit_date}
                    onChange={(e) => setFormData({ ...formData, deposit_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="grid-1-1">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="Owner Capital Investment">Owner Capital Investment</option>
                    <option value="Working Capital Injection">Working Capital Injection</option>
                    <option value="Short-term Cash Infusion">Short-term Cash Infusion</option>
                    <option value="Partner Contribution">Partner Contribution</option>
                    <option value="Emergency Reserve">Emergency Reserve</option>
                    <option value="Other">Other Inflow</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode *</label>
                  <select
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                    className="form-control"
                    required
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference / UTR / Transaction No.</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="form-control"
                  placeholder="e.g. UTR12345678, IMPS-987654"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Purpose</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Initial business working capital injection, expansion funds..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Recording...' : 'Record Inflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
