import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderDetailsModal from '../components/OrderDetailsModal';
import CustomerDetailsModal from '../components/CustomerDetailsModal';

export default function DashboardPage() {
  const { API_URL, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard data');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to dashboard API');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [API_URL, token]);

  const openOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
        setSelectedOrderId(orderId);
      }
    } catch {}
  };

  if (loading && !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-white/50">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-raw-accent border-t-transparent" />
          <p className="mt-3 text-xs uppercase tracking-[0.2em]">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        <h2 className="text-lg font-bold">Dashboard Error</h2>
        <p className="mt-2 text-sm">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-full bg-red-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-red-500/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  const cards = [
    { label: 'Total Revenue', value: `₹${Number(stats?.totalSales || 0).toLocaleString()}`, subtitle: 'All-time sales', accent: 'border-raw-accent/40 bg-gradient-to-br from-raw-accent/20 to-transparent' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, subtitle: `${stats?.pendingOrders || 0} pending processing`, accent: 'border-blue-500/30 bg-blue-500/10' },
    { label: 'Delivered Orders', value: stats?.deliveredOrders || 0, subtitle: 'Successfully fulfilled', accent: 'border-emerald-500/30 bg-emerald-500/10' },
    { label: 'Low Stock Alert', value: stats?.lowStockProducts || 0, subtitle: 'Items under 10 units', accent: stats?.lowStockProducts > 0 ? 'border-amber-500/40 bg-amber-500/15 text-amber-200' : 'border-white/10 bg-white/5' },
  ];

  const salesMax = Math.max(1, ...(stats?.salesByMonth || []).map((s) => s.sales));

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[26px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.26em] text-raw-accent">Live Telemetry</span>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">Store Overview</h1>
          <p className="text-xs text-white/50">Real-time metrics from the RAW-CULTURE database</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/orders"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-white/10"
          >
            All Orders ({stats?.totalOrders || 0})
          </Link>
          <Link
            to="/products/new"
            className="rounded-full bg-raw-accent px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#2346d6]"
          >
            + Add Product
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={i} className={`rounded-[24px] border p-5 shadow-lg backdrop-blur-sm ${c.accent}`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">{c.label}</span>
            <p className="mt-3 text-3xl font-black tracking-tight text-white">{c.value}</p>
            <p className="mt-1 text-xs text-white/50">{c.subtitle}</p>
          </div>
        ))}
      </section>

      {/* Chart & Status Breakdown */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        {/* Revenue Chart */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Revenue Over Time</h2>
              <p className="text-xs text-white/50">Monthly gross sales (INR)</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-white/70">Last 6 Months</span>
          </div>

          <div className="mt-8 flex h-52 items-end gap-3 rounded-2xl border border-white/5 bg-[#121417] p-5">
            {(stats?.salesByMonth || []).map((m, idx) => {
              const heightPct = Math.round((m.sales / salesMax) * 100);
              return (
                <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                  <div
                    className="w-full rounded-t-xl bg-raw-accent transition-all duration-500 hover:brightness-125"
                    style={{ height: `${Math.max(8, heightPct)}%` }}
                  />
                  <span className="mt-2 text-[10px] font-semibold uppercase text-white/50">{m.month}</span>
                  <div className="pointer-events-none absolute -top-8 hidden rounded-md bg-white px-2 py-1 text-[10px] font-bold text-black group-hover:block z-10 whitespace-nowrap">
                    ₹{Number(m.sales).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white">Fulfillment Status</h2>
          <p className="text-xs text-white/50">Current order pipeline</p>

          <div className="mt-6 space-y-3.5">
            {[
              { label: 'Pending Confirmation', count: stats?.pendingOrders || 0, color: 'bg-amber-400' },
              { label: 'Confirmed', count: stats?.confirmedOrders || 0, color: 'bg-blue-400' },
              { label: 'Processing in Warehouse', count: stats?.processingOrders || 0, color: 'bg-indigo-400' },
              { label: 'Shipped / In Transit', count: stats?.shippedOrders || 0, color: 'bg-purple-400' },
              { label: 'Delivered', count: stats?.deliveredOrders || 0, color: 'bg-emerald-400' },
              { label: 'Cancelled', count: stats?.cancelledOrders || 0, color: 'bg-red-400' },
            ].map((st, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${st.color}`} />
                  <span className="text-white/80">{st.label}</span>
                </div>
                <span className="font-bold text-white">{st.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-white/10 pt-4">
            <Link
              to="/inventory"
              className="flex items-center justify-between text-xs text-raw-accent hover:underline"
            >
              <span>Manage Store Inventory →</span>
              <span>{stats?.totalProducts || 0} products</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Orders & Customers Tables */}
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Recent Orders */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Orders</h2>
              <p className="text-xs text-white/50">Latest customer purchases</p>
            </div>
            <Link to="/orders" className="text-xs text-raw-accent hover:underline">View All →</Link>
          </div>

          {stats?.recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider">
                    <th className="pb-3 pr-3">Order #</th>
                    <th className="pb-3 pr-3">Customer</th>
                    <th className="pb-3 pr-3">Total</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5 transition">
                      <td className="py-3 pr-3 font-semibold text-white">#{o.orderNumber || o.id.slice(0, 8)}</td>
                      <td className="py-3 pr-3 text-white/70">{o.customerName || o.email}</td>
                      <td className="py-3 pr-3 font-bold text-white">₹{Number(o.total).toFixed(2)}</td>
                      <td className="py-3 pr-3">
                        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openOrderDetails(o.id)}
                          className="rounded-full border border-white/15 px-3 py-1 text-[10px] text-white hover:bg-white/10"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-white/40">No orders placed yet.</p>
          )}
        </div>

        {/* Recent Customers */}
        <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">New Customers</h2>
              <p className="text-xs text-white/50">Registered customer accounts</p>
            </div>
            <Link to="/customers" className="text-xs text-raw-accent hover:underline">View All →</Link>
          </div>

          {stats?.recentCustomers?.length ? (
            <div className="space-y-3">
              {stats.recentCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[#121417] p-3 transition hover:border-white/20 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-raw-accent/20 text-xs font-bold text-raw-accent">
                      {cust.name?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{cust.name}</p>
                      <p className="text-[10px] text-white/50">{cust.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-white">{cust.ordersCount} orders</span>
                    <p className="text-[10px] text-emerald-400">₹{Number(cust.totalSpent || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-white/40">No customers found.</p>
          )}
        </div>
      </section>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setSelectedOrderId(null);
          }}
          onOrderUpdated={(updated) => {
            setSelectedOrder(updated);
            fetchDashboard();
          }}
        />
      )}

      {selectedCustomerId && (
        <CustomerDetailsModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onSelectOrder={(ordId) => {
            setSelectedCustomerId(null);
            openOrderDetails(ordId);
          }}
        />
      )}
    </div>
  );
}
