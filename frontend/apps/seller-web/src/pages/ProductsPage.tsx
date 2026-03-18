import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Product } from '../types';

function formatBDT(paisa: number): string {
  return 'BDT ' + (paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 });
}

interface ProductFormData {
  name: string;
  description: string;
  priceBDT: string;
  sku: string;
  stock: string;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  priceBDT: '',
  sku: '',
  stock: '',
};

export default function ProductsPage() {
  const { orgId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadProducts = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    apiFetch<Product[]>(`/api/orgs/${orgId}/products`)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description ?? '',
      priceBDT: (p.pricePaisa / 100).toString(),
      sku: p.sku ?? '',
      stock: p.stock != null ? p.stock.toString() : '',
    });
    setEditingId(p.id);
    setError('');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    setError('');
    const pricePaisa = Math.round(parseFloat(form.priceBDT) * 100);
    if (isNaN(pricePaisa) || pricePaisa <= 0) {
      setError('Please enter a valid price');
      setSaving(false);
      return;
    }
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      pricePaisa,
      sku: form.sku.trim() || undefined,
      stock: form.stock ? parseInt(form.stock) : undefined,
    };
    try {
      if (editingId) {
        const updated = await apiFetch<Product>(`/api/products/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await apiFetch<Product>(`/api/orgs/${orgId}/products`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setProducts((prev) => [...prev, created]);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteTarget(null);
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
  });

  function stockBadge(stock: number | null | undefined) {
    if (stock == null) return <span className="stock-badge stock-badge-in">Unlimited</span>;
    if (stock === 0) return <span className="stock-badge stock-badge-out">Out of Stock</span>;
    if (stock <= 5) return <span className="stock-badge stock-badge-low">Low ({stock})</span>;
    return <span className="stock-badge stock-badge-in">{stock} in stock</span>;
  }

  if (!orgId) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>Set up your store first to manage products.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Product
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h2 className="card-title">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-name">Product Name *</label>
                  <input
                    id="prod-name"
                    type="text"
                    className="form-input"
                    placeholder="Product name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-price">Price (BDT) *</label>
                  <input
                    id="prod-price"
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.priceBDT}
                    onChange={(e) => setForm({ ...form, priceBDT: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prod-desc">Description</label>
                <textarea
                  id="prod-desc"
                  className="form-input"
                  placeholder="Product description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-sku">SKU</label>
                  <input
                    id="prod-sku"
                    type="text"
                    className="form-input"
                    placeholder="SKU-001"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-stock">Stock</label>
                  <input
                    id="prod-stock"
                    type="number"
                    className="form-input"
                    placeholder="Unlimited"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>{search ? 'No products match your search.' : 'No products yet. Add your first product to start selling.'}</p>
              {!search && (
                <button className="btn btn-primary" onClick={openAdd}>
                  + Add Product
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-name">{p.name}</div>
                      {p.description && (
                        <div className="text-muted text-sm">{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>
                      )}
                    </td>
                    <td className="font-mono">{formatBDT(p.pricePaisa)}</td>
                    <td className="text-muted">{p.sku ?? '—'}</td>
                    <td>{stockBadge(p.stock)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
