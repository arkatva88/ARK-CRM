'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, Download } from 'lucide-react';

export default function PrintInvoicePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isDownload = searchParams?.get('download') === '1';

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
      const { data: itms } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);
      if (itms) setItems(itms);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (invoice && isDownload && typeof window !== 'undefined') {
      setTimeout(() => {
        downloadPDF();
      }, 800);
    }
  }, [invoice, isDownload]);

  const downloadPDF = () => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById('invoice-print-box');
    const html2pdf = (window as any).html2pdf;
    if (element && html2pdf) {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${invoice?.invoice_number || 'document'}.pdf`,
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
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', background: '#f8fafc', minHeight: '100vh' }}>
        Invoice not found.
      </div>
    );
  }

  const advance = invoice.is_advance_paid ? Number(invoice.advance_amount || 0) : 0;
  const balanceDue = Math.max(0, Number(invoice.total_amount || 0) - advance);
  const isPaid = invoice.status?.toLowerCase() === 'paid' || balanceDue === 0;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '30px 15px', color: '#0f172a' }}>
      {/* Controls */}
      <div
        className="no-print"
        style={{
          maxWidth: '840px',
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
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      {/* Invoice Document Box */}
      <div
        id="invoice-print-box"
        style={{
          maxWidth: '840px',
          margin: 'auto',
          background: '#ffffff',
          color: '#0f172a',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Header: Brand & Contacts */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '36px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '26px',
          }}
        >
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
                Technology & Digital Solutions
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>Arkatva Tech Solutions</p>
            <p style={{ margin: 0, color: '#475569' }}>Kelrai, Church Rd, Mangaluru, KA 575029</p>
            <p style={{ margin: 0, color: '#475569' }}>Phone: +91 8075 203 446 | +91 6364749168</p>
            <p style={{ margin: 0, color: '#475569' }}>Email: contact@arkatva.com</p>
          </div>
        </div>

        {/* Details: Bill To & Invoice Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', gap: '24px' }}>
          {/* Bill To */}
          <div style={{ width: '52%' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.05em' }}>
              Bill To:
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>
              {invoice.clients?.name || 'Customer'}
            </div>
            {invoice.clients?.address && (
              <div style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {invoice.clients.address}
              </div>
            )}
            {invoice.clients?.phone && (
              <div style={{ margin: '0 0 4px 0', color: '#334155', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Phone:</span> {invoice.clients.phone}
              </div>
            )}
            {invoice.clients?.email && (
              <div style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Email:</span> {invoice.clients.email}
                {invoice.clients?.email2 && <span> / {invoice.clients.email2}</span>}
              </div>
            )}
          </div>

          {/* Invoice Summary Box */}
          <div style={{ width: '45%', textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', marginBottom: '12px' }}>
              TAX INVOICE
            </div>
            <div style={{
              display: 'inline-block',
              width: '290px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              textAlign: 'left'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', background: 'transparent' }}>
                <tbody>
                  <tr style={{ background: 'transparent', border: 'none' }}>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#475569', fontWeight: 600, border: 'none', background: 'transparent', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Invoice Number:
                    </td>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 800, textAlign: 'right', border: 'none', background: 'transparent', whiteSpace: 'nowrap' }}>
                      #{invoice.invoice_number}
                    </td>
                  </tr>
                  <tr style={{ background: 'transparent', border: 'none' }}>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#475569', fontWeight: 600, border: 'none', background: 'transparent', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Invoice Date:
                    </td>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 700, textAlign: 'right', border: 'none', background: 'transparent', whiteSpace: 'nowrap' }}>
                      {formatDate(invoice.invoice_date)}
                    </td>
                  </tr>
                  {invoice.due_date && (
                    <tr style={{ background: 'transparent', border: 'none' }}>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#475569', fontWeight: 600, border: 'none', background: 'transparent', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        Due Date:
                      </td>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 700, textAlign: 'right', border: 'none', background: 'transparent', whiteSpace: 'nowrap' }}>
                        {formatDate(invoice.due_date)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: 'transparent', border: 'none' }}>
                    <td style={{ padding: '6px 0 2px 0', fontSize: '13px', color: '#475569', fontWeight: 600, border: 'none', background: 'transparent', borderTop: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Payment Status:
                    </td>
                    <td style={{ padding: '6px 0 2px 0', fontSize: '13px', color: isPaid ? '#047857' : '#b91c1c', fontWeight: 800, textTransform: 'uppercase', border: 'none', background: 'transparent', borderTop: '1px solid #e2e8f0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isPaid ? 'PAID' : 'PAYMENT DUE'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', color: '#0f172a' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
              <th style={{ backgroundColor: '#f1f5f9', padding: '14px 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, letterSpacing: '0.04em', borderBottom: '2px solid #0f172a' }}>
                Description
              </th>
              <th style={{ backgroundColor: '#f1f5f9', padding: '14px 16px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, width: '80px', letterSpacing: '0.04em', borderBottom: '2px solid #0f172a' }}>
                Qty
              </th>
              <th style={{ backgroundColor: '#f1f5f9', padding: '14px 16px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, width: '140px', letterSpacing: '0.04em', borderBottom: '2px solid #0f172a' }}>
                Unit Price
              </th>
              <th style={{ backgroundColor: '#f1f5f9', padding: '14px 16px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, width: '140px', letterSpacing: '0.04em', borderBottom: '2px solid #0f172a' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
                  {item.description}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
                  {formatCurrency(item.unit_price)}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#0f172a', fontWeight: 700 }}>
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
          <div style={{ width: '320px', borderTop: '2px solid #0f172a', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Total Amount:</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(invoice.total_amount)}</span>
            </div>
            {invoice.is_advance_paid && advance > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#047857' }}>
                <span style={{ fontWeight: 600 }}>Advance Paid:</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(advance)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: 900,
                color: balanceDue > 0 ? '#0f172a' : '#047857',
                borderTop: '1px solid #cbd5e1',
                paddingTop: '10px',
                marginTop: '6px',
              }}
            >
              <span>Balance Due:</span>
              <span style={{ color: balanceDue > 0 ? '#b91c1c' : '#047857' }}>{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Bank Details */}
        {invoice.notes && (
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '6px', marginBottom: '36px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
              Payment Instructions / Bank Details:
            </div>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {invoice.notes}
            </div>
          </div>
        )}

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
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>
            Thank you for doing business with Arkatva.
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
            For payment inquiries, contact <strong>contact@arkatva.com</strong> or call <strong>+91 8075 203 446</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
