'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, X, FileImage, ExternalLink } from 'lucide-react';
import { Expense } from '@/lib/types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('Tools/Software');
  const [debitFrom, setDebitFrom] = useState('Anish');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    let receiptPath = null;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      } else if (uploadData) {
        const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        receiptPath = publicUrlData?.publicUrl || fileName;
      }
    }

    const payload = {
      category,
      debit_from: debitFrom,
      amount: parseFloat(amount) || 0,
      expense_date: expenseDate,
      description,
      receipt_path: receiptPath,
    };

    const { error: insertError } = await supabase.from('expenses').insert([payload]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setAmount('');
      setDescription('');
      setFile(null);
      fetchExpenses();
    }

    setUploading(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Internal Expense Manager</div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Debit From</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? (
                expenses.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.expense_date)}</td>
                    <td>
                      <span className="badge badge-pending">{row.category}</span>
                    </td>
                    <td>
                      <strong>{row.debit_from || 'Anish'}</strong>
                    </td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(row.amount)}</td>
                    <td>{row.description || 'N/A'}</td>
                    <td>
                      {row.receipt_path ? (
                        <a
                          href={row.receipt_path}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 500,
                          }}
                        >
                          <FileImage size={15} /> View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No Receipt</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading expenses...' : 'No expenses recorded yet. Click "+ Add Expense" to log one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add New Expense</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Tools/Software">Tools / Software</option>
                  <option value="Infrastructure">Infrastructure / Hosting</option>
                  <option value="Salaries">Salaries / Freelancers</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Debit From Account *</label>
                <select
                  value={debitFrom}
                  onChange={(e) => setDebitFrom(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="Company Primary">Arkatva Primary Account</option>
                  <option value="Anish">Anish Account</option>
                  <option value="Shrinidhi M">Shrinidhi M Account</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Sajjad">Sajjad (Historical)</option>
                </select>
              </div>

              <div className="grid-1-1">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-control"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expense Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control"
                  rows={3}
                  placeholder="Purpose of expense, vendor name, etc..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Receipt File (Optional - Image or PDF)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="form-control"
                  accept="image/*,.pdf"
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Uploaded automatically to Supabase Storage
                </small>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {uploading ? 'Uploading & Saving...' : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
