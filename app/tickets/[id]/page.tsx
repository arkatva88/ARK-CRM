'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    const { data: tk } = await supabase
      .from('tickets')
      .select('*, clients(id, name, email, phone)')
      .eq('id', id)
      .single();

    if (tk) {
      setTicket(tk);
      setStatus(tk.status);

      const { data: msgs } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (msgs) setMessages(msgs);
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);

    const payload = {
      ticket_id: Number(id),
      sender_name: 'Anish (Owner)',
      message: reply.trim(),
    };

    const { error } = await supabase.from('ticket_messages').insert([payload]);
    if (!error) {
      setReply('');
      fetchTicket();
    }
    setSending(false);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ticket #{id}...</div>;
  }

  if (!ticket) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Ticket not found.</div>;
  }

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/tickets" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Tickets
          </Link>
          <div className="page-title">Ticket #{ticket.id}: {ticket.subject}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Status:</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
          >
            <option value="open">Open</option>
            <option value="in-progress">In-Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid-2">
        {/* Ticket Overview */}
        <div className="card" style={{ padding: '1.5rem', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Ticket Info</h3>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Client:</strong> {ticket.clients?.name || 'N/A'}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Email:</strong> {ticket.clients?.email || 'N/A'}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Phone:</strong> {ticket.clients?.phone || 'N/A'}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Priority:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{ticket.priority}</span>
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Created:</strong> {formatDate(ticket.created_at)}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Initial Problem Description</h4>
          <p style={{ color: 'var(--text-main)', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
            {ticket.description || 'No description provided.'}
          </p>
        </div>

        {/* Conversation Thread & Reply */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Conversation Thread</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {messages.length > 0 ? (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <strong>{m.sender_name || 'Staff'}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{formatDate(m.created_at)}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>{m.message}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No replies in thread yet.</p>
            )}
          </div>

          <form onSubmit={handleSendReply}>
            <div className="form-group">
              <label className="form-label">Add Reply / Update Client Note</label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Type response to client or resolution note..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Send size={15} /> {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
