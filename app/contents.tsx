import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { RipplePressable } from '@/components/RipplePressable';
import { StatusBar } from 'expo-status-bar';
import { PlusIcon, MinusIcon } from '@/components/Icons';
import { NavBar } from '@/components/NavBar';
import { BookSectionHeading } from '@/components/BookSectionHeading';
import { AppScrollView } from '@/components/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { toTitleCase } from '@/utils/text';
import { useTheme, useThemeColors } from '@/utils/theme';
import { UIFonts } from '@/constants/Typography';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderWidth } from '@/constants/Tokens';

const INDEX_FILES = {
  theory:     require('@/assets/content/theory-index.json'),
  workbook:   require('@/assets/content/workbook-index.json'),
  mft:        require('@/assets/content/mft-index.json'),
  supplement: require('@/assets/content/supplement-index.json'),
} as const;

type FlatItemType = 'Item' | 'Title-L1' | 'Title-L2' | 'Accordion';
type FlatChild = { label: string; subtitle?: string; id: string; anchor?: string; bookId: string };
type FlatItem = {
  type: FlatItemType;
  label: string;
  subtitle?: string;
  id: string;
  anchor?: string;
  bookId: string;
  children?: FlatChild[];
};

function buildAllItems(books: any[]): FlatItem[] {
  const items: FlatItem[] = [];
  for (const book of books) {
    if ((book as any)._comment) continue;
    items.push({ type: 'Title-L1', label: book.title, id: book.id, bookId: book.id });
    for (const child of book.children ?? []) {
      if (child._comment) continue;
      if (child.component === 'title-l2') {
        items.push({ type: 'Title-L2', label: child.title, id: child.id, bookId: book.id });
        for (const grandchild of child.children ?? []) {
          if (grandchild._comment) continue;
          const item = buildItem(grandchild, book.id);
          if (item) items.push(item);
        }
      } else {
        const item = buildItem(child, book.id);
        if (item) items.push(item);
      }
    }
  }
  return items;
}

// Section ids encode nesting depth in their suffix: "-s4" (section), "-s4a"
// (lettered subsection), "-s4a-i" (lowercase-roman sub-subsection) — see
// theory-ch19's four obstacles to peace for the deepest real example.
function getChildIndentLevel(id: string): number {
  const m = id.match(/-s\d+([a-z]*)(-[a-z]+)?$/);
  if (!m) return 0;
  if (m[2]) return 2;
  if (m[1]) return 1;
  return 0;
}

function buildItem(node: any, bookId: string): FlatItem | null {
  if (!node || node._comment) return null;
  if (node.component === 'accordion') {
    return {
      type: 'Accordion',
      label: node.title,
      subtitle: node.subtitle,
      id: node.id,
      bookId,
      children: (node.children ?? [])
        .filter((c: any) => !c._comment)
        .map((c: any) => ({ label: c.title, subtitle: c.subtitle, id: c.id, anchor: c.anchor, bookId })),
    };
  }
  return { type: 'Item', label: node.title, subtitle: node.subtitle, id: node.id, anchor: node.anchor, bookId };
}

// Computed once at module load — not on every screen mount
const ITEMS_BY_BOOK = Object.fromEntries(
  Object.entries(INDEX_FILES).map(([key, idx]) => [key, buildAllItems((idx as any).books)])
) as Record<string, FlatItem[]>;

