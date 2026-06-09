import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CREATE_FOOD_ORDER, INITIATE_PAYMENT } from '../lib/queries';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount, cafeId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fulfillment, setFulfillment] = useState('PICKUP');
  const [instructions, setInstructions] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [createOrder, { loading: ordering }] = useMutation(CREATE_FOOD_ORDER, {
    onCompleted: () => { setOrderSuccess(true); clearCart(); }
  });

  const handleCheckout = () => {
    if (!user) return navigate('/login');
    createOrder({
      variables: {
        input: {
          cafeId,
          items: items.map(i => ({ menuItemId: i.menuItemId || i.id, quantity: i.quantity })),
          fulfillmentMethod: fulfillment,
          specialInstructions: instructions || undefined,
        }
      }
    });
  };

  if (orderSuccess) {
    return (
      <div className="py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block">
          <CheckCircle size={80} className="mx-auto text-green mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold font-[var(--font-heading)]">Order Placed!</h2>
        <p className="text-text-muted mt-2">Your food is being prepared</p>
        <Link to="/food">
          <motion.button whileHover={{ scale: 1.05 }} className="mt-6 px-6 py-3 bg-primary text-white rounded-2xl font-bold">
            Order More
          </motion.button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-text-muted text-lg mb-4">Your cart is empty</p>
        <Link to="/food">
          <motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold">
            Browse Food
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/food">
          <motion.div whileHover={{ scale: 1.05 }} className="p-2 rounded-xl bg-surface-warm"><ArrowLeft size={20} /></motion.div>
        </Link>
        <h1 className="text-3xl font-bold font-[var(--font-heading)]">Your Cart</h1>
        <span className="text-text-muted">({itemCount} items)</span>
      </div>

      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {items.map(item => (
            <motion.div key={item.id} layout exit={{ opacity: 0, x: -100 }}
              className="bg-surface rounded-2xl p-4 border border-border flex items-center gap-4">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-primary font-bold">{item.price.toFixed(0)} ETB</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-surface-warm flex items-center justify-center hover:bg-primary/10">
                  <Minus size={16} />
                </motion.button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-surface-warm flex items-center justify-center hover:bg-primary/10">
                  <Plus size={16} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem(item.id)}
                  className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fulfillment & Instructions */}
      <div className="bg-surface rounded-2xl p-5 border border-border mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Fulfillment Method</label>
          <div className="flex gap-3">
            {['PICKUP', 'DELIVERY'].map(method => (
              <motion.button key={method} whileTap={{ scale: 0.95 }}
                onClick={() => setFulfillment(method)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${fulfillment === method ? 'bg-primary text-white' : 'bg-surface-warm text-text-muted border border-border'}`}>
                {method === 'PICKUP' ? 'Pickup' : 'Delivery'}
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Special Instructions</label>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none resize-none h-16"
            placeholder="Any special requests?" />
        </div>
      </div>

      {/* Total & Checkout */}
      <div className="bg-surface rounded-2xl p-5 border border-border">
        <div className="flex justify-between items-center mb-4">
          <span className="text-text-muted">Subtotal</span>
          <span className="font-bold">{total.toFixed(2)} ETB</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCheckout}
          disabled={ordering}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          <CreditCard size={22} />
          {ordering ? 'Placing Order...' : `Checkout · ${total.toFixed(2)} ETB`}
        </motion.button>
      </div>
    </div>
  );
}
