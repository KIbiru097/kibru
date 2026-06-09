import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, UtensilsCrossed, ShoppingBag, MessageCircle, User, ShoppingCart, Truck, Wrench, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/food', icon: UtensilsCrossed, label: 'Food' },
  { path: '/marketplace', icon: ShoppingBag, label: 'Market' },
  { path: '/services', icon: Wrench, label: 'Services' },
  { path: '/messages', icon: MessageCircle, label: 'Chat' },
  { path: '/deliveries', icon: Truck, label: 'Delivery' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border px-6 py-3 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-white font-[var(--font-heading)] font-bold text-lg">C</span>
          </div>
          <span className="font-[var(--font-heading)] text-xl text-text font-bold">CampusHub</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path || (path !== '/' && pathname.startsWith(path));
            return (
              <Link key={path} to={path}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-muted hover:bg-surface-warm'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-xl bg-surface-warm hover:bg-primary/10 transition-colors">
              <ShoppingCart size={20} className="text-text" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </motion.div>
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-warm hover:bg-primary/10 transition-colors">
                  <User size={18} />
                  <span className="text-sm font-semibold">{user.firstName}</span>
                </motion.div>
              </Link>
              <motion.button whileHover={{ scale: 1.05 }} onClick={logout} className="p-2 rounded-xl hover:bg-destructive/10 text-text-muted hover:text-destructive transition-colors">
                <LogOut size={18} />
              </motion.button>
            </div>
          ) : (
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} className="px-5 py-2 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/25">
                Login
              </motion.div>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-border px-2 py-1 flex justify-around items-center safe-area-pb">
        {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => {
          const active = pathname === path || (path !== '/' && pathname.startsWith(path));
          return (
            <Link key={path} to={path} className="flex flex-col items-center py-1 px-2">
              <motion.div whileTap={{ scale: 0.9 }} className={`p-2 rounded-xl ${active ? 'bg-primary text-white' : 'text-text-muted'}`}>
                <Icon size={20} />
              </motion.div>
              <span className={`text-[10px] mt-0.5 font-semibold ${active ? 'text-primary' : 'text-text-muted'}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
