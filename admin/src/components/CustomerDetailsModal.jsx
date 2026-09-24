import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CustomerDetailsModal({ customerId, onClose, onSelectOrder }) {
  const { API_URL, token } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    setError('');

    fetch(`${API_URL}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load customer profile');
        return res.json();
      })
      .then((data) => {
        setCustomer(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [customerId, API_URL, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-[28px] border border-white/10 bg-[#16191c] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Customer Profile</span>
            <span className="text-xl font-bold text-white">{customer?.name || 'Customer Details'}</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-sm">
          {loading ? (
            <div className="py-20 text-center text-white/60">Loading customer information...</div>
          ) : error || !customer ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
              {error || 'Customer not found.'}
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Email</span>
                  <p className="mt-1 truncate font-semibold text-white">{customer.email}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Phone</span>
                  <p className="mt-1 font-semibold text-white">{customer.phone || 'N/A'}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Total Orders</span>
                  <p className="mt-1 text-lg font-bold text-white">{customer.ordersCount || customer.orders?.length || 0}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Lifetime Spent</span>
                  <p className="mt-1 text-lg font-bold text-raw-accent">
                    ₹{Number(customer.totalSpent || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Addresses */}
              <div className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Customer Addresses
                </h3>
                {customer.addresses?.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {customer.addresses.map((addr, idx) => (
                      <div key={idx} className="rounded-xl border border-white/5 bg-white/5 p-4 text-white/80">
                        <p className="font-semibold text-white">{addr.name || customer.name}</p>
                        <p>{addr.line1}</p>
                        {addr.line2 && <p>{addr.line2}</p>}
                        <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.postalCode}</p>
                        <p>{addr.country || 'India'}</p>
                        {addr.phone && <p className="text-xs text-white/50 mt-1">Phone: {addr.phone}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40">No saved addresses for this customer.</p>
                )}
              </div>

              {/* Products Purchased Breakdown */}
              <div className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Products Purchased ({customer.productsPurchased?.length || 0})
                </h3>
                {customer.productsPurchased?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                          <th className="pb-3 pr-4">Product</th>
                          <th className="pb-3 pr-4">SKU</th>
                          <th className="pb-3 pr-4">Total Qty</th>
                          <th className="pb-3 text-right">Total Spend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {customer.productsPurchased.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                {p.image && <img src={p.image} alt={p.name} className="h-10 w-8 rounded object-cover" />}
                                <span className="font-medium text-white">{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-white/60">{p.sku || 'N/A'}</td>
                            <td className="py-3 pr-4 font-bold text-white">{p.totalQuantity}</td>
                            <td className="py-3 text-right font-semibold text-white">
                              ₹{Number(p.totalSpend || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-white/40">No purchases found.</p>
                )}
              </div>

              {/* Order History */}
              <div className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                  Order History ({customer.orders?.length || 0})
                </h3>
                {customer.orders?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                          <th className="pb-3 pr-4">Order #</th>
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">Payment</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {customer.orders.map((o) => (
                          <tr
                            key={o.id}
                            onClick={() => onSelectOrder && onSelectOrder(o.id)}
                            className="cursor-pointer hover:bg-white/5 transition"
                          >
                            <td className="py-3 pr-4 font-semibold text-raw-accent hover:underline">
                              #{o.orderNumber || o.id}
                            </td>
                            <td className="py-3 pr-4 text-white/60">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="rounded-md border border-white/15 px-2 py-0.5 text-xs font-semibold text-white">
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-white/60 uppercase text-xs">
                              {o.paymentStatus}
                            </td>
                            <td className="py-3 text-right font-bold text-white">
                              ₹{Number(o.total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-white/40">No order history available.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
