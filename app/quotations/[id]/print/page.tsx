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
        margin: 10,
        filename: `Quotation_${quotation?.quotation_number || 'document'}.pdf`,
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
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading quotation...</div>;
  }

  if (!quotation) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--danger)' }}>Quotation not found.</div>;
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '30px 15px' }}>
      {/* Print Controls */}
      <div
        className="no-print"
        style={{
          maxWidth: '820px',
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
          <Printer size={16} /> Print Quotation
        </button>
      </div>

      {/* Printable Box */}
      <div
        id="quotation-print-box"
        style={{
          maxWidth: '820px',
          margin: 'auto',
          background: 'white',
          padding: '45px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '40px',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '25px',
          }}
        >
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
                Technology & Digital Solutions
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Arkatva</p>
            <p style={{ margin: 0 }}>Kelrai, Church Rd, Mangaluru</p>
            <p style={{ margin: 0 }}>Karnataka 575029</p>
            <p style={{ margin: 0 }}>Phone: +91 8075 203 446 | +91 6364749168</p>
            <p style={{ margin: 0 }}>Email: contact@arkatva.com</p>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px', gap: '20px' }}>
          <div style={{ width: '50%' }}>
            <h3 style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
              Quote Prepared For:
            </h3>
            <p style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
              {quotation.clients?.name}
            </p>
            {quotation.clients?.address && (
              <p style={{ margin: '0 0 4px 0', color: '#475569', fontSize: '14px', whiteSpace: 'pre-line' }}>
                {quotation.clients.address}
              </p>
            )}
            {quotation.clients?.phone && (
              <p style={{ margin: '0 0 4px 0', color: '#475569', fontSize: '14px' }}>
                <strong>Phone:</strong> {quotation.clients.phone}
              </p>
            )}
            {quotation.clients?.email && (
              <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
                <strong>Email:</strong> {quotation.clients.email}
              </p>
            )}
          </div>

          <div style={{ width: '50%', textAlign: 'right' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
              Quotation Number: <strong style={{ fontSize: '16px', color: '#0f172a' }}>#{quotation.quotation_number}</strong>
            </p>
            <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
              Quotation Date: <strong>{formatDate(quotation.quotation_date)}</strong>
            </p>
            {quotation.expiry_date && (
              <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>
                Valid Until: <strong>{formatDate(quotation.expiry_date)}</strong>
              </p>
            )}
            <p style={{ margin: 0, fontSize: '14px' }}>
              Status: <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#059669' }}>{quotation.status}</span>
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>
                Description
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', width: '80px' }}>
                Qty
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', width: '130px' }}>
                Unit Price
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', width: '130px' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontSize: '14px', color: '#1e293b' }}>{item.description}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '280px', borderTop: '2px solid #e2e8f0', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#059669' }}>
              <span>Total Quote:</span>
              <span>{formatCurrency(quotation.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '40px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Notes & Terms:
            </div>
            <div style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-line' }}>{quotation.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: '50px',
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px',
          }}
        >
          <p style={{ margin: 0 }}>Arkatva &bull; Kelrai, Church Rd, Mangaluru &bull; contact@arkatva.com</p>
          <p style={{ margin: '4px 0 0 0' }}>Thank you for considering Arkatva for your digital solutions.</p>
        </div>
      </div>
    </div>
  );
}
