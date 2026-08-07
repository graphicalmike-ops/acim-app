// Design tokens — sourced from Figma file w4OSlFQqdU4zdzNKvoj8tD
// Variable collection: Primitive Tokens, Mode 1
//
// Primitive tokens only — no semantic color tokens. With this few components,
// a semantic name tied to one-off instances (e.g. "primary-button-bg") isn't
// worth maintaining; call sites reference the primitive directly. Border
// width, radius, and spacing DO use semantic tokens — see constants/Tokens.ts.

export const Colors = {
  brand100:   '#F7F4F2',  // Figma: Colors/Brand/Brand 100
  brand200:   '#EDE6E1',  // Figma: Colors/Brand/Brand 200
  brand300:   '#F0E6DF',  // Figma: Colors/Brand/Brand 300
  brand400:   '#DED5CE',  // Figma: Colors/Brand/Brand 400
  neutral100: '#FFFFFF',  // Figma: Colors/Neutral/Neutral 100
  neutral200: '#CCCCCC',  // Figma: Colors/Neutral/Neutral 200
  neutral300: '#999999',  // Figma: Colors/Neutral/Neutral 300
  dark100:    '#1B1933',  // Figma: Colors/Dark/Dark 100 (old Dark 100 deleted; Dark 200 renamed to Dark 100)
  dark200:    '#302C59',  // Figma: Colors/Dark/Dark 200 (confirmed 2026-08-05 resync; was app-defined/added on request, Figma has since added a matching primitive)
  gold100:    '#A6875B',  // Figma: Colors/Gold/Gold 100
  gold200:    '#CCBBA3',  // Figma: Colors/Gold/Gold 200
  gold300:    '#B27E36',  // Figma: Colors/Gold/Gold 300
  gold400:    '#C49027',  // Figma: Colors/Gold/Gold 400
  ink100:     '#333333',  // Figma: Colors/Ink/Ink 100
  ink200:     '#666666',  // Figma: Colors/Ink/Ink 200
  ink300:     '#803300',  // Figma: Colors/Ink/Ink 300

  // No exact match among the Figma primitives above — left as their original
  // raw values rather than forced onto a nearby-but-different primitive.
  primaryButtonPressed:  '#EBE8E6',
  textHighlight:         '#803000',
  divider:               '#EDE5D8',
  savedHighlight:        'rgba(255, 224, 102, 0.32)',      // translucent highlighter yellow (light mode)
  savedHighlightDark:    'rgba(255, 224, 102, 0.32)',      // translucent highlighter yellow (dark mode, keeps white text legible)

  // Utility — not in Figma
  black:       '#000000',
  transparent: 'transparent',
  overlay:     'rgba(51, 51, 51, 0.6)',

  // Image scrims — not in Figma. App-defined so raw rgba values don't get
  // scattered across screens; each is a black dimming overlay over a photo
  // background at a fixed opacity, named by that opacity.
  imageScrim20: 'rgba(0, 0, 0, 0.20)',
  imageScrim30: 'rgba(0, 0, 0, 0.30)',
  imageScrim35: 'rgba(0, 0, 0, 0.35)',
  imageScrim40: 'rgba(0, 0, 0, 0.40)',
} as const;
