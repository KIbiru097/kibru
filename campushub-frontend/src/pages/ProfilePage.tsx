import { useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Clock, Package, ShoppingBag, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MY_ORDERS, MY_PAYMENTS } from '../lib/queries';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: ordersData } = useQuery(MY_ORDERS, { skip: !user });
  const { data: paymentsData } = useQuery(MY_PAYMENTS, { skip: !user });

  if (!user) {
    return (
      <div className="text-center py-20">
        <User size={48} className="mx-auto text-text-light mb-4" />
        <p className="text-text-muted text-lg mb-4">Please log in to view your profile</p>
        <Link to="/login">
          <motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold">
            Sign In
          </motion.button>
        </Link>
      </div>
    );
  }

  const orders = ordersData?.myOrders || [];
  const payments = paymentsData?.myPayments || [];

  return (
    <div className="py-6 max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl p-6 border border-border text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {user.profilePictureUrl ? (
            <img src={user.profilePictureUrl} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-primary font-[var(--font-heading)] text-3xl font-bold">{user.firstName[0]}{user.lastName[0]}</span>
          )}
        </div>
        <h2 className="text-2xl font-bold font-[var(--font-heading)]">{user.firstName} {user.lastName}</h2>
        <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold ${user.accountStatus === 'VERIFIED' ? 'bg-green/10 text-green' : 'bg-mustard/10 text-mustard'}`}>
          <Shield size={12} />
          {user.accountStatus || 'Active'}
        </div>
      </motion.div>

      {/* Info */}
      <div className="bg-surface rounded-3xl p-5 border border-border space-y-4">
        <h3 className="font-bold font-[var(--font-heading)]">Account Details</h3>
        {[
          { icon: Mail, label: 'Email', value: user.email },
          { icon: Phone, label: 'Phone', value: user.phone || 'Not set' },
          { icon: Clock, label: 'Member since', value: new Date(user.createdAt || Date.now()).toLocaleDateString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-bg-alt">
            <Icon size={18} className="text-text-muted" />
            <div>
              <p className="text-xs text-text-muted font-semibold">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: 'Orders', value: orders.length, color: 'text-primary bg-primary/10' },
          { icon: CreditCard, label: 'Payments', value: payments.length, color: 'text-accent bg-accent/10' },
          { icon: ShoppingBag, label: 'Active', value: orders.filter((o: { status: string }) => o.status === 'PENDING').length, color: 'text-green bg-green/10' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-surface rounded-2xl p-4 border border-border text-center">
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <p className="font-bold text-xl">{value}</p>
            <p className="text-text-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      <motion.button whileHover={{ scale: 1.02 }} onClick={logout}
        className="w-full py-3 bg-destructive/10 text-destructive rounded-2xl font-bold hover:bg-destructive/20 transition-colors">
        Sign Out
      </motion.button>
    </div>
  );
}
