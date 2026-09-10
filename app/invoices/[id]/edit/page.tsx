'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Client, Product } from '@/lib/types';

interface ItemRow {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [status, setStatus] = useState('sent');
  const [advanceAmount, setAdvanceAmount] = useState('0.00');
  const [isAdvancePaid, setIsAdvancePaid] = useState(false);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ItemRow[]>([]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: cls } = await supabase.from('clients').select('*').order('name', { ascending: true });
    const { data: prods } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (cls) setClients(cls);
    if (prods) setProducts(prods);

    const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (inv) {
      setClientId(String(inv.client_id));
      setInvoiceNumber(inv.invoice_number);
      setInvoiceDate(inv.invoice_date);
      setStatus(inv.status);
      setAdvanceAmount(String(inv.advance_amount || 0));
      setIsAdvancePaid(Boolean(inv.is_advance_paid));
      setNotes(inv.notes || '');

      const { data: itms } = await supabase.from('invoice_items').select('*').eq('invoice_id', id);
      if (itms && itms.length > 0) {
        setItems(
          itms.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: Number(item.total),
          }))
        );
      } else {
        setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
      }
    }
    setLoading(false);
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(field === 'quantity' ? value : row.quantity) || 0;
      const p = parseFloat(field === 'unit_price' ? value : row.unit_price) || 0;
      row.total = q * p;
    }

    updated[index] = row;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const parsedAdvance = parseFloat(advanceAmount) || 0;
  const balanceDue = Math.max(0, grandTotal - (isAdvancePaid ? parsedAdvance : 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 1. Update invoice
      const { error: invError } = await supabase
        .from('invoices')
        .update({
          invoice_number: invoiceNumber,
          client_id: parseInt(clientId),
          invoice_date: invoiceDate,
          status,
          total_amount: grandTotal,
          advance_amount: parsedAdvance,
          is_advance_paid: isAdvancePaid,
          notes,
        })
        .eq('id', id);

      if (invError) throw invError;

      // 2. Delete old items and insert updated items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);

      const itemInserts = items
        .filter((item) => item.description.trim() !== '')
        .map((item) => ({
          invoice_id: parseInt(String(id)),
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));

      if (itemInserts.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemInserts);
        if (itemsError) throw itemsError;
      }

      router.push('/invoices');
    } catch (err: any) {
      setError(err.message || 'Error updating invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoice...</div>;

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/invoices" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="page-title">Edit Invoice #{invoiceNumber}</div>
        </div>
      </div>

      {error && (
        <div className="badge badge-overdue" style={{ marginBottom: '1.5rem', display: 'block', padding: '0.75rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Client Details</h3>
            <div className="form-group">
              <label className="form-label">Client</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="form-control"
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Instructions / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
                rows={3}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Invoice Details</h3>
            <div className="form-group">
              <label className="form-label">Invoice #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="grid-1-1">
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="grid-1-1">
              <div className="form-group">
                <label className="form-label">Advance Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
                <input
                  type="checkbox"
                  id="edit_is_advance_paid"
                  checked={isAdvancePaid}
                  onChange={(e) => setIsAdvancePaid(e.target.checked)}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="edit_is_advance_paid" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Advance Paid?
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Line Items</h3>
            <button type="button" onClick={addItemRow} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Description</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Unit Price (₹)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="form-control"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="form-control"
                        style={{ textAlign: 'center' }}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={row.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="form-control"
                        style={{ textAlign: 'right' }}
                        required
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(row.total)}</td>
                    <td>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1.5rem', textAlign: 'right', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Subtotal: {formatCurrency(grandTotal)}
            </div>
            {isAdvancePaid && parsedAdvance > 0 && (
              <div style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
                Advance Paid: -{formatCurrency(parsedAdvance)}
              </div>
            )}
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '4px' }}>
              Balance Due: {formatCurrency(balanceDue)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link href="/invoices" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {saving ? 'Updating...' : 'Update Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
