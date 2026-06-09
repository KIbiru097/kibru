import { useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, CheckCircle, Package } from 'lucide-react';
import { MY_DELIVERIES } from '../lib/queries';
import { useAuth } from '../context/AuthContext';

interface Delivery {
  id: string; orderId: string; status: string; pickupLocation: string;
  deliveryLocation: string; assignedAt: string; pickedUpAt?: string; deliveredAt?: string;
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-mustard/10 text-mustard',
  PICKED_UP: 'bg-accent/10 text-accent',
  IN_TRANSIT: 'bg-primary/10 text-primary',
  DELIVERED: 'bg-green/10 text-green',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

const statusIcons: Record<string, typeof Truck> = {
  ASSIGNED: Clock,
  PICKED_UP: Package,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle,
};

export default function DeliveryPage() {
  const { user } = useAuth();
  const { data, loading } = useQuery(MY_DELIVERIES, { skip: !user });
  const deliveries: Delivery[] = data?.myDeliveries || [];

  if (!user) {
    return (
      <div className="text-center py-20">
        <Truck size={48} className="mx-auto text-text-light mb-4" />
        <p className="text-text-muted text-lg">Please log in to view deliveries</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold font-[var(--font-heading)]">Deliveries</h1>
        <p className="text-text-muted mt-1">Track your food deliveries</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-surface rounded-3xl h-32 animate-pulse border border-border" />)}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-20">
          <Truck size={48} className="mx-auto text-text-light mb-4" />
          <p className="text-text-muted text-lg">No deliveries yet</p>
          <p className="text-text-light text-sm mt-1">Your delivery tracking will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((d, i) => {
            const StatusIcon = statusIcons[d.status] || Truck;
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-surface rounded-3xl p-5 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <StatusIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Order #{d.orderId.slice(0, 8)}</p>
                      <p className="text-text-muted text-xs">{new Date(d.assignedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${statusColors[d.status] || 'bg-surface-warm text-text-muted'}`}>
                    {d.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-green mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-text-muted">Pickup</p>
                      <p className="text-sm">{d.pickupLocation || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-text-muted">Delivery</p>
                      <p className="text-sm">{d.deliveryLocation || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex gap-1 mt-4">
                  {['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].map((step, idx) => {
                    const stepOrder = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
                    const currentIdx = stepOrder.indexOf(d.status);
                    return (
                      <div key={step} className={`h-1.5 flex-1 rounded-full ${idx <= currentIdx ? 'bg-primary' : 'bg-border'}`} />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
