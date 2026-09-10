'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateDocNumber, formatCurrency } from '@/lib/utils';
import { Plus, Trash2, ArrowLeft, FileDown } from 'lucide-react';
import { Client, Product } from '@/lib/types';

interface ItemRow {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(generateDocNumber('INV'));
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0.00');
  const [isAdvancePaid, setIsAdvancePaid] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cls } = await supabase.from('clients').select('*').order('name', { ascending: true });
    const { data: prods } = await supabase.from('products').select('*').order('name', { ascending: true });
    const { data: quots } = await supabase
      .from('quotations')
      .select('id, quotation_number, total_amount, clients(name)')
      .order('created_at', { ascending: false });

    if (cls) setClients(cls);
    if (prods) setProducts(prods);
    if (quots) setQuotations(quots);
  };

  const handleImportQuotation = async () => {
    if (!selectedQuotationId) return;
    try {
      const { data: quo } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('id', selectedQuotationId)
        .single();

      if (quo) {
        setClientId(String(quo.client_id));
        if (quo.notes) setNotes(quo.notes);

        if (quo.quotation_items && quo.quotation_items.length > 0) {
          setItems(
            quo.quotation_items.map((it: any) => ({
              description: it.description,
              quantity: Number(it.quantity) || 1,
              unit_price: Number(it.unit_price) || 0,
              total: Number(it.total) || 0,
            }))
          );
        }
      }
    } catch (err: any) {
      console.error('Error importing quotation:', err);
    }
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

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => String(p.id) === productId);
    if (prod) {
      const updated = [...items];
      const q = updated[index].quantity || 1;
      updated[index] = {
        description: prod.name,
        quantity: q,
        unit_price: prod.price,
        total: q * prod.price,
      };
      setItems(updated);
    }
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
    setLoading(true);
    setError('');

    try {
      // 1. Insert invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            client_id: parseInt(clientId),
            invoice_date: invoiceDate,
            status: 'sent',
            total_amount: grandTotal,
            advance_amount: parsedAdvance,
            is_advance_paid: isAdvancePaid,
            notes,
          },
        ])
        .select()
        .single();

      if (invError) throw invError;

      // 2. Insert items
      const itemInserts = items
        .filter((item) => item.description.trim() !== '')
        .map((item) => ({
          invoice_id: invoice.id,
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
      setError(err.message || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/invoices" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="page-title">Create New Invoice</div>
        </div>
      </div>

      {error && (
        <div className="badge badge-overdue" style={{ marginBottom: '1.5rem', display: 'block', padding: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Import from Quotation */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(240, 253, 244, 0.9)' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>
          Import from Quotation (Autofill)
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedQuotationId}
            onChange={(e) => setSelectedQuotationId(e.target.value)}
            className="form-control"
            style={{ width: '380px', maxWidth: '100%' }}
          >
            <option value="">-- Choose Quotation --</option>
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>
                #{q.quotation_number} - {q.clients?.name} ({formatCurrency(q.total_amount)})
              </option>
            ))}
          </select>
          <button type="button" onClick={handleImportQuotation} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
            <FileDown size={16} /> Import Quotation
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
              Client Information
            </h3>
            <div className="form-group">
              <label className="form-label">Select Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="form-control"
                required
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <small style={{ marginTop: '0.35rem', display: 'block' }}>
                <Link href="/clients" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  + Add New Client
                </Link>
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Instructions / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Bank account details, UPI QR code info, payment link..."
              />
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>
              Invoice Details
            </h3>
            <div className="form-group">
              <label className="form-label">Invoice # *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Date *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="form-control"
                required
              />
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
                  id="is_advance_paid"
                  checked={isAdvancePaid}
                  onChange={(e) => setIsAdvancePaid(e.target.checked)}
                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="is_advance_paid" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Advance Paid?
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Invoice Items</h3>
            <button type="button" onClick={addItemRow} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add Line Item
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Description</th>
                  <th style={{ width: '15%' }}>Catalog Preset</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Qty</th>
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
                        placeholder="Description..."
                        required
                      />
                    </td>
                    <td>
                      <select
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="form-control"
                        defaultValue=""
                      >
                        <option value="">-- Preset --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                          </option>
                        ))}
                      </select>
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
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                      {formatCurrency(row.total)}
                    </td>
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

          <div
            style={{
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div style={{ textAlign: 'right' }}>
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
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link href="/invoices" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            {loading ? 'Creating Invoice...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
