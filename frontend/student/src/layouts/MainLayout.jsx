import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MobileBottomNav from '../components/MobileBottomNav';
import CartDrawer from '../components/CartDrawer';
import { CartProvider } from '../context/CartContext';

export default function MainLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
        <Navbar onOpenCart={() => setIsCartOpen(true)} />
        <main className="flex-1 pb-20 md:pb-16">
          <Outlet />
        </main>
        <MobileBottomNav onOpenCart={() => setIsCartOpen(true)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </CartProvider>
  );
}
