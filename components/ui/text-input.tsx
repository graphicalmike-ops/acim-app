import { TextInput, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius, BorderWidth, Spacing } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';
import { useTheme } from '@/utils/theme';

// Pulled from Figma node 676:3496 (file w4OSlFQqdU4zdzNKvoj8tD), component
// set "Text input" — replaces components/NoteInput.tsx (wired into
// app/reader.tsx's save drawer).
//
// Re-synced 2026-08-05 against the current Figma state — verified live via
// figma_execute (not just the deep-extraction tool), since a prior pull on
// this component pair found the deep tool can go stale on the Default/Dark
// cell specifically. componentPropertyDefinitions reads a clean 2×2 grid:
// State(Default/Filled) × Mode(Light/Dark):
//   - Light: Colors.neutral100 box fill, Colors.brand400 1px border;
//     placeholder text Colors.neutral200 (State=Default), typed text
//     Colors.dark100 (State=Filled).
//   - Dark: no box fill (transparent — lets the screen's dark background
//     show through) in both states; placeholder text Colors.neutral300
//     (State=Default — was Colors.gold200 on the prior pull; Figma dropped
//     the gold accent here in favor of neutral), typed text
//     Colors.neutral100/white (State=Filled, unchanged).
//   - Dark border: Colors.neutral100/white (was Colors.gold100 on the prior
//     pull).
//   - Border width varies by state in BOTH themes (product decision,
//     2026-08-06): 1px (BorderWidth.sm) at Default, 2px (BorderWidth.md)
//     once filled — was dark-only before; now applies to Light too. Same
//     rule on Search input (components/ui/search-input.tsx).
//
// Re-verified 2026-08-07 — all 4 variant colors/border-widths above still
// match live Figma exactly, no drift. The component frame is 48px tall
// (Spacing[48], not the previous Spacing[40]).
//
// Right padding deliberately deviates from the Figma pull above (which read
// 4px, matching Search input's own right inset): overridden back to a
// symmetric 12px/12px (product decision) since, unlike Search input, this
// component has no trailing icon to make room for. Also now `multiline` —
// long typed text wraps onto additional lines (container grows via
// `minHeight`, not a fixed `height`) instead of scrolling horizontally and
// hiding the start of the text; see `input`'s own comment below for how the
// vertical layout math changed to support that.
// A plain controlled <TextInput> already renders the Default/Filled split
// for free (placeholder color while empty, text color once there's a
// value), so this component takes no separate "filled"/variant prop —
// `useTheme().isDark` for the Light/Dark axis, plus `value` (via a local
// isFilled check) for the dark-mode border-width split above.
//
// Named TextInputField (not TextInput) to avoid shadowing the React Native
// TextInput it wraps internally.
//
// Submit affordance gap — resolved 2026-08-05: none of the 4 Figma variants
// of this "Text input" component include a trailing icon/button, so this
// component still has no icon slot of its own; submission here stays
// return-key only (returnKeyType="done" + onSubmitEditing -> onSubmit).
// Figma's "Save" Drawer variant (node 693:2536) instead places a separate
// IconButton icon={PlusIcon} (components/ui/icon-button.tsx) as a sibling to
// this component in a row, gap 6 — that's how app/reader.tsx's save drawer
// now wires the explicit submit affordance back in, by composition rather
// than by this component growing an icon prop.

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function TextInputField({ value, onChangeText, onSubmit, placeholder = 'Ingresa una nota', autoFocus }: Props) {
  const { isDark } = useTheme();
  const isFilled = value.length > 0;
  const backgroundColor = isDark ? Colors.transparent : Colors.neutral100;
  const borderColor = isDark ? Colors.neutral100 : Colors.brand400;
  const borderWidth = isFilled ? BorderWidth.md : BorderWidth.sm;
  const placeholderColor = isDark ? Colors.neutral300 : Colors.neutral200;
  const textColor = isDark ? Colors.neutral100 : Colors.dark100;

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
        returnKeyType="done"
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // minHeight (not a fixed height) — now that the input is `multiline`,
    // this needs to grow taller as typed text wraps past one line instead
    // of clipping/scrolling horizontally. 48px still holds for the common
    // single-line case (see `input`'s own paddingVertical math below).
    minHeight: Spacing[48],
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingLeft: Spacing[12],
    paddingRight: Spacing[12],
  },
  input: {
    flex: 1,
    ...UIFonts.bodySRegular,
    // Single-line case: paddingVertical (12+12=24) + bodySRegular's 22
    // lineHeight = 46, just under the container's 48 minHeight, so the
    // container's own `alignItems: 'center'` centers it with ~1px to
    // spare either side — visually matches the old fixed-height/centered
    // approach. Multi-line case: as text wraps, the input's own natural
    // height grows past 48 and the container (minHeight, not height) grows
    // with it; `textAlignVertical: 'top'` (not 'center') keeps the first
    // line anchored at the top as later lines append below it, rather than
    // re-centering the whole growing block — the user wants text to stay
    // put and grow downward, not shift/hide.
    textAlignVertical: 'top',
    includeFontPadding: false,
    paddingHorizontal: Spacing.none,
    paddingVertical: Spacing[12],
  },
});
