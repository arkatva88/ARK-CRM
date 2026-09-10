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

export default function EditQuotationPage() {
  const { id } = useParams();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('sent');
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

    const { data: q } = await supabase.from('quotations').select('*').eq('id', id).single();
    if (q) {
      setClientId(String(q.client_id));
      setQuotationNumber(q.quotation_number);
      setQuotationDate(q.quotation_date);
      setExpiryDate(q.expiry_date || '');
      setStatus(q.status);
      setNotes(q.notes || '');

      const { data: itms } = await supabase.from('quotation_items').select('*').eq('quotation_id', id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 1. Update quotation
      const { error: quoError } = await supabase
        .from('quotations')
        .update({
          quotation_number: quotationNumber,
          client_id: parseInt(clientId),
          quotation_date: quotationDate,
          expiry_date: expiryDate || null,
          status,
          total_amount: grandTotal,
          notes,
        })
        .eq('id', id);

      if (quoError) throw quoError;

      // 2. Delete old items and insert updated items
      await supabase.from('quotation_items').delete().eq('quotation_id', id);

      const itemInserts = items
        .filter((item) => item.description.trim() !== '')
        .map((item) => ({
          quotation_id: parseInt(String(id)),
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));

      if (itemInserts.length > 0) {
        const { error: itemsError } = await supabase.from('quotation_items').insert(itemInserts);
        if (itemsError) throw itemsError;
      }

      router.push('/quotations');
    } catch (err: any) {
      setError(err.message || 'Error updating quotation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading quotation...</div>;

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/quotations" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="page-title">Edit Quotation #{quotationNumber}</div>
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
              <label className="form-label">Notes / Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
                rows={3}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quotation Details</h3>
            <div className="form-group">
              <label className="form-label">Quotation #</label>
              <input
                type="text"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="grid-1-1">
              <div className="form-group">
                <label className="form-label">Quotation Date</label>
                <input
                  type="date"
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
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
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Quotation Items</h3>
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
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
              Total: {formatCurrency(grandTotal)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link href="/quotations" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {saving ? 'Updating...' : 'Update Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
}
