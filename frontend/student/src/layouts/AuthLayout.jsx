import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-3 sm:p-6 py-8 sm:py-12 pb-24 sm:pb-16 overflow-y-auto">
      <Outlet />
    </div>
  );
}
