import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import OrderDetailsModal from './components/OrderDetailsModal';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

function getToken() {
  return localStorage.getItem('raw_admin_token') || '';
}

function saveToken(token) {
  localStorage.setItem('raw_admin_token', token);
}

function clearToken() {
  localStorage.removeItem('raw_admin_token');
}

function AdminLayout({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <div className="admin-shell min-h-screen bg-[#111315] text-white">
      <div className="flex min-h-screen">
        <aside className="w-[260px] border-r border-white/10 bg-[#121517] p-6">
          <div className="mb-10 text-xl font-black uppercase tracking-[0.18em]">RAW-CULTURE ADMIN</div>
          <nav className="space-y-2 text-sm uppercase tracking-[0.12em] text-white/60">
            <NavLink to="/admin" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Dashboard</NavLink>
            <NavLink to="/admin/products" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Products</NavLink>
            <NavLink to="/admin/products/new" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Add Product</NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Categories</NavLink>
            <NavLink to="/admin/collections" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Collections</NavLink>
            <NavLink to="/admin/inventory" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Inventory</NavLink>
            <NavLink to="/admin/orders" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Orders</NavLink>
            <NavLink to="/admin/customers" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Customers</NavLink>
            <NavLink to="/admin/content" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Content</NavLink>
            <NavLink to="/admin/media" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Media Library</NavLink>
            <NavLink to="/admin/videos" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Videos</NavLink>
            <NavLink to="/admin/coupons" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Coupons</NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => `block rounded-xl px-3 py-2 ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Settings</NavLink>
          </nav>
          <button onClick={() => { clearToken(); window.location.href = '/admin/login'; }} className="mt-10 w-full rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">Logout</button>
        </aside>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@rawculture.com', password: 'Admin@123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      saveToken(data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111315] p-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#171a1d] p-8 shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">Admin access</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">RAW-CULTURE Login</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white outline-none" />
          </div>
          {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <button disabled={loading} className="w-full rounded-full bg-raw-accent px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-60">{loading ? 'Signing in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, lowStockProducts: 0, pendingOrders: 0, processingOrders: 0, deliveredOrders: 0, cancelledOrders: 0 });

  useEffect(() => {
    fetch(`${API_URL}/dashboard`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total sales', value: `$${(stats.totalSales || 0).toLocaleString()}`, accent: 'bg-raw-accent' },
    { label: 'Today sales', value: '$4.8K', accent: 'bg-raw-lime text-black' },
    { label: 'Monthly sales', value: '$62.1K', accent: 'bg-white text-black' },
    { label: 'Total orders', value: (stats.totalOrders || 0).toString(), accent: 'bg-[#1b1f22]' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between rounded-[22px] border border-white/10 bg-[#171a1d] p-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">Export</button>
          <Link to="/admin/products/new" className="rounded-full bg-raw-accent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">Add product</Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`${card.accent} rounded-[24px] p-5`}>
            <p className="text-[10px] uppercase tracking-[0.24em] opacity-70">{card.label}</p>
            <p className="mt-5 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-6">
          <h2 className="text-xl font-semibold">Revenue over time</h2>
          <div className="mt-6 h-64 rounded-[18px] bg-[linear-gradient(180deg,#1f2427,#171a1d)] p-4">
            <div className="flex h-full items-end gap-3">
              {[40,60,55,70,78,88,95,75,90,68,85,98].map((value, index) => (
                <div key={index} className="flex-1 rounded-t-xl bg-raw-accent/80" style={{ height: `${value}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-6">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          <ul className="mt-6 space-y-4 text-sm text-white/70">
            <li className="flex items-center justify-between"><span>New order #2034</span><span>2m ago</span></li>
            <li className="flex items-center justify-between"><span>Low stock alert</span><span>25m ago</span></li>
            <li className="flex items-center justify-between"><span>Homepage updated</span><span>1h ago</span></li>
            <li className="flex items-center justify-between"><span>Customer signup</span><span>2h ago</span></li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch(() => setError('Unable to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const onDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    const response = await fetch(`${API_URL}/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    if (response.ok) {
      setProducts((current) => current.filter((item) => item.id !== productId));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Products</h1>
        </div>
        <Link to="/admin/products/new" className="rounded-full bg-raw-accent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">Add product</Link>
      </header>

      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        {loading ? <div>Loading products...</div> : error ? <div className="text-red-300">{error}</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="py-3 pr-4">Image</th>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-white/10 align-middle">
                    <td className="py-3 pr-4"><img src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80'} alt={product.name} className="h-12 w-12 rounded-lg object-cover" /></td>
                    <td className="py-3 pr-4">{product.name}</td>
                    <td className="py-3 pr-4">{product.sku}</td>
                    <td className="py-3 pr-4">{product.category?.name || 'Unassigned'}</td>
                    <td className="py-3 pr-4">${Number(product.price || 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">{product.stock}</td>
                    <td className="py-3 pr-4">{product.status || 'IN_STOCK'}</td>
                    <td className="py-3 pr-4 space-x-2">
                      <Link to={`/admin/products/${product.id}`} className="text-raw-accent">Edit</Link>
                      <button onClick={() => onDelete(product.id)} className="text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const initialForm = {
    name: '',
    sku: '',
    category: 't-shirts',
    collection: 'summer-2026',
    description: '',
    price: 0,
    salePrice: 0,
    stock: 0,
    sizes: 'S,M,L,XL',
    colors: 'Black,White',
    tags: 'new,streetwear',
    images: '',
    videos: '',
    featured: false,
    newArrival: false,
    bestSeller: false,
    status: 'IN_STOCK',
  };
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!editing) return;
    fetch(`${API_URL}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...initialForm,
          name: data.name || '',
          sku: data.sku || '',
          category: data.category?.slug || 't-shirts',
          description: data.description || '',
          price: data.price || 0,
          salePrice: data.salePrice || 0,
          stock: data.stock || 0,
          sizes: (data.sizes || []).join(','),
          colors: (data.colors || []).join(','),
          tags: (data.tags || []).join(','),
          images: (data.images || []).map((image) => image.url).join(','),
          videos: (data.videos || []).map((video) => video.url).join(','),
          featured: Boolean(data.featured),
          newArrival: Boolean(data.newArrival),
          bestSeller: Boolean(data.bestSeller),
          status: data.status || 'IN_STOCK',
        });
      });
  }, [editing, id]);

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.sku || Number(form.price) <= 0) {
      setError('Product name, SKU, and a positive price are required.');
      return;
    }

    setLoading(true);
    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      price: Number(form.price),
      salePrice: Number(form.salePrice || 0),
      costPrice: Number(form.salePrice || 0),
      stock: Number(form.stock || 0),
      categories: [form.category],
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map((size) => size.trim()).filter(Boolean),
      colors: form.colors.split(',').map((color) => color.trim()).filter(Boolean),
      imageUrls: form.images.split(',').map((url) => url.trim()).filter(Boolean),
      videoUrls: form.videos.split(',').map((url) => url.trim()).filter(Boolean),
      featured: form.featured,
      newArrival: form.newArrival,
      bestSeller: form.bestSeller,
      status: form.status,
    };

    const response = await fetch(`${API_URL}/products${editing ? `/${id}` : ''}`, {
      method: editing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.message || 'Failed to save product.');
      return;
    }

    setSuccess(editing ? 'Product updated.' : 'Product created successfully.');
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{editing ? 'Edit product' : 'Add product'}</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-6 rounded-[24px] border border-white/10 bg-[#171a1d] p-6">
        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</div>}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Product name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">SKU</label>
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white">
              <option value="t-shirts">T-Shirts</option>
              <option value="hoodies">Hoodies</option>
              <option value="pants">Pants</option>
              <option value="jackets">Jackets</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-32 w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Price</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" required />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Sale price</label>
            <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Stock</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white">
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Sizes</label>
            <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Colors</label>
            <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Image URLs</label>
            <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" placeholder="https://image1.jpg, https://image2.jpg" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Video URLs</label>
            <input value={form.videos} onChange={(e) => setForm({ ...form, videos: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" placeholder="https://video.mp4" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Tags</label>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/60">Collection</label>
            <input value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#1d2124] px-4 py-3 text-white" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} /> New Arrival</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} /> Best Seller</label>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/admin/products" className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white">Cancel</Link>
          <button type="submit" disabled={loading} className="rounded-full bg-raw-accent px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-white disabled:opacity-60">{loading ? 'Saving...' : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
}

function AdminOrdersPage() {
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
    fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => {
        const loadedOrders = Array.isArray(data) ? data : [];
        setOrders(loadedOrders);
        if (orderId) setSelectedOrder(loadedOrders.find((order) => order.id === orderId || order.orderNumber === orderId) || null);
      })
      .catch(() => setOrders([]));
  }, [orderId]);

  const updateStatus = async (orderId, status) => {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.message || 'Unable to update order status.'); return; }
    setOrders((items) => items.map((order) => order.id === orderId ? { ...order, ...data, status } : order));
    setSelectedOrder((order) => order?.id === orderId ? { ...order, ...data, status } : order);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">Orders</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">All orders</h1>
      </header>
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-red-300">{error}</p>}
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="py-3 pr-4">Order ID</th>
              <th className="py-3 pr-4">Customer</th>
              <th className="py-3 pr-4">Phone</th>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Payment</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="cursor-pointer border-t border-white/10 transition hover:bg-white/5" onClick={() => setSelectedOrder(order)}>
                <td className="py-3 pr-4 font-mono font-semibold">#{order.orderNumber || order.id}</td>
                <td className="py-3 pr-4"><div>{order.name || order.customer?.name || 'Anonymous'}</div><div className="text-xs text-white/50">{order.email || order.customer?.email}</div></td>
                <td className="py-3 pr-4 text-white/70">{order.phone || order.customer?.phone || 'N/A'}</td>
                <td className="py-3 pr-4 text-white/70">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="py-3 pr-4"><div className="uppercase">{order.paymentMethod === 'cod' ? 'COD' : 'ONLINE'}</div><div className="text-xs text-white/50">{order.paymentStatus}</div></td>
                <td className="py-3 pr-4">${Number(order.total || 0).toFixed(2)}</td>
                <td className="py-3 pr-4" onClick={(event) => event.stopPropagation()}><select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded-lg border border-white/10 bg-[#1d2124] px-2 py-1"><option>PENDING</option><option>CONFIRMED</option><option>PROCESSING</option><option>SHIPPED</option><option>DELIVERED</option><option>CANCELLED</option></select></td>
                <td className="py-3 text-right"><button type="button" onClick={() => setSelectedOrder(order)} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wider hover:bg-raw-accent">View Order</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onOrderUpdated={(updated) => { setSelectedOrder(updated); setOrders((items) => items.map((order) => order.id === updated.id ? updated : order)); }} />}
    </div>
  );
}

function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/customers`)
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-[-0.06em]">Customers</h1></header>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <table className="min-w-full text-left text-sm">
          <thead className="text-white/60">
            <tr><th className="py-3 pr-4">Name</th><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Orders</th><th className="py-3 pr-4">Spend</th></tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-white/10">
                <td className="py-3 pr-4">{customer.name}</td>
                <td className="py-3 pr-4">{customer.email}</td>
                <td className="py-3 pr-4">{customer.orders}</td>
                <td className="py-3 pr-4">${Number(customer.totalSpending || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminContentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-[-0.06em]">Content management</h1>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#1d2124] p-4">Hero title</div>
          <div className="rounded-xl border border-white/10 bg-[#1d2124] p-4">Hero subtitle</div>
          <div className="rounded-xl border border-white/10 bg-[#1d2124] p-4">Hero image</div>
          <div className="rounded-xl border border-white/10 bg-[#1d2124] p-4">Hero video</div>
          <div className="rounded-xl border border-white/10 bg-[#1d2124] p-4">Editorial text</div>
          <div className="rounded-xl border border-white/10 bg-[#1d2124] p-4">Featured products</div>
        </div>
      </div>
    </div>
  );
}

function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-[-0.06em]">Categories</h1></header>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#1d2124] p-4">
              <p className="text-lg font-semibold text-white">{item.name}</p>
              <p className="text-sm text-white/60">{item.slug}</p>
            </div>
          ))}
          {!items.length && <p className="text-white/60">No categories found.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminCollectionsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/collections`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-[-0.06em]">Collections</h1></header>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#1d2124] p-4">
              <p className="text-lg font-semibold text-white">{item.name}</p>
              <p className="text-sm text-white/60">{item.description || item.slug}</p>
            </div>
          ))}
          {!items.length && <p className="text-white/60">No collections found.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/inventory`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-[-0.06em]">Inventory</h1></header>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <table className="min-w-full text-left text-sm">
          <thead className="text-white/60"><tr><th className="py-3 pr-4">Product</th><th className="py-3 pr-4">SKU</th><th className="py-3 pr-4">Stock</th><th className="py-3 pr-4">Status</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/10"><td className="py-3 pr-4 text-white">{item.name}</td><td className="py-3 pr-4 text-white/70">{item.sku}</td><td className="py-3 pr-4 text-white">{item.stock}</td><td className="py-3 pr-4 text-white/70">{item.status || (item.stock === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK')}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMediaPage() {
  return <div className="space-y-6"><h1 className="text-3xl font-semibold tracking-[-0.06em]">Media library</h1><div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-6">Upload, preview, search, and manage media files here.</div></div>;
}

function AdminVideosPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/videos`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-[-0.06em]">Videos</h1></header>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#1d2124] p-4">
              <p className="text-base font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm text-white/60 break-all">{item.url}</p>
            </div>
          ))}
          {!items.length && <p className="text-white/60">No videos found.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminCouponsPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/coupons`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-[-0.06em]">Coupons</h1></header>
      <div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#1d2124] p-4">
              <p className="text-lg font-semibold text-white">{item.code}</p>
              <p className="text-sm text-white/60">{item.discountType} • {item.discountValue}%</p>
            </div>
          ))}
          {!items.length && <p className="text-white/60">No coupons found.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminSettingsPage() {
  return <div className="space-y-6"><h1 className="text-3xl font-semibold tracking-[-0.06em]">Settings</h1><div className="rounded-[24px] border border-white/10 bg-[#171a1d] p-6">Store configuration, admin users, and export settings.</div></div>;
}

function AdminApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/products" element={<AdminLayout><AdminProductsPage /></AdminLayout>} />
      <Route path="/admin/products/new" element={<AdminLayout><ProductFormPage /></AdminLayout>} />
      <Route path="/admin/products/:id" element={<AdminLayout><ProductFormPage /></AdminLayout>} />
      <Route path="/admin/categories" element={<AdminLayout><AdminCategoriesPage /></AdminLayout>} />
      <Route path="/admin/collections" element={<AdminLayout><AdminCollectionsPage /></AdminLayout>} />
      <Route path="/admin/inventory" element={<AdminLayout><AdminInventoryPage /></AdminLayout>} />
      <Route path="/admin/orders" element={<AdminLayout><AdminOrdersPage /></AdminLayout>} />
      <Route path="/admin/orders/:orderId" element={<AdminLayout><AdminOrdersPage /></AdminLayout>} />
      <Route path="/admin/customers" element={<AdminLayout><AdminCustomersPage /></AdminLayout>} />
      <Route path="/admin/content" element={<AdminLayout><AdminContentPage /></AdminLayout>} />
      <Route path="/admin/media" element={<AdminLayout><AdminMediaPage /></AdminLayout>} />
      <Route path="/admin/videos" element={<AdminLayout><AdminVideosPage /></AdminLayout>} />
      <Route path="/admin/coupons" element={<AdminLayout><AdminCouponsPage /></AdminLayout>} />
      <Route path="/admin/settings" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default AdminApp;
