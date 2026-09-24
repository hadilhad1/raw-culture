import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const { API_URL, token } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/categories`),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"?`)) {
      return;
    }

    setDeletingId(productId);
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete');

      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === 'IN_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK';
    try {
      const res = await fetch(`${API_URL}/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      p.category?.slug === selectedCategory ||
      p.category?.name === selectedCategory;

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q);

    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[26px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.26em] text-raw-accent">Product Catalog</span>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">Products</h1>
          <p className="text-xs text-white/50">Manage items, inventory counts, pricing, variants, and stock status</p>
        </div>

        <Link
          to="/products/new"
          className="rounded-full bg-raw-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#2346d6]"
        >
          + Add New Product
        </Link>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-[#16191c] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#121417] px-3.5 py-2">
          <span>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or keyword..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-white/50 hover:text-white">
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#121417] px-3 py-2 text-xs text-white outline-none focus:border-raw-accent"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#121417] px-3 py-2 text-xs text-white outline-none focus:border-raw-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <button
            onClick={fetchData}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs uppercase tracking-wider text-white hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-4 shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-white/50">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-raw-accent border-t-transparent" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em]">Loading Catalog...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-300">
            <p>{error}</p>
            <button onClick={fetchData} className="mt-3 underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <p className="text-2xl">👕</p>
            <p className="mt-2 text-sm font-semibold">No products match your criteria</p>
            <p className="text-xs text-white/30">Create a new product or reset your search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                  <th className="pb-3.5 pr-4">Image</th>
                  <th className="pb-3.5 pr-4">Product Name</th>
                  <th className="pb-3.5 pr-4">SKU</th>
                  <th className="pb-3.5 pr-4">Category</th>
                  <th className="pb-3.5 pr-4">Price</th>
                  <th className="pb-3.5 pr-4">Stock</th>
                  <th className="pb-3.5 pr-4">Status</th>
                  <th className="pb-3.5 pr-4">Badges</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((product) => {
                  const frontImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150&q=80';
                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 pr-4">
                        <img
                          src={frontImage}
                          alt={product.name}
                          className="h-12 w-10 rounded-lg object-cover"
                        />
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-[10px] text-white/40">
                          Sizes: {product.sizes?.join(', ') || 'Standard'}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-white/70">{product.sku}</td>
                      <td className="py-3.5 pr-4 text-white/70">{product.category?.name || 'Unassigned'}</td>
                      <td className="py-3.5 pr-4">
                        <span className="font-bold text-white">₹{Number(product.price).toFixed(2)}</span>
                        {product.compareAtPrice && (
                          <span className="ml-1.5 text-[10px] text-white/40 line-through">
                            ₹{Number(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`font-bold ${product.stock === 0 ? 'text-red-400' : product.stock < 10 ? 'text-amber-400' : 'text-white'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <button
                          onClick={() => handleToggleStatus(product.id, product.status)}
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            product.status === 'IN_STOCK'
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                              : product.status === 'LOW_STOCK'
                              ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                              : 'border-red-500/30 bg-red-500/15 text-red-300'
                          }`}
                        >
                          {product.status || 'IN_STOCK'}
                        </button>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {product.featured && <span className="rounded bg-raw-accent/20 px-1.5 py-0.5 text-[9px] text-raw-accent">Featured</span>}
                          {product.newArrival && <span className="rounded bg-raw-lime/20 px-1.5 py-0.5 text-[9px] text-raw-lime">New</span>}
                          {product.bestSeller && <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] text-purple-300">Best Seller</span>}
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.id}`}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/10"
                          >
                            Edit
                          </Link>
                          <button
                            disabled={deletingId === product.id}
                            onClick={() => handleDelete(product.id, product.name)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
