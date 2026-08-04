import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/utils/theme';

// Figma: Icon Button (node 648:5933, file w4OSlFQqdU4zdzNKvoj8tD) — a
// circular 40×40 icon-only button with two "Surface" treatments. A separate
// component from the mainHero/mainHome/toolDrawer Button variants (not
// another entry in that cva) — built on top of the shared RNR Button
// (ghost variant, size="icon") since the icon's own color can't be driven
// by NativeWind's dark:/active: classes the way text/background can:
// react-native-svg ignores CSS, so the color has to be computed here and
// passed down as a plain `color` prop instead.
//
// Surface="transparent" (Figma's default) — for buttons sitting on a photo
// backdrop (e.g. Home's hero card): icon stays Brand 100 in both themes at
// rest (needs to read against a photo, not the app's light/dark surface),
// pressed swaps to Ink 100 with a Brand 200 (light) / Gold 100 (dark) fill.
//
// Surface="solid" — for buttons sitting on the app's own page background:
// icon follows the page's ink color (Ink 100 light / Brand 100 dark) at
// rest; pressed fill is Brand 300 (light) / Gold 100 (dark), icon swaps to
// Ink 100 in both themes.
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
};

const PRESS_BG: Record<Surface, string> = {
  transparent: 'active:bg-[#EDE6E1] dark:active:bg-[#A6875B]',
  solid: 'active:bg-[#F0E6DF] dark:active:bg-[#A6875B]',
};

export function IconButton({ icon: Icon, surface = 'transparent', iconSize = 20, onPress, style, className }: IconButtonProps) {
  const { isDark } = useTheme();

  const iconColor = (pressed: boolean) => {
    if (surface === 'transparent') {
      return pressed ? Colors.ink100 : Colors.brand100;
    }
    if (pressed) return Colors.ink100;
    return isDark ? Colors.brand100 : Colors.ink100;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('rounded-full px-1', PRESS_BG[surface], className)}
      onPress={onPress}
      style={style}
    >
      {({ pressed }: { pressed: boolean }) => <Icon size={iconSize} color={iconColor(pressed)} />}
    </Button>
  );
}
