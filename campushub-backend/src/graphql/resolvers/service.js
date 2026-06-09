const { query } = require('../../config/database');

const mapService = (s) => ({
  id: s.id,
  providerId: s.provider_id,
  title: s.title,
  description: s.description,
  price: parseFloat(s.price),
  category: s.category,
  status: s.status,
  rating: s.rating ? parseFloat(s.rating) : null,
  createdAt: s.created_at
});

const serviceResolvers = {
  Query: {
    services: async (_, { category }) => {
      let sql = `SELECT * FROM services WHERE status = 'ACTIVE'`;
      const params = [];
      let paramCount = 1;

      if (category) {
        sql += ` AND category = $${paramCount++}`;
        params.push(category);
      }

      sql += ` ORDER BY created_at DESC`;
      const result = await query(sql, params);
      return result.rows.map(mapService);
    },
    service: async (_, { id }) => {
      const result = await query(`SELECT * FROM services WHERE id = $1`, [id]);
      return result.rows[0] ? mapService(result.rows[0]) : null;
    },
    myServices: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `SELECT * FROM services WHERE provider_id = $1 ORDER BY created_at DESC`,
        [user.userId]
      );
      return result.rows.map(mapService);
    }
  },
  Mutation: {
    createService: async (_, { title, description, price, category }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `INSERT INTO services (id, provider_id, title, description, price, category, status, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ACTIVE', NOW())
         RETURNING *`,
        [user.userId, title, description, price, category]
      );
      return mapService(result.rows[0]);
    },
    updateService: async (_, { id, title, description, price }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(title); }
      if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
      if (price !== undefined) { updates.push(`price = $${paramCount++}`); values.push(price); }

      if (updates.length === 0) throw new Error('No fields to update');

      values.push(id, user.userId);
      const result = await query(
        `UPDATE services SET ${updates.join(', ')} WHERE id = $${paramCount++} AND provider_id = $${paramCount} RETURNING *`,
        values
      );
      if (result.rows.length === 0) throw new Error('Service not found or unauthorized');
      return mapService(result.rows[0]);
    },
    deleteService: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `UPDATE services SET status = 'DELETED' WHERE id = $1 AND provider_id = $2`,
        [id, user.userId]
      );
      return true;
    }
  }
};

module.exports = serviceResolvers;
