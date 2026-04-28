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
//
// Today + Orders tabs were removed (Phase 2 post-pilot) — they require
// real line-staff users with shift / fulfillment workflows.
// When that need arises, re-introduce here and create the screens.
export function visibleTabsForUser(user) {
  const level = user?.accessLevel ?? 0;

  if (level >= 5) return ['dashboard', 'feedback', 'billing', 'alerts', 'more'];   // admin
  if (level >= 4) return ['dashboard', 'feedback', 'billing', 'alerts', 'more'];   // director
  if (level >= 3) return ['feedback', 'alerts', 'more'];                            // manager
  if (level >= 2) return ['alerts', 'more'];                                        // staff
  return ['more'];                                                                   // limited
}
