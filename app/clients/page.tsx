'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Plus, X, Phone, Mail, MapPin } from 'lucide-react';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    email2: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('clients').insert([formData]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({ name: '', email: '', email2: '', phone: '', address: '' });
      fetchClients();
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Client Directory</div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add New Client
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.name}</strong>
                    </td>
                    <td>
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} color="var(--text-muted)" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.email2 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Mail size={12} />
                          <span>{client.email2}</span>
                        </div>
                      )}
                      {!client.email && !client.email2 && 'N/A'}
                    </td>
                    <td>
                      {client.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{client.phone}</span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>
                      {client.address ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="var(--text-muted)" />
                          <span>{client.address}</span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{formatDate(client.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading clients...' : 'No clients found in registry. Click "+ Add New Client" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add New Client</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddClient}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                  placeholder="e.g. John Doe / Acme Corp"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address 1 (Primary)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-control"
                  placeholder="name@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address 2 (Optional)</label>
                <input
                  type="email"
                  value={formData.email2}
                  onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                  className="form-control"
                  placeholder="accounts@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-control"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-control"
                  rows={3}
                  placeholder="Full office or postal address..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {saving ? 'Saving...' : 'Save Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
