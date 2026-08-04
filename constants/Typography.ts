// Design tokens — sourced from Figma file w4OSlFQqdU4zdzNKvoj8tD
// Noto Sans — for navigation, labels, and UI chrome
// Font family strings must match the keys registered in _layout.tsx useFonts()

// UI fonts (Noto Sans) — for navigation, labels, and UI chrome
// Mirrors Figma: UI fonts/*
export const UIFonts = {
  bodyMdBold:     { fontFamily: 'NotoSans_700Bold',   fontSize: 18, lineHeight: 25 },  // Figma: UI fonts/body-md-bold
  bodySBold:      { fontFamily: 'NotoSans_700Bold',   fontSize: 16, lineHeight: 22 },  // Figma: UI fonts/body-sm-bold
  bodySSemibold:  { fontFamily: 'NotoSans_600SemiBold', fontSize: 16, lineHeight: 22 }, // Figma: UI fonts/body-sm-semibold — new, not yet used in app
  bodySMedium:    { fontFamily: 'NotoSans_500Medium', fontSize: 16, lineHeight: 22 },  // Figma: UI fonts/body-sm-medium
  bodySRegular:   { fontFamily: 'NotoSans_400Regular', fontSize: 16, lineHeight: 22 }, // Figma: UI fonts/body-sm-regular
  bodyXsSemibold: { fontFamily: 'NotoSans_600SemiBold', fontSize: 14, lineHeight: 19 }, // Figma: UI fonts/body-xs-semibold
  bodyXsMedium:   { fontFamily: 'NotoSans_500Medium', fontSize: 14, lineHeight: 19 },  // Figma: UI fonts/body-xs-medium — not yet used in app
  bodyXsRegular:  { fontFamily: 'NotoSans_400Regular', fontSize: 14, lineHeight: 19 }, // Figma: UI fonts/body-xs-regular
  body2xsBold:    { fontFamily: 'NotoSans_700Bold',   fontSize: 12, lineHeight: 16 },  // Figma: UI fonts/body-2xs-bold
  body2xsSemibold: { fontFamily: 'NotoSans_600SemiBold', fontSize: 12, lineHeight: 16 }, // Figma: UI fonts/body-2xs-semibold
  body2xsMedium:  { fontFamily: 'NotoSans_500Medium', fontSize: 12, lineHeight: 16 },  // Figma: UI fonts/body-2xs-medium — not yet used in app
  body2xsRegular: { fontFamily: 'NotoSans_400Regular', fontSize: 12, lineHeight: 16 }, // Figma: UI fonts/body-2xs-regular
  body3xsRegular: { fontFamily: 'NotoSans_400Regular', fontSize: 11, lineHeight: 15 }, // Figma: UI fonts/body-3xs-regular
  // Figma: UI fonts / caps-body-xs-* — small caps variants (approximated with uppercase)
  capsBodyXsSemibold: { fontFamily: 'NotoSans_600SemiBold', fontSize: 14, lineHeight: 19, textTransform: 'uppercase' as const }, // Figma: UI fonts/caps-body-xs-semibold
  capsBodyXsRegular:  { fontFamily: 'NotoSans_500Medium', fontSize: 14, lineHeight: 19, textTransform: 'uppercase' as const },   // Figma: UI fonts/caps-body-xs-medium (name kept as "Regular" — no true small-caps Regular style exists in Figma)
} as const;

// Book fonts (Lora) — for chapter/section/lesson titles and body copy in the Reader
// Mirrors Figma: Book fonts/*
export const BookFonts = {
  titleXlBold:     { fontFamily: 'Lora_700Bold',    fontSize: 26, lineHeight: 33 },  // Figma: Book fonts/title-xl-bold
  titleLgBold:     { fontFamily: 'Lora_700Bold',    fontSize: 22, lineHeight: 28 },  // Figma: Book fonts/title-lg-bold
  titleLgSemibold: { fontFamily: 'Lora_600SemiBold', fontSize: 22, lineHeight: 28 }, // Figma: Book fonts/title-lg-semibold — not yet used in app
  titleLgMedium:   { fontFamily: 'Lora_500Medium',  fontSize: 22, lineHeight: 28 },  // Figma: Book fonts/title-lg-medium — not yet used in app
  titleMdSemibold: { fontFamily: 'Lora_600SemiBold', fontSize: 20, lineHeight: 26 }, // Figma: Book fonts/title-md-semibold
  titleMdMedium:   { fontFamily: 'Lora_500Medium',  fontSize: 20, lineHeight: 26 },  // Figma: Book fonts/title-md-medium — not yet used in app
  bodyMdBold:      { fontFamily: 'Lora_700Bold',    fontSize: 17, lineHeight: 32 },  // Figma: Book fonts/body-md-bold
  bodyMdSemibold:  { fontFamily: 'Lora_600SemiBold', fontSize: 17, lineHeight: 22 }, // Figma: Book fonts/body-md-semibold
  bodyMdRegular:   { fontFamily: 'Lora_400Regular', fontSize: 17, lineHeight: 32 },  // Figma: Book fonts/body-md-regular
  bodySmSemibold:  { fontFamily: 'Lora_600SemiBold', fontSize: 14, lineHeight: 22 }, // Figma: Book fonts/body-sm-semibold — not yet used in app
  bodySmRegular:   { fontFamily: 'Lora_400Regular', fontSize: 14, lineHeight: 22 },  // Figma: Book fonts/body-sm-regular — not yet used in app
  bodySmRegularItalic: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14, lineHeight: 22 }, // Figma: Book fonts/body-sm-regular-italic
} as const;
