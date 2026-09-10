'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Invalid username or password.');
      } else {
        localStorage.setItem('arkatva_auth_user', JSON.stringify(data.user));
        localStorage.setItem('scalevyn_auth_user', JSON.stringify(data.user));
        router.push('/');
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        backgroundImage: `
          radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: '#111217',
          padding: '2.5rem',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
        }}
      >
        {/* Brand Header with Faceted Crystal Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              margin: '0 auto 1.25rem',
              borderRadius: '16px',
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src="/assets/ark-logo.jpeg"
              alt="Arkatva Crystal Emblem"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/logo.png';
              }}
            />
          </div>

          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            ARKATVA
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '0.15rem 0.45rem',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#e2e8f0',
              }}
            >
              CRM
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
            Enterprise Billing & Financial Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} color="var(--text-muted)" /> Email / Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control"
              placeholder="crm@arkatva.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="var(--text-muted)" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
            <Link
              href="/forgot-password"
              style={{
                fontSize: '0.8rem',
                color: '#cbd5e1',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.15s',
              }}
              onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#ffffff')}
              onMouseOut={(e) => ((e.target as HTMLElement).style.color = '#cbd5e1')}
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              'Signing In...'
            ) : (
              <>
                Sign In to Arkatva <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '2.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
          }}
        >
          <p>&copy; {new Date().getFullYear()} Arkatva.com &bull; Confidential & Secure</p>
        </div>
      </div>
    </div>
  );
}
