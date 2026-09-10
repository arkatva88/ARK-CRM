'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  Wallet,
  Coins,
  Ticket,
  RefreshCw,
  Users,
  Package,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // If on login, forgot-password, or print pages, do not render sidebar
  if (
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.includes('/print')
  ) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Invoices', href: '/invoices', icon: FileText },
    { label: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
    { label: 'Receipts', href: '/receipts', icon: Receipt },
    { label: 'Cash Brought In', href: '/capital', icon: TrendingUp },
    { label: 'Expenses', href: '/expenses', icon: Wallet },
    { label: 'Withdrawals', href: '/withdrawals', icon: Coins },
    { label: 'Tickets', href: '/tickets', icon: Ticket },
    { label: 'Renewals', href: '/renewals', icon: RefreshCw },
    { label: 'Clients', href: '/clients', icon: Users },
    { label: 'Products & Services', href: '/products', icon: Package },
  ];

  const handleLogout = () => {
    localStorage.removeItem('arkatva_auth_user');
    localStorage.removeItem('scalevyn_auth_user');
    window.location.href = '/login';
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 95,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-brand">
          <Link href="/" className="brand-wrapper" onClick={onClose}>
            <img
              src="/assets/ark-logo.jpeg"
              alt="Arkatva Logo"
              className="brand-logo-img"
              onError={(e) => {
                // Fallback if jpeg doesn't load
                (e.target as HTMLImageElement).src = '/assets/logo.png';
              }}
            />
            <div className="brand-text">
              ARKATVA
              <span className="brand-badge">CRM</span>
            </div>
          </Link>

          {isOpen && (
            <button
              onClick={onClose}
              className="modal-close"
              aria-label="Close Navigation"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <ul className="sidebar-nav">
          <li className="nav-section-title">Navigation</li>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <li key={item.href} className="nav-item">
                <Link
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}

          <li className="nav-item" style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{
                color: 'var(--danger)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </li>
        </ul>
      </aside>
    </>
  );
}
