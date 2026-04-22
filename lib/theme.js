export const colors = {
  bg:        '#0B1628',
  surface:   '#111E34',
  surface2:  '#17263F',
  border:    '#1F3154',
  text:      '#E8EEF8',
  textMuted: '#8CA0BF',
  textDim:   '#5A718F',
  accent:    '#F5B942',
  accentDim: '#C89530',
  success:   '#4ADE80',
  warning:   '#FBBF24',
  danger:    '#F87171',
  info:      '#60A5FA',
  roleAdmin:    '#F5B942',
  roleDirector: '#60A5FA',
  roleManager:  '#4ADE80',
  roleStaff:    '#8CA0BF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '600', color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  bodyMuted: { fontSize: 15, color: colors.textMuted },
  label: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  caption: { fontSize: 12, color: colors.textDim },
};

export default { colors, spacing, radius, typography };
