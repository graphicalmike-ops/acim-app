import { Text, View } from 'react-native';
import { RipplePressable } from '@/components/RipplePressable';
import { useTheme } from '@/utils/theme';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderWidth } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';

// Pulled from Figma node 674:2700 (file w4OSlFQqdU4zdzNKvoj8tD), component
// set "Search-items" — variants State(Default/Pressed) x Mode(Light/Dark).
// Wired into app/search.tsx's results list.
//
// Figma's "Pressed" state is this app's ripple-splash color (RipplePressable
// already renders that as a transient overlay via `rippleColor`), not a
// persistent background swap — same pattern as index-item.tsx. Dark-mode
// "Pressed" row background is Colors/Gold/Gold 100 (matches Saved-items and
// index-item.tsx's own elevated/pressed treatment) — text colors stay
// constant between Default and Pressed within a given mode.
//
// The snippet/subtitle text layer in Figma has no single resolvable
// fontFamily/fontStyle — it mixes Regular and Bold runs (the highlighted
// search-match spans) — confirming `subtitle` here must accept
// React.ReactNode rather than a plain string, so a caller can compose bold
// spans the way app/search.tsx already does via utils/search.ts's
// splitSnippet()/truncateSnippetSegments().

function useSearchRowColors() {
  const { isDark } = useTheme();
  return {
    backgroundColor: isDark ? Colors.dark100 : Colors.brand100,
    rippleColor: isDark ? Colors.gold100 : Colors.brand200,
    labelColor: isDark ? Colors.brand100 : Colors.ink100,
    subtitleColor: isDark ? Colors.brand300 : Colors.ink200,
    // Figma's 4 variants all bind to Brand 400, but overridden to match
    // index-item.tsx's own dark-mode divider treatment (Neutral 300) for
    // consistency across row types — light mode stays Figma's Brand 400.
    dividerColor: isDark ? Colors.neutral300 : Colors.brand400,
  };
}

export type SearchItemProps = {
  // Pre-composed citation label, e.g. "T-1.I.43:1 - I. El propósito de la
  // enfermedad" — caller joins formatRouteId() + nearestTitle(), mirroring
  // app/search.tsx's current row label.
  label: string;
  // Snippet/excerpt text. Accepts ReactNode (not just string) so a caller
  // can render highlighted match spans — e.g. mapping
  // truncateSnippetSegments(splitSnippet(...)) into bold/plain <Text> runs
  // the way app/search.tsx's itemSubtitleBold style does today.
  subtitle?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
};

export function SearchItem({ label, subtitle, onPress, showDivider = true }: SearchItemProps) {
  const { backgroundColor, rippleColor, labelColor, subtitleColor, dividerColor } = useSearchRowColors();

  return (
    <RipplePressable
      onPress={onPress}
      rippleColor={rippleColor}
      style={{ backgroundColor, paddingTop: Spacing[12], paddingRight: Spacing[24], paddingLeft: Spacing[24], gap: Spacing[12], overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1, gap: Spacing[2] }}>
          <Text style={[UIFonts.bodyXsMedium, { color: labelColor }]}>{label}</Text>
          {subtitle ? <Text style={[UIFonts.body2xsRegular, { color: subtitleColor }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {showDivider ? <View style={{ height: BorderWidth.sm, backgroundColor: dividerColor }} /> : null}
    </RipplePressable>
  );
}
