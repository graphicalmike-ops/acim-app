import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BorderWidth } from '@/constants/Tokens';
import { useTheme } from '@/utils/theme';

// Pulled from Figma node 674:2847 (file w4OSlFQqdU4zdzNKvoj8tD), component
// set "Loading Bar" — variants Element(Track/Fill) x Mode(Light/Dark). A thin
// horizontal track with an animated fill that slides in from the left,
// shown briefly during in-app navigation. Was previously duplicated inline
// across app/home.tsx, contents.tsx, reader.tsx, search.tsx, and
// bookmarks.tsx; each screen keeps its own loadBarVisible/loadBarAnim state
// and startLoadBar() trigger logic (navigation business logic), only the
// rendering moved here.
//
// Same fill colors as AppScrollView's thumb (see that file's own comment).

type Props = {
  /** Whether the bar is currently shown — mirrors each screen's own loadBarVisible state. */
  visible: boolean;
  /** Each screen's own loadBarAnim Animated.Value, driven 0 -> 1 by that screen's startLoadBar(). */
  progress: Animated.Value;
  /** Current screen width, used so the fill's start position is fully off-screen to the left. */
  screenWidth: number;
  /** Extra styling for the track — e.g. absolute positioning + safe-area offset. */
  style?: StyleProp<ViewStyle>;
};

export function LoadingBar({ visible, progress, screenWidth, style }: Props) {
  const { isDark } = useTheme();
  if (!visible) return null;

  return (
    <View style={[styles.track, { backgroundColor: isDark ? Colors.dark100 : Colors.brand400 }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: isDark ? Colors.gold100 : Colors.ink100 },
          { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: BorderWidth.lg,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BorderWidth.lg,
  },
});
