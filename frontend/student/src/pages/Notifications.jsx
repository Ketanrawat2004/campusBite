import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosClient.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications read');
    }
  };

  return (
    <div className="page-container max-w-3xl py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-4 gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">Notification Center</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Live order tracking, kitchen updates & payment confirmations</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary text-xs font-bold py-1.5 px-2.5 sm:px-3 whitespace-nowrap">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-20 skeleton bg-slate-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 sm:py-16 card space-y-2 p-4">
          <span className="text-4xl sm:text-5xl opacity-40">🔔</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-800">No notifications yet</h3>
          <p className="text-xs text-slate-500">Live payment confirmations and tracking updates will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const orderId = notif.relatedEntity?.id;

            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                className={`card p-4 sm:p-5 flex gap-3 sm:gap-4 items-start transition-all rounded-2xl cursor-pointer ${
                  !notif.isRead ? 'border-2 border-orange-300 bg-orange-50/40 shadow-sm' : 'bg-white border-slate-200'
                }`}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
                  🔔
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{notif.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                  {orderId && (
                    <div className="pt-1.5">
                      <Link
                        to={`/orders/${orderId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        <span>View Live Order Tracking →</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
