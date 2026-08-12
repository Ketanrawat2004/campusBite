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

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axiosClient.get('/orders');
        setOrders(data.data || []);
      } catch (err) {
        console.error('Fetch order history error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
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
    <div className="page-container max-w-4xl space-y-6 animate-fade-in">
      <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">My Orders</h1>
          <p className="text-xs text-gray-500 mt-1">Track current orders, download bills as PDF, or remove past history.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="card h-32 skeleton" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 card">
          <span className="text-5xl opacity-40">📦</span>
          <h3 className="text-lg font-bold text-gray-700 mt-4">No orders placed yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">Explore campus canteens and place your first order!</p>
          <Link to="/canteens" className="btn btn-primary">
            Browse Canteens
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="card p-5 space-y-3 hover:border-gray-300 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-gray-900">
                      Order #{order.orderNumber}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' • '}
                    <span className="font-semibold text-gray-600">
                      {order.canteenId?.name || 'Canteen'}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-extrabold text-gray-900">
                    {formatRupees(order.pricingBreakdown?.totalInPaise || 0)}
                  </span>
                  <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm">
                    Track →
                  </Link>
                  <Link to={`/report-issue/${order._id}`} className="btn btn-sm" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: '600', fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}>
                    ⚠️ Report Issue
                  </Link>
                  <button
                    onClick={() => handleDownloadInvoice(order)}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: '600', fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                  >
                    📄 Download Invoice
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order._id)}
                    className="btn btn-sm"
                    style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: '600', fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>

              {/* Items summary */}
              <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
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
