'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const [username, setUsername] = useState('Anish');

  useEffect(() => {
    const userStr =
      localStorage.getItem('arkatva_auth_user') ||
      localStorage.getItem('scalevyn_auth_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const raw = u.full_name || u.username || 'Anish';
        // Strip out role parentheses e.g. "(Arkatva Owner)", "(Owner)", etc.
        const cleaned = raw.replace(/\s*\(.*?\)/g, '').trim();
        setUsername(cleaned || 'Anish');
      } catch {}
    }
  }, []);

  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.includes('/print')
  ) {
    return null;
  }

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname?.startsWith('/invoices')) return 'Invoices & Billing';
    if (pathname?.startsWith('/quotations')) return 'Quotations Management';
    if (pathname?.startsWith('/receipts')) return 'Receipts & Payments';
    if (pathname?.startsWith('/capital')) return 'Cash Brought In (Capital Inflow)';
    if (pathname?.startsWith('/expenses')) return 'Internal Expenses';
    if (pathname?.startsWith('/withdrawals')) return 'Owner Withdrawals';
    if (pathname?.startsWith('/tickets')) return 'Support Tickets';
    if (pathname?.startsWith('/renewals')) return 'Service Renewals';
    if (pathname?.startsWith('/clients')) return 'Client Registry';
    if (pathname?.startsWith('/products')) return 'Services & Products';
    return 'Arkatva CRM';
  };

  return (
    <>
      <button
        className="mobile-nav-toggle"
        onClick={onToggleSidebar}
        aria-label="Toggle Navigation"
      >
        <Menu size={20} />
      </button>

      <header className="header">
        <h1 className="page-title">{getPageTitle()}</h1>
        <div className="user-profile">
          <div className="user-avatar-dot" />
          <span>{username}</span>
        </div>
      </header>
    </>
  );
}
