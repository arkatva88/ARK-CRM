'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, Download } from 'lucide-react';

export default function PrintReceiptPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isDownload = searchParams?.get('download') === '1';

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchReceipt();
  }, [id]);

  const fetchReceipt = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('receipts')
      .select('*, clients(*)')
      .eq('id', id)
      .single();

    if (data) {
      setReceipt(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (receipt && isDownload && typeof window !== 'undefined') {
      setTimeout(() => {
        downloadPDF();
      }, 800);
    }
  }, [receipt, isDownload]);

  const downloadPDF = () => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById('receipt-print-box');
    const html2pdf = (window as any).html2pdf;
    if (element && html2pdf) {
      const opt = {
        margin: 10,
        filename: `Receipt_${receipt?.receipt_number || 'voucher'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      html2pdf().from(element).set(opt).save();
    } else {
      window.print();
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading receipt...</div>;
  }

  if (!receipt) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>Receipt not found.</div>;
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '30px 15px' }}>
      {/* Action Buttons */}
      <div
        className="no-print"
        style={{
          maxWidth: '720px',
          margin: '0 auto 20px auto',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        <button
          onClick={downloadPDF}
          className="btn btn-primary"
          style={{ background: '#059669', color: 'white', padding: '8px 18px' }}
        >
          <Download size={16} /> Download PDF
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
          style={{ background: '#2563eb', color: 'white', padding: '8px 18px' }}
        >
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      {/* Printable Receipt Box */}
      <div
        id="receipt-print-box"
        style={{
          maxWidth: '720px',
          margin: 'auto',
          background: 'white',
          padding: '45px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          borderTop: '8px solid #059669',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img
              src="/assets/ark-logo.jpeg"
              alt="Arkatva Logo"
              style={{ height: '48px', width: '48px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#09090b', letterSpacing: '0.04em' }}>
                ARKATVA
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Official Financial Receipt
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#09090b', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Receipt
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Official Payment Voucher
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Receipt Number:</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>#{receipt.receipt_number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Date Received:</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{formatDate(receipt.received_date)}</div>
          </div>
        </div>

        {/* Amount Box */}
        <div
          style={{
            background: '#f0fdf4',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #dcfce7',
            marginBottom: '35px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '1px', marginBottom: '6px' }}>
            Amount Received
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, color: '#059669' }}>
            {formatCurrency(receipt.amount)}
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ fontSize: '16px', lineHeight: '2', color: '#334155', marginBottom: '40px' }}>
          <p>
            Received with thanks from: <strong style={{ color: '#0f172a' }}>{receipt.clients?.name || 'Customer'}</strong>
          </p>
          <p>
            The sum of: <strong style={{ color: '#059669' }}>{formatCurrency(receipt.amount)}</strong>
          </p>
          <p>
            Payment Method: <strong style={{ color: '#0f172a' }}>{receipt.payment_method || 'UPI / Bank'}</strong>
          </p>
          {receipt.credited_to_account && (
            <p>
              Credited to Account: <strong style={{ color: '#0f172a' }}>{receipt.credited_to_account}</strong>
            </p>
          )}
          {receipt.description && (
            <p>
              For / Remarks: <em style={{ color: '#475569' }}>{receipt.description}</em>
            </p>
          )}
        </div>

        {/* Signature Stamp */}
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ height: '45px', borderBottom: '1px solid #cbd5e1', marginBottom: '8px' }}></div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Authorized Signature
            </p>
            <p style={{ margin: 0, fontWeight: 700, color: '#09090b', fontSize: '14px' }}>Arkatva</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '55px',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
            lineHeight: '1.6',
          }}
        >
          <p style={{ margin: 0 }}>Kelrai, Church Rd, Mangaluru, Karnataka 575029</p>
          <p style={{ margin: 0 }}>contact@arkatva.com | +91 8075 203 446</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            This is an electronically generated official receipt.
          </p>
        </div>
      </div>
    </div>
  );
}
