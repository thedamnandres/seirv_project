// Utility functions for user objects
export function normalizeRole(rawRole) {
  if (!rawRole) return null;
  let roleValue = rawRole;
  if (typeof roleValue === 'object' && roleValue !== null && 'value' in roleValue) {
    roleValue = roleValue.value;
  }
  return String(roleValue).toLowerCase().trim();
}

export default {
  normalizeRole,
};
