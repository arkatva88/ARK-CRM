'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', username, dob }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Identity verification failed.');
      } else {
        setUserId(data.userId);
        setStep(2);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', newPassword: password, userId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to update password.');
      } else {
        setMessage('Password reset successfully! You can now login.');
        setStep(3);
      }
    } catch {
      setError('An error occurred. Please try again.');
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
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 1rem',
              borderRadius: '12px',
              background: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyRound size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 700 }}>Reset Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Verify account ownership with Date of Birth
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: 'var(--success-bg)',
              color: 'var(--success)',
              border: '1px solid var(--success-border)',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              textAlign: 'center',
            }}
          >
            {message}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Username / Admin Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-control"
                placeholder="crm@arkatva.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="form-control"
                required
              />
              <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '0.25rem' }}>
                Used for identity security verification
              </small>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.75rem' }}
            >
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.75rem' }}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Sign In Now
            </Link>
          </div>
        )}

        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <Link
            href="/login"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
