// Role & access-level utilities.
// Mirrors lib/auth.js on the backend — keep the level mapping identical.

export const ROLE_NAMES = {
  5: 'admin',
  4: 'director',
  3: 'manager',
  2: 'staff',
  1: 'limited',
};

export const ROLE_LABELS = {
  5: 'Administrator',
  4: 'Director',
  3: 'Manager',
  2: 'Staff',
  1: 'Limited',
};

export function roleNameFromLevel(level) {
  return ROLE_NAMES[level] || null;
}

export function roleLabelFromLevel(level) {
  return ROLE_LABELS[level] || 'Unknown';
}

export function hasAccessAtLeast(user, minLevel) {
  if (!user || user.role !== 'staff') return false;
  return (user.accessLevel ?? 0) >= minLevel;
}

// Returns which tabs should be visible for a given user.
// Used by app/(tabs)/_layout.js to render the tab bar.
export function visibleTabsForUser(user) {
  const level = user?.accessLevel ?? 0;

  // Level 5 (admin) — full GM view
  if (level >= 5) {
    return ['dashboard', 'feedback', 'billing', 'alerts', 'more'];
  }
  // Level 4 (director) — same as admin but data scoped to their dept
  if (level >= 4) {
    return ['dashboard', 'feedback', 'billing', 'alerts', 'more'];
  }
  // Level 3 (manager) — operational view
  if (level >= 3) {
    return ['today', 'feedback', 'orders', 'alerts', 'more'];
  }
  // Level 2 (staff) — line staff, no feedback triage
  if (level >= 2) {
    return ['today', 'orders', 'alerts', 'more'];
  }
  // Level 1 or unknown — bare minimum
  return ['today', 'more'];
}
