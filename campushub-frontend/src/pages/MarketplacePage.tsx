import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Package, Tag, X, ShoppingBag } from 'lucide-react';
import { GET_PRODUCTS, CREATE_PRODUCT } from '../lib/queries';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string; sellerId: string; title: string; description?: string;
  price: number; stockQuantity: number; condition: string; imageUrl?: string; createdAt: string;
}

const productImages = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=300&fit=crop',
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '', condition: 'USED', category: 'general' });

  const { data, loading, refetch } = useQuery(GET_PRODUCTS, {
    variables: { search: search || undefined, status: 'ACTIVE' }
  });

  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT, {
    onCompleted: () => { setShowCreate(false); refetch(); setNewProduct({ title: '', description: '', price: '', condition: 'USED', category: 'general' }); }
  });

  const products: Product[] = data?.products || [];

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-heading)]">Marketplace</h1>
          <p className="text-text-muted mt-1">Buy & sell with fellow students</p>
        </div>
        {user && (
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25">
            <Plus size={20} /> Sell Item
          </motion.button>
        )}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface text-text focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          placeholder="Search products..." />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-surface rounded-3xl h-72 animate-pulse border border-border" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="mx-auto text-text-light mb-4" />
          <p className="text-text-muted text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product, i) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-surface rounded-3xl overflow-hidden border border-border shadow-[0_6px_0_rgba(37,99,235,0.08)]">
              <div className="h-48 overflow-hidden">
                <img src={product.imageUrl || productImages[i % productImages.length]} alt={product.title}
                  className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${product.condition === 'NEW' ? 'bg-green/10 text-green' : 'bg-mustard/10 text-mustard'}`}>
                    {product.condition}
                  </span>
                  {product.stockQuantity <= 2 && (
                    <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded-lg text-xs font-bold">Low Stock</span>
                  )}
                </div>
                <h3 className="font-[var(--font-heading)] font-bold text-base truncate">{product.title}</h3>
                {product.description && <p className="text-text-muted text-sm mt-1 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-accent text-lg">{product.price.toFixed(0)} ETB</span>
                  <motion.button whileHover={{ scale: 1.1 }} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold">
                    Contact Seller
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface rounded-3xl p-6 w-full max-w-md border border-border shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-[var(--font-heading)]">Sell an Item</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-bg-alt rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); createProduct({ variables: { input: { ...newProduct, price: parseFloat(newProduct.price), stockQuantity: 1 } } }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Title</label>
                  <div className="relative">
                    <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={newProduct.title} onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))} required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none" placeholder="What are you selling?" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none resize-none h-20" placeholder="Describe the item..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Price (ETB)</label>
                    <div className="relative">
                      <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="number" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} required
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Condition</label>
                    <select value={newProduct.condition} onChange={e => setNewProduct(p => ({ ...p, condition: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none">
                      <option value="NEW">New</option>
                      <option value="USED">Used</option>
                      <option value="LIKE_NEW">Like New</option>
                    </select>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} type="submit" disabled={creating}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25 disabled:opacity-50">
                  {creating ? 'Posting...' : 'Post Item'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
