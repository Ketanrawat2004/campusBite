import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

async function handleDownloadInvoice(order) {
  try {
    const toastId = toast.loading('Generating Official Tax Invoice PDF...');
    const response = await axiosClient.get(`/orders/${order._id}/invoice`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CampusBite-Invoice-${order.orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.dismiss(toastId);
    toast.success('Official Tax Invoice PDF downloaded!');
  } catch (err) {
    console.error('Invoice download error:', err);
    toast.dismiss();
    toast.error('Failed to download invoice PDF');
  }
}

let cachedOrders = null;

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState(() => cachedOrders || []);
  const [loading, setLoading] = useState(() => !cachedOrders);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async (isBackground = false) => {
      if (document.hidden) return;
      try {
        const { data } = await axiosClient.get('/orders');
        if (!isMounted) return;
        const list = data.data || [];
        cachedOrders = list;
        setOrders(list);
      } catch (err) {
        console.error('Fetch order history error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders(!cachedOrders);

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PREPARING':
      case 'READY':
        return 'badge-orange';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'badge-green';
      case 'CANCELLED':
      case 'REJECTED':
      case 'PAYMENT_FAILED':
        return 'badge-red';
      default:
        return 'badge-blue';
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to remove this order from your order history?')) return;
    try {
      await axiosClient.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      toast.success('Order removed from history 🗑️');
    } catch (err) {
      toast.error('Failed to remove order from history');
    }
  };

  return (
    <div className="page-container max-w-4xl py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-3 sm:pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">My Orders</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Track current orders, download bills as PDF, or remove past history.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="card h-32 skeleton bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 sm:py-16 card p-4">
          <span className="text-4xl sm:text-5xl opacity-40">📦</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-700 mt-3">No orders placed yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-5">Explore campus canteens and place your first order!</p>
          <Link to="/canteens" className="btn btn-primary text-xs sm:text-sm font-bold">
            Browse Canteens
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="card p-4 sm:p-5 space-y-3 hover:border-slate-300 transition-all shadow-sm rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-slate-900 text-sm sm:text-base">
                      Order #{order.orderNumber}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(order.status)} text-[10px] sm:text-xs`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' • '}
                    <span className="font-semibold text-slate-600">
                      {order.canteenId?.name || 'Canteen'}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap pt-1 sm:pt-0">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 mr-2">
                    {formatRupees(order.pricingBreakdown?.totalInPaise || 0)}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm text-xs py-1 px-2.5">
                      Track →
                    </Link>
                    <Link to={`/report-issue/${order._id}`} className="btn btn-sm text-xs py-1 px-2.5" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: '600', borderRadius: '8px' }}>
                      ⚠️ Issue
                    </Link>
                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      className="btn btn-sm text-xs py-1 px-2.5"
                      style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: '600', borderRadius: '8px' }}
                    >
                      📄 Bill
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      className="btn btn-sm text-xs py-1 px-2"
                      style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: '600', borderRadius: '8px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                {order.items?.map((item, idx) => (
                  <span key={idx}>
                    {item.quantity}× <strong>{item.name}</strong>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
