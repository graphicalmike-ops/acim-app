import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';
import { IconButton } from '@/components/ui/icon-button';
import { BackIcon, HomeIcon } from '@/components/Icons';
import { useTheme, useThemeColors } from '@/utils/theme';

// Figma: Nav bar (node 674:3164, file w4OSlFQqdU4zdzNKvoj8tD) — back button,
// eyebrow + title stack, optional home button. IconButton uses surface="solid",
// matching Figma's own Icon Button instances (Surface=Solid) — exact in light
// mode (Ink 100); in dark mode Figma's icon glyphs are directly overridden to
// Neutral 100 (pure white) where solid gives Brand 100 (#F7F4F2, near-white)
// instead — a deliberate, visually negligible deviation rather than adding a
// new IconButton surface for one caller.
//
// Eyebrow/title colors are one-off literals, not theme.tsx's fontColorGray/
// fontColorPrimary — those are shared across many unrelated screen elements
// and Figma's dark-mode values here (Brand 300 eyebrow, Brand 100 title)
// don't match them.
//
// iconSize={16} overrides IconButton's app-wide 20px default, matching
// Figma's own 16px glyph for this component specifically (per product
// feedback — 20px read too large against the 40x40 button here).
//
// Figma defines this as two named variants — "Single Line" (title only) and
// "Double line" (eyebrow + title) — chosen here by whether `eyebrow` is
// passed. Both use the same bold body-xs-semibold title style; Single Line
// isn't a distinct larger/regular treatment.
type NavBarProps = {
  eyebrow?: string;
  title?: string;
  onBack?: () => void;
  onHome?: () => void;
  children?: ReactNode;
};

export function NavBar({ eyebrow, title, onBack, onHome, children }: NavBarProps) {
  const { isDark } = useTheme();
  const t = useThemeColors();
  const eyebrowColor = isDark ? Colors.brand300 : Colors.ink200;
  const titleColor = isDark ? Colors.brand100 : Colors.ink100;

  return (
    <View style={[styles.bar, { backgroundColor: t.darkerBackgroundColor }]}>
      <IconButton icon={BackIcon} surface="solid" iconSize={16} onPress={onBack ?? (() => router.back())} />
      <View style={styles.center}>
        {children ?? (
          <>
            {!!eyebrow && <Text numberOfLines={1} style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>}
            {!!title && (
              <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
                {title}
              </Text>
            )}
          </>
        )}
      </View>
      {!!onHome && <IconButton icon={HomeIcon} surface="solid" iconSize={16} onPress={onHome} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[12],
    paddingLeft: Spacing[16],
    paddingRight: Spacing[20],
    paddingVertical: Spacing[12],
  },
  center: {
    flex: 1,
    gap: Spacing[4],
  },
  eyebrow: {
    ...UIFonts.body2xsRegular,
  },
  title: {
    ...UIFonts.bodyXsSemibold,
  },
});
