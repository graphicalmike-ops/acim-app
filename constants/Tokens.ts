// Design tokens — sourced from Figma file w4OSlFQqdU4zdzNKvoj8tD
// Variable collection: Semantic Tokens, Mode 1 (Borders/* and spacing/* only —
// the color variables in this collection are semantic and unused; see
// constants/Colors.ts, which uses the Primitive Tokens collection instead)

export const Radius = {
  sm:    3,   // Figma: Borders/radius/sm
  md:    6,   // Figma: Borders/radius/md
  lg:    12,  // Figma: Borders/radius/lg
  xl:    20,  // Figma: Borders/radius/xl
  round: 9999, // Figma: Borders/radius/round
} as const;

export const BorderWidth = {
  sm: 1,  // Figma: Borders/width/sm
  md: 2,  // Figma: Borders/width/md
  lg: 3,  // Figma: Borders/width/lg
} as const;

export const Spacing = {
  none: 0,    // Figma: spacing/none
  2:    2,    // Figma: spacing/2
  4:    4,    // Figma: spacing/4
  6:    6,    // Figma: spacing/6
  8:    8,    // Figma: spacing/8
  10:   10,   // Figma: spacing/10
  12:   12,   // Figma: spacing/12
  16:   16,   // Figma: spacing/16
  20:   20,   // Figma: spacing/20
  24:   24,   // Figma: spacing/24
  32:   32,   // Figma: spacing/32
  40:   40,   // Figma: spacing/40
  48:   48,   // Figma: spacing/48
  56:   56,   // Figma: spacing/56
  64:   64,   // Figma: spacing/64
  72:   72,   // Figma: spacing/72
  80:   80,   // Figma: spacing/80
  96:   96,   // Figma: spacing/96
  128:  128,  // Figma: spacing/128
} as const;

// App-defined (not a Figma variable) — composite `boxShadow` CSS-value
// strings, for RN 0.74+/New Arch's cross-platform `boxShadow` style prop.
// Not usable inside a NativeWind `className` directly (Tailwind needs the
// class string itself statically written out, not a JS value plugged in at
// runtime) — components consuming this via className instead spell out the
// equivalent `shadow-[...]` arbitrary-value class literally, with a comment
// pointing back here so the two stay in sync if this value changes.
export const Shadows = {
  // Drawer slides up from the bottom of the screen, so its shadow points
  // *up* (offset x0/y-2) to read as floating above the reader content
  // behind it. Used by app/reader.tsx's drawer header.
  drawer: '0px -2px 4px 0px rgba(0,0,0,0.15)',
  // Menu/dialog drop down over their trigger/backdrop, so this shadow points
  // *down* (offset x0/y2) — same blur/spread as `drawer`, opposite
  // direction, higher opacity. Used by components/UIMenu.tsx's popup and
  // ConfirmDialog.tsx's card.
  menu: '0px 2px 4px 0px rgba(0,0,0,0.25)',
} as const;
