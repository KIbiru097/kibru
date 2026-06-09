import { motion } from 'framer-motion';
import { Plus, Flame, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface Props {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  cafeId?: string;
  badge?: string;
}

const heroImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=500&fit=crop',
];

export default function FeaturedFoodCard({ id, name, description, price, imageUrl, cafeId, badge }: Props) {
  const { addItem } = useCart();
  const img = imageUrl || heroImages[Math.abs(name.charCodeAt(0)) % heroImages.length];

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      className="relative bg-surface rounded-3xl overflow-hidden col-span-2 row-span-2 border border-border shadow-[0_12px_0_rgba(234,88,12,0.1)]"
    >
      <div className="relative h-full min-h-[320px]">
        <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badge */}
        {badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 left-4 px-4 py-2 bg-secondary text-white rounded-2xl text-sm font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Flame size={16} /> {badge}
          </motion.span>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-surface/90 backdrop-blur-sm rounded-full">
          <Star size={14} className="text-mustard fill-mustard" />
          <span className="text-sm font-bold">Chef's Pick</span>
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="font-[var(--font-heading)] text-white text-2xl font-bold mb-2">{name}</h3>
          {description && <p className="text-white/80 text-sm mb-4 line-clamp-2">{description}</p>}
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-2xl">{price.toFixed(0)} ETB</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addItem({ id, name, price, imageUrl: img, cafeId, menuItemId: id })}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30"
            >
              <Plus size={20} strokeWidth={3} />
              Add to Cart
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
