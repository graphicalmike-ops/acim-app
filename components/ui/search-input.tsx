import { TextInput, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SearchIcon, CloseIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';
import { Radius, BorderWidth, Spacing } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';
import { useTheme } from '@/utils/theme';

// Pulled from Figma node 678:3561 (file w4OSlFQqdU4zdzNKvoj8tD), component
// set "Search input" — replaces components/SearchBar.tsx (which was built
// from an older component, node 511:1367 "Search bar").
//
// Re-synced 2026-08-05 against the current Figma state — verified live via
// figma_execute (not just the deep-extraction tool), since a prior pull on
// this component found the deep tool can go stale on exactly the cell that
// matters most here (Default/Dark). componentPropertyDefinitions reads a
// clean 2×2 grid: State(Default/Filled) × Mode(Light/Dark). State still
// drives the content axis (`searched` prop below: false → Default, gray
// "Buscar" placeholder + search icon; true → Filled, typed text + close
// icon):
//   - Light: Colors.neutral100 box fill (both states), Colors.brand400
//     border, Colors.neutral200 placeholder / Colors.ink100 typed text,
//     Colors.ink100 icon (search + close). Unchanged from the prior pull.
//   - Dark: Colors.neutral100/white border (was Colors.gold100 on the prior
//     pull) in both states. Placeholder is Colors.neutral300 (was
//     Colors.gold200) — typed text and icon color are unchanged at
//     Colors.neutral100 (white).
//   - Border width varies by state in BOTH themes (product decision,
//     2026-08-06): 1px (BorderWidth.sm) at Default, 2px (BorderWidth.md)
//     once searched/Filled — was dark-only before; now applies to Light too.
//   - Box fill is now transparent in dark mode for BOTH states (Default and
//     Filled) — fixed in Figma 2026-08-06, re-pulled live. Previously
//     Default/dark kept Colors.neutral100 (white) while Filled/dark was
//     transparent, which made the Default/dark search icon (also white)
//     invisible against its own still-white box. Light mode is unaffected —
//     both states stay Colors.neutral100 there.
//
// Layout read directly off the pulled node: 6px radius, 12px left padding,
// 6px gap between the text and the icon button. Text is body-sm-regular
// (16/22 Noto Sans Regular).
//
// Icon touch target is Figma's 40×40 ("Icon Button" instance size) with the
// same fixed SearchIcon/CloseIcon glyphs, resized to Figma's 16px/12px. The
// shared components/ui/icon-button.tsx isn't used here since this
// component's icon color rule (Ink 100 light / white dark, independent of
// icon-button.tsx's own surface-driven palette) doesn't line up with it;
// colors are computed directly here instead.
//
// Re-verified 2026-08-07 against the live file — all colors/border-widths/
// icon sizing/font above still match exactly, no drift. Two things fixed
// this pass: (1) the component frame is 48px tall (Spacing[48], not the
// previous Spacing[40]); (2) the "no right padding, icon flush to the edge"
// claim above was wrong — the outer frame actually carries a 4px right
// padding (Spacing[4]), so the icon sits 4px inset from the true right
// edge, not flush against it. Both confirmed via componentPropertyDefinitions
// traversal (paddingLeft:12/paddingRight:4/height:48 identical across all 4
// variants) and a 4x screenshot of the Default/Light variant showing visible
// space between the search icon and the box's right edge.
//
// Figma defines no pressed state for this component. The ripple wash
// (RipplePressable + Colors.primaryButtonPressed) carries over unchanged
// from the previous component in both modes. The icon's pressed-state color
// swap (dimming on press) has no Figma spec either; it reuses this
// component's own resting placeholder tone per mode (Colors.ink200 light /
// Colors.neutral300 dark, updated to track the placeholder change above) as
// a reasonable dimmed tone rather than inventing a new token.

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  searched?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchInput({ value, onChangeText, onSubmit, onClear, searched, placeholder = 'Buscar', autoFocus }: Props) {
  const { isDark } = useTheme();
  const backgroundColor = isDark ? Colors.transparent : Colors.neutral100;
  const borderColor = isDark ? Colors.neutral100 : Colors.brand400;
  const borderWidth = searched ? BorderWidth.md : BorderWidth.sm;
  const placeholderColor = isDark ? Colors.neutral300 : Colors.neutral200;
  const textColor = isDark ? Colors.neutral100 : Colors.ink100;
  const iconColor = isDark ? Colors.neutral100 : Colors.ink100;
  const iconPressedColor = isDark ? Colors.neutral300 : Colors.ink200;

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor, borderColor, borderWidth }]}>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {searched ? (
        <RipplePressable
          style={styles.iconWrap}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={handleClear}
        >
          {({ pressed }) => <CloseIcon size={12} color={pressed ? iconPressedColor : iconColor} />}
        </RipplePressable>
      ) : (
        <RipplePressable
          style={styles.iconWrap}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={onSubmit}
        >
          {({ pressed }) => <SearchIcon size={16} color={pressed ? iconPressedColor : iconColor} />}
        </RipplePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Spacing[48],
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingLeft: Spacing[12],
    paddingRight: Spacing[4],
    gap: Spacing[6],
  },
  input: {
    flex: 1,
    ...UIFonts.bodySRegular,
    // Same fix as components/ui/text-input.tsx: fill the row's full height
    // and center within that (rather than leaning on the container's
    // alignItems:'center' + the input's own unset intrinsic height), plus
    // includeFontPadding:false to cancel out Android's extra glyph
    // ascent/descent padding that otherwise skews "centered" text off-center.
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
    padding: Spacing.none,
  },
  iconWrap: {
    width: Spacing[40],
    height: Spacing[40],
    borderRadius: Radius.round,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
