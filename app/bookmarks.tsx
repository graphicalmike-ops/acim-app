import { useState, useCallback, useRef } from 'react';
import { StyleSheet, Animated, useWindowDimensions, Share, ToastAndroid, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { SavedItem, useSavedRowColors } from '@/components/ui/saved-item';
import { UIMenu } from '@/components/UIMenu';
import { ConfirmDialog, ConfirmDialogContent } from '@/components/ConfirmDialog';
import { AppScrollView } from '@/components/AppScrollView';
import { LoadingBar } from '@/components/ui/loading-bar';
import { NavBar } from '@/components/NavBar';
import { useTheme, useThemeColors } from '@/utils/theme';
import { useBookmarks, bookmarkHref, SavedBookmark } from '@/utils/bookmarks';
import { getVersesText } from '@/utils/content';
import { formatSavedDate } from '@/utils/text';
import { Spacing } from '@/constants/Tokens';

export default function BookmarksScreen() {
  const { isDark } = useTheme();
  const t = useThemeColors();
  const { iconColor } = useSavedRowColors();
  const { width: screenWidth } = useWindowDimensions();
  const { bookmarks, deleteBookmark } = useBookmarks();

  const handleShare = useCallback((item: SavedBookmark) => {
    const verseText = getVersesText(item.bookId, item.anchor, item.paragraph, item.verses ?? []);
    const message = verseText ? `${verseText}\n\n${item.notation}` : `${item.notation} — ${item.note}`;
    Share.share({ message });
  }, []);

  const handleDelete = useCallback((item: SavedBookmark) => {
    deleteBookmark(item.id);
    if (Platform.OS === 'android') ToastAndroid.show('Eliminado', ToastAndroid.SHORT);
  }, [deleteBookmark]);

  // "Eliminar" in the row's UIMenu opens this confirm step instead of
  // deleting straight away — holds the pending item until the user confirms
  // or cancels in the ConfirmDialog rendered below.
  const [deleteTarget, setDeleteTarget] = useState<SavedBookmark | null>(null);

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
            <SavedItem
              key={item.id}
              label={item.name ? `${item.notation} - ${item.name}` : item.notation}
              date={formatSavedDate(item.date)}
              note={item.note}
              onPress={() => {
                if (navigating) return;
                setNavigating(true);
                startLoadBar();
                setTimeout(() => router.push(bookmarkHref(item)), 200);
              }}
              actionsSlot={
                <UIMenu
                  iconColor={iconColor}
                  actions={[
                    { id: 'share', title: 'Compartir', onPress: () => handleShare(item) },
                    { id: 'delete', title: 'Eliminar', destructive: true, onPress: () => setDeleteTarget(item) },
                  ]}
                />
              }
            />
          ))}
        </AppScrollView>
        <LoadingBar visible={loadBarVisible} progress={loadBarAnim} screenWidth={screenWidth} />
      </SafeAreaView>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ConfirmDialogContent
          title="¿Eliminar verso guardado?"
          description="Esta acción no se puede deshacer."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) handleDelete(deleteTarget);
            setDeleteTarget(null);
          }}
        />
      </ConfirmDialog>
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
});
