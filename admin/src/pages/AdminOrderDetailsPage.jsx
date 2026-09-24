import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrderDetailsModal from '../components/OrderDetailsModal';

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('raw_admin_token') || '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')}/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Order API returned ${response.status} ${response.statusText || 'a non-JSON response'}`);
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load order');
      if (!data || !Array.isArray(data.items)) data.items = [];
      setOrder(data);
    } catch (loadError) {
      console.error('Failed to load admin order details', loadError);
      setError(loadError.message || 'Unable to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setError('No order ID was provided.');
      setLoading(false);
      return;
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[24px] border border-white/10 bg-[#171a1d] text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-raw-accent border-t-transparent" />
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[24px] border border-red-500/20 bg-[#171a1d] p-8 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Unable to load order</h1>
          <p className="mt-3 text-sm text-white/60">Order ID: {orderId}</p>
          <p className="mt-2 text-sm text-red-300">{error || 'Order details are unavailable.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={loadOrder} className="rounded-full bg-raw-accent px-5 py-2.5 text-xs uppercase tracking-wider text-white">Retry</button>
            <button type="button" onClick={() => navigate('/admin/orders')} className="rounded-full border border-white/15 px-5 py-2.5 text-xs uppercase tracking-wider text-white">Back to Orders</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => navigate('/admin/orders')} className="mb-4 text-xs uppercase tracking-[0.16em] text-white/60 hover:text-white">
        ← Back to Orders
      </button>
      <OrderDetailsModal
        order={order}
        onClose={() => navigate('/admin/orders')}
        onOrderUpdated={setOrder}
      />
    </div>
  );
}