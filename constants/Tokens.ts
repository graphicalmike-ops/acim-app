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
