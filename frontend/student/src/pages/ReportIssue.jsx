import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

const ISSUE_TYPES = [
  { value: 'WRONG_ITEMS', label: '❌ Wrong items delivered' },
  { value: 'MISSING_ITEMS', label: '📦 Items missing from order' },
  { value: 'QUALITY_ISSUE', label: '😟 Food quality not acceptable' },
  { value: 'LATE_DELIVERY', label: '⏰ Delivery was too late' },
  { value: 'OVERCHARGED', label: '💸 Overcharged / billing issue' },
  { value: 'NOT_DELIVERED', label: '🚫 Order not delivered at all' },
  { value: 'OTHER', label: '📝 Other issue' },
];

export default function ReportIssuePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrderAndIssues = () => {
    if (!orderId) { setLoadingOrder(false); return; }

    Promise.all([
      axiosClient.get(`/orders/${orderId}`),
      axiosClient.get(`/issues/order/${orderId}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([orderRes, issuesRes]) => {
        setOrder(orderRes.data.data);
        setIssues(issuesRes.data.data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoadingOrder(false));
  };

  useEffect(() => {
    fetchOrderAndIssues();
    const interval = setInterval(() => {
      if (!document.hidden) fetchOrderAndIssues();
    }, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueType) { toast.error('Please select an issue type'); return; }
    if (!message.trim()) { toast.error('Please describe the issue'); return; }

    setSubmitting(true);
    try {
      const { data } = await axiosClient.post('/issues', {
        orderId,
        issueType,
        studentMessage: message.trim(),
      });
      toast.success('Issue reported! Canteen staff will respond soon.');
      setIssues((prev) => [data.data, ...prev]);
      setIssueType('');
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="page-container max-w-2xl py-6 px-3 sm:px-6">
        <div className="card h-48 skeleton bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl py-4 sm:py-8 space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 sm:pb-4">
        <Link to="/orders" className="text-slate-400 hover:text-slate-700 transition-colors text-lg font-bold">
          ←
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Report an Issue</h1>
          {order && (
            <p className="text-xs text-slate-500 mt-0.5">
              Order #{order.orderNumber} • {order.canteenId?.name || 'Canteen'}
            </p>
          )}
        </div>
      </div>

      {/* New Issue Form */}
      <div className="card p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
        <h2 className="font-bold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Describe Your Problem</h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Issue Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ISSUE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setIssueType(type.value)}
                  className="text-left p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all"
                  style={{
                    backgroundColor: issueType === type.value ? '#fff7ed' : '#f8fafc',
                    borderColor: issueType === type.value ? '#f97316' : '#e2e8f0',
                    color: issueType === type.value ? '#ea580c' : '#475569',
                    fontWeight: issueType === type.value ? '700' : '500',
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="issue-message">
              Describe the Issue *
            </label>
            <textarea
              id="issue-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe the problem in detail so the canteen staff can help you effectively..."
              className="input resize-none text-xs sm:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full font-bold text-xs sm:text-sm py-2.5"
          >
            {submitting ? 'Submitting...' : '📩 Submit Issue Report'}
          </button>
        </form>
      </div>

      {/* Existing Issues & Staff Replies */}
      {issues.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-900 text-sm sm:text-base">Previous Reports for This Order</h2>
          {issues.map((issue) => (
            <div key={issue._id} className="card p-4 space-y-3 rounded-2xl">
              {/* Student message */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs sm:text-sm font-bold text-blue-700 flex-shrink-0">
                  You
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {ISSUE_TYPES.find(t => t.value === issue.issueType)?.label || issue.issueType}
                    </span>
                    <span className={`badge text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                      issue.status === 'RESOLVED' ? 'badge-green' :
                      issue.status === 'IN_PROGRESS' ? 'badge-orange' : 'badge-blue'
                    }`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{issue.studentMessage}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                    {new Date(issue.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Staff reply */}
              {issue.staffReply && (
                <div className="flex items-start gap-3 pl-3 sm:pl-4 border-l-2 border-orange-200">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs sm:text-sm font-bold text-orange-700 flex-shrink-0">
                    Staff
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] sm:text-xs font-bold text-slate-900 mb-1">Canteen Staff Response</div>
                    <p className="text-xs sm:text-sm text-slate-700 bg-orange-50 border border-orange-100 rounded-xl p-3">{issue.staffReply}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                      {new Date(issue.repliedAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {!issue.staffReply && (
                <p className="text-[11px] sm:text-xs text-slate-400 pl-10 italic">⏳ Awaiting canteen staff response...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
