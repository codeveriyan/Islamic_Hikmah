export const theme = {
  colors: {
    surface: '#0B141A',
    surfaceSecondary: '#111B21',
    surfaceTertiary: '#202C33',
    onSurface: '#E9EDEF',
    onSurfaceMuted: '#8696A0',
    onSurfaceSecondary: '#D1D7DB',
    border: '#222E35',
    borderStrong: '#2A3942',
    brand: '#00A884',
    brandPrimary: '#00A884',
    onBrandPrimary: '#0B141A',
    brandSecondary: '#005C4B',
    brandAccent: '#00D4AA',
    error: '#F15C6D',
    warning: '#F59E0B',
    success: '#00A884',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  // Full xs-xl radius scale. `xl` covers the larger hero/banner cards that
  // previously hardcoded `borderRadius: 24` inline; `xs` covers small chips
  // and badges that previously hardcoded `borderRadius: 4-6`.
  radius: { xs: 4, sm: 6, md: 12, lg: 20, xl: 24, pill: 999 },
  font: {
    display: 'Outfit_600SemiBold',
    displayBold: 'Outfit_700Bold',
    displayExtraBold: 'Outfit_800ExtraBold',
    text: 'Figtree_400Regular',
    textMedium: 'Figtree_500Medium',
    textSemiBold: 'Figtree_600SemiBold',
    textBold: 'Figtree_700Bold',
    arabic: 'NotoNaskhArabic',
  },
  layout: {
    readableWidth: 680,
    wideWidth: 1120,
    touchTarget: 44,
  },
  /**
   * Material 3 Expressive Type Scale
   * Use these tokens instead of raw fontSize numbers in components.
   *
   * Roles:
   *   display  — hero numbers, countdown badges, stat values
   *   headline — screen titles, section heroes
   *   title    — card titles, list headers, section labels
   *   body     — paragraph text, descriptions, subtitles
   *   label    — tags, badges, micro-captions
   *
   * Each role has lg / md / sm sizes. Prefer the `AppText` component
   * (`@/src/components/ui`) over consuming these directly.
   */
  typography: {
    display:  { lg: 57, md: 45, sm: 36 },
    headline: { lg: 32, md: 28, sm: 24 },
    title:    { lg: 22, md: 16, sm: 14 },
    body:     { lg: 16, md: 14, sm: 12 },
    label:    { lg: 14, md: 12, sm: 10 },
  } as const,
};


export type CardGradient = readonly [string, string, ...string[]];
