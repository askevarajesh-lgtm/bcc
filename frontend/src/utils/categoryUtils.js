/**
 * categoryUtils
 * Utility functions for managing task categories.
 */

/**
 * Ensures that categories are in the named {label, value} format.
 * Accepts both string arrays and object arrays.
 */
export function ensureNamedCategories(categories = []) {
  if (!Array.isArray(categories)) return [];
  return categories.map(cat => {
    if (typeof cat === 'string') {
      return { label: cat, value: cat };
    }
    if (typeof cat === 'object' && cat !== null) {
      return {
        label: cat.label || cat.name || cat.value || String(cat),
        value: cat.value || cat._id || cat.name || String(cat),
      };
    }
    return { label: String(cat), value: String(cat) };
  });
}

/**
 * Converts a flat array of category strings or objects into
 * the format expected by Ant Design Select options.
 */
export function toSelectOptions(categories = []) {
  return ensureNamedCategories(categories).map(c => ({
    label: c.label,
    value: c.value,
  }));
}

/**
 * Stub to get project service stats.
 */
export function getProjectServiceStats(projectId, serviceType) {
  return null;
}

export default { ensureNamedCategories, toSelectOptions, getProjectServiceStats };
