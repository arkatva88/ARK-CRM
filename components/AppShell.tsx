'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.includes('/print');

  useEffect(() => {
    setMounted(true);
    if (!isAuthPage) {
      const user =
        localStorage.getItem('arkatva_auth_user') ||
        localStorage.getItem('scalevyn_auth_user');
      if (!user) {
        router.push('/login');
      }
    }
  }, [isAuthPage, router, pathname]);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }} />;
  }

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </div>
    </div>
  );
}