export default function ContentsScreen() {
  const { anchor } = useLocalSearchParams<{ anchor: string }>();
  const items = ITEMS_BY_BOOK[anchor] ?? ITEMS_BY_BOOK.theory;
  const bookTitle = items.find(i => i.type === 'Title-L1')?.label ?? '';
  const { width: screenWidth } = useWindowDimensions();
  const { isDark } = useTheme();
  const t = useThemeColors();

  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [loadBarVisible, setLoadBarVisible] = useState(false);
  const loadBarAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const itemYPositions = useRef<Map<string, number>>(new Map());

  const toggleAccordion = useCallback((id: string) => {
    setOpenAccordion(prev => {
      if (prev === id) return null;
      const oldY = itemYPositions.current.get(id) ?? 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newY = itemYPositions.current.get(id) ?? 0;
          const delta = oldY - newY;
          if (delta > 0) {
            scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current - delta), animated: false });
          }
        });
      });
      return id;
    });
  }, []);

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

  return (
    <SafeAreaView style={[styles.topArea, { backgroundColor: t.darkerBackgroundColor }]} edges={['top']}>
      <SafeAreaView style={[styles.container, { backgroundColor: t.backgroundColor }]} edges={['bottom']}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
        <NavBar
          title={toTitleCase(bookTitle)}
          onBack={() => router.back()}
          onHome={() => setTimeout(() => router.navigate('/home'), 100)}
        />

        <AppScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          style={[styles.scrollView, { backgroundColor: t.backgroundColor }]}
          onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        >
          {items.map((item) => {
            if (item.type === 'Title-L1') {
              return null;
            }

            if (item.type === 'Title-L2') {
              return <BookSectionHeading key={item.id} label={toTitleCase(item.label)} />;
            }

            if (item.type === 'Accordion') {
              const isOpen = openAccordion === item.id;
              return (
                <View key={item.id} onLayout={(e) => itemYPositions.current.set(item.id, e.nativeEvent.layout.y)}>
                  <RipplePressable
                    style={[styles.item, isOpen && { backgroundColor: t.darkerBackgroundColor }]}
                    rippleColor={isOpen ? t.backgroundColor : t.darkerBackgroundColor}
                    onPress={() => toggleAccordion(item.id)}
                  >
                    {() => (
                      <>
                        <View style={styles.itemRow}>
                          <View style={styles.itemText}>
                            <Text style={[isOpen ? styles.itemLabelBold : styles.itemLabel, { color: t.fontColorPrimary }]}>{item.bookId === 'mft' ? item.label : toTitleCase(item.label)}</Text>
                            {item.subtitle && (
                              <Text style={[styles.itemSubtitle, { color: t.fontColorGray }]}>{item.bookId === 'mft' ? item.subtitle : toTitleCase(item.subtitle)}</Text>
                            )}
                          </View>
                          {isOpen ? <MinusIcon color={t.fontColorGray} /> : <PlusIcon color={t.fontColorGray} />}
                        </View>
                        <View style={[styles.divider, { backgroundColor: t.darkOutline }]} />
                      </>
                    )}
                  </RipplePressable>
                  {isOpen && item.children?.map((child, childIndex) => (
                    <RipplePressable
                      key={child.id}
                      style={[styles.item, { backgroundColor: t.darkerBackgroundColor }]}
                      rippleColor={t.backgroundColor}
                      onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); const anchor = childIndex === 0 && child.bookId === 'theory' ? item.id : (child.anchor ?? child.id); setTimeout(() => router.push(`/reader?book=${child.bookId}&anchor=${anchor}`), 200); }}
                    >
                      <>
                        <View style={[styles.itemRow, styles.accordionChildRow, { paddingLeft: Spacing[24] + getChildIndentLevel(child.id) * 24 }]}>
                          <View style={styles.itemText}>
                            <Text style={[styles.itemLabel, { color: t.fontColorPrimary }]}>{child.label}</Text>
                            {child.subtitle && (
                              <Text style={[styles.itemSubtitle, { color: t.fontColorGray }]}>{child.subtitle}</Text>
                            )}
                          </View>
                        </View>
                        <View style={[styles.divider, { backgroundColor: t.darkOutline }]} />
                      </>
                    </RipplePressable>
                  ))}
                </View>
              );
            }

            return (
              <RipplePressable
                key={item.id}
                style={styles.item}
                rippleColor={t.darkerBackgroundColor}
                onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); setTimeout(() => router.push(`/reader?book=${item.bookId}&anchor=${item.anchor ?? item.id}`), 200); }}
              >
                {() => (
                  <>
                    <View style={styles.itemRow}>
                      <View style={styles.itemText}>
                        <Text style={[styles.itemLabel, { color: t.fontColorPrimary }]}>{item.bookId === 'mft' ? item.label : toTitleCase(item.label)}</Text>
                        {item.subtitle && (
                          <Text style={[styles.itemSubtitle, { color: t.fontColorGray }]}>{item.subtitle}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: t.darkOutline }]} />
                  </>
                )}
              </RipplePressable>
            );
          })}
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
  item: {
    overflow: 'hidden',
    paddingLeft: Spacing[24],
    paddingRight: Spacing[24],
    paddingTop: Spacing[12],
    gap: Spacing[12],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[12],
  },
  divider: {
    height: BorderWidth.sm,
  },
  itemText: {
    flex: 1,
    gap: Spacing[2],
  },
  itemLabel: {
    ...UIFonts.bodyXsRegular,
  },
  itemLabelBold: {
    ...UIFonts.bodyXsSemibold,
  },
  accordionChildRow: {
    paddingLeft: Spacing[24],
  },
  itemSubtitle: {
    ...UIFonts.body2xsRegular,
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
