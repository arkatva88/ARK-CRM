'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Printer, Download } from 'lucide-react';
import { Receipt } from '@/lib/types';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('receipts')
      .select('*, clients(name)')
      .order('received_date', { ascending: false });

    if (data) setReceipts(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Receipts Tracker</div>
        <Link href="/receipts/new" className="btn btn-primary">
          <Plus size={16} /> Create New Receipt
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Client</th>
                <th>Date Received</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Credited To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length > 0 ? (
                receipts.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>#{row.receipt_number}</strong>
                    </td>
                    <td>{row.clients?.name || 'N/A'}</td>
                    <td>{formatDate(row.received_date)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(row.amount)}</td>
                    <td>{row.payment_method || 'UPI'}</td>
                    <td>
                      <strong>{row.credited_to_account || 'Anish'}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Link
                          href={`/receipts/${row.id}/print`}
                          target="_blank"
                          style={{ color: 'var(--primary)' }}
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </Link>
                        <Link
                          href={`/receipts/${row.id}/print?download=1`}
                          target="_blank"
                          style={{ color: 'var(--success)' }}
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading receipts...' : 'No receipts found. Click "Create New Receipt" to generate one.'}
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
