// backend/utils/roles.js

const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
};

const ROLE_HIERARCHY = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER];

function hasRole(user, role) {
  return user && user.role === role;
}

function hasAnyRole(user, roles) {
  return user && roles.includes(user.role);
}

function roleGreaterOrEqual(user, targetRole) {
  if (!user || !user.role) return false;
  const userIdx = ROLE_HIERARCHY.indexOf(user.role);
  const targetIdx = ROLE_HIERARCHY.indexOf(targetRole);
  return userIdx >= 0 && targetIdx >= 0 && userIdx <= targetIdx;
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  hasRole,
  hasAnyRole,
  roleGreaterOrEqual,
};
