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
        margin: [10, 10, 10, 10],
        filename: `Receipt_${receipt?.receipt_number || 'voucher'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      html2pdf().from(element).set(opt).save();
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#0f172a', background: '#f8fafc', minHeight: '100vh' }}>
        Loading receipt...
      </div>
    );
  }

  if (!receipt) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', background: '#f8fafc', minHeight: '100vh' }}>
        Receipt not found.
      </div>
    );
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '30px 15px', color: '#0f172a' }}>
      <style>{`
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            background-image: none !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #receipt-print-box {
            box-shadow: none !important;
            border: none !important;
            padding: 16mm 14mm !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Action Buttons */}
      <div
        className="no-print"
        style={{
          maxWidth: '740px',
          margin: '0 auto 20px auto',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}
      >
        <button
          onClick={downloadPDF}
          className="btn btn-primary"
          style={{ background: '#059669', color: '#ffffff', padding: '9px 20px', fontWeight: 600, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} /> Download PDF
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
          style={{ background: '#0f172a', color: '#ffffff', padding: '9px 20px', fontWeight: 600, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      {/* Printable Receipt Box */}
      <div
        id="receipt-print-box"
        style={{
          maxWidth: '740px',
          margin: 'auto',
          background: '#ffffff',
          color: '#0f172a',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          borderTop: '6px solid #047857',
          border: '1px solid #e2e8f0',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '2px solid #e2e8f0', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src="/assets/ark-symbol-dark.png"
              alt="Arkatva Logo"
              style={{ height: '52px', width: 'auto', display: 'block', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/ark-logo.jpeg';
              }}
            />
            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#09090b', letterSpacing: '0.04em', lineHeight: '1.1' }}>
                ARKATVA
              </div>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px' }}>
                Official Financial Receipt
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
              RECEIPT
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              Payment Voucher
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Receipt Number:</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>#{receipt.receipt_number}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>Date Received:</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatDate(receipt.received_date)}</div>
          </div>
        </div>

        {/* Amount Box */}
        <div
          style={{
            background: '#f0fdf4',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            marginBottom: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: '#065f46', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>
            Amount Received
          </div>
          <div style={{ fontSize: '36px', fontWeight: 900, color: '#047857' }}>
            {formatCurrency(receipt.amount)}
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ fontSize: '15px', lineHeight: '2.1', color: '#1e293b', marginBottom: '36px' }}>
          <p style={{ margin: 0 }}>
            Received with thanks from:{' '}
            <strong style={{ color: '#0f172a', fontSize: '16px', fontWeight: 800 }}>
              {receipt.clients?.name || 'Customer'}
            </strong>
          </p>
          <p style={{ margin: 0 }}>
            The sum of:{' '}
            <strong style={{ color: '#047857', fontSize: '16px', fontWeight: 800 }}>
              {formatCurrency(receipt.amount)}
            </strong>
          </p>
          <p style={{ margin: 0 }}>
            Payment Method:{' '}
            <strong style={{ color: '#0f172a', fontWeight: 700 }}>
              {receipt.payment_method || 'UPI / Direct Bank Transfer'}
            </strong>
          </p>
          {receipt.description && (
            <p style={{ margin: 0 }}>
              Towards / Remarks:{' '}
              <span style={{ color: '#334155', fontWeight: 500 }}>{receipt.description}</span>
            </p>
          )}
        </div>

        {/* Signature Stamp */}
        <div style={{ marginTop: '45px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ height: '40px', borderBottom: '1px solid #94a3b8', marginBottom: '8px' }}></div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
              Authorized Signature
            </p>
            <p style={{ margin: '2px 0 0 0', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>Arkatva</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '45px',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
            lineHeight: '1.6',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Kelrai, Church Rd, Mangaluru, Karnataka 575029</p>
          <p style={{ margin: 0, color: '#64748b' }}>arkatva.in@gmail.com | +91 82776 59388 | www.arkatva.in</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
            This is an electronically generated official receipt issued by Arkatva.
          </p>
        </div>
      </div>
    </div>
  );
}
