const { query } = require('../../config/database');

const mapDelivery = (d) => ({
  id: d.id,
  orderId: d.order_id,
  deliveryPersonId: d.delivery_person_id,
  status: d.status,
  pickupLocation: d.pickup_location,
  deliveryLocation: d.delivery_location,
  assignedAt: d.assigned_at,
  pickedUpAt: d.picked_up_at,
  deliveredAt: d.delivered_at
});

const deliveryResolvers = {
  Query: {
    myDeliveries: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `SELECT * FROM deliveries WHERE delivery_person_id = $1 ORDER BY assigned_at DESC`,
        [user.userId]
      );
      return result.rows.map(mapDelivery);
    },
    pendingDeliveries: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `SELECT * FROM deliveries WHERE status = 'PENDING' ORDER BY assigned_at DESC`
      );
      return result.rows.map(mapDelivery);
    }
  },
  Mutation: {
    assignDelivery: async (_, { orderId, deliveryPersonId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `INSERT INTO deliveries (id, order_id, delivery_person_id, status, pickup_location, delivery_location, assigned_at)
         VALUES (gen_random_uuid(), $1, $2, 'ASSIGNED', 
           (SELECT address FROM restaurants r JOIN orders o ON o.restaurant_id = r.id WHERE o.id = $1),
           (SELECT delivery_address FROM orders WHERE id = $1),
           NOW())
         RETURNING *`,
        [orderId, deliveryPersonId]
      );
      if (result.rows.length === 0) throw new Error('Failed to assign delivery');
      return mapDelivery(result.rows[0]);
    },
    updateDeliveryStatus: async (_, { deliveryId, status }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const validStatuses = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) throw new Error('Invalid delivery status');

      const updates = [`status = $1`, `updated_at = NOW()`];
      const values = [status];
      let paramCount = 2;

      if (status === 'PICKED_UP') {
        updates.push(`picked_up_at = NOW()`);
      } else if (status === 'DELIVERED') {
        updates.push(`delivered_at = NOW()`);
      }

      values.push(deliveryId);
      const result = await query(
        `UPDATE deliveries SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      if (result.rows.length === 0) throw new Error('Delivery not found');
      return mapDelivery(result.rows[0]);
    }
  }
};

module.exports = deliveryResolvers;
