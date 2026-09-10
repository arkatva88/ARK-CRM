'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, calculateDaysLeft, getWhatsAppLink } from '@/lib/utils';
import { Plus, Trash2, MessageSquare, X } from 'lucide-react';
import { Service, Client } from '@/lib/types';

export default function RenewalsPage() {
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    client_id: '',
    name_of_service: '',
    purchase_date: new Date().toISOString().split('T')[0],
    duration_years: '1',
    cost: '',
    status: 'active',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: servs } = await supabase
      .from('services')
      .select('*, clients(id, name, phone)')
      .order('expiry_date', { ascending: true });

    const { data: cls } = await supabase.from('clients').select('*').order('name', { ascending: true });

    if (servs) setServices(servs);
    if (cls) setClients(cls);
    setLoading(false);
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const years = parseInt(formData.duration_years) || 1;
    const pDate = new Date(formData.purchase_date);
    const expDate = new Date(pDate);
    expDate.setFullYear(expDate.getFullYear() + years);
    const expiryDateStr = expDate.toISOString().split('T')[0];

    const payload = {
      client_id: parseInt(formData.client_id),
      service_type: 'other',
      domain_name: '',
      name_of_service: formData.name_of_service,
      purchase_date: formData.purchase_date,
      duration: `${years} Year${years > 1 ? 's' : ''}`,
      cost: parseFloat(formData.cost) || 0,
      expiry_date: expiryDateStr,
      status: formData.status,
    };

    const { error: insertError } = await supabase.from('services').insert([payload]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      setFormData({
        client_id: '',
        name_of_service: '',
        purchase_date: new Date().toISOString().split('T')[0],
        duration_years: '1',
        cost: '',
        status: 'active',
      });
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    await supabase.from('services').delete().eq('id', id);
    fetchData();
  };

  return (
    <div>
      <div className="header">
        <div>
          <div className="page-title">Service Renewals</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track and manage recurring subscription renewals with instant WhatsApp reminders
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Subscription
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Client</th>
                <th>Purchase Date</th>
                <th>Duration</th>
                <th>Expiry Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map((row) => {
                  const daysLeft = calculateDaysLeft(row.expiry_date);
                  let badgeClass = 'badge-paid';
                  let displayStatus = row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Active';

                  if (row.status === 'cancelled') {
                    badgeClass = 'badge-cancelled';
                  } else if (daysLeft < 0 || row.status === 'expired') {
                    badgeClass = 'badge-overdue';
                    displayStatus = `Expired (${Math.abs(daysLeft)}d ago)`;
                  } else if (daysLeft < 15) {
                    badgeClass = 'badge-pending';
                    displayStatus = `${daysLeft} days left`;
                  }

                  const serviceDisplay = row.name_of_service || row.service_type || 'Service';
                  const waMsg = `Hello ${row.clients?.name || 'Client'}, your subscription for ${serviceDisplay} is expiring on ${formatDate(
                    row.expiry_date
                  )}. Please renew to avoid service interruption. - Arkatva.com`;
                  const waLink = getWhatsAppLink(row.clients?.phone, waMsg);

                  return (
                    <tr key={row.id}>
                      <td>
                        <strong>{serviceDisplay}</strong>
                      </td>
                      <td>{row.clients?.name || 'N/A'}</td>
                      <td>{formatDate(row.purchase_date)}</td>
                      <td>{row.duration || 'N/A'}</td>
                      <td>{formatDate(row.expiry_date)}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(row.cost)}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{displayStatus}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-whatsapp"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare size={13} style={{ marginRight: '4px' }} /> WhatsApp
                          </a>
                          <button
                            onClick={() => handleDelete(row.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading subscriptions...' : 'No renewal subscriptions found. Click "+ Add Subscription" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Subscription Renewal</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubscription}>
              <div className="form-group">
                <label className="form-label">Select Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="form-control"
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input
                  type="text"
                  value={formData.name_of_service}
                  onChange={(e) => setFormData({ ...formData, name_of_service: e.target.value })}
                  className="form-control"
                  placeholder="e.g. Website Maintenance, Domain Renewal, AWS Server"
                  required
                />
              </div>

              <div className="grid-1-1">
                <div className="form-group">
                  <label className="form-label">Purchase Date *</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select
                    value={formData.duration_years}
                    onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })}
                    className="form-control"
                  >
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years</option>
                  </select>
                </div>
              </div>

              <div className="grid-1-1">
                <div className="form-group">
                  <label className="form-label">Renewal Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="form-control"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {saving ? 'Saving...' : 'Save Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
