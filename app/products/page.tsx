'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Product } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditProduct(null);
    setName('');
    setPrice('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setName(p.name);
    setPrice(String(p.price));
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name,
      price: parseFloat(price) || 0,
    };

    if (editProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editProduct.id);

      if (updateError) setError(updateError.message);
      else {
        setShowModal(false);
        fetchProducts();
      }
    } else {
      const { error: insertError } = await supabase.from('products').insert([payload]);
      if (insertError) setError(insertError.message);
      else {
        setShowModal(false);
        fetchProducts();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product/service?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  return (
    <div>
      <div className="header">
        <div className="page-title">Manage Services & Products</div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Add New Product / Service
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td>{formatDate(p.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                          onClick={() => openEditModal(p)}
                          style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer' }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading catalog...' : 'No products or services found. Click "+ Add New Product" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editProduct ? 'Edit Product / Service' : 'Add New Product / Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="badge badge-overdue" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Service / Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Website Development, Cloud Hosting"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-control"
                  placeholder="0.00"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Save Service / Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
