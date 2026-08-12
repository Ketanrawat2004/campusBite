import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, dispatch, totalItems, subtotalInPaise } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const formatRupees = (paise) => `₹${(paise / 100).toFixed(2)}`;

  const handleUpdateQuantity = (menuItemId, newQty) => {
    dispatch({ type: 'UPDATE_QUANTITY', menuItemId, quantity: newQty });
  };

  const handleRemoveItem = (menuItemId) => {
    dispatch({ type: 'REMOVE_ITEM', menuItemId });
  };

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-slide-left">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-xl text-white font-bold shadow-sm">
                🛒
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">Your Food Cart</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {cart.canteenName ? `From ${cart.canteenName}` : `${totalItems} items selected`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold text-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-50 flex items-center justify-center text-4xl text-orange-600">
                  🍲
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Explore canteens and add delicious snacks, thalis & beverages to your order.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/canteens');
                  }}
                  className="btn btn-primary font-bold shadow-sm"
                >
                  Browse Canteens →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Clear Cart link */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Cart Items ({totalItems})
                  </span>
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    Clear All
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                        </div>
                        <p className="text-xs font-bold text-orange-600">
                          {formatRupees(item.priceInPaise)}
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-slate-900 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Smart Pooling Delivery Pricing Note */}
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-orange-800">
                    <span>⚡ Smart Delivery Group Pooling</span>
                    <span>₹10 – ₹20</span>
                  </div>
                  <p className="text-[11px] text-orange-700 leading-normal">
                    Orders to the same hostel room are automatically grouped in 15-min windows, dropping delivery fees to <strong>₹10</strong> per order!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-white space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-slate-900">{formatRupees(subtotalInPaise)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Est. Hostel Delivery</span>
                  <span className="font-bold text-emerald-600">₹15.00</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span className="text-orange-600">{formatRupees(subtotalInPaise + 1500)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="btn btn-primary w-full btn-lg font-bold shadow-md text-base"
              >
                Proceed to Checkout →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
