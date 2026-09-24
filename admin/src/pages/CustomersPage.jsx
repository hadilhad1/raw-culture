import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function CustomersPage() {
  const { API_URL, token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load customers');
        return res.json();
      })
      .then((data) => {
        setCustomers(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to customers API');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [API_URL, token]);

  const openOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
      }
    } catch {}
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[26px] border border-white/10 bg-[#16191c] p-6 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-[0.26em] text-raw-accent">Accounts & CRM</span>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">Customers</h1>
          <p className="text-xs text-white/50">Manage customer accounts, lifetime spending, and purchase histories</p>
        </div>

        <button
          onClick={fetchCustomers}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-white/10"
        >
          Refresh Customers
        </button>
      </header>

      {/* Search Bar */}
      <div className="rounded-[22px] border border-white/10 bg-[#16191c] p-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121417] px-3.5 py-2">
          <span>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or phone number..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-white/50 hover:text-white">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-[24px] border border-white/10 bg-[#16191c] p-4 shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-white/50">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-raw-accent border-t-transparent" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em]">Loading Customers...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-300">
            <p>{error}</p>
            <button onClick={fetchCustomers} className="mt-3 underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-white/40">
            <p className="text-2xl">👥</p>
            <p className="mt-2 text-sm font-semibold">No customers found</p>
            <p className="text-xs text-white/30">Customers will automatically register here as orders are placed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                  <th className="pb-3.5 pr-4">Customer</th>
                  <th className="pb-3.5 pr-4">Email</th>
                  <th className="pb-3.5 pr-4">Phone</th>
                  <th className="pb-3.5 pr-4">Orders</th>
                  <th className="pb-3.5 pr-4">Lifetime Spend</th>
                  <th className="pb-3.5 pr-4">Last Order</th>
                  <th className="pb-3.5 pr-4">Status</th>
                  <th className="pb-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="hover:bg-white/5 transition cursor-pointer"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-raw-accent/20 text-xs font-bold text-raw-accent">
                          {customer.name?.[0] || 'C'}
                        </div>
                        <span className="font-semibold text-white">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-white/70">{customer.email}</td>
                    <td className="py-3.5 pr-4 text-white/60">{customer.phone || 'N/A'}</td>
                    <td className="py-3.5 pr-4 font-bold text-white">{customer.orders || 0}</td>
                    <td className="py-3.5 pr-4 font-bold text-emerald-400">
                      ₹{Number(customer.totalSpending || customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 pr-4 text-white/60">
                      {customer.lastOrder
                        ? new Date(customer.lastOrder).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${customer.orders > 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white/50'}`}>
                        {customer.orders > 0 ? 'Active' : 'New'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-raw-accent transition"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
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

      {/* Order Details Modal when clicked from inside customer modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={(updated) => setSelectedOrder(updated)}
        />
      )}
    </div>
  );
}
