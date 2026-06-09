import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, MessageCircle, Truck, Wrench, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: UtensilsCrossed, title: 'Food Ordering', desc: 'Order from campus cafes & restaurants', path: '/food', color: 'bg-primary', shadow: 'shadow-primary/20' },
  { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy & sell with fellow students', path: '/marketplace', color: 'bg-accent', shadow: 'shadow-accent/20' },
  { icon: MessageCircle, title: 'Messaging', desc: 'Chat with buyers & sellers', path: '/messages', color: 'bg-green', shadow: 'shadow-green/20' },
  { icon: Truck, title: 'Delivery', desc: 'Track your deliveries live', path: '/deliveries', color: 'bg-mustard', shadow: 'shadow-mustard/20' },
  { icon: Wrench, title: 'Services', desc: 'Tutoring, design & more', path: '/services', color: 'bg-purple-600', shadow: 'shadow-purple-600/20' },
];

const stats = [
  { value: '500+', label: 'Students', icon: Star },
  { value: '50+', label: 'Cafes', icon: UtensilsCrossed },
  { value: '1K+', label: 'Orders', icon: TrendingUp },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-10 py-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary rounded-[2rem] p-8 md:p-12 text-white overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold font-[var(--font-heading)] leading-tight">
            {user ? `Hey ${user.firstName}!` : 'Campus Life,'}<br />
            {user ? 'What are you craving?' : 'Made Simple.'}
          </h1>
          <p className="text-white/80 mt-4 text-lg">
            Order food, trade items, book services — all in one place for your campus community.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/food">
              <motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 bg-white text-primary rounded-2xl font-bold flex items-center gap-2 shadow-lg">
                Order Food <ArrowRight size={18} />
              </motion.button>
            </Link>
            <Link to="/marketplace">
              <motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 bg-white/15 backdrop-blur-sm text-white rounded-2xl font-bold border border-white/20">
                Browse Market
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-8 relative z-10">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl">
              <Icon size={16} />
              <span className="font-bold">{value}</span>
              <span className="text-white/70 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Bento Feature Grid */}
      <section>
        <h2 className="text-2xl font-bold font-[var(--font-heading)] mb-6">Explore CampusHub</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, path, color, shadow }, i) => (
            <Link key={title} to={path}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`bg-surface rounded-3xl p-6 border border-border shadow-lg ${shadow} hover:shadow-xl transition-all ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon size={26} className="text-white" />
                </div>
                <h3 className="font-[var(--font-heading)] text-xl font-bold">{title}</h3>
                <p className="text-text-muted mt-2">{desc}</p>
                <div className="flex items-center gap-1 mt-4 text-primary font-semibold text-sm">
                  Explore <ArrowRight size={16} />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Categories */}
      <section>
        <h2 className="text-2xl font-bold font-[var(--font-heading)] mb-6">Popular Right Now</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Coffee & Tea', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop', count: '12 items' },
            { name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop', count: '8 items' },
            { name: 'Pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop', count: '15 items' },
            { name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=200&fit=crop', count: '10 items' },
          ].map(({ name, img, count }) => (
            <Link key={name} to="/food">
              <motion.div whileHover={{ y: -3 }} className="relative rounded-3xl overflow-hidden h-36">
                <img src={img} alt={name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-bold">{name}</p>
                  <p className="text-white/70 text-xs">{count}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
