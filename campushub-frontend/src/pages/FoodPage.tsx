import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { GET_CAFES, GET_MENU_ITEMS } from '../lib/queries';
import CategorySelector from '../components/food/CategorySelector';
import FoodMenuGrid from '../components/food/FoodMenuGrid';

export default function FoodPage() {
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data: cafesData } = useQuery(GET_CAFES);
  const { data: menuData, loading } = useQuery(GET_MENU_ITEMS, {
    variables: {
      ...(selectedCafe ? { cafeId: selectedCafe } : {}),
      isAvailable: true
    }
  });

  const cafes = cafesData?.cafes || [];
  const allItems = (menuData?.menuItems || []).map((item: Record<string, unknown>) => ({
    ...item,
    cafeId: item.cafeId as string,
  }));

  const filteredItems = allItems.filter((item: Record<string, unknown>) => {
    if (category !== 'all' && item.category && (item.category as string).toLowerCase() !== category) return false;
    if (search && !(item.name as string).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-heading)]">Food Menu</h1>
          <p className="text-text-muted mt-1">Order delicious food from campus cafes</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Search for food..."
          />
        </div>
        <motion.button whileHover={{ scale: 1.05 }} className="p-3 bg-surface rounded-2xl border border-border text-text-muted hover:bg-primary hover:text-white transition-colors">
          <SlidersHorizontal size={20} />
        </motion.button>
      </div>

      {/* Cafe tabs */}
      {cafes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCafe(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${!selectedCafe ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'}`}
          >
            All Cafes
          </motion.button>
          {cafes.map((cafe: { id: string; name: string }) => (
            <motion.button
              key={cafe.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCafe(cafe.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${selectedCafe === cafe.id ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'}`}
            >
              {cafe.name}
            </motion.button>
          ))}
        </div>
      )}

      {/* Categories */}
      <CategorySelector selected={category} onSelect={setCategory} />

      {/* Menu Grid */}
      <FoodMenuGrid items={filteredItems} loading={loading} />
    </div>
  );
}
