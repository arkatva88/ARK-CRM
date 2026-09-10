'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, calculateDaysLeft, getWhatsAppLink } from '@/lib/utils';
import {
  Printer,
  Download,
  Receipt as ReceiptIcon,
  MessageSquare,
  Plus,
  TrendingUp,
  Landmark,
  Wallet,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCapital: 0,
    availableBalance: 0,
    totalPending: 0,
    pendingRenewalsCount: 0,
    openTicketsCount: 0,
    totalWithdrawals: 0,
    totalExpenses: 0,
  });

  const [ownerData, setOwnerData] = useState({
    capital: 0,
    receipts: 0,
    withdrawals: 0,
    expenses: 0,
    balance: 0,
    grossProfit: 0,
    retainedCapital: 0,
  });

  const [partnerStats, setPartnerStats] = useState({
    anish: { capital: 0, withdrawals: 0, net: 0 },
    shrinidhi: { capital: 0, withdrawals: 0, net: 0 },
  });

  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Receipts (Revenue)
      const { data: receipts } = await supabase.from('receipts').select('amount, credited_to_account');
      const totalRev = receipts?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;

      // 2. Capital Injections (Cash Brought In)
      const { data: capitalInjections } = await supabase
        .from('capital_injections')
        .select('amount, brought_in_by, deposited_to');
      const totalCap = capitalInjections?.reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

      const anishCap =
        capitalInjections
          ?.filter((c) => c.brought_in_by?.toLowerCase().includes('anish'))
          .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;
      const shrinidhiCap =
        capitalInjections
          ?.filter((c) => c.brought_in_by?.toLowerCase().includes('shrinidhi'))
          .reduce((sum, c) => sum + Number(c.amount || 0), 0) || 0;

      // 3. Expenses
      const { data: expenses } = await supabase.from('expenses').select('amount, debit_from');
      const totalExp = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

      // 4. Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount, withdrawn_by, withdrawn_from');
      const totalWith = withdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      const anishWith =
        withdrawals
          ?.filter((w) => w.withdrawn_by?.toLowerCase().includes('anish'))
          .reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;
      const shrinidhiWith =
        withdrawals
          ?.filter((w) => w.withdrawn_by?.toLowerCase().includes('shrinidhi'))
          .reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

      setPartnerStats({
        anish: { capital: anishCap, withdrawals: anishWith, net: anishCap - anishWith },
        shrinidhi: { capital: shrinidhiCap, withdrawals: shrinidhiWith, net: shrinidhiCap - shrinidhiWith },
      });

      // 5. Invoices
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('*, clients(id, name, phone, email, address)')
        .order('created_at', { ascending: false });

      const pendingInvs = (allInvoices || []).filter(
        (i) => i.status !== 'paid' && i.status !== 'cancelled'
      );

      const totalPend = pendingInvs.reduce((sum, inv) => {
        const advance = inv.is_advance_paid ? Number(inv.advance_amount || 0) : 0;
        return sum + (Number(inv.total_amount || 0) - advance);
      }, 0);

      // 6. Renewals (< 30 days)
      const now = new Date();
      const thirtyDaysAhead = new Date();
      thirtyDaysAhead.setDate(now.getDate() + 30);
      const thirtyDaysAheadStr = thirtyDaysAhead.toISOString().split('T')[0];

      const { data: renewals } = await supabase
        .from('services')
        .select('*, clients(id, name, phone)')
        .lte('expiry_date', thirtyDaysAheadStr)
        .order('expiry_date', { ascending: true })
        .limit(5);

      const { count: renewCount } = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .lte('expiry_date', thirtyDaysAheadStr)
        .eq('status', 'active');

      // 7. Tickets
      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      // 8. Recent Quotations
      const { data: quotations } = await supabase
        .from('quotations')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Financial calculations (Including Cash Brought Into Business)
      const availBal = (totalRev + totalCap) - totalWith - totalExp;
      const grossProf = totalRev - totalExp;
      const retainedCap = totalCap + grossProf - totalWith;

      setStats({
        totalRevenue: totalRev,
        totalCapital: totalCap,
        availableBalance: availBal,
        totalPending: totalPend,
        pendingRenewalsCount: renewCount || renewals?.length || 0,
        openTicketsCount: ticketCount || 0,
        totalWithdrawals: totalWith,
        totalExpenses: totalExp,
      });

      setOwnerData({
        capital: totalCap,
        receipts: totalRev,
        withdrawals: totalWith,
        expenses: totalExp,
        balance: availBal,
        grossProfit: grossProf,
        retainedCapital: retainedCap,
      });

      setPendingInvoices(pendingInvs.slice(0, 5));
      setUpcomingRenewals(renewals || []);
      setRecentTransactions(allInvoices ? allInvoices.slice(0, 5) : []);
      setRecentQuotations(quotations || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Top Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-title">
            <span>Total Revenue</span>
            <ArrowUpRight size={16} color="var(--text-muted)" />
          </div>
          <div className="stat-card-value">{formatCurrency(stats.totalRevenue)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Cash Brought In</span>
            <TrendingUp size={16} color="#34d399" />
          </div>
          <div className="stat-card-value" style={{ color: '#34d399' }}>
            {formatCurrency(stats.totalCapital)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Available Cash Balance</span>
            <Wallet size={16} color="#ffffff" />
          </div>
          <div
            className="stat-card-value"
            style={{ color: stats.availableBalance >= 0 ? '#ffffff' : 'var(--danger)' }}
          >
            {formatCurrency(stats.availableBalance)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Pending Receivables</span>
            <ReceiptIcon size={16} color="var(--danger)" />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
            {formatCurrency(stats.totalPending)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Renewals (30d)</span>
            <RefreshCw size={16} color="#fbbf24" />
          </div>
          <div className="stat-card-value">{stats.pendingRenewalsCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">
            <span>Open Tickets</span>
            <Landmark size={16} color="var(--text-muted)" />
          </div>
          <div className="stat-card-value">{stats.openTicketsCount}</div>
        </div>
      </div>

      {/* Partner Accounts & Financial Health */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>
              Partner Accounts & Financial Health
            </h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Arkatva Partnership Ledger: Capital introduced, partner drawings & consolidated cashflow
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link href="/capital" className="btn btn-primary btn-sm">
              <Plus size={14} /> Cash Brought In
            </Link>
            <Link href="/receipts/new" className="btn btn-secondary btn-sm">
              <Plus size={14} /> Log Receipt
            </Link>
            <Link href="/expenses" className="btn btn-secondary btn-sm">
              <Plus size={14} /> Add Expense
            </Link>
            <Link href="/withdrawals" className="btn btn-secondary btn-sm">
              <Plus size={14} /> Withdrawal
            </Link>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Partner / Account</th>
                <th>Capital Injected</th>
                <th>Personal Drawings</th>
                <th>Net Contributed Equity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style={{ color: '#ffffff' }}>Anish</strong>
                </td>
                <td style={{ color: '#34d399', fontWeight: 600 }}>
                  + {formatCurrency(partnerStats.anish.capital)}
                </td>
                <td style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  - {formatCurrency(partnerStats.anish.withdrawals)}
                </td>
                <td style={{ color: '#ffffff', fontWeight: 700 }}>
                  {formatCurrency(partnerStats.anish.net)}
                </td>
              </tr>
              <tr>
                <td>
                  <strong style={{ color: '#ffffff' }}>Shrinidhi M</strong>
                </td>
                <td style={{ color: '#34d399', fontWeight: 600 }}>
                  + {formatCurrency(partnerStats.shrinidhi.capital)}
                </td>
                <td style={{ color: 'var(--warning)', fontWeight: 600 }}>
                  - {formatCurrency(partnerStats.shrinidhi.withdrawals)}
                </td>
                <td style={{ color: '#ffffff', fontWeight: 700 }}>
                  {formatCurrency(partnerStats.shrinidhi.net)}
                </td>
              </tr>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--border-main)' }}>
                <td>
                  <strong style={{ color: '#ffffff' }}>Arkatva Treasury (Consolidated)</strong>
                </td>
                <td style={{ color: '#34d399', fontWeight: 600 }}>
                  Total Inflow: {formatCurrency(ownerData.capital)}
                </td>
                <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  Expenses: - {formatCurrency(ownerData.expenses)}
                </td>
                <td style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem' }}>
                  Available Cash: {formatCurrency(ownerData.balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit & Capital Retained */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>
              Firm Profitability & Retained Capital
            </h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Partnership valuation: Combined capital + Net earnings - Partner drawings
            </span>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Entity</th>
                <th>Combined Capital Introduced</th>
                <th>Gross Operating Profit</th>
                <th>Combined Partner Drawings</th>
                <th>Total Retained Business Capital</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style={{ color: '#ffffff' }}>Arkatva (Anish & Shrinidhi M)</strong>
                </td>
                <td style={{ color: '#34d399', fontWeight: 600 }}>
                  {formatCurrency(ownerData.capital)}
                </td>
                <td style={{ color: '#ffffff', fontWeight: 600 }}>
                  {formatCurrency(ownerData.grossProfit)}
                </td>
                <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  {formatCurrency(ownerData.withdrawals)}
                </td>
                <td
                  style={{
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: ownerData.retainedCapital >= 0 ? '#ffffff' : 'var(--danger)',
                  }}
                >
                  {formatCurrency(ownerData.retainedCapital)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invoices */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>Pending Invoices</h2>
          <Link href="/invoices" className="btn btn-outline btn-sm">
            View All Invoices
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Pending Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvoices.length > 0 ? (
                pendingInvoices.map((row) => {
                  const advance = row.is_advance_paid ? Number(row.advance_amount || 0) : 0;
                  const pending = Number(row.total_amount || 0) - advance;
                  const statusClass = `badge-${row.status?.toLowerCase() || 'pending'}`;

                  return (
                    <tr key={row.id}>
                      <td>
                        <strong style={{ color: '#ffffff' }}>#{row.invoice_number}</strong>
                      </td>
                      <td>{row.clients?.name || 'N/A'}</td>
                      <td>{formatDate(row.invoice_date)}</td>
                      <td>{formatCurrency(row.total_amount)}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                        {formatCurrency(pending)}
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`}>{row.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <Link
                            href={`/receipts/new?client_id=${row.client_id}&invoice_id=${row.id}`}
                            style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 500 }}
                            title="Generate Receipt"
                          >
                            <ReceiptIcon size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Send Receipt
                          </Link>
                          <Link
                            href={`/invoices/${row.id}/print`}
                            target="_blank"
                            style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 500 }}
                            title="Print Invoice"
                          >
                            <Printer size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Print
                          </Link>
                          <Link
                            href={`/invoices/${row.id}/print?download=1`}
                            target="_blank"
                            style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 500 }}
                            title="Download PDF"
                          >
                            <Download size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            PDF
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading invoices...' : 'No pending invoices found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Renewals & Reminders */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>Upcoming Renewals & Reminders</h2>
          <Link href="/renewals" className="btn btn-outline btn-sm">
            View All Renewals
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Client</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {upcomingRenewals.length > 0 ? (
                upcomingRenewals.map((row) => {
                  const daysLeft = calculateDaysLeft(row.expiry_date);
                  const daysText =
                    daysLeft < 0
                      ? `Expired (${Math.abs(daysLeft)} days ago)`
                      : daysLeft === 0
                      ? 'Expires Today'
                      : `${daysLeft} days left`;

                  const daysColor =
                    daysLeft < 0 ? 'var(--danger)' : daysLeft < 7 ? 'var(--warning)' : '#ffffff';

                  const serviceDisplay = row.name_of_service || row.service_type || 'Service Subscription';
                  const waMsg = `Hello ${row.clients?.name || 'Customer'}, your subscription for ${serviceDisplay} is expiring on ${formatDate(
                    row.expiry_date
                  )}. Please renew to avoid service interruption. - Arkatva.com`;
                  const waLink = getWhatsAppLink(row.clients?.phone, waMsg);

                  return (
                    <tr key={row.id}>
                      <td>
                        <strong style={{ color: '#ffffff' }}>{serviceDisplay}</strong>
                      </td>
                      <td>{row.clients?.name || 'N/A'}</td>
                      <td>{formatDate(row.expiry_date)}</td>
                      <td style={{ color: daysColor, fontWeight: 600 }}>{daysText}</td>
                      <td>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-whatsapp"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageSquare size={14} style={{ marginRight: '4px' }} /> Send Reminder
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading upcoming renewals...' : 'No upcoming renewals in the next 30 days.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Invoices / Transactions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>Recent Transactions</h2>
          <Link href="/invoices" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Account Credited</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong style={{ color: '#ffffff' }}>#{row.invoice_number}</strong>
                    </td>
                    <td>{row.clients?.name || 'N/A'}</td>
                    <td>{formatDate(row.invoice_date)}</td>
                    <td>{formatCurrency(row.total_amount)}</td>
                    <td>Arkatva Primary Account</td>
                    <td>
                      <span className={`badge badge-${row.status?.toLowerCase()}`}>{row.status}</span>
                    </td>
                    <td>
                      <Link
                        href={`/invoices/${row.id}/print`}
                        target="_blank"
                        style={{ color: '#ffffff', marginRight: '1rem' }}
                        title="Print"
                      >
                        <Printer size={16} />
                      </Link>
                      <Link
                        href={`/invoices/${row.id}/print?download=1`}
                        target="_blank"
                        style={{ color: '#34d399' }}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading transactions...' : 'No transactions recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Quotations */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff' }}>Recent Quotations</h2>
          <Link href="/quotations" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Expiry</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotations.length > 0 ? (
                recentQuotations.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong style={{ color: '#ffffff' }}>#{row.quotation_number}</strong>
                    </td>
                    <td>{row.clients?.name || 'N/A'}</td>
                    <td>{formatDate(row.quotation_date)}</td>
                    <td>{formatDate(row.expiry_date)}</td>
                    <td>{formatCurrency(row.total_amount)}</td>
                    <td>
                      <span className={`badge badge-${row.status?.toLowerCase()}`}>{row.status}</span>
                    </td>
                    <td>
                      <Link
                        href={`/quotations/${row.id}/print`}
                        target="_blank"
                        style={{ color: '#ffffff', marginRight: '1rem' }}
                        title="Print"
                      >
                        <Printer size={16} />
                      </Link>
                      <Link
                        href={`/quotations/${row.id}/print?download=1`}
                        target="_blank"
                        style={{ color: '#34d399' }}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading quotations...' : 'No quotations recorded yet.'}
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
