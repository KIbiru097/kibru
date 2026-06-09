import { motion } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface FoodCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  category?: string;
  preparationTime?: number;
  cafeId?: string;
  isAvailable?: boolean;
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop',
];

export default function FoodCard({ id, name, description, price, discountPrice, imageUrl, category, preparationTime, cafeId, isAvailable = true }: FoodCardProps) {
  const { addItem } = useCart();
  const img = imageUrl || fallbackImages[Math.abs(name.charCodeAt(0)) % fallbackImages.length];

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`relative bg-surface rounded-3xl overflow-hidden border border-border shadow-[0_8px_0_rgba(234,88,12,0.08)] hover:shadow-[0_12px_0_rgba(234,88,12,0.15)] transition-shadow ${!isAvailable ? 'opacity-60' : ''}`}
    >
      {/* Image - top 60% */}
      <div className="relative h-48 overflow-hidden">
        <img src={img} alt={name} className="w-full h-full object-cover" loading="lazy" />
        {category && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-surface/90 backdrop-blur-sm rounded-full text-xs font-bold text-text">
            {category}
          </span>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-destructive px-4 py-1 rounded-full">Unavailable</span>
          </div>
        )}
        {/* Floating add button */}
        {isAvailable && (
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => addItem({ id, name, price: discountPrice || price, imageUrl: img, cafeId, menuItemId: id })}
            className="absolute bottom-3 right-3 w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Plus size={22} strokeWidth={3} />
          </motion.button>
        )}
      </div>

      {/* Info - bottom 40% */}
      <div className="p-4">
        <h3 className="font-[var(--font-heading)] font-bold text-text text-base truncate">{name}</h3>
        {description && <p className="text-text-muted text-sm mt-1 line-clamp-2">{description}</p>}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {discountPrice && discountPrice < price ? (
              <>
                <span className="font-bold text-primary text-lg">{discountPrice.toFixed(0)} ETB</span>
                <span className="text-text-light text-sm line-through">{price.toFixed(0)}</span>
              </>
            ) : (
              <span className="font-bold text-primary text-lg">{price.toFixed(0)} ETB</span>
            )}
          </div>
          {preparationTime && (
            <div className="flex items-center gap-1 text-text-muted text-xs">
              <Clock size={14} />
              <span>{preparationTime}m</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
