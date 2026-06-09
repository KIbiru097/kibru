import FoodCard from './FoodCard';
import FeaturedFoodCard from './FeaturedFoodCard';

interface FoodItem {
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

interface Props {
  items: FoodItem[];
  loading?: boolean;
}

const badges = ['SPICY 🔥', 'NEW ✨', 'POPULAR 🎉', 'BEST SELLER 🏆'];

export default function FoodMenuGrid({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-3xl h-72 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-lg">No items found</p>
      </div>
    );
  }

  // First item is featured
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-auto">
      {featured && (
        <FeaturedFoodCard
          id={featured.id}
          name={featured.name}
          description={featured.description}
          price={featured.discountPrice || featured.price}
          imageUrl={featured.imageUrl}
          cafeId={featured.cafeId}
          badge={badges[0]}
        />
      )}
      {rest.map((item, i) => (
        <FoodCard
          key={item.id}
          {...item}
          cafeId={item.cafeId}
        />
      ))}
    </div>
  );
}
