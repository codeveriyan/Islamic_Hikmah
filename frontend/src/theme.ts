export const theme = {
  colors: {
    surface: '#0D2137',
    surfaceSecondary: '#112840',
    surfaceTertiary: '#163351',
    onSurface: '#FFFFFF',
    onSurfaceMuted: '#8BAFC8',
    onSurfaceSecondary: '#C8DFF0',
    border: '#1A3A55',
    borderStrong: '#1E4570',
    brand: '#C5A880',
    brandPrimary: '#C5A880',
    onBrandPrimary: '#0D2137',
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
    arabic: 'NotoNaskhArabic',
  },
};

export type CardGradient = readonly [string, string, ...string[]];
