import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee, Pizza, Salad, Sandwich, IceCreamCone, Soup, Cake } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: UtensilsCrossed, color: 'bg-primary' },
  { id: 'coffee', label: 'Coffee', icon: Coffee, color: 'bg-mustard' },
  { id: 'pizza', label: 'Pizza', icon: Pizza, color: 'bg-secondary' },
  { id: 'salad', label: 'Healthy', icon: Salad, color: 'bg-green' },
  { id: 'sandwich', label: 'Sandwich', icon: Sandwich, color: 'bg-accent' },
  { id: 'dessert', label: 'Dessert', icon: IceCreamCone, color: 'bg-pink-500' },
  { id: 'soup', label: 'Soup', icon: Soup, color: 'bg-amber-600' },
  { id: 'cake', label: 'Bakery', icon: Cake, color: 'bg-purple-500' },
];

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategorySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(({ id, label, icon: Icon, color }) => {
        const active = selected === id;
        return (
          <motion.button
            key={id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all ${
              active
                ? `${color} text-white shadow-lg`
                : 'bg-surface text-text-muted hover:bg-surface-warm border border-border'
            }`}
          >
            <Icon size={18} />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
