import { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SavedItemRow } from '@/components/SavedItemRow';
import { AppScrollView } from '@/components/AppScrollView';
import { NavBar } from '@/components/NavBar';
import { useTheme, useThemeColors } from '@/utils/theme';
import { useBookmarks, bookmarkHref } from '@/utils/bookmarks';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderWidth } from '@/constants/Tokens';

export default function BookmarksScreen() {
  const { isDark } = useTheme();
  const t = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const { bookmarks } = useBookmarks();

  const [navigating, setNavigating] = useState(false);
  const [loadBarVisible, setLoadBarVisible] = useState(false);
  const loadBarAnim = useRef(new Animated.Value(0)).current;

  const startLoadBar = useCallback(() => {
    setLoadBarVisible(true);
    loadBarAnim.setValue(0);
    Animated.timing(loadBarAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loadBarAnim]);

  useFocusEffect(
    useCallback(() => {
      setNavigating(false);
      setLoadBarVisible(false);
      loadBarAnim.stopAnimation();
      loadBarAnim.setValue(0);
    }, [loadBarAnim])
  );

  const sortedBookmarks = [...bookmarks].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <SafeAreaView style={[styles.topArea, { backgroundColor: t.darkerBackgroundColor }]} edges={['top']}>
      <SafeAreaView style={[styles.container, { backgroundColor: t.backgroundColor }]} edges={['bottom']}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
        <NavBar title="Guardados" onBack={() => router.back()} />

        <AppScrollView
          contentContainerStyle={styles.content}
          style={[styles.scrollView, { backgroundColor: t.backgroundColor }]}
        >
          {sortedBookmarks.map((item) => (
            <SavedItemRow
              key={item.id}
              item={item}
              onPress={() => {
                if (navigating) return;
                setNavigating(true);
                startLoadBar();
                setTimeout(() => router.push(bookmarkHref(item)), 200);
              }}
            />
          ))}
        </AppScrollView>
        {loadBarVisible && (
          <View style={[styles.loadBarTrack, { backgroundColor: isDark ? Colors.transparent : t.darkOutline }]}>
            <Animated.View style={[
              styles.loadBarFill,
              { backgroundColor: isDark ? t.darkerBackgroundColor : t.fontColorPrimary },
              { transform: [{ translateX: loadBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
            ]} />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing[40],
  },
  loadBarTrack: {
    height: BorderWidth.lg,
    overflow: 'hidden',
  },
  loadBarFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: BorderWidth.lg,
  },
});
