'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

/* ── Types ────────────────────────────────────────── */
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  restaurantId: string;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
}

type CartAction =
  | { type: 'ADD'; payload: Omit<CartItem, 'qty'> }
  | { type: 'REMOVE'; menuItemId: string }
  | { type: 'INCREMENT'; menuItemId: string }
  | { type: 'DECREMENT'; menuItemId: string }
  | { type: 'CLEAR' }
  | { type: 'REPLACE_AND_ADD'; payload: Omit<CartItem, 'qty'> }
  | { type: 'HYDRATE'; payload: CartState };

/* ── Persistence ──────────────────────────────────── */
const STORAGE_KEY = 'zuridrop-cart';

function saveToStorage(state: CartState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded or SSR — ignore */ }
}

function loadFromStorage(): CartState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* SSR — ignore */ }
}

/* ── Reducer ──────────────────────────────────────── */
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'ADD': {
      const existing = state.items.find((i) => i.menuItemId === action.payload.menuItemId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.menuItemId === action.payload.menuItemId ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return {
        ...state,
        restaurantId: action.payload.restaurantId,
        restaurantName: action.payload.restaurantName,
        items: [...state.items, { ...action.payload, qty: 1 }],
      };
    }
    case 'REPLACE_AND_ADD': {
      return {
        restaurantId: action.payload.restaurantId,
        restaurantName: action.payload.restaurantName,
        items: [{ ...action.payload, qty: 1 }],
      };
    }
    case 'REMOVE': {
      const filtered = state.items.filter((i) => i.menuItemId !== action.menuItemId);
      return {
        ...state,
        items: filtered,
        ...(filtered.length === 0 ? { restaurantId: null, restaurantName: null } : {}),
      };
    }
    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, qty: i.qty + 1 } : i,
        ),
      };
    case 'DECREMENT': {
      const item = state.items.find((i) => i.menuItemId === action.menuItemId);
      if (!item) return state;
      if (item.qty <= 1) {
        const remaining = state.items.filter((i) => i.menuItemId !== action.menuItemId);
        return {
          ...state,
          items: remaining,
          ...(remaining.length === 0 ? { restaurantId: null, restaurantName: null } : {}),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, qty: i.qty - 1 } : i,
        ),
      };
    }
    case 'CLEAR':
      return { items: [], restaurantId: null, restaurantName: null };
    default:
      return state;
  }
}

/* ── Context ──────────────────────────────────────── */
interface CartContextValue {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  totalQty: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (menuItemId: string) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  clear: () => void;
  getItemQty: (menuItemId: string) => number;
  conflictPending: Omit<CartItem, 'qty'> | null;
  confirmReplace: () => void;
  cancelReplace: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/* ── Provider ─────────────────────────────────────── */
const INITIAL_STATE: CartState = { items: [], restaurantId: null, restaurantName: null };

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);
  const [conflictPending, setConflictPending] = useState<Omit<CartItem, 'qty'> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved && saved.items.length > 0) {
      dispatch({ type: 'HYDRATE', payload: saved });
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (state.items.length > 0) {
      saveToStorage(state);
    } else {
      clearStorage();
    }
  }, [state, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'qty'>) => {
      if (!state.restaurantId || state.restaurantId === item.restaurantId) {
        dispatch({ type: 'ADD', payload: item });
      } else {
        setConflictPending(item);
      }
    },
    [state.restaurantId],
  );

  const confirmReplace = useCallback(() => {
    if (conflictPending) {
      dispatch({ type: 'REPLACE_AND_ADD', payload: conflictPending });
      setConflictPending(null);
    }
  }, [conflictPending]);

  const cancelReplace = useCallback(() => {
    setConflictPending(null);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const totalQty = state.items.reduce((s, i) => s + i.qty, 0);
    const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      items: state.items,
      restaurantId: state.restaurantId,
      restaurantName: state.restaurantName,
      totalQty,
      subtotal,
      addItem,
      removeItem: (menuItemId: string) => dispatch({ type: 'REMOVE', menuItemId }),
      increment: (menuItemId: string) => dispatch({ type: 'INCREMENT', menuItemId }),
      decrement: (menuItemId: string) => dispatch({ type: 'DECREMENT', menuItemId }),
      clear: () => dispatch({ type: 'CLEAR' }),
      getItemQty: (menuItemId: string) =>
        state.items.find((i) => i.menuItemId === menuItemId)?.qty ?? 0,
      conflictPending,
      confirmReplace,
      cancelReplace,
    };
  }, [state, addItem, conflictPending, confirmReplace, cancelReplace]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ── Hook ─────────────────────────────────────────── */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}
