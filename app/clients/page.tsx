'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Plus, X, Phone, Mail, MapPin, Edit2, CheckCircle2 } from 'lucide-react';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    email2: '',
    phone: '',
    address: '',
  });

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    email2: '',
    phone: '',
    address: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

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
      setSuccessMsg('New client added successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchClients();
    }
    setSaving(false);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditFormData({
      name: client.name || '',
      email: client.email || '',
      email2: client.email2 || '',
      phone: client.phone || '',
      address: client.address || '',
    });
    setEditError('');
    setEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setEditSaving(true);
    setEditError('');

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        name: editFormData.name.trim(),
        email: editFormData.email.trim() || null,
        email2: editFormData.email2.trim() || null,
        phone: editFormData.phone.trim() || null,
        address: editFormData.address.trim() || null,
      })
      .eq('id', editingClient.id);

    if (updateError) {
      setEditError(updateError.message);
    } else {
      setEditModal(false);
      setEditingClient(null);
      setSuccessMsg('Customer details updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchClients();
    }
    setEditSaving(false);
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Client Directory</div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add New Client
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </div>
      )}

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
                <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{client.name}</strong>
                    </td>
                    <td>
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} color="var(--text-muted)" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.email2 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <Mail size={12} />
                          <span>{client.email2}</span>
                        </div>
                      )}
                      {!client.email && !client.email2 && <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                    </td>
                    <td>
                      {client.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{client.phone}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      {client.address ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', maxWidth: '280px' }}>
                          <MapPin size={13} color="var(--text-muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'pre-line', fontSize: '0.85rem' }}>{client.address}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(client.created_at)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '6px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                        title="Edit Customer Details"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
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
                  placeholder="e.g. Chaavadi Store / Acme Corp"
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

      {/* Edit Customer Details Modal */}
      {editModal && editingClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} /> Edit Customer Details
              </h3>
              <button onClick={() => setEditModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateClient}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="form-control"
                  placeholder="Customer / Company Name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address 1 (Primary)</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="form-control"
                  placeholder="primary@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address 2 (Optional)</label>
                <input
                  type="email"
                  value={editFormData.email2}
                  onChange={(e) => setEditFormData({ ...editFormData, email2: e.target.value })}
                  className="form-control"
                  placeholder="accounts@company.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="form-control"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Address</label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="form-control"
                  rows={3}
                  placeholder="Complete postal address for quotes & invoices..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center', background: 'var(--success)', borderColor: 'var(--success)' }}
                >
                  {editSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
