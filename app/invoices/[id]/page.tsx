'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Edit2, Printer, Download, Receipt as ReceiptIcon } from 'lucide-react';

export default function ViewInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('id', id)
      .single();

    if (inv) {
      setInvoice(inv);
      const { data: itms } = await supabase.from('invoice_items').select('*').eq('invoice_id', id);
      if (itms) setItems(itms);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoice...</div>;
  if (!invoice) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Invoice not found.</div>;

  const advance = invoice.is_advance_paid ? Number(invoice.advance_amount || 0) : 0;
  const balanceDue = Math.max(0, Number(invoice.total_amount || 0) - advance);

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/invoices" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="page-title">Invoice #{invoice.invoice_number}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href={`/receipts/new?client_id=${invoice.client_id}&invoice_id=${invoice.id}`}
            className="btn btn-primary"
            style={{ background: 'var(--warning)' }}
          >
            <ReceiptIcon size={16} /> Send Receipt
          </Link>
          <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-secondary">
            <Edit2 size={16} /> Edit
          </Link>
          <Link href={`/invoices/${invoice.id}/print`} target="_blank" className="btn btn-primary">
            <Printer size={16} /> Print
          </Link>
          <Link href={`/invoices/${invoice.id}/print?download=1`} target="_blank" className="btn btn-primary" style={{ background: 'var(--success)' }}>
            <Download size={16} /> PDF
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Client Information</h3>
          <p style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> {invoice.clients?.name}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Email 1:</strong> {invoice.clients?.email || 'N/A'}</p>
          {invoice.clients?.email2 && <p style={{ marginBottom: '0.5rem' }}><strong>Email 2:</strong> {invoice.clients.email2}</p>}
          <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> {invoice.clients?.phone || 'N/A'}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Address:</strong> {invoice.clients?.address || 'N/A'}</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Invoice Summary</h3>
          <p style={{ marginBottom: '0.5rem' }}><strong>Invoice #:</strong> #{invoice.invoice_number}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Invoice Date:</strong> {formatDate(invoice.invoice_date)}</p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> <span className={`badge badge-${invoice.status?.toLowerCase()}`}>{invoice.status}</span>
          </p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Total:</strong> {formatCurrency(invoice.total_amount)}</p>
          {invoice.is_advance_paid && (
            <p style={{ marginBottom: '0.5rem', color: 'var(--success)' }}>
              <strong>Advance Paid:</strong> {formatCurrency(advance)}
            </p>
          )}
          <p style={{ marginBottom: '0.5rem', color: 'var(--danger)', fontWeight: 600 }}>
            <strong>Balance Due:</strong> {formatCurrency(balanceDue)}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Line Items</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.description}</td>
                  <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(it.unit_price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
