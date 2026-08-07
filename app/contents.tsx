import { useState, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavBar } from '@/components/NavBar';
import { IndexTitleL1, IndexItemRow, IndexAccordionGroup, IndexAccordionItem } from '@/components/ui/index-item';
import { LoadingBar } from '@/components/ui/loading-bar';
import { AppScrollView } from '@/components/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { toTitleCase } from '@/utils/text';
import { useTheme, useThemeColors } from '@/utils/theme';
import { Spacing } from '@/constants/Tokens';

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

  // Controlled single/collapsible value-change handler for IndexAccordionGroup.
  // On native, RNR's Accordion Root fires this with the item's own value when
  // opening, or `undefined` when collapsing the currently-open item (single +
  // collapsible mode) — so the id whose position we care about for the
  // scroll-preserving adjustment below is either the new value (opening) or
  // the previous openAccordion (closing).
  const handleAccordionValueChange = useCallback((newValue: string | undefined) => {
    const toggledId = newValue ?? openAccordion;
    if (toggledId) {
      const oldY = itemYPositions.current.get(toggledId) ?? 0;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const newY = itemYPositions.current.get(toggledId) ?? 0;
          const delta = oldY - newY;
          if (delta > 0) {
            scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current - delta), animated: false });
          }
        });
      });
    }
    setOpenAccordion(newValue ?? null);
  }, [openAccordion]);

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
          <IndexAccordionGroup value={openAccordion ?? undefined} onValueChange={handleAccordionValueChange}>
            {items.map((item) => {
              if (item.type === 'Title-L1') {
                return null;
              }

              if (item.type === 'Title-L2') {
                return <IndexTitleL1 key={item.id} label={toTitleCase(item.label)} />;
              }

              if (item.type === 'Accordion') {
                return (
                  <IndexAccordionItem
                    key={item.id}
                    value={item.id}
                    label={item.bookId === 'mft' ? item.label : toTitleCase(item.label)}
                    subtitle={item.subtitle ? (item.bookId === 'mft' ? item.subtitle : toTitleCase(item.subtitle)) : undefined}
                    onLayout={(e) => itemYPositions.current.set(item.id, e.nativeEvent.layout.y)}
                  >
                    {(item.children ?? []).map((child, childIndex) => ({
                      id: child.id,
                      label: child.label,
                      subtitle: child.subtitle,
                      indentLevel: getChildIndentLevel(child.id),
                      onPress: () => {
                        if (navigating) return;
                        setNavigating(true);
                        startLoadBar();
                        const anchor = childIndex === 0 && child.bookId === 'theory' ? item.id : (child.anchor ?? child.id);
                        setTimeout(() => router.push(`/reader?book=${child.bookId}&anchor=${anchor}`), 200);
                      },
                    }))}
                  </IndexAccordionItem>
                );
              }

              return (
                <IndexItemRow
                  key={item.id}
                  label={item.bookId === 'mft' ? item.label : toTitleCase(item.label)}
                  subtitle={item.subtitle}
                  onPress={() => { if (navigating) return; setNavigating(true); startLoadBar(); setTimeout(() => router.push(`/reader?book=${item.bookId}&anchor=${item.anchor ?? item.id}`), 200); }}
                />
              );
            })}
          </IndexAccordionGroup>
        </AppScrollView>
        <LoadingBar visible={loadBarVisible} progress={loadBarAnim} screenWidth={screenWidth} />
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
});
