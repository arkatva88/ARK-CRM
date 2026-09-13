'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Edit2, Printer, Download } from 'lucide-react';

export default function ViewQuotationPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    setLoading(true);
    const { data: q } = await supabase
      .from('quotations')
      .select('*, clients(*)')
      .eq('id', id)
      .single();

    if (q) {
      setQuotation(q);
      const { data: itms } = await supabase.from('quotation_items').select('*').eq('quotation_id', id);
      if (itms) setItems(itms);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading quotation...</div>;
  if (!quotation) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Quotation not found.</div>;

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/quotations" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="page-title">Quotation #{quotation.quotation_number}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={`/quotations/${quotation.id}/edit`} className="btn btn-secondary">
            <Edit2 size={16} /> Edit
          </Link>
          <Link href={`/quotations/${quotation.id}/print`} target="_blank" className="btn btn-primary">
            <Printer size={16} /> Print
          </Link>
          <Link href={`/quotations/${quotation.id}/print?download=1`} target="_blank" className="btn btn-primary" style={{ background: 'var(--success)' }}>
            <Download size={16} /> PDF
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Client Information</h3>
            <Link href="/clients" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <Edit2 size={12} /> Edit Client
            </Link>
          </div>
          <p style={{ marginBottom: '0.5rem' }}><strong>Client Name:</strong> {quotation.clients?.name}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {quotation.clients?.email || 'N/A'}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Phone:</strong> {quotation.clients?.phone || 'N/A'}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Address:</strong> {quotation.clients?.address || 'N/A'}</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quotation Details</h3>
          <p style={{ marginBottom: '0.5rem' }}><strong>Quotation #:</strong> #{quotation.quotation_number}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Date:</strong> {formatDate(quotation.quotation_date)}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Expiry:</strong> {formatDate(quotation.expiry_date)}</p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong> <span className={`badge badge-${quotation.status?.toLowerCase()}`}>{quotation.status}</span>
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Quotation Items</h3>
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
        <div style={{ padding: '1.5rem', textAlign: 'right', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            Total: {formatCurrency(quotation.total_amount)}
          </div>
        </div>
      </div>
    </div>
  );
}
