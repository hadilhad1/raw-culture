import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OrderDetailsModal from '../components/OrderDetailsModal';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const { API_URL, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
      })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to orders API');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [API_URL, token]);

  const handleQuickStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.message || 'Update failed');

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(`Could not update order status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.orderNumber?.toLowerCase().includes(q) ||
      (order.name || '').toLowerCase().includes(q) ||
      (order.email || '').toLowerCase().includes(q) ||
      (order.phone || '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[26px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.26em] text-raw-accent">Sales & Fulfillment</span>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">Orders</h1>
          <p className="text-xs text-white/50">Manage customer orders, shipping details, and fulfillment statuses</p>
        </div>

        <button
          onClick={fetchOrders}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-white/10"
        >
          Refresh Orders
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-[22px] border border-white/10 bg-[#16191c] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#121417] px-3.5 py-2">
          <span>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, email, or phone..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-white/50 hover:text-white">
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                statusFilter === st
                  ? 'bg-raw-accent text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-4 shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-white/50">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-raw-accent border-t-transparent" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em]">Loading Orders...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-300">
            <p>{error}</p>
            <button onClick={fetchOrders} className="mt-3 underline">Try again</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <p className="text-2xl">🛍️</p>
            <p className="mt-2 text-sm font-semibold">No orders found</p>
            <p className="text-xs text-white/30">Try clearing filters or search queries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                  <th className="pb-3.5 pr-4">Order #</th>
                  <th className="pb-3.5 pr-4">Date</th>
                  <th className="pb-3.5 pr-4">Customer</th>
                  <th className="pb-3.5 pr-4">Items</th>
                  <th className="pb-3.5 pr-4">Payment</th>
                  <th className="pb-3.5 pr-4">Total</th>
                  <th className="pb-3.5 pr-4">Status</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/5 transition cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3.5 pr-4 font-bold text-white font-mono">
                      #{order.orderNumber || order.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 pr-4 text-white/60">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-white">{order.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-white/50">{order.email}</div>
                    </td>
                    <td className="py-3.5 pr-4 text-white/70">
                      {order.items?.length || 0} pcs
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[10px] uppercase tracking-wider text-white/80 block">
                        {order.paymentMethod === 'cod' ? 'COD' : 'ONLINE'}
                      </span>
                      <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${order.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-white">
                      ₹{Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 pr-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        disabled={updatingId === order.id}
                        value={order.status}
                        onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                        className="rounded-lg border border-white/15 bg-[#121417] px-2 py-1 text-[11px] font-semibold uppercase text-white outline-none focus:border-raw-accent disabled:opacity-50"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-raw-accent transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={(updated) => {
            setSelectedOrder(updated);
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
          }}
        />
      )}
    </div>
  );
}
