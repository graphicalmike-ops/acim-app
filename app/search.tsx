import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { SearchInput } from '@/components/ui/search-input';
import { NavBar } from '@/components/NavBar';
import { IndexTitleL1 } from '@/components/ui/index-item';
import { SearchItem } from '@/components/ui/search-item';
import { LoadingBar } from '@/components/ui/loading-bar';
import { AppSectionList } from '@/components/AppSectionList';
import { useTheme, useThemeColors } from '@/utils/theme';
import { UIFonts } from '@/constants/Typography';
import { Spacing } from '@/constants/Tokens';
import { searchContent, formatRouteId, nearestTitle, splitSnippet, truncateSnippetSegments, SearchResult } from '@/utils/search';

// No pagination — every match is fetched in one query. The corpus is only
// ~5,000 rows total and FTS5 is an indexed lookup (not a scan), so this stays
// fast regardless of how many rows come back; MAX_RESULTS just needs to be
// comfortably above the corpus size.
const MAX_RESULTS = 10000;
const EXCERPT_MAX_CHARS = 160;

// Fixed display order/titles, matching how the rest of the app organizes books
// (see assets/content/*-index.json book titles).
const BOOK_ORDER = ['theory', 'workbook', 'mft', 'psychotherapy', 'song'] as const;
const BOOK_TITLES: Record<string, string> = {
  theory: 'Libro de Texto',
  workbook: 'Libro de Ejercicios',
  mft: 'Manual para el Maestro',
  psychotherapy: 'Psicoterapia',
  song: 'El Canto de la Oración',
};

// Display-ready row, derived from a raw SearchResult once per results
// change (not per render) — see the `displayResults` useMemo below.
type DisplayResult = {
  key: string;
  book: string;
  label: string;
  subtitleSegments: { text: string; highlighted: boolean }[];
  result: SearchResult;
};

type SearchSection = { book: string; title: string; data: DisplayResult[] };

function groupByBook(items: DisplayResult[]): SearchSection[] {
  const groups = new Map<string, DisplayResult[]>();
  for (const item of items) {
    if (!groups.has(item.book)) groups.set(item.book, []);
    groups.get(item.book)!.push(item);
  }
  return BOOK_ORDER
    .filter((book) => groups.has(book))
    .map((book) => ({ book, title: BOOK_TITLES[book] ?? book, data: groups.get(book)! }));
}

function formatResultsCount(count: number): string {
  return count === 1 ? '1 resultado' : `${count} resultados`;
}

export default function SearchScreen() {
  const t = useThemeColors();
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  // Search only fires on explicit submission (search-icon tap or the
  // keyboard's search key) — not as the user types.
  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed && trimmed !== submittedQuery) {
      setSearching(true);
    }
    setSubmittedQuery(trimmed);
  }, [query, submittedQuery]);

  const handleClearSearch = useCallback(() => {
    setSubmittedQuery('');
  }, []);

  // Submitted query changed: fetch every match in one shot (no pagination).
  useEffect(() => {
    let cancelled = false;
    if (!submittedQuery) {
      setResults([]);
      setSearching(false);
      setLoadBarVisible(false);
      return;
    }
    setSearching(true);
    startLoadBar();
    (async () => {
      const items = await searchContent(submittedQuery, MAX_RESULTS);
      if (!cancelled) {
        setResults(items);
        setSearching(false);
        setLoadBarVisible(false);
      }
    })();
    return () => { cancelled = true; };
  }, [submittedQuery, startLoadBar]);

  const openResult = useCallback((result: SearchResult) => {
    if (navigating) return;
    setNavigating(true);
    startLoadBar();
    const anchor = result.anchor ?? result.chapterAnchor ?? result.lessonAnchor;
    const paragraphParam = result.paragraph != null ? `&paragraph=${result.paragraph}` : '';
    const queryParam = submittedQuery ? `&q=${encodeURIComponent(submittedQuery)}` : '';
    setTimeout(() => router.push(`/reader?book=${result.book}&anchor=${anchor}${paragraphParam}${queryParam}`), 200);
  }, [navigating, startLoadBar, submittedQuery]);

  // Derived, display-ready rows — recomputed only when `results` itself
  // changes (a new page arrives), never on every keystroke in the search
  // box (query state is separate from submittedQuery/results). This is what
  // keeps typing the next search smooth while old results are still shown.
  const displayResults = useMemo<DisplayResult[]>(() => results.map((result, idx) => {
    const segments = truncateSnippetSegments(splitSnippet(result.snippet), EXCERPT_MAX_CHARS);
    const title = nearestTitle(result);
    return {
      key: `${result.anchor}-${result.paragraph}-${idx}`,
      book: result.book,
      label: title ? `${title} - ${formatRouteId(result)}` : formatRouteId(result),
      subtitleSegments: segments,
      result,
    };
  }), [results]);

  const sections = useMemo(() => groupByBook(displayResults), [displayResults]);

  return (
    <SafeAreaView style={[styles.topArea, { backgroundColor: t.darkerBackgroundColor }]} edges={['top']}>
      <SafeAreaView style={[styles.container, { backgroundColor: t.backgroundColor }]} edges={['bottom']}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
        <NavBar onBack={() => router.back()} title="Búsqueda" />
        <View style={[styles.searchBar, { backgroundColor: t.darkerBackgroundColor }]}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            onSubmit={handleSearch}
            onClear={handleClearSearch}
            searched={submittedQuery.length > 0 && query === submittedQuery}
            placeholder="Buscar"
            autoFocus
          />
        </View>

        <AppSectionList<DisplayResult, SearchSection>
          sections={searching ? [] : sections}
          keyExtractor={(item) => item.key}
          renderSectionHeader={({ section }) => <IndexTitleL1 label={section.title} font={UIFonts.capsBodyXsMedium} />}
          renderItem={({ item }) => (
            <SearchItem
              label={item.label}
              subtitle={item.subtitleSegments.map((seg, i) => (
                <Text key={i} style={seg.highlighted ? styles.itemSubtitleBold : undefined}>
                  {seg.text}
                </Text>
              ))}
              onPress={() => openResult(item.result)}
            />
          )}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={submittedQuery.length > 0 ? (
            <View style={styles.headerItem}>
              <Text style={[styles.titleL1, { color: t.fontColorGray }]}>
                {searching ? 'Buscando…' : formatResultsCount(results.length)}
              </Text>
            </View>
          ) : null}
          ListEmptyComponent={!searching && submittedQuery.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: t.fontColorGray }]}>No se encontraron resultados.</Text>
            </View>
          ) : null}
          contentContainerStyle={styles.content}
          style={[styles.scrollView, { backgroundColor: t.backgroundColor }, searching ? { pointerEvents: 'none' } : null]}
          keyboardShouldPersistTaps="handled"
        />

        <LoadingBar visible={loadBarVisible} progress={loadBarAnim} screenWidth={screenWidth} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topArea: { flex: 1 },
  container: { flex: 1 },
  searchBar: { paddingHorizontal: Spacing[24], paddingVertical: Spacing[12] },
  scrollView: { flex: 1 },
  content: { paddingBottom: Spacing[40] },
  headerItem: { paddingTop: Spacing[24], paddingBottom: Spacing[12], paddingHorizontal: Spacing[24] },
  titleL1: UIFonts.capsBodyXsSemibold,
  emptyState: { paddingHorizontal: Spacing[24], paddingTop: Spacing[12] },
  emptyText: { ...UIFonts.bodyXsRegular },
  itemSubtitleBold: { fontFamily: UIFonts.body2xsBold.fontFamily },
});
