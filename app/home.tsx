import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { Radius, BorderWidth, Spacing } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';
import { TheoryIcon, ExercizesIcon, TeacherIcon, SupplementalIcon, TipLightIcon, LightModeIcon, DarkModeIcon, SearchIcon, BookmarkIcon } from '@/components/Icons';
import { HeroLogo } from '@/components/HeroLogo';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Text as ButtonText } from '@/components/ui/text';
import { loadLastRead, clearLastRead, LastReadState } from '@/utils/lastRead';
import { useTheme } from '@/utils/theme';
import { useBookmarks } from '@/utils/bookmarks';

const BUTTONS = [
  { Icon: TheoryIcon,       label: 'Libro de Texto',         anchor: 'theory'     },
  { Icon: ExercizesIcon,    label: 'Libro de Ejercicios',    anchor: 'workbook'   },
  { Icon: TeacherIcon,      label: 'Manual para el Maestro', anchor: 'mft'        },
  { Icon: SupplementalIcon, label: 'Suplementos',            anchor: 'supplement' },
];

const heroSourceLight = require('@/assets/images/splash-bg-alt.jpg');
const heroSourceDark = require('@/assets/images/splash-bg-dark-alt.jpg');

export default function HomeScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { bottom: bottomInset } = useSafeAreaInsets();

  // Crossfades the hero image on every theme change, not just the first —
  // both images stay mounted (no source swap) so there's nothing to
  // decode/load mid-transition, just an opacity animation on top.
  const heroFadeAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(heroFadeAnim, { toValue: isDark ? 1 : 0, duration: 350, useNativeDriver: true }).start();
  }, [isDark, heroFadeAnim]);

  const t = isDark ? {
    pageBg:          Colors.dark100,
    topBarBg:        Colors.dark100,
    btnIconColor:    Colors.brand100,
    highlightedOverlay: Colors.imageScrim40,
  } : {
    pageBg:          Colors.brand100,
    topBarBg:        Colors.brand100,
    btnIconColor:    Colors.ink100,
    highlightedOverlay: Colors.imageScrim35,
  };
  const { clearAllBookmarks } = useBookmarks();
  const [lastRead, setLastRead] = useState<LastReadState | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [loadBarVisible, setLoadBarVisible] = useState(false);

  const handleResetAll = useCallback(() => {
    Alert.alert(
      '¿Restablecer todo?',
      'Se borrará el último capítulo leído y todos los versos guardados junto con sus notas. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            await clearLastRead();
            setLastRead(null);
            clearAllBookmarks();
          },
        },
      ]
    );
  }, [clearAllBookmarks]);
  const loadBarAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();

  const startLoadBar = useCallback(() => {
    setLoadBarVisible(true);
    loadBarAnim.setValue(0);
    Animated.timing(loadBarAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [loadBarAnim]);

  useFocusEffect(
    useCallback(() => {
      loadLastRead().then(setLastRead);
      setNavigating(false);
      setLoadBarVisible(false);
      loadBarAnim.stopAnimation();
      loadBarAnim.setValue(0);
    }, [loadBarAnim])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.pageBg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.topBarBg} />

      {/* Top bar (donation/tip + light/dark toggle) hidden — may be restored later
      <View style={[styles.topBar, { backgroundColor: t.topBarBg }]}>
        <IconButton icon={TipLightIcon} surface="transparent" onPress={async () => { await clearLastRead(); setLastRead(null); }} />
        <IconButton icon={isDark ? LightModeIcon : DarkModeIcon} surface="transparent" onPress={toggleTheme} />
      </View>
      */}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero card */}
        <View style={[styles.heroCard, { borderColor: isDark ? Colors.brand400 : Colors.transparent }]}>
          <Image
            source={heroSourceLight}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
            resizeMode="cover"
          />
          <Animated.Image
            source={heroSourceDark}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: heroFadeAnim }]}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

          <View style={styles.heroTipButton}>
            <IconButton icon={TipLightIcon} surface="transparent" onPress={handleResetAll} />
          </View>

          <View style={styles.heroThemeToggle}>
            <IconButton icon={isDark ? LightModeIcon : DarkModeIcon} surface="transparent" onPress={toggleTheme} />
          </View>

          <View style={styles.heroContent}>
            {/* Logo — top half */}
            <View style={styles.heroLogo}>
              <HeroLogo />
            </View>

            {/* Highlighted item — continue reading / welcome */}
            <View style={[styles.highlighted, { backgroundColor: t.highlightedOverlay }]}>
              <View style={styles.highlightPlaceholders}>
                <IconButton icon={SearchIcon} surface="transparent" onPress={() => router.push('/search')} />
                <IconButton icon={BookmarkIcon} surface="transparent" onPress={() => router.push('/bookmarks')} />
              </View>
              <View style={styles.highlightMeta}>
                <Text style={styles.highlightLabel}>{lastRead ? 'Continúa leyendo' : 'Te damos la bienvenida:'}</Text>
                {lastRead && <Text style={styles.highlightChapter}>{lastRead.breadcrumb}</Text>}
              </View>
              {lastRead && <Text style={styles.highlightQuote}>{lastRead.title}</Text>}
              <Button
                variant="mainHero"
                style={{ marginTop: Spacing[20] }}
                onPress={() => {
                  if (navigating) return;
                  setNavigating(true);
                  startLoadBar();
                  // Long enough for the load bar to actually be seen before this screen unmounts —
                  // 100ms (used elsewhere for pure ripple-feedback delays) was imperceptible here.
                  setTimeout(() => lastRead
                    ? router.push(`/reader?book=${lastRead.bookId}&anchor=${lastRead.anchor}`)
                    : router.push('/reader?book=theory&anchor=theory-prefacio')
                  , 200);
                }}
              >
                <ButtonText>{lastRead ? 'Sigue leyendo' : 'Comienza el Curso'}</ButtonText>
              </Button>
            </View>
          </View>
        </View>

        {/* Primary buttons */}
        <View style={styles.buttons}>
          {BUTTONS.map(({ Icon, label, anchor }, i) => (
            <Button
              key={i}
              variant="mainHome"
              onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); setTimeout(() => router.push(`/contents?anchor=${anchor}`), 200); }}
            >
              <Icon size={16} color={t.btnIconColor} />
              <ButtonText>{label}</ButtonText>
            </Button>
          ))}
        </View>
      </ScrollView>
      {loadBarVisible && (
        <View style={[styles.loadBarTrack, { bottom: bottomInset, backgroundColor: isDark ? Colors.transparent : Colors.brand400 }]}>
          <Animated.View style={[
            styles.loadBarFill,
            { backgroundColor: isDark ? Colors.gold100 : Colors.ink100 },
            { transform: [{ translateX: loadBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
          ]} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    paddingHorizontal: Spacing[24],
    paddingVertical: Spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing[24],
    paddingTop: Spacing.none,
    paddingBottom: Spacing[20],
  },

  // Hero card
  heroCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: BorderWidth.sm,
    overflow: 'hidden',
    marginBottom: Spacing[12],
  },
  heroOverlay: {
    backgroundColor: Colors.imageScrim20,
  },
  heroTipButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    paddingTop: Spacing[10],
    paddingLeft: Spacing[10],
  },
  heroThemeToggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    paddingTop: Spacing[10],
    paddingRight: Spacing[10],
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Logo section
  heroLogo: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[16],
  },
  // Highlighted item
  highlighted: {
    position: 'relative',
    paddingHorizontal: Spacing[20],
    paddingTop: Spacing[16],
    paddingBottom: Spacing[20],
  },
  highlightPlaceholders: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    gap: Spacing[8],
    zIndex: 1,
    paddingTop: Spacing[10],
    paddingRight: Spacing[10],
  },
  highlightMeta: {
    gap: Spacing[8],
  },
  highlightLabel: {
    ...UIFonts.body2xsRegular,
    color: Colors.brand100,
  },
  highlightChapter: {
    ...UIFonts.body2xsSemibold,
    color: Colors.brand100,
  },
  highlightQuote: {
    ...UIFonts.bodyXsMedium,
    color: Colors.brand100,
    marginTop: Spacing[16],
  },
  // Primary buttons
  buttons: {
    gap: Spacing[12],
  },
  loadBarTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
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
