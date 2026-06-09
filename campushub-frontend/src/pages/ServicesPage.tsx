import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Star, X, Wrench, BookOpen, Palette, Code, Camera, Music } from 'lucide-react';
import { GET_SERVICES, CREATE_SERVICE } from '../lib/queries';
import { useAuth } from '../context/AuthContext';

interface Service {
  id: string; providerId: string; title: string; description?: string;
  price: number; category: string; status: string; rating?: number; createdAt: string;
}

const categoryIcons: Record<string, typeof Wrench> = {
  tutoring: BookOpen, design: Palette, development: Code, photography: Camera, music: Music, other: Wrench,
};

const categories = ['all', 'tutoring', 'design', 'development', 'photography', 'music', 'other'];

export default function ServicesPage() {
  const { user } = useAuth();
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'tutoring' });

  const { data, loading, refetch } = useQuery(GET_SERVICES, {
    variables: selectedCat !== 'all' ? { category: selectedCat } : {}
  });

  const [createService, { loading: creating }] = useMutation(CREATE_SERVICE, {
    onCompleted: () => { setShowCreate(false); refetch(); setForm({ title: '', description: '', price: '', category: 'tutoring' }); }
  });

  const services: Service[] = (data?.services || []).filter((s: Service) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[var(--font-heading)]">Services</h1>
          <p className="text-text-muted mt-1">Student-to-student services</p>
        </div>
        {user && (
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25">
            <Plus size={20} /> Offer Service
          </motion.button>
        )}
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-surface text-text focus:border-primary outline-none"
          placeholder="Search services..." />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => setSelectedCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap capitalize ${selectedCat === cat ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'}`}>
            {cat}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-surface rounded-3xl h-48 animate-pulse border border-border" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20">
          <Wrench size={48} className="mx-auto text-text-light mb-4" />
          <p className="text-text-muted text-lg">No services found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => {
            const CatIcon = categoryIcons[s.category] || Wrench;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-surface rounded-3xl p-6 border border-border shadow-[0_6px_0_rgba(139,92,246,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <CatIcon size={22} className="text-purple-600" />
                  </div>
                  {s.rating && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-mustard/10 rounded-lg">
                      <Star size={14} className="text-mustard fill-mustard" />
                      <span className="text-sm font-bold text-mustard">{s.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-purple-600 uppercase">{s.category}</span>
                <h3 className="font-[var(--font-heading)] font-bold text-lg mt-1">{s.title}</h3>
                {s.description && <p className="text-text-muted text-sm mt-1 line-clamp-2">{s.description}</p>}
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-primary text-lg">{s.price.toFixed(0)} ETB</span>
                  <motion.button whileHover={{ scale: 1.1 }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">
                    Book Now
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface rounded-3xl p-6 w-full max-w-md border border-border shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold font-[var(--font-heading)]">Offer a Service</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-bg-alt rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); createService({ variables: { ...form, price: parseFloat(form.price) } }); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Service Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none"
                    placeholder="e.g. Math Tutoring" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none resize-none h-20"
                    placeholder="Describe your service..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Price (ETB)</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg-alt text-sm focus:border-primary outline-none">
                      <option value="tutoring">Tutoring</option>
                      <option value="design">Design</option>
                      <option value="development">Development</option>
                      <option value="photography">Photography</option>
                      <option value="music">Music</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} type="submit" disabled={creating}
                  className="w-full py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25 disabled:opacity-50">
                  {creating ? 'Posting...' : 'Post Service'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
