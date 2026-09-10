'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Printer, Download, Edit2, Eye } from 'lucide-react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('quotations')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    if (data) setQuotations(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Quotation Management</div>
        <Link href="/quotations/new" className="btn btn-primary">
          <Plus size={16} /> Create New Quotation
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Expiry</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length > 0 ? (
                quotations.map((row) => {
                  const statusClass = `badge-${row.status?.toLowerCase() || 'draft'}`;
                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>#{row.quotation_number}</strong>
                      </td>
                      <td>{row.clients?.name || 'N/A'}</td>
                      <td>{formatDate(row.quotation_date)}</td>
                      <td>{formatDate(row.expiry_date)}</td>
                      <td style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`}>{row.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <Link
                            href={`/quotations/${row.id}/print`}
                            target="_blank"
                            style={{ color: 'var(--primary)' }}
                            title="Print Quotation"
                          >
                            <Printer size={16} />
                          </Link>
                          <Link
                            href={`/quotations/${row.id}/print?download=1`}
                            target="_blank"
                            style={{ color: 'var(--success)' }}
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </Link>
                          <Link
                            href={`/quotations/${row.id}/edit`}
                            style={{ color: 'var(--warning)' }}
                            title="Edit Quotation"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <Link
                            href={`/quotations/${row.id}`}
                            style={{ color: 'var(--secondary)' }}
                            title="View Quotation"
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading quotations...' : 'No quotations found. Click "Create New Quotation" to start.'}
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
