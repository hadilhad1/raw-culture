import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { API_URL, token } = useAuth();

  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    compareAtPrice: '',
    salePrice: '',
    costPrice: '',
    stock: '',
    category: '',
    collection: '',
    status: 'IN_STOCK',
    sizes: 'S, M, L, XL',
    colors: 'Black, White',
    tags: 'streetwear, 2026',
    imageUrls: [''],
    videoUrls: [''],
    featured: false,
    newArrival: true,
    bestSeller: false,
  });

  // Load categories and collections
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/categories`).then((r) => r.json()),
      fetch(`${API_URL}/collections`).then((r) => r.json()),
    ])
      .then(([cats, cols]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setCollections(Array.isArray(cols) ? cols : []);

        if (!isEditing && cats.length > 0 && !formData.category) {
          setFormData((prev) => ({ ...prev, category: cats[0].slug || cats[0].name }));
        }
      })
      .catch(() => {});
  }, [API_URL, isEditing]);

  // Load product if editing
  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    fetch(`${API_URL}/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setFormData({
          name: data.name || '',
          sku: data.sku || '',
          description: data.description || '',
          price: data.price !== undefined ? data.price : '',
          compareAtPrice: data.compareAtPrice !== undefined && data.compareAtPrice !== null ? data.compareAtPrice : '',
          salePrice: data.salePrice !== undefined && data.salePrice !== null ? data.salePrice : '',
          costPrice: data.costPrice !== undefined && data.costPrice !== null ? data.costPrice : '',
          stock: data.stock !== undefined ? data.stock : 0,
          category: data.category?.slug || data.category?.name || '',
          collection: data.collection?.slug || data.collection?.name || '',
          status: data.status || 'IN_STOCK',
          sizes: Array.isArray(data.sizes) ? data.sizes.join(', ') : data.sizes || '',
          colors: Array.isArray(data.colors) ? data.colors.join(', ') : data.colors || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
          imageUrls: data.images?.length ? data.images.map((img) => img.url) : [''],
          videoUrls: data.videos?.length ? data.videos.map((vid) => vid.url) : [''],
          featured: Boolean(data.featured),
          newArrival: Boolean(data.newArrival),
          bestSeller: Boolean(data.bestSeller),
        });
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch product');
      })
      .finally(() => setLoading(false));
  }, [id, isEditing, API_URL]);

  const handleImageUrlChange = (index, value) => {
    const updated = [...formData.imageUrls];
    updated[index] = value;
    setFormData({ ...formData, imageUrls: updated });
  };

  const addImageField = () => {
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
  };

  const removeImageField = (index) => {
    const updated = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, imageUrls: updated.length ? updated : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.sku.trim()) {
      setError('Product Name and SKU are required.');
      return;
    }

    if (Number(formData.price) <= 0) {
      setError('A valid positive price is required.');
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      description: formData.description.trim(),
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
      salePrice: formData.salePrice ? Number(formData.salePrice) : null,
      costPrice: formData.costPrice ? Number(formData.costPrice) : null,
      stock: parseInt(formData.stock || 0, 10),
      category: formData.category,
      collection: formData.collection || null,
      status: formData.status,
      sizes: formData.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: formData.colors.split(',').map((c) => c.trim()).filter(Boolean),
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrls: formData.imageUrls.map((u) => u.trim()).filter(Boolean),
      videoUrls: formData.videoUrls.map((v) => v.trim()).filter(Boolean),
      featured: formData.featured,
      newArrival: formData.newArrival,
      bestSeller: formData.bestSeller,
    };

    try {
      const url = isEditing ? `${API_URL}/products/${id}` : `${API_URL}/products`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save product');
      }

      setSuccess(isEditing ? 'Product updated successfully.' : 'Product created successfully.');
      setTimeout(() => {
        navigate('/products');
      }, 700);
    } catch (err) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-white/50">Loading product editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-[26px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.26em] text-raw-accent">
            {isEditing ? 'Catalog Revision' : 'New Drop'}
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">
            {isEditing ? `Edit: ${formData.name || 'Product'}` : 'Create New Product'}
          </h1>
          <p className="text-xs text-white/50">Fill in product details, variants, media, and inventory status</p>
        </div>

        <Link
          to="/products"
          className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-white/10"
        >
          Cancel
        </Link>
      </header>

      {/* Messages */}
      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Information */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Core Specifications</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Product Title *
              </label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Core Heavyweight Tee"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
                placeholder="e.g. RC-TS-009"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 font-mono text-white outline-none focus:border-raw-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id || c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Collection Drop (Optional)
              </label>
              <select
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              >
                <option value="">None / Standalone</option>
                {collections.map((col) => (
                  <option key={col.id || col.slug} value={col.slug}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Stock Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              >
                <option value="IN_STOCK">IN_STOCK (Available)</option>
                <option value="LOW_STOCK">LOW_STOCK (Warning)</option>
                <option value="OUT_OF_STOCK">OUT_OF_STOCK (Sold Out)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Product Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product composition, fit, cut, and cultural backstory..."
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Pricing & Inventory</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Retail Price (INR) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                placeholder="69.00"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Compare-at Price (Strike-through)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                placeholder="89.00"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Sale Price (Discounted)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Available Stock Units *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                placeholder="25"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>
          </div>
        </div>

        {/* Variants: Sizes & Colors */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Variants & Metadata</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Sizes (Comma-separated)
              </label>
              <input
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                placeholder="XS, S, M, L, XL"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
              <p className="mt-1 text-[10px] text-white/40">Presets: XS, S, M, L, XL, XXL, One Size</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Colors (Comma-separated)
              </label>
              <input
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                placeholder="Black, White, Stone, Olive"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-white/60">
                Search Tags (Comma-separated)
              </label>
              <input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="heavyweight, oversized, summer"
                className="w-full rounded-xl border border-white/15 bg-[#121417] px-4 py-3 text-white outline-none focus:border-raw-accent"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 border-t border-white/10 pt-5">
            <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="h-4 w-4 rounded accent-raw-accent"
              />
              <span>Featured on Homepage</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formData.newArrival}
                onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                className="h-4 w-4 rounded accent-raw-accent"
              />
              <span>New Arrival Badge</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={formData.bestSeller}
                onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
                className="h-4 w-4 rounded accent-raw-accent"
              />
              <span>Best Seller Badge</span>
            </label>
          </div>
        </div>

        {/* Media & Images */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Product Images</h2>
              <p className="text-xs text-white/50">Primary image is shown first in the catalog</p>
            </div>
            <button
              type="button"
              onClick={addImageField}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-wider text-white hover:bg-white/10"
            >
              + Add Image URL
            </button>
          </div>

          <div className="space-y-3">
            {formData.imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-6 text-center">{idx + 1}</span>
                {url ? (
                  <img
                    src={url}
                    alt="Preview"
                    className="h-12 w-10 shrink-0 rounded-lg object-cover border border-white/10"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-12 w-10 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-white/30">
                    N/A
                  </div>
                )}
                <input
                  value={url}
                  onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                  placeholder="https://example.com/image.jpg or /products/tshirt/front.jpg"
                  className="flex-1 rounded-xl border border-white/15 bg-[#121417] px-4 py-2.5 text-xs text-white outline-none focus:border-raw-accent"
                />
                {formData.imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageField(idx)}
                    className="rounded-lg p-2 text-white/40 hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            to="/products"
            className="rounded-full border border-white/15 px-6 py-3 text-xs uppercase tracking-wider text-white hover:bg-white/5"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-raw-accent px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#2346d6] disabled:opacity-50"
          >
            {saving ? 'Saving to Database...' : isEditing ? 'Save Product Changes' : 'Create & Publish Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
