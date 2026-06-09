const requireAuth = (user) => {
  if (!user || !user.userId) throw new Error('Not authenticated');
};

const requireRole = (user, allowedRoles) => {
  requireAuth(user);
  const userRoles = user.roles || ['student'];
  const hasRole = allowedRoles.some(role => userRoles.includes(role));
  if (!hasRole) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
};

const ROLES = {
  STUDENT: 'student',
  CAFE_OWNER: 'cafe_owner',
  RESTAURANT_OWNER: 'restaurant_owner',
  DELIVERY_PERSON: 'delivery_person',
  SERVICE_PROVIDER: 'service_provider',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

module.exports = { requireAuth, requireRole, ROLES };
