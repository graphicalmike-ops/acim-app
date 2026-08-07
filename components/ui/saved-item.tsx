import { Text, View } from 'react-native';
import { RipplePressable } from '@/components/RipplePressable';
import { TertiaryButton } from '@/components/TertiaryButton';
import { ActionsIcon } from '@/components/Icons';
import { useTheme } from '@/utils/theme';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderWidth } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';

// Pulled from Figma node 674:2592 (file w4OSlFQqdU4zdzNKvoj8tD), component
// set "Saved-items" — variants State(Default/Pressed) x Type(Accordion, the
// only option defined) x Mode(Light/Dark). Wired into app/bookmarks.tsx and
// app/reader.tsx's save/toolbar drawers, replacing components/SavedItemRow.tsx.
//
// Figma's "Pressed" state is this app's ripple-splash color (RipplePressable
// already renders that as a transient overlay via `rippleColor`), not a
// persistent background swap — same pattern as index-item.tsx.
//
// Dark-mode "Pressed" row background is Colors/Gold/Gold 100 (matches the
// elevated/pressed treatment already used in index-item.tsx) — text/icon
// colors stay constant between Default and Pressed within a given mode.
//
// Also: Figma's date label alternates Regular/Medium weight inconsistently
// across the 4 variants (Default-Dark uses Medium 500, the other 3 use
// Regular 400) — since no "body-3xs-medium" token exists and 3 of 4 variants
// agree, this uses UIFonts.body3xsRegular uniformly rather than branching.

// Exported so callers building a custom `actionsSlot` (e.g. wrapping the
// ellipsis trigger in a MenuView) can match this row's own colors exactly.
export function useSavedRowColors() {
  const { isDark } = useTheme();
  return {
    backgroundColor: isDark ? Colors.dark100 : Colors.brand100,
    rippleColor: isDark ? Colors.gold100 : Colors.brand200,
    labelColor: isDark ? Colors.brand100 : Colors.ink100,
    mutedColor: isDark ? Colors.brand300 : Colors.ink200,
    iconColor: isDark ? Colors.neutral100 : Colors.ink100,
    // Figma's 4 variants all bind to Brand 400, but overridden to match
    // index-item.tsx's own dark-mode divider treatment (Neutral 300) for
    // consistency across row types — light mode stays Figma's Brand 400.
    dividerColor: isDark ? Colors.neutral300 : Colors.brand400,
  };
}

export type SavedItemProps = {
  // Pre-composed citation label, e.g. "M-5.I.1:1 - I. El propósito de la
  // enfermedad" — caller joins notation + section title:
  // `item.name ? \`${item.notation} - ${item.name}\` : item.notation`.
  label: string;
  // Pre-formatted date, e.g. "28 jul 2026" (see formatSavedDate in
  // utils/text.ts).
  date: string;
  // Saved note preview text.
  note?: string;
  onPress?: () => void;
  // Ellipsis actions button (share/delete menu). Plain tap callback for the
  // common case — ignored when `actionsSlot` is provided.
  onActionsPress?: () => void;
  // Escape hatch for callers whose actions button opens its own menu (e.g.
  // `@/components/UIMenu`'s `<UIMenu actions={...} />`, which renders the
  // ellipsis trigger + dropdown itself, not a separate callback). When
  // provided, this renders in place of the built-in ellipsis
  // button/`onActionsPress`, in the same slot — the caller owns the whole
  // trigger and is responsible for matching its look (hitSize 40,
  // rippleColor, ActionsIcon — UIMenu already does this for you).
  actionsSlot?: React.ReactNode;
  showDivider?: boolean;
};

export function SavedItem({ label, date, note, onPress, onActionsPress, actionsSlot, showDivider = true }: SavedItemProps) {
  const { backgroundColor, rippleColor, labelColor, mutedColor, iconColor, dividerColor } = useSavedRowColors();

  return (
    <RipplePressable
      onPress={onPress}
      rippleColor={rippleColor}
      style={{ backgroundColor, paddingTop: Spacing[12], paddingRight: Spacing[24], paddingLeft: Spacing[24], gap: Spacing[12], overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, gap: Spacing[2] }}>
          <Text style={[UIFonts.body3xsRegular, { color: mutedColor }]}>{date}</Text>
          <Text style={[UIFonts.bodyXsMedium, { color: labelColor }]}>{label}</Text>
          {note ? <Text style={[UIFonts.body2xsRegular, { color: mutedColor }]}>{note}</Text> : null}
        </View>
        {actionsSlot ?? (
          <TertiaryButton hitSize={40} rippleColor={rippleColor} onPress={onActionsPress}>
            {() => <ActionsIcon size={16} color={iconColor} />}
          </TertiaryButton>
        )}
      </View>
      {showDivider ? <View style={{ height: BorderWidth.sm, backgroundColor: dividerColor }} /> : null}
    </RipplePressable>
  );
}
