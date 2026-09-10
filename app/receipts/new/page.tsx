'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateDocNumber, formatCurrency } from '@/lib/utils';
import { Client } from '@/lib/types';

export default function CreateReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [clients, setClients] = useState<Client[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState(searchParams?.get('client_id') || '');
  const [invoiceId, setInvoiceId] = useState(searchParams?.get('invoice_id') || '');
  const [receiptNumber, setReceiptNumber] = useState(generateDocNumber('REC'));
  const [amount, setAmount] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [creditedToAccount, setCreditedToAccount] = useState('Anish');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchPendingInvoices(parseInt(clientId));
    } else {
      setPendingInvoices([]);
    }
  }, [clientId]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('name', { ascending: true });
    if (data) setClients(data);
  };

  const fetchPendingInvoices = async (cId: number) => {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, advance_amount, is_advance_paid, notes')
      .eq('client_id', cId)
      .neq('status', 'paid')
      .neq('status', 'cancelled');

    if (data) {
      setPendingInvoices(data);
      const preselected = searchParams?.get('invoice_id');
      if (preselected) {
        const found = data.find((i) => String(i.id) === preselected);
        if (found) {
          handleSelectInvoice(found);
        }
      }
    }
  };

  const handleSelectInvoice = (inv: any) => {
    setInvoiceId(String(inv.id));
    const advance = inv.is_advance_paid ? Number(inv.advance_amount || 0) : 0;
    const pending = Number(inv.total_amount || 0) - advance;
    setAmount(String(pending > 0 ? pending : inv.total_amount));
    setDescription(`Payment for Invoice #${inv.invoice_number}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const parsedAmount = parseFloat(amount) || 0;

      // 1. Insert receipt
      const { data: newReceipt, error: receiptError } = await supabase
        .from('receipts')
        .insert([
          {
            receipt_number: receiptNumber,
            client_id: parseInt(clientId),
            amount: parsedAmount,
            received_date: receivedDate,
            description,
            payment_method: paymentMethod,
            credited_to_account: creditedToAccount,
          },
        ])
        .select()
        .single();

      if (receiptError) throw receiptError;

      // 2. If invoice selected, check if fully paid and record transaction
      if (invoiceId) {
        const { data: inv } = await supabase
          .from('invoices')
          .select('id, total_amount, advance_amount, is_advance_paid')
          .eq('id', invoiceId)
          .single();

        if (inv) {
          const advance = inv.is_advance_paid ? Number(inv.advance_amount || 0) : 0;
          const pending = Number(inv.total_amount || 0) - advance;

          if (parsedAmount >= pending) {
            await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);
          }
        }

        // Insert transaction record
        await supabase.from('transactions').insert([
          {
            invoice_id: parseInt(invoiceId),
            client_id: parseInt(clientId),
            amount: parsedAmount,
            payment_date: receivedDate,
            payment_method: paymentMethod,
            account_credited: creditedToAccount,
            reference_number: receiptNumber,
            notes: description,
          },
        ]);
      }

      router.push('/receipts');
    } catch (err: any) {
      setError(err.message || 'Error generating receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Create New Receipt</div>
      </div>

      <div className="card" style={{ maxWidth: '650px', margin: 'auto', padding: '2rem' }}>
        {error && (
          <div className="badge badge-overdue" style={{ marginBottom: '1.5rem', display: 'block', padding: '0.75rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Client (Received From) *</label>
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
          </div>

          {pendingInvoices.length > 0 && (
            <div className="form-group" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #dcfce7' }}>
              <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Pending Invoices for this Client (Autofill)
              </label>
              <select
                value={invoiceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setInvoiceId(val);
                  const found = pendingInvoices.find((i) => String(i.id) === val);
                  if (found) handleSelectInvoice(found);
                }}
                className="form-control"
              >
                <option value="">-- Choose Pending Invoice to Settle --</option>
                {pendingInvoices.map((inv) => {
                  const advance = inv.is_advance_paid ? Number(inv.advance_amount || 0) : 0;
                  const pending = Number(inv.total_amount || 0) - advance;
                  return (
                    <option key={inv.id} value={inv.id}>
                      #{inv.invoice_number} - Pending: {formatCurrency(pending)} (Total: {formatCurrency(inv.total_amount)})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Receipt # *</label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="form-control"
              required
            />
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
              <label className="form-label">Date Received *</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="grid-1-1">
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-control"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Credited to Account *</label>
              <select
                value={creditedToAccount}
                onChange={(e) => setCreditedToAccount(e.target.value)}
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
          </div>

          <div className="form-group">
            <label className="form-label">Description / Remarks</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              rows={3}
              placeholder="e.g. Website development milestone payment, Annual hosting renewal..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem' }}
          >
            {loading ? 'Generating Receipt...' : 'Generate Receipt Voucher'}
          </button>
        </form>
      </div>
    </div>
  );
}
