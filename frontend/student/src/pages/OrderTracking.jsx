import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

export default function OrderTrackingPage() {
  const { id: orderId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchTracking = async () => {
    try {
      const { data } = await axiosClient.get(`/orders/${orderId}/tracking`);
      setTracking(data.data);
    } catch (err) {
      console.error('Fetch tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 2000); // Live poll every 2s in real-time
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await axiosClient.patch(`/orders/${orderId}/cancel`, { reason: 'Cancelled by student' });
      toast.success('Order cancelled successfully');
      fetchTracking();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="page-container max-w-3xl space-y-6 py-8">
        <div className="card h-64 skeleton bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="page-container max-w-xl mx-auto text-center py-16 card space-y-4 my-8">
        <span className="text-5xl opacity-50">📦</span>
        <h2 className="text-xl font-bold text-slate-800">Order Tracking Details</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">Your order has been recorded successfully. Check your order history to view live status updates or download your bill receipt.</p>
        <div className="pt-2">
          <Link to="/orders" className="btn btn-primary font-bold text-xs px-6 py-2.5">
            ← View My Order History
          </Link>
        </div>
      </div>
    );
  }

  const status = tracking.status || 'CONFIRMED';
  const fulfillmentType = tracking.fulfillmentType || 'PICKUP';
  const deliveryBatch = tracking.deliveryBatch || null;
  const deliveryDetails = tracking.deliveryDetails || null;
  const isDelivery = fulfillmentType === 'DELIVERY';

  // Specific Timeline Steps per Fulfillment Type
  const pickupSteps = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
  const deliverySteps = ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  const steps = isDelivery ? deliverySteps : pickupSteps;
  const currentStepIndex = steps.indexOf(status) >= 0 ? steps.indexOf(status) : (status === 'COMPLETED' ? steps.length - 1 : 0);

  // Labels customized per type
  const pickupLabels = {
    CONFIRMED: { label: 'Order Confirmed by Canteen', icon: '✓', desc: 'Canteen received your pickup order' },
    PREPARING: { label: 'Canteen Preparing Food', icon: '🍳', desc: 'Kitchen staff is preparing your meal' },
    READY: { label: 'Food Ready for Pickup at Canteen', icon: '🍱', desc: 'Head to the canteen counter to collect your order' },
    COMPLETED: { label: 'Order Collected at Canteen Counter', icon: '🎉', desc: 'Thank you for ordering with CampusBite!' },
  };

  const deliveryLabels = {
    CONFIRMED: { label: 'Order Confirmed by Canteen', icon: '✓', desc: 'Canteen received your room delivery order' },
    PREPARING: { label: 'Canteen Preparing Food', icon: '🍳', desc: 'Kitchen staff is preparing your meal' },
    READY: { label: 'Food Prepared & Packed', icon: '🍱', desc: 'Meal packed and ready for canteen delivery staff' },
    OUT_FOR_DELIVERY: { label: 'Canteen Staff Out for Room Delivery', icon: '🚴', desc: `Heading to ${deliveryDetails?.hostelName || 'Hostel'}, Room ${deliveryDetails?.roomNumber || ''}` },
    DELIVERED: { label: 'Delivered to Hostel Room', icon: '🎉', desc: 'Canteen staff delivered food to your room!' },
    COMPLETED: { label: 'Order Completed', icon: '🎉', desc: 'Enjoy your hot meal!' },
  };

  const stepLabels = isDelivery ? deliveryLabels : pickupLabels;

  return (
    <div className="page-container max-w-3xl py-8 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="card p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div className="space-y-1">
          <span className={`badge ${isDelivery ? 'badge-orange' : 'bg-blue-600 text-white font-bold border border-blue-500 shadow-sm px-3 py-1'}`}>
            {isDelivery ? '🚴 Hostel Room Delivery' : '🏪 Canteen Counter Pickup'}
          </span>
          <h1 className="text-2xl font-display font-bold text-white">Order #{tracking.orderNumber || 'CB-ORDER'}</h1>
          <p className="text-xs text-slate-400">
            Current Status: <span className="text-orange-400 font-bold uppercase">{status.replace(/_/g, ' ')}</span>
          </p>
        </div>

        {['PENDING_PAYMENT', 'CONFIRMED'].includes(status) && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="btn btn-secondary bg-rose-600/20 text-rose-300 border-rose-500/30 hover:bg-rose-600/30 text-xs font-bold"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      {/* Smart Group Delivery Info Card */}
      {isDelivery && (
        <div className="card p-5 border-2 border-orange-200 bg-orange-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center text-xl font-bold">
                🚴
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Delivered Directly by Canteen Staff
                </h3>
                <p className="text-xs text-slate-600">
                  Canteen employee delivers food straight to <strong>{deliveryDetails?.hostelName || 'Hostel'}</strong>, Room <strong>{deliveryDetails?.roomNumber || ''}</strong>
                </p>
              </div>
            </div>
            <span className="badge badge-orange font-bold text-xs">
              Direct Canteen Delivery
            </span>
          </div>

          {deliveryBatch && (
            <p className="text-xs text-orange-800 font-medium pt-2 border-t border-orange-200/80">
              🤝 Batch #{deliveryBatch.batchNumber || 'CB-BATCH'} • Group Fee: <strong>{formatRupees(deliveryBatch.deliveryFeePerOrderInPaise || 1500)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Pickup Info Card */}
      {!isDelivery && (
        <div className="card p-5 border-2 border-blue-500/40 bg-blue-50/80 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
              🏪
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Canteen Counter Pickup</h3>
              <p className="text-xs text-slate-700 font-medium">
                Collect your hot order directly at the <strong>canteen counter</strong> when ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Live Order Timeline
          </h2>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            Auto 5s Refresh
          </span>
        </div>

        {status === 'CANCELLED' ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-1">
            <span className="text-3xl">❌</span>
            <h3 className="font-bold text-rose-900">Order Cancelled</h3>
            <p className="text-xs text-rose-700">This order was cancelled.</p>
          </div>
        ) : (
          <div className="relative pl-8 border-l-2 border-slate-200 space-y-8 my-2">
            {steps.map((stepKey, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const stepInfo = stepLabels[stepKey] || { label: stepKey, icon: '•', desc: '' };

              return (
                <div key={stepKey} className="relative group">
                  {/* Circle indicator */}
                  <div
                    className={`absolute -left-[41px] top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? ['DELIVERED', 'COMPLETED'].includes(status)
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 shadow-md'
                          : 'bg-orange-600 text-white ring-4 ring-orange-100 scale-110 shadow-md'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>

                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-bold flex items-center gap-2 ${
                      isCurrent
                        ? ['DELIVERED', 'COMPLETED'].includes(status)
                          ? 'text-emerald-700 font-extrabold'
                          : 'text-orange-600 font-extrabold'
                        : isPassed
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}>
                      <span>{stepInfo.icon}</span>
                      <span>{stepInfo.label}</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-normal">
                      {stepInfo.desc}
                    </p>

                    {isCurrent && (
                      ['DELIVERED', 'COMPLETED'].includes(status) ? (
                        <span className="inline-block text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 mt-1">
                          ✓ Order Delivered & Completed
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] text-orange-600 font-bold bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200 mt-1">
                          In progress...
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <Link to="/orders" className="text-sm font-bold text-orange-600 hover:text-orange-700">
          ← Back to Order History
        </Link>
      </div>
    </div>
  );
}
