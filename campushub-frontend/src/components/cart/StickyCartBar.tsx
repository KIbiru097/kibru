import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';

export default function StickyCartBar() {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-40"
    >
      <Link to="/cart">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-primary text-white rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl shadow-primary/30"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-xs rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="font-bold text-lg">View Cart</p>
              <p className="text-white/80 text-sm">{itemCount} item{itemCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">{total.toFixed(2)} ETB</span>
            <ArrowRight size={20} />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
