import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  CONFIRMED: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  PROCESSING: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  SHIPPED: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  DELIVERED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const PAYMENT_STATUS_COLORS = {
  PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PAID: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  FAILED: 'bg-red-500/15 text-red-300 border-red-500/30',
  REFUNDED: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
};

export default function OrderDetailsModal({ order, onClose, onOrderUpdated }) {
  const { API_URL, token } = useAuth();
  const [currentOrder, setCurrentOrder] = useState(order);
  const [status, setStatus] = useState(order.status || 'PENDING');
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus || 'PENDING');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [shippingProvider, setShippingProvider] = useState(order.shippingProvider || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const addr = currentOrder.shippingAddress || {};

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/orders/${currentOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber,
          shippingProvider,
          notes,
        }),
      });

      const updated = await response.json();
      if (!response.ok) {
        throw new Error(updated.message || 'Failed to update order');
      }

      setCurrentOrder(updated);
      setFeedback({ type: 'success', message: `Order updated successfully to ${status}` });
      if (onOrderUpdated) {
        onOrderUpdated(updated);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-[28px] border border-white/10 bg-[#16191c] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">Order Details</span>
            <span className="text-xl font-bold text-white">#{currentOrder.orderNumber || currentOrder.id}</span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${STATUS_COLORS[currentOrder.status] || STATUS_COLORS.PENDING}`}>
              {currentOrder.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${PAYMENT_STATUS_COLORS[currentOrder.paymentStatus] || PAYMENT_STATUS_COLORS.PENDING}`}>
              {currentOrder.paymentStatus}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-sm">
          {feedback.message && (
            <div className={`rounded-xl border p-3.5 text-sm ${feedback.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}>
              {feedback.message}
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Date Placed</span>
              <p className="mt-1 font-semibold text-white">
                {new Date(currentOrder.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Payment Method</span>
              <p className="mt-1 font-semibold uppercase text-white">
                {currentOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Payment Status</span>
              <p className="mt-1 font-semibold uppercase text-white">
                {currentOrder.paymentStatus}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#1b1f23] p-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Grand Total</span>
              <p className="mt-1 text-lg font-bold text-raw-accent">
                ₹{Number(currentOrder.total || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Customer Information
              </h3>
              <div className="space-y-2 text-white/80">
                <div><span className="text-white/40">Name:</span> <strong className="text-white">{currentOrder.name || 'N/A'}</strong></div>
                <div><span className="text-white/40">Email:</span> <span className="text-white">{currentOrder.email}</span></div>
                <div><span className="text-white/40">Phone:</span> <span className="text-white">{currentOrder.phone || addr.phone || 'N/A'}</span></div>
                {currentOrder.userId && (
                  <div><span className="text-white/40">Customer ID:</span> <span className="text-xs text-white/60 font-mono">{currentOrder.userId}</span></div>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Historical Delivery Address
              </h3>
              <div className="space-y-1 text-white/80">
                <p className="font-semibold text-white">{addr.name || currentOrder.name}</p>
                <p>{addr.street || addr.line1 || 'No street address provided'}</p>
                {(addr.apartment || addr.line2) && <p>{addr.apartment || addr.line2}</p>}
                <p>
                  {addr.city ? `${addr.city}, ` : ''}
                  {addr.state ? `${addr.state} ` : ''}
                  {addr.postalCode ? `- ${addr.postalCode}` : ''}
                </p>
                <p>{addr.country || 'India'}</p>
                {addr.phone && <p className="text-xs text-white/60">Contact: {addr.phone}</p>}
              </div>
            </div>
          </div>

          {/* Products Ordered Table */}
          <div className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Ordered Products Snapshot ({currentOrder.items?.length || 0})
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.16em] text-white/40">
                    <th className="pb-3 pr-4">Item</th>
                    <th className="pb-3 pr-4">SKU</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Size</th>
                    <th className="pb-3 pr-4">Color</th>
                    <th className="pb-3 pr-4">Unit Price</th>
                    <th className="pb-3 pr-4">Qty</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(currentOrder.items || []).map((item, idx) => (
                    <tr key={item.id || idx} className="align-middle">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-12 w-10 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs text-white/40">
                              No Pic
                            </div>
                          )}
                          <span className="font-medium text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-white/70">{item.sku || 'N/A'}</td>
                      <td className="py-3 pr-4 text-white/60">{item.category || 'Apparel'}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white">
                          {item.size || 'One Size'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white">
                          {item.color || 'Standard'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white/80">₹{Number(item.price || item.unitPrice || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4 font-bold text-white">{item.quantity}</td>
                      <td className="py-3 text-right font-semibold text-white">
                        ₹{Number(item.total ?? ((item.price || item.unitPrice || 0) * item.quantity)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Calculations */}
            <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-right text-xs text-white/70">
              <div>Subtotal: <span className="font-semibold text-white">₹{Number(currentOrder.subtotal || currentOrder.total).toFixed(2)}</span></div>
              {currentOrder.discount > 0 && (
                <div className="text-emerald-400">Discount: <span>−₹{Number(currentOrder.discount).toFixed(2)}</span></div>
              )}
              <div>Shipping Fee: <span className="font-semibold text-white">{currentOrder.shippingFee ? `₹${Number(currentOrder.shippingFee).toFixed(2)}` : 'FREE'}</span></div>
              <div className="pt-2 text-base font-bold text-white">
                Grand Total: <span className="text-raw-accent">₹{Number(currentOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status & Fulfillment Management Form */}
          <form onSubmit={handleUpdateStatus} className="rounded-[22px] border border-white/10 bg-[#1b1f23] p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Manage Status & Fulfillment
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#14171a] px-3.5 py-2.5 text-white outline-none focus:border-raw-accent"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#14171a] px-3.5 py-2.5 text-white outline-none focus:border-raw-accent"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Tracking Number
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-8921892"
                  className="w-full rounded-xl border border-white/15 bg-[#14171a] px-3.5 py-2.5 text-white outline-none focus:border-raw-accent"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Shipping Provider
                </label>
                <input
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  placeholder="e.g. Blue Dart, Delhivery"
                  className="w-full rounded-xl border border-white/15 bg-[#14171a] px-3.5 py-2.5 text-white outline-none focus:border-raw-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Internal Admin Notes
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes about fulfillment, customer requests, etc."
                  className="w-full rounded-xl border border-white/15 bg-[#14171a] px-3.5 py-2.5 text-white outline-none focus:border-raw-accent"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-5 py-2 text-xs uppercase tracking-wider text-white hover:bg-white/5"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={updating}
                className="rounded-full bg-raw-accent px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#2346d6] disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Save Order Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
