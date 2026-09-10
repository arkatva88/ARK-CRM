'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Plus, MessageSquare, X } from 'lucide-react';
import { Ticket, Client } from '@/lib/types';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    client_id: '',
    subject: '',
    description: '',
    priority: 'medium',
    status: 'open',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: tks } = await supabase
      .from('tickets')
      .select('*, clients(id, name)')
      .order('created_at', { ascending: false });

    const { data: cls } = await supabase.from('clients').select('*').order('name', { ascending: true });

    if (tks) setTickets(tks);
    if (cls) setClients(cls);
    setLoading(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      client_id: parseInt(formData.client_id),
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
    };

    const { error: insertError } = await supabase.from('tickets').insert([payload]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({
        client_id: '',
        subject: '',
        description: '',
        priority: 'medium',
        status: 'open',
      });
      fetchData();
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">CRM Support Tickets</div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Client</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? (
                tickets.map((row) => {
                  let priorityColor = 'var(--text-main)';
                  if (row.priority === 'urgent') priorityColor = 'var(--danger)';
                  else if (row.priority === 'high') priorityColor = 'var(--warning)';

                  let statusBadgeClass = 'badge-pending';
                  if (row.status === 'resolved' || row.status === 'closed') statusBadgeClass = 'badge-paid';
                  else if (row.status === 'open') statusBadgeClass = 'badge-overdue';

                  return (
                    <tr key={row.id}>
                      <td>#{row.id}</td>
                      <td>
                        <strong>{row.subject}</strong>
                      </td>
                      <td>{row.clients?.name || 'N/A'}</td>
                      <td>
                        <span style={{ color: priorityColor, fontWeight: 600, textTransform: 'capitalize' }}>
                          {row.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>{row.status}</span>
                      </td>
                      <td>{formatDate(row.created_at)}</td>
                      <td>
                        <Link
                          href={`/tickets/${row.id}`}
                          style={{
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 500,
                          }}
                        >
                          <MessageSquare size={15} /> View & Reply
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading tickets...' : 'No support tickets found. Click "+ New Ticket" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New Support Ticket</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="form-control"
                  placeholder="e.g. Server down / DNS issue"
                  required
                />
              </div>

              <div className="grid-1-1">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="form-control"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Problem Details</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows={4}
                  placeholder="Details of the client issue..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {saving ? 'Creating Ticket...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
