export const theme = {
  colors: {
    surface: '#0B1120',
    surfaceSecondary: '#151E32',
    surfaceTertiary: '#1E293B',
    onSurface: '#F8FAFC',
    onSurfaceMuted: '#94A3B8',
    onSurfaceSecondary: '#E2E8F0',
    border: '#1E293B',
    borderStrong: '#334155',
    brand: '#C5A880',
    brandPrimary: '#C5A880',
    onBrandPrimary: '#1A150D',
    brandSecondary: '#14B8A6',
    brandAccent: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { sm: 6, md: 12, lg: 20, pill: 999 },
  font: {
    display: 'Outfit_600SemiBold',
    text: 'Figtree_400Regular',
    arabic: 'Amiri',
  },
};

export type CardGradient = readonly [string, string, ...string[]];
