'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, Download } from 'lucide-react';

export default function PrintQuotationPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isDownload = searchParams?.get('download') === '1';

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
      const { data: itms } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id);

      if (itms) setItems(itms);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (quotation && isDownload && typeof window !== 'undefined') {
      setTimeout(() => {
        downloadPDF();
      }, 800);
    }
  }, [quotation, isDownload]);

  const downloadPDF = () => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById('quotation-print-box');
    const html2pdf = (window as any).html2pdf;
    if (element && html2pdf) {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Quotation_${quotation?.quotation_number || 'document'}.pdf`,
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
        Loading quotation...
      </div>
    );
  }

  if (!quotation) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', background: '#f8fafc', minHeight: '100vh' }}>
        Quotation not found.
      </div>
    );
  }

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '30px 15px', color: '#0f172a' }}>
      {/* Print / Download Controls */}
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
          <Printer size={16} /> Print Quotation
        </button>
      </div>

      {/* Printable Quotation Box */}
      <div
        id="quotation-print-box"
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
        {/* Header: Brand and Company Contacts */}
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
          {/* Logo & Company Name */}
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

          {/* Company Official Contacts */}
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>Arkatva Tech Solutions</p>
            <p style={{ margin: 0, color: '#475569' }}>Kelrai, Church Rd, Mangaluru, KA 575029</p>
            <p style={{ margin: 0, color: '#475569' }}>Phone: +91 8075 203 446 | +91 6364749168</p>
            <p style={{ margin: 0, color: '#475569' }}>Email: contact@arkatva.com</p>
          </div>
        </div>

        {/* Document Title & Client Details Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', gap: '24px' }}>
          {/* Left Column: Client Information */}
          <div style={{ width: '52%' }}>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.05em' }}>
              Quote Prepared For:
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>
              {quotation.clients?.name || 'Customer'}
            </div>
            {quotation.clients?.address && (
              <div style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {quotation.clients.address}
              </div>
            )}
            {quotation.clients?.phone && (
              <div style={{ margin: '0 0 4px 0', color: '#334155', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Phone:</span> {quotation.clients.phone}
              </div>
            )}
            {quotation.clients?.email && (
              <div style={{ margin: 0, color: '#334155', fontSize: '14px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Email:</span> {quotation.clients.email}
              </div>
            )}
          </div>

          {/* Right Column: Official Quote Details */}
          <div style={{ width: '45%', textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em', marginBottom: '12px' }}>
              QUOTATION
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
                      Quotation Number:
                    </td>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 800, textAlign: 'right', border: 'none', background: 'transparent', whiteSpace: 'nowrap' }}>
                      #{quotation.quotation_number}
                    </td>
                  </tr>
                  <tr style={{ background: 'transparent', border: 'none' }}>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#475569', fontWeight: 600, border: 'none', background: 'transparent', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      Quotation Date:
                    </td>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#0f172a', fontWeight: 700, textAlign: 'right', border: 'none', background: 'transparent', whiteSpace: 'nowrap' }}>
                      {formatDate(quotation.quotation_date)}
                    </td>
                  </tr>
                  {quotation.expiry_date && (
                    <tr style={{ background: 'transparent', border: 'none' }}>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#475569', fontWeight: 600, border: 'none', background: 'transparent', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        Valid Until:
                      </td>
                      <td style={{ padding: '4px 0', fontSize: '13px', color: '#047857', fontWeight: 800, textAlign: 'right', border: 'none', background: 'transparent', whiteSpace: 'nowrap' }}>
                        {formatDate(quotation.expiry_date)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quotation Line Items Table */}
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

        {/* Grand Total Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
          <div style={{ width: '320px', borderTop: '2px solid #0f172a', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Total Quote:</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#047857' }}>
                {formatCurrency(quotation.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms (Optional) */}
        {quotation.notes && (
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '6px', marginBottom: '36px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
              Terms & Scope of Work:
            </div>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {quotation.notes}
            </div>
          </div>
        )}

        {/* Document Footer */}
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
            Thank you for considering Arkatva for your digital solutions.
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
            For questions or approval regarding this quotation, contact <strong>contact@arkatva.com</strong> or call <strong>+91 8075 203 446</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
