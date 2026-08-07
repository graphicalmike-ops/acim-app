import type { ComponentType } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';
import { View as RNView } from 'react-native';
import { RipplePressable } from '@/components/RipplePressable';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Tokens';
import { useTheme } from '@/utils/theme';

// Figma: Icon Button (node 648:5933, file w4OSlFQqdU4zdzNKvoj8tD) — a
// circular 40×40 icon-only button with two "Surface" treatments. Built
// directly on RipplePressable (like components/TertiaryButton.tsx) rather
// than the shared RNR Button — the icon's own color can't be driven by
// NativeWind's dark:/active: classes the way text/background can:
// react-native-svg ignores CSS, so the color has to be computed here and
// passed down as a plain `color` prop instead.
//
// Pressed-state feedback — re-verified directly against the live Figma
// variants (node 648:5933, all 8 Surface×State×Mode combos) 2026-08-07,
// not assumed from the old version of this comment. Figma's "Default"
// state variants all have an EMPTY fill (no background at all); only
// "Pressed" adds an opaque background disc behind the icon. That disc used
// to be stood in for by RipplePressable's animated ripple wash; now that
// the ripple is disabled (rippleColor="transparent" below, per product
// decision — do not re-enable it), the disc is rendered directly below as
// a `pressed`-gated absolutely-positioned View, using these exact Figma
// values:
//   Surface=Transparent, Pressed, Light → bg Brand 200 (#EDE6E1)
//   Surface=Transparent, Pressed, Dark  → bg Gold 100  (#A6875B)
//   Surface=Solid,       Pressed, Light → bg Brand 300 (#F0E6DF)
//   Surface=Solid,       Pressed, Dark  → bg Gold 100  (#A6875B)
// Icon stroke color itself (same verification pass): transparent-surface
// icon is Brand 100 at rest in both themes and swaps to Ink 100 on press in
// light mode only — the dark-mode press value is Brand 100, identical to
// its own rest value, so there's no visible swap there; solid-surface icon
// is Ink 100 (light) / Brand 100 (dark) at rest and does NOT change on
// press in either mode. That already matches what defaultIconColor below
// computes — only the missing background disc needed restoring.
type Surface = 'solid' | 'transparent';

type IconButtonProps = {
  icon: ComponentType<{ size?: number; color?: string }>;
  surface?: Surface;
  // Figma's icon slot is a flat 16px, but overridden to 20px per product
  // decision. Override further only if a call site deliberately wants a
  // different glyph size.
  iconSize?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  // Overrides `surface`'s own default color/pressed-color logic below —
  // static color, or a pressed-aware function. Needed by callers whose own
  // callers need a color `surface` alone can't express (e.g. UIMenu.tsx,
  // whose reader.tsx savedNoteSheet call site swaps color on a condition
  // that isn't just "pressed or not").
  color?: string | ((pressed: boolean) => string);
  // React 19 ref-as-prop, forwarded to the underlying RipplePressable/
  // Pressable so callers can `.measure()`/`.measureInWindow()` it — needed
  // by UIMenu.tsx's own trigger positioning.
  ref?: React.Ref<View>;
};

export function IconButton({ icon: Icon, surface = 'transparent', iconSize = 20, onPress, style, className, color, ref }: IconButtonProps) {
  const { isDark } = useTheme();

  const defaultIconColor = (pressed: boolean) => {
    if (surface === 'transparent') {
      if (!pressed) return Colors.brand100;
    }
    return isDark ? Colors.brand100 : Colors.ink100;
  };

  const resolveColor = (pressed: boolean) =>
    color ? (typeof color === 'function' ? color(pressed) : color) : defaultIconColor(pressed);

  // Figma's Pressed-state background disc (see header comment for the
  // per-variant values this was pulled from). Independent of the `color`
  // override above — that prop only overrides the icon's own color, not
  // this surface-level disc, since Figma draws the disc regardless of what
  // the icon itself renders.
  const pressedBackgroundColor =
    surface === 'solid' ? (isDark ? Colors.gold100 : Colors.brand300) : isDark ? Colors.gold100 : Colors.brand200;

  return (
    <RipplePressable
      ref={ref}
      className={className}
      style={[{ width: Spacing[40], height: Spacing[40], borderRadius: Radius.round, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}
      // No ripple animation — the pressed-state background disc below
      // (plus the icon's own pressed-state color swap, resolveColor above)
      // signals press instead. Still RipplePressable (not a plain
      // Pressable) so the pressed-state callback/onPress behavior stays
      // identical; "transparent" just makes the ripple paint invisible.
      rippleColor="transparent"
      onPress={onPress}
    >
      {({ pressed }: { pressed: boolean }) => (
        <>
          {pressed && (
            <RNView pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: pressedBackgroundColor }} />
          )}
          <Icon size={iconSize} color={resolveColor(pressed)} />
        </>
      )}
    </RipplePressable>
  );
}
