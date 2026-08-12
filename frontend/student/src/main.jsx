import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          gutter={12}
          containerStyle={{
            top: 24,
            right: 24,
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
            },
            success: {
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1.5px solid #22c55e',
              },
            },
            error: {
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1.5px solid #ef4444',
              },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div className="flex items-center gap-3 w-full">
                  {icon}
                  <div className="flex-1 text-xs sm:text-sm font-bold text-slate-100 pr-2">
                    {message}
                  </div>
                  {t.type !== 'loading' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                      }}
                      className="ml-auto flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-sm"
                      title="Close notification"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
