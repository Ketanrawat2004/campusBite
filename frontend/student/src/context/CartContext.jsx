import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'campusbite_cart';

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      // If cart has items from another canteen, clear old canteen's items and start fresh with new canteen
      const isDifferentCanteen = state.canteenId && state.canteenId !== action.item.canteenId;
      const currentItems = isDifferentCanteen ? [] : state.items;

      const existing = currentItems.find(
        (i) => i.menuItemId === action.item.menuItemId &&
               JSON.stringify(i.customizations || []) === JSON.stringify(action.item.customizations || [])
      );

      let updatedItems;
      if (existing) {
        updatedItems = currentItems.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + action.item.quantity } : i
        );
      } else {
        updatedItems = [...currentItems, action.item];
      }

      return {
        ...state,
        canteenId: action.item.canteenId,
        canteenName: action.item.canteenName,
        items: updatedItems,
        pendingClearConfirm: null,
      };
    }

    case 'REMOVE_ITEM': {
      const remainingItems = state.items.filter((i) => i.menuItemId !== action.menuItemId);
      return {
        ...state,
        items: remainingItems,
        canteenId: remainingItems.length === 0 ? null : state.canteenId,
        canteenName: remainingItems.length === 0 ? null : state.canteenName,
      };
    }

    case 'UPDATE_QUANTITY': {
      const updated = state.items
        .map((i) => (i.menuItemId === action.menuItemId ? { ...i, quantity: action.quantity } : i))
        .filter((i) => i.quantity > 0);

      return {
        ...state,
        items: updated,
        canteenId: updated.length === 0 ? null : state.canteenId,
        canteenName: updated.length === 0 ? null : state.canteenName,
      };
    }

    case 'CLEAR_CART':
      return { items: [], canteenId: null, canteenName: null, pendingClearConfirm: null };

    case 'LOAD':
      return action.state;

    default:
      return state;
  }
}

const initialState = { items: [], canteenId: null, canteenName: null, pendingClearConfirm: null };

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(
    cartReducer,
    initialState,
    () => {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        return saved ? JSON.parse(saved) : initialState;
      } catch {
        return initialState;
      }
    }
  );

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalInPaise = cart.items.reduce(
    (sum, i) => sum + (i.priceInPaise + (i.customizationPriceInPaise || 0)) * i.quantity,
    0
  );

  return (
    <CartContext.Provider value={{ cart, dispatch, totalItems, subtotalInPaise }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
