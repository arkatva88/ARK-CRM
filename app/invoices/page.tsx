'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Printer, Download, Edit2, Eye, Receipt as ReceiptIcon } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    if (data) setInvoices(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Invoice Management</div>
        <Link href="/invoices/new" className="btn btn-primary">
          <Plus size={16} /> Create New Invoice
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((row) => {
                  const statusClass = `badge-${row.status?.toLowerCase() || 'sent'}`;
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>#{row.invoice_number}</strong>
                      </td>
                      <td>{row.clients?.name || 'N/A'}</td>
                      <td>{formatDate(row.invoice_date)}</td>
                      <td style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`}>{row.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <Link
                            href={`/receipts/new?client_id=${row.client_id}&invoice_id=${row.id}`}
                            style={{ color: 'var(--warning)' }}
                            title="Generate Receipt"
                          >
                            <ReceiptIcon size={16} />
                          </Link>
                          <Link
                            href={`/invoices/${row.id}/print`}
                            target="_blank"
                            style={{ color: 'var(--primary)' }}
                            title="Print Invoice"
                          >
                            <Printer size={16} />
                          </Link>
                          <Link
                            href={`/invoices/${row.id}/print?download=1`}
                            target="_blank"
                            style={{ color: 'var(--success)' }}
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </Link>
                          <Link
                            href={`/invoices/${row.id}/edit`}
                            style={{ color: 'var(--warning)' }}
                            title="Edit Invoice"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <Link
                            href={`/invoices/${row.id}`}
                            style={{ color: 'var(--secondary)' }}
                            title="View Invoice"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading invoices...' : 'No invoices found. Click "Create New Invoice" to start.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
