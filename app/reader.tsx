import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutChangeEvent, useWindowDimensions, Pressable, Animated, BackHandler, ToastAndroid, Platform, PanResponder, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { UIMenu } from '@/components/UIMenu';
import { ConfirmDialog, ConfirmDialogContent } from '@/components/ConfirmDialog';
import { NavBar } from '@/components/NavBar';
import { ReaderToolButton } from '@/components/ReaderToolButton';
import { TextInputField } from '@/components/ui/text-input';
import { IconButton } from '@/components/ui/icon-button';
import { PlusIcon } from '@/components/Icons';
import { SavedItem, useSavedRowColors } from '@/components/ui/saved-item';
import { Button } from '@/components/ui/button';
import { Text as ButtonText } from '@/components/ui/text';
import { IndexTitleL1 } from '@/components/ui/index-item';
import { LoadingBar } from '@/components/ui/loading-bar';
import { toTitleCase, formatSavedDate } from '@/utils/text';
import { saveLastRead } from '@/utils/lastRead';
import { AppScrollView } from '@/components/AppScrollView';
import { useTheme, useThemeColors } from '@/utils/theme';
import { splitQueryTerms, normalizeForMatch, formatRouteId, SearchResult } from '@/utils/search';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, Shadows } from '@/constants/Tokens';
import { UIFonts, BookFonts } from '@/constants/Typography';
import { Sentence, ContentBlock, CONTENT, resolveContentKey, getVersesText } from '@/utils/content';
import { useBookmarks, BookId as SavedBookId, bookmarkHref, SavedBookmark } from '@/utils/bookmarks';
import { requestAppReview } from '@/utils/storeReview';

const NO_HIGHLIGHT_TERMS: string[] = [];

// Android's native text-selection (long-press handles + magnifier + copy
// menu, enabled by RN Text's `selectable` prop) fires on the same gesture as
// this screen's own verse-selection (handleVersePress, tap-driven) and the
// two fight over the touch — so `selectable` is only turned on outside
// Android. iOS's native selection doesn't intercept taps the same way, so it
// coexists with the custom selection fine.
const nativeTextSelectable = Platform.OS !== 'android';

// The toolbar drawer's tools-only ("peek") content height — computed from its
// own fixed styling (drawerHeader paddingTop 8 + handle row 6 + gap 12 +
// button row 43 (toolDrawer Button: py-3*2=24 + text lineHeight 19) +
// paddingBottom 12 = 81, matching Figma's "Tools" header frame height
// exactly) rather than measured via onLayout, since a post-mount measurement
// correction was visibly snapping the drawer right after its open animation
// finished. The device's bottom safe-area inset (Android's gesture/button
// nav bar) is added on top of this at the call site, since SafeAreaView's
// own bottom padding would otherwise eat into this budget.
const TOOLBAR_PEEK_CONTENT_HEIGHT = 81;

// User-requested on-top adjustment: pulls the toolbar drawer's resting top
// edge 12px closer to the top of the screen. Since the drawer is pinned to
// the bottom edge (styles.sheetSlide) with no top/translateY-to-a-fixed-
// position logic, its top edge is purely a function of its rendered height —
// so growing that height by Spacing[12] pushes the top edge up by exactly
// Spacing[12]. Kept separate from TOOLBAR_PEEK_CONTENT_HEIGHT (rather than
// folded into it) so that constant's own comment can keep asserting an exact
// Figma match, same pattern as RECENT_SAVES_TITLE_HEIGHT below.
const TOOLBAR_DRAWER_TOP_ADJUSTMENT = Spacing[12];

// Extra height added on top of the save-mode drawer's default (75%-screen,
// non-dragged) resting height so the "Guardados recientes" section title is
// visible without the user needing to drag the drawer open first — same
// derive-from-fixed-styling approach as TOOLBAR_PEEK_CONTENT_HEIGHT above
// (not measured via onLayout, for the same post-mount-snap reason). Matches
// IndexTitleL1's own styling (components/ui/index-item.tsx: paddingTop 32 +
// UIFonts.capsBodyXsSemibold lineHeight 19 + paddingBottom 12 = 63).
const RECENT_SAVES_TITLE_HEIGHT = 63;

// Downward drag distance (px) past which any of the sheets/drawers below
// dismiss instead of springing back to rest. Shared by drawerPanResponder
// (defined inside ReaderScreen, since it also needs the drag-up-to-expand
// state that lives on component refs) and createSheetPanResponder below.
const DRAWER_CLOSE_THRESHOLD = 100;

// Caps how many Reader screens can stack on top of each other via in-Reader
// jumps (the recent-saves drawer below — "next chapter" already replaces,
// so it never stacks and isn't part of this). Tracked via a `chain` route
// param (not component/module state, since each jump is a fresh Reader
// mount) rather than a plain "always replace" — this keeps normal 1-2-jump
// back history fully intact (matches today's behavior exactly) and only
// starts capping once a user chains MAX_READER_CHAIN_DEPTH jumps in a row
// without ever navigating away via Back/Home. Entering Reader from a list
// screen (Contents/Search/Bookmarks/Home) never sets `chain`, so it's
// treated as depth 1 — a fresh chain.
const MAX_READER_CHAIN_DEPTH = 3;

// Drag-to-dismiss for the N.T. and highlighted-verse sheets — the same
// fraction/threshold drag behavior as drawerPanResponder's own no-expand
// (plain downward-drag) branch, minus the drawer's extra-height (drag-up-to-
// expand) behavior, since these two sheets are fixed-height and only ever
// dismiss, never expand. `onStartShouldSetPanResponder` never claims on
// touch-down (only via onMoveShouldSetPanResponder, once real vertical drag
// distance is seen) so a plain tap on any interactive child (e.g. the
// highlighted-verse sheet's UIMenu actions button) is never contested —
// same fix as drawerPanResponder's own onStartShouldSetPanResponder below.
function createSheetPanResponder(anim: Animated.Value, onDismiss: () => void) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => {
      const fraction = Math.max(0, Math.min(1, 1 - gesture.dy / 500));
      anim.setValue(fraction);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > DRAWER_CLOSE_THRESHOLD) onDismiss();
      else Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start();
    },
  });
}

const BOOK_SEQUENCES: Record<string, string[]> = {
  theory: [
    'theory-prefacio',
    'theory-ch1',  'theory-ch2',  'theory-ch3',  'theory-ch4',  'theory-ch5',
    'theory-ch6',  'theory-ch7',  'theory-ch8',  'theory-ch9',  'theory-ch10',
    'theory-ch11', 'theory-ch12', 'theory-ch13', 'theory-ch14', 'theory-ch15',
    'theory-ch16', 'theory-ch17', 'theory-ch18', 'theory-ch19', 'theory-ch20',
    'theory-ch21', 'theory-ch22', 'theory-ch23', 'theory-ch24', 'theory-ch25',
    'theory-ch26', 'theory-ch27', 'theory-ch28', 'theory-ch29', 'theory-ch30',
    'theory-ch31',
  ],
  workbook: [
    'workbook-part1-lessons1-50',  'workbook-part1-review1',
    'workbook-part1-lessons61-80', 'workbook-part1-review2',
    'workbook-part1-lessons91-110','workbook-part1-review3',
    'workbook-part1-lessons121-140','workbook-part1-review4',
    'workbook-part1-lessons151-170','workbook-part1-review5',
    'workbook-part1-lessons181-200','workbook-part1-review6',
    'workbook-part2-intro',
    'workbook-part2-set1',  'workbook-part2-set2',  'workbook-part2-set3',
    'workbook-part2-set4',  'workbook-part2-set5',  'workbook-part2-set6',
    'workbook-part2-set7',  'workbook-part2-set8',  'workbook-part2-set9',
    'workbook-part2-set10', 'workbook-part2-set11', 'workbook-part2-set12',
    'workbook-part2-set13', 'workbook-part2-set14',
    'workbook-part2-final', 'workbook-epilogue',
  ],
  mft:        ['mft', 'mft-clarification'],
  supplement: ['supplements', 'supplement-song'],
};

function getMarginTop(type: string, prevType: string | null, isFirst: boolean): number {
  // First block on the page — flush distance below the nav bar, independent
  // of block type (content's own scroll padding already matches the nav
  // bar's height exactly, so this is the only source of that gap).
  if (isFirst) return 20;
  if (type === 'book-heading')        return 40;
  if (type === 'part-heading')        return prevType === 'book-heading' ? 40 : 80;
  if (type === 'lesson-group-heading') return 80;
  if (type === 'chapter-heading')     { if (prevType === 'part-heading' || prevType === 'lesson-set-heading' || prevType === 'lesson-group-heading') return 4; return prevType === 'book-heading' ? 40 : 80; }
  if (type === 'section-heading')     return 40;
  if (type === 'lesson-set-heading')  return 80;
  if (type === 'lesson-heading')      return 80;
  if (prevType === 'lesson-heading' || prevType === 'chapter-heading' || prevType === 'lesson-group-heading')  return 40;
  return 20;
}

const SUPERSCRIPT: Record<string, string> = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
};
const SUPERSCRIPT_ALPHA: Record<string, string> = {
  'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ',
  'i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ',
  'r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
};
function toSuperscript(n: number | string): string {
  if (typeof n === 'string') return SUPERSCRIPT_ALPHA[n] ?? n;
  return String(n).split('').map(d => SUPERSCRIPT[d]).join('');
}

const NT_NOTES: Record<string, string> = {
  unicidad: 'A la palabra "unicidad", que de acuerdo con el Diccionario de la Real Academia Española significa "calidad de único", se le ha dado aquí un nuevo significado. En la presente obra se ha utilizado "unicidad" exclusivamente para traducir la palabra inglesa "oneness" en su acepción de: "calidad, estado o hecho de ser uno".',
  impecables: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  impecablemente: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  impecabilidad: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  impecable: 'La palabra "impecable" no tiene aquí el significado más usual de "intachable, irreprochable", sino el más literal de "sin pecado".',
  especialismo: 'Se ha utilizado "especialismo" para traducir el término inglés "specialness", cuyo significado es "la calidad, condición, estado o deseo de ser especial".',
};

function extractSectionLabel(title: string): string {
  const m = title.match(/^([IVX]+|[A-Z]|[0-9]+)\./);
  if (!m) return '';
  return `Secc. ${m[1].toUpperCase()}`;
}

// Builds a case/accent-folded copy of `text` where each entry lines up 1:1
// with `chars` (text split by code point), so match ranges found in the
// normalized string can be sliced straight back out of the original.
function normalizeForHighlight(text: string): { normalized: string; chars: string[] } {
  const chars = Array.from(text);
  const normalized = chars
    .map((ch) => {
      const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (stripped[0] ?? ch).toLowerCase();
    })
    .join('');
  return { normalized, chars };
}

function isWordChar(ch: string | undefined): boolean {
  return !!ch && /[\p{L}\p{N}]/u.test(ch);
}

// Finds whole-word matches for each (already-normalized) term, mirroring
// FTS5's prefix-match semantics: a term matches any word that *starts* with
// it, and the whole word gets highlighted — not just the typed prefix.
function findHighlightRanges(normalized: string, terms: string[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const term of terms) {
    if (!term) continue;
    let from = 0;
    let idx: number;
    while ((idx = normalized.indexOf(term, from)) !== -1) {
      from = idx + 1;
      if (isWordChar(normalized[idx - 1])) continue; // mid-word, not a token start
      let end = idx + term.length;
      while (isWordChar(normalized[end])) end++;
      ranges.push([idx, end]);
    }
  }
  if (!ranges.length) return ranges;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

function highlightText(
  text: string,
  terms: string[],
  keyPrefix: string,
  boldFontFamily = 'Lora_700Bold'
): (string | React.ReactElement)[] {
  if (!terms.length) return [text];
  const { normalized, chars } = normalizeForHighlight(text);
  const ranges = findHighlightRanges(normalized, terms);
  if (!ranges.length) return [text];
  const out: (string | React.ReactElement)[] = [];
  let cursor = 0;
  ranges.forEach(([s, e], idx) => {
    if (s > cursor) out.push(chars.slice(cursor, s).join(''));
    out.push(<Text key={`${keyPrefix}-${idx}`} style={{ fontFamily: boldFontFamily }}>{chars.slice(s, e).join('')}</Text>);
    cursor = e;
  });
  if (cursor < chars.length) out.push(chars.slice(cursor).join(''));
  return out;
}

function renderInline(
  text: string,
  onNt: ((word: string, note: string) => void) | undefined,
  highlightTerms: string[],
  styles: ReturnType<typeof createStyles>
): (string | React.ReactElement)[] {
  const parts = text.split(/(\*\*_[^_]+_\*\*|\*\*[^*]+\*\*|_[^_]+_|\{NT:[^}]+\})/);
  return parts.flatMap((part, i) => {
    if (part.startsWith('**_') && part.endsWith('_**')) {
      return <Text key={i} style={{ fontFamily: 'Lora_700Bold_Italic' }}>{part.slice(3, -3)}</Text>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <Text key={i} style={{ fontFamily: 'Lora_700Bold' }}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <Text key={i} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('{NT:') && part.endsWith('}')) {
      const word = part.slice(4, -1);
      const note = NT_NOTES[word.toLowerCase()];
      return (
        <Text key={i} style={styles.ntWord} onPress={note && onNt ? () => onNt(word, note) : undefined}>
          {word}
        </Text>
      );
    }
    return highlightText(part, highlightTerms, `hl-${i}`);
  });
}

// Each block (paragraph/stanza/heading) is its own memoized component so a
// verse tap (which changes `selectedMask` for exactly one block) only
// re-renders that block, not the whole chapter. This only works because
// every prop below is either a primitive or a reference that's stable
// across re-renders (see the call site in ReaderScreen) — passing the raw
// `selectedVerses` Set or an inline `() => ...` callback here would give
// every block a "changed" prop on every tap and defeat the memoization.
type ReaderBlockProps = {
  block: ContentBlock;
  blockKey: number;
  mt: number;
  numbered: boolean;
  styles: ReturnType<typeof createStyles>;
  bookId: string;
  isScrollTarget: boolean;
  rootChapterAnchor: string | null;
  versesParam?: string;
  highlightTerms: string[];
  selectedMask: string;
  savedVerseMap: Map<string, SavedBookmark>;
  handleVersePress: (verseKey: string) => void;
  handleVerseLongPress: (verseKey: string) => void;
  openNtSheet: (word: string, note: string) => void;
  handleAnchorLayout: (e: LayoutChangeEvent, scrollToTop?: boolean, verseFraction?: number | null) => void;
  recordChapterLayout: (block: ContentBlock, e: LayoutChangeEvent) => void;
  recordSectionLayout: (block: ContentBlock, e: LayoutChangeEvent) => void;
  recordVerseBlockLayout: (blockKey: number, e: LayoutChangeEvent) => void;
};

const ReaderBlock = React.memo(function ReaderBlock({
  block, blockKey, mt, numbered, styles, bookId, isScrollTarget, rootChapterAnchor,
  versesParam, highlightTerms, selectedMask, savedVerseMap,
  handleVersePress, handleVerseLongPress, openNtSheet, handleAnchorLayout,
  recordChapterLayout, recordSectionLayout, recordVerseBlockLayout,
}: ReaderBlockProps) {
  const key = blockKey;
  // Landing on a saved bookmark: estimate where the first saved verse
  // falls within this paragraph (by sentence position) so the scroll
  // can keep it within the top half of the screen even if it isn't
  // the paragraph's first sentence.
  const onLayout = isScrollTarget
    ? (e: LayoutChangeEvent) => {
        let verseFraction: number | null = null;
        if (versesParam && block.sentences?.length) {
          const firstSavedVerse = Math.min(...versesParam.split(',').map(Number));
          const idx = block.sentences.findIndex(s => s.verse === firstSavedVerse);
          if (idx >= 0) verseFraction = idx / block.sentences.length;
        }
        handleAnchorLayout(e, false, verseFraction);
      }
    : undefined;
  switch (block.type) {

    case 'book-heading':
      return (
        <Text key={key} selectable={nativeTextSelectable} style={[styles.bookHeading, { marginTop: mt }]} onLayout={onLayout}>
          {block.title}
        </Text>
      );

    case 'part-heading':
      return (
        <Text key={key} selectable={nativeTextSelectable} style={[styles.partHeading, { marginTop: mt }]} onLayout={onLayout}>
          {block.title}
        </Text>
      );

    case 'chapter-heading': {
      const chapterLayout = (e: LayoutChangeEvent) => {
        recordChapterLayout(block, e);
        if (isScrollTarget) handleAnchorLayout(e, block.anchor === rootChapterAnchor);
      };
      const isSetIntro = /^workbook-part2-set\d+-intro$/.test(block.anchor ?? '');
      const fmt = (s: string) => bookId === 'mft' ? s : toTitleCase(s);
      return (
        <View key={key} style={{ marginTop: mt }} onLayout={chapterLayout}>
          {block.subtitle ? (
            <>
              <Text selectable={nativeTextSelectable} style={styles.chapterNumber}>{fmt(block.title ?? '')}</Text>
              <Text selectable={nativeTextSelectable} style={[styles.chapterHeading, { marginTop: Spacing[4] }]}>{fmt(block.subtitle ?? '')}</Text>
            </>
          ) : (
            <Text selectable={nativeTextSelectable} style={isSetIntro ? styles.chapterNumber : styles.chapterHeading}>{fmt(block.title ?? '')}</Text>
          )}
        </View>
      );
    }

    case 'section-heading': {
      const sectionLayout = (e: LayoutChangeEvent) => {
        recordSectionLayout(block, e);
        if (isScrollTarget) handleAnchorLayout(e);
      };
      return (
        <Text key={key} selectable={nativeTextSelectable} style={[styles.sectionHeading, { marginTop: mt }]} onLayout={sectionLayout}>
          {block.title}
        </Text>
      );
    }

    case 'lesson-group-heading':
      return (
        <Text key={key} selectable={nativeTextSelectable} style={[styles.lessonTitle, { marginTop: mt }]} onLayout={isScrollTarget ? (e) => handleAnchorLayout(e, true) : undefined}>
          {block.title}
        </Text>
      );

    case 'lesson-set-heading': {
      const setLayout = (e: LayoutChangeEvent) => {
        recordChapterLayout(block, e);
        if (isScrollTarget) handleAnchorLayout(e, true);
      };
      if (block.anchor === 'workbook-part2-final') {
        return (
          <Text key={key} selectable={nativeTextSelectable} style={[styles.lessonTitle, { marginTop: mt }]} onLayout={setLayout}>
            {block.subtitle}
          </Text>
        );
      }
      return (
        <View key={key} style={{ marginTop: mt }} onLayout={setLayout}>
          <Text selectable={nativeTextSelectable} style={styles.lessonSetSubtitle}>{block.subtitle}</Text>
        </View>
      );
    }

    case 'lesson-heading': {
      const lessonLayout = (e: LayoutChangeEvent) => {
        recordChapterLayout(block, e);
        if (isScrollTarget) handleAnchorLayout(e);
      };
      return (
        <View key={key} style={{ marginTop: mt }} onLayout={lessonLayout}>
          <Text selectable={nativeTextSelectable} style={styles.lessonTitle}>{block.title}</Text>
          {block.subtitle && (
            <Text selectable={nativeTextSelectable} style={[styles.lessonSubtitle, { marginTop: Spacing[4] }]}>{block.subtitle}</Text>
          )}
        </View>
      );
    }

    case 'stanza': {
      const stSentences = block.sentences ?? [];
      const stHasLineBreaks = stSentences.some(s => s.newline);
      const stFont = (s: Sentence) =>
        s.bold && !s.italic ? 'Lora_700Bold' :
        s.bold &&  s.italic ? 'Lora_700Bold_Italic' :
                              'Lora_400Regular_Italic';
      const stanzaHighlightTerms = isScrollTarget ? highlightTerms : NO_HIGHLIGHT_TERMS;
      const stanzaBlockLayout = (e: LayoutChangeEvent) => {
        recordVerseBlockLayout(key, e);
        onLayout?.(e);
      };
      if (stHasLineBreaks) {
        return (
          <View key={key} style={[styles.stanzaBlock, { marginTop: mt }]} onLayout={stanzaBlockLayout}>
            {stSentences.map((s, si) => {
              const verseKey = `${key}:${si}`;
              const selected = selectedMask.charAt(si) === '1';
              const saved = savedVerseMap.has(verseKey);
              return (
                <Text
                  key={si}
                  selectable={nativeTextSelectable}
                  onPress={() => handleVersePress(verseKey)}
                  onLongPress={() => handleVerseLongPress(verseKey)}
                  style={[
                    styles.bodyLarge,
                    { fontFamily: stFont(s) },
                    s.spaceBefore && si > 0 && { marginTop: Spacing[20] },
                    saved && styles.verseSaved,
                    selected && styles.verseSelected,
                  ]}
                >
                  {s.verse !== 1 && s.verse !== stSentences[si - 1]?.verse && toSuperscript(s.verse)}
                  {renderInline(s.content, openNtSheet, stanzaHighlightTerms, styles)}
                </Text>
              );
            })}
          </View>
        );
      }
      return (
        <Text key={key} selectable={nativeTextSelectable} style={[styles.bodyLarge, styles.stanzaBlock, { marginTop: mt }]} onLayout={stanzaBlockLayout}>
          {stSentences.map((s, si) => {
            const verseKey = `${key}:${si}`;
            const selected = selectedMask.charAt(si) === '1';
            const saved = savedVerseMap.has(verseKey);
            return (
              <Text key={si} onPress={() => handleVersePress(verseKey)} onLongPress={() => handleVerseLongPress(verseKey)} style={[{ fontFamily: stFont(s) }, saved && styles.verseSaved, selected && styles.verseSelected]}>
                {s.verse !== 1 && s.verse !== stSentences[si - 1]?.verse && toSuperscript(s.verse)}
                {renderInline(s.content, openNtSheet, stanzaHighlightTerms, styles)}
                {si < stSentences.length - 1 ? ' ' : ''}
              </Text>
            );
          })}
        </Text>
      );
    }

    case 'text': {
      const sentences = block.sentences ?? [];
      const hasLineBreaks = sentences.some(s => s.newline);
      const textHighlightTerms = isScrollTarget ? highlightTerms : NO_HIGHLIGHT_TERMS;
      const textBlockLayout = (e: LayoutChangeEvent) => {
        recordVerseBlockLayout(key, e);
        onLayout?.(e);
      };
      if (hasLineBreaks) {
        // Each sentence gets its own line UNLESS inline:true, which attaches it to the previous line
        const lines: { sentences: { s: Sentence; oi: number }[]; spaceBefore: boolean }[] = [];
        sentences.forEach((s, oi) => {
          if (s.inline && lines.length > 0) {
            lines[lines.length - 1].sentences.push({ s, oi });
          } else {
            lines.push({ sentences: [{ s, oi }], spaceBefore: !!s.spaceBefore });
          }
        });
        return (
          <View key={key} style={{ marginTop: mt }} onLayout={textBlockLayout}>
            {lines.map((line, li) => (
              <Text key={li} selectable={nativeTextSelectable} style={[
                styles.bodyLarge,
                line.spaceBefore && { marginTop: Spacing[20] },
              ]}>
                {li === 0 && numbered && block.paragraph != null && <Text style={styles.bodyLarge}>{block.paragraph}.{'  '}</Text>}
                {line.sentences.map(({ s, oi }, si) => {
                  const verseKey = `${key}:${oi}`;
                  const selected = selectedMask.charAt(oi) === '1';
                  const saved = savedVerseMap.has(verseKey);
                  return (
                    <Text
                      key={si}
                      onPress={() => handleVersePress(verseKey)}
                      onLongPress={() => handleVerseLongPress(verseKey)}
                      style={[
                        s.bold && s.italic  ? { fontFamily: 'Lora_700Bold_Italic' } : undefined,
                        s.bold && !s.italic ? { fontFamily: 'Lora_700Bold' } : undefined,
                        !s.bold && s.italic ? { fontFamily: 'Lora_400Regular_Italic' } : undefined,
                        saved && styles.verseSaved,
                        selected && styles.verseSelected,
                      ]}
                    >
                      {s.verse !== 1 && s.verse !== line.sentences[si - 1]?.s.verse && toSuperscript(s.verse)}
                      {s.italic
                        ? highlightText(s.content, textHighlightTerms, `it-${si}`, 'Lora_700Bold_Italic')
                        : renderInline(s.content, openNtSheet, textHighlightTerms, styles)}
                      {si < line.sentences.length - 1 ? ' ' : ''}
                    </Text>
                  );
                })}
              </Text>
            ))}
          </View>
        );
      }
      return (
        <Text key={key} selectable={nativeTextSelectable} style={[styles.bodyLarge, { marginTop: mt }, block.indent && styles.stanzaBlock, block.center && { textAlign: 'center' }]} onLayout={textBlockLayout}>
          {numbered && block.paragraph != null && `${block.paragraph}.  `}
          {sentences.map((s, si) => {
            const verseKey = `${key}:${si}`;
            const selected = selectedMask.charAt(si) === '1';
            const saved = savedVerseMap.has(verseKey);
            return (
              <Text
                key={si}
                onPress={() => handleVersePress(verseKey)}
                onLongPress={() => handleVerseLongPress(verseKey)}
                style={[
                  s.bold && s.italic  ? { fontFamily: 'Lora_700Bold_Italic' } : undefined,
                  s.bold && !s.italic ? { fontFamily: 'Lora_700Bold' } : undefined,
                  !s.bold && s.italic ? styles.italic : undefined,
                  saved && styles.verseSaved,
                  selected && styles.verseSelected,
                ]}
              >
                {s.verse !== 1 && s.verse !== sentences[si - 1]?.verse && toSuperscript(s.verse)}
                {s.italic
                  ? highlightText(s.content, textHighlightTerms, `it-${si}`, 'Lora_700Bold_Italic')
                  : renderInline(s.content, openNtSheet, textHighlightTerms, styles)}
                {si < sentences.length - 1 ? ' ' : ''}
              </Text>
            );
          })}
        </Text>
      );
    }

    default:
      return null;
  }
});

export default function ReaderScreen() {
  const { book: bookId, anchor, paragraph: paragraphParam, q: searchQuery, verses: versesParam, chain: chainParam } = useLocalSearchParams<{ book: string; anchor: string; paragraph?: string; q?: string; verses?: string; chain?: string }>();
  // How many Reader-to-Reader jumps deep the *current* screen already is —
  // see MAX_READER_CHAIN_DEPTH above. Missing/invalid means this Reader was
  // reached fresh from a list screen, i.e. depth 1.
  const chainDepth = Number(chainParam) || 1;
  const highlightTerms = useMemo(
    () => (searchQuery ? splitQueryTerms(searchQuery).map(normalizeForMatch) : NO_HIGHLIGHT_TERMS),
    [searchQuery]
  );
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const t = useThemeColors();
  const { iconColor: savedRowIconColor } = useSavedRowColors();
  const styles = useMemo(() => createStyles(t, isDark), [t, isDark]);
  const scrollRef = useRef<ScrollView>(null);
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
  const hasScrolled = useRef(false);
  const chapterPositions = useRef<{ y: number; block: ContentBlock }[]>([]);
  const activeChapterRef = useRef<ContentBlock | null>(null);
  const [scrolledChapterBlock, setScrolledChapterBlock] = useState<ContentBlock | null>(null);
  const sectionPositions = useRef<{ y: number; block: ContentBlock }[]>([]);
  const activeSectionRef = useRef<ContentBlock | null>(null);
  const [scrolledSectionBlock, setScrolledSectionBlock] = useState<ContentBlock | null>(null);
  const [ntSheet, setNtSheet] = useState<{ word: string; note: string } | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  // Ref-mirror of ntSheet (same pattern as drawerModeRef below) — lets
  // closeOtherOverlays check "is this currently open" without needing ntSheet
  // itself in its dependency array, which would otherwise churn
  // closeOtherOverlays' identity (and, transitively, openNtSheet/
  // openSavedNoteSheet/openDrawer's) on every open/close.
  const ntSheetRef = useRef<{ word: string; note: string } | null>(null);
  useEffect(() => { ntSheetRef.current = ntSheet; }, [ntSheet]);

  // Tapping an already-saved (yellow-highlighted) verse opens this sheet
  // instead of toggling selection — a read-only peek at the saved note,
  // restyled to match the N.T. sheet's own visuals (see savedNoteSheet JSX).
  const [savedNoteSheet, setSavedNoteSheet] = useState<SavedBookmark | null>(null);
  const savedNoteSheetAnim = useRef(new Animated.Value(0)).current;
  const savedNoteSheetRef = useRef<SavedBookmark | null>(null);
  useEffect(() => { savedNoteSheetRef.current = savedNoteSheet; }, [savedNoteSheet]);

  // Verse selection (for bookmarking): verses are keyed as `${blockKey}:${sentenceIndex}`.
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set());
  const selectedVersesRef = useRef<Set<string>>(new Set());
  const verseBlockLayouts = useRef<Map<number, { y: number; height: number }>>(new Map());
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerVisibleRef = useRef(false);
  useEffect(() => { drawerVisibleRef.current = drawerVisible; }, [drawerVisible]);
  const [drawerMode, setDrawerMode] = useState<'toolbar' | 'save'>('toolbar');
  const drawerModeRef = useRef(drawerMode);
  useEffect(() => { drawerModeRef.current = drawerMode; }, [drawerMode]);
  const [noteText, setNoteText] = useState('');
  const drawerAnim = useRef(new Animated.Value(0)).current;
  // Extra height (px) added on top of each drawer's base height when the user
  // drags its handle upward — lets it expand toward the top. In save mode the
  // base is the 75%-screen height; in toolbar mode it's the measured peek
  // (tools-only) height, so dragging up reveals the recent-saves list beneath.
  const drawerExtraHeight = useRef(new Animated.Value(0)).current;
  // Plain-JS mirror of drawerExtraHeight's current value (Animated.Value has
  // no public synchronous getter) — lets each new drag gesture continue from
  // wherever the toolbar drawer currently sits instead of always restarting
  // from 0, so it can be dragged up/down repeatedly in one session.
  const drawerExtraHeightValueRef = useRef(0);
  const setDrawerExtraHeight = useCallback((v: number) => {
    drawerExtraHeight.setValue(v);
    drawerExtraHeightValueRef.current = v;
  }, [drawerExtraHeight]);
  const lastTouchYRef = useRef(0);
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarks();

  const closeNtSheet = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setNtSheet(null);
    });
  }, [sheetAnim]);

  const closeSavedNoteSheet = useCallback(() => {
    Animated.timing(savedNoteSheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSavedNoteSheet(null);
    });
  }, [savedNoteSheetAnim]);

  const closeDrawer = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerVisible(false);
      setDrawerMode('toolbar');
      setNoteText('');
      setDrawerExtraHeight(0);
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  const clearVerseSelection = useCallback(() => {
    selectedVersesRef.current = new Set();
    setSelectedVerses(new Set());
    closeDrawer();
  }, [closeDrawer]);

  // Only one of the three overlays (N.T. note, saved-verse note, verse-
  // selection/save drawer) may be visible at a time. Each open* function
  // below calls this first, so opening any one closes the other two. The
  // drawer is dismissed via clearVerseSelection (not closeDrawer alone) so
  // selectedVerses never sits non-empty while drawerVisible is false — that
  // would desync toggleVerse's own open/close logic. Reads current
  // visibility off the *Ref mirrors (not the state values themselves) so
  // this stays referentially stable — see ntSheetRef/savedNoteSheetRef/
  // drawerVisibleRef above.
  const closeOtherOverlays = useCallback((keep: 'nt' | 'saved' | 'drawer') => {
    if (keep !== 'nt' && ntSheetRef.current) closeNtSheet();
    if (keep !== 'saved' && savedNoteSheetRef.current) closeSavedNoteSheet();
    if (keep !== 'drawer' && drawerVisibleRef.current) clearVerseSelection();
  }, [closeNtSheet, closeSavedNoteSheet, clearVerseSelection]);

  const openNtSheet = useCallback((word: string, note: string) => {
    closeOtherOverlays('nt');
    sheetAnim.setValue(0);
    setNtSheet({ word, note });
    requestAnimationFrame(() => {
      Animated.timing(sheetAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [sheetAnim, closeOtherOverlays]);

  const openSavedNoteSheet = useCallback((bookmark: SavedBookmark) => {
    closeOtherOverlays('saved');
    savedNoteSheetAnim.setValue(0);
    setSavedNoteSheet(bookmark);
    requestAnimationFrame(() => {
      Animated.timing(savedNoteSheetAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [savedNoteSheetAnim, closeOtherOverlays]);

  const openDrawer = useCallback(() => {
    closeOtherOverlays('drawer');
    setDrawerExtraHeight(0);
    setDrawerVisible(true);
    requestAnimationFrame(() => {
      Animated.timing(drawerAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }, [drawerAnim, setDrawerExtraHeight, closeOtherOverlays]);

  const handleShareSavedNote = useCallback(() => {
    if (!savedNoteSheet) return;
    const verseText = getVersesText(savedNoteSheet.bookId, savedNoteSheet.anchor, savedNoteSheet.paragraph, savedNoteSheet.verses ?? []);
    const message = verseText ? `${verseText}\n\n${savedNoteSheet.notation}` : `${savedNoteSheet.notation} — ${savedNoteSheet.note}`;
    Share.share({ message });
  }, [savedNoteSheet]);

  const handleDeleteSavedNote = useCallback(() => {
    if (!savedNoteSheet) return;
    deleteBookmark(savedNoteSheet.id);
    if (Platform.OS === 'android') ToastAndroid.show('Eliminado', ToastAndroid.SHORT);
    closeSavedNoteSheet();
  }, [savedNoteSheet, deleteBookmark, closeSavedNoteSheet]);

  // "Eliminar" in the saved-note sheet's UIMenu opens this confirm step
  // instead of deleting straight away.
  const [deleteNoteConfirmOpen, setDeleteNoteConfirmOpen] = useState(false);

  const toggleVerse = useCallback((verseKey: string) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseKey)) next.delete(verseKey);
      else next.add(verseKey);
      selectedVersesRef.current = next;
      if (prev.size === 0 && next.size > 0) openDrawer();
      else if (prev.size > 0 && next.size === 0) closeDrawer();
      return next;
    });
  }, [openDrawer, closeDrawer]);

  const recordVerseBlockLayout = useCallback((blockKey: number, e: LayoutChangeEvent) => {
    verseBlockLayouts.current.set(blockKey, { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height });
  }, []);

  // Returns from the save-verses drawer back to the selection-toolbar drawer
  // (verse selection stays intact) — used by both the hardware back button
  // and a downward drag past the threshold while in save mode.
  const handleBackToToolbar = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerMode('toolbar');
      setNoteText('');
      setDrawerExtraHeight(0);
      requestAnimationFrame(() => {
        Animated.timing(drawerAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  // Resting ("peek") height of the toolbar drawer — content height plus the
  // device's bottom safe-area inset, so SafeAreaView's own inset padding
  // doesn't eat into the tools' budget and get squeezed under the nav bar —
  // plus TOOLBAR_DRAWER_TOP_ADJUSTMENT to pull the drawer's top edge closer
  // to the top of the screen per user request.
  const toolbarBaseHeight = TOOLBAR_PEEK_CONTENT_HEIGHT + bottomInset + TOOLBAR_DRAWER_TOP_ADJUSTMENT;

  // The drag PanResponder below is created once via useRef and never
  // recreated, so its callbacks close over whatever these values were on
  // that first render. Mirroring the latest values into refs (synced every
  // render) keeps the drag math correct even if screen/inset dimensions
  // change later (rotation, split-screen) — and, on the JS/Fast-Refresh
  // side, is what actually makes edits to the height-cap logic below take
  // effect without a full reload.
  const screenHeightRef = useRef(screenHeight);
  const topInsetRef = useRef(topInset);
  const toolbarBaseHeightRef = useRef(toolbarBaseHeight);
  // Same staleness concern as the three refs above — mirrors `bookmarks`
  // (not the sorted `recentBookmarks` below, which would create a
  // declaration-order problem; length is identical either way) so
  // baseHeightFor('save') picks up bookmarks that finish loading from
  // AsyncStorage after this component's first render.
  const hasRecentBookmarksRef = useRef(bookmarks.length > 0);
  useEffect(() => {
    screenHeightRef.current = screenHeight;
    topInsetRef.current = topInset;
    toolbarBaseHeightRef.current = toolbarBaseHeight;
    hasRecentBookmarksRef.current = bookmarks.length > 0;
  });

  // Drag-to-dismiss anywhere on the drawer's non-interactive surface. Writes
  // directly into drawerAnim (rather than a separate offset) so a partial
  // drag blends seamlessly into openDrawer/closeDrawer's own animation of
  // the same value. Dragging up instead expands the drawer's height (via
  // drawerExtraHeight): toolbar mode tops out at 75% of the screen (matching
  // the save drawer's own resting height), save mode reaches all the way to
  // 100%. Each new drag picks up from wherever it currently sits (via
  // incremental per-frame deltas) so it can be dragged up/down repeatedly
  // within one session. On release, any net downward pull anchors it back to
  // the resting height (tools peek in toolbar mode, 75%-screen in save
  // mode); a net upward drag leaves it wherever it was released.
  // (DRAWER_CLOSE_THRESHOLD lives at module scope — createSheetPanResponder
  // above needs it too.)
  const baseHeightFor = (mode: 'toolbar' | 'save') => (mode === 'save' ? screenHeightRef.current * 0.75 + (hasRecentBookmarksRef.current ? RECENT_SAVES_TITLE_HEIGHT : 0) : toolbarBaseHeightRef.current);
  const maxTotalHeightFor = (mode: 'toolbar' | 'save') => (mode === 'toolbar' ? screenHeightRef.current * 0.75 : screenHeightRef.current - topInsetRef.current);
  const maxExtraFor = (mode: 'toolbar' | 'save') => Math.max(0, maxTotalHeightFor(mode) - baseHeightFor(mode));
  const drawerPanResponder = useRef(
    PanResponder.create({
      // Never claim on touch-down — only via onMoveShouldSetPanResponder
      // below, once real vertical drag distance is seen. Claiming
      // unconditionally on start (the old `() => true`) intermittently stole
      // taps from interactive children placed inside a drag region (buttons,
      // text input) on Android, which is why those used to be carved out of
      // the pan-handled area entirely. Fixing this at the source is what
      // lets the *entire* drawer header (handle + buttons + note input) be
      // one draggable region below without breaking their own taps — a tap
      // (near-zero dy) never crosses the onMoveShouldSetPanResponder
      // threshold, so the child's own responder claim always wins first.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: (_, gesture) => {
        lastTouchYRef.current = gesture.y0;
      },
      onPanResponderMove: (_, gesture) => {
        const mode = drawerModeRef.current;
        // Toolbar mode, dragging up from peek: snap straight to its 75%
        // resting height (like tapping "Guardar" does for the save drawer)
        // instead of continuously tracking the finger — an upward drag is a
        // reveal trigger, not a proportional slider.
        if (mode === 'toolbar' && drawerExtraHeightValueRef.current === 0 && gesture.dy < 0) {
          lastTouchYRef.current = gesture.moveY;
          const max = maxExtraFor('toolbar');
          setDrawerExtraHeight(max);
          Animated.spring(drawerExtraHeight, { toValue: max, useNativeDriver: false }).start();
          return;
        }
        // Already expanded, or actively dragging upward: adjust the extra
        // (reveal) height, relative to wherever it currently is.
        if (drawerExtraHeightValueRef.current > 0 || gesture.dy < 0) {
          const deltaY = gesture.moveY - lastTouchYRef.current;
          lastTouchYRef.current = gesture.moveY;
          const max = maxExtraFor(mode);
          setDrawerExtraHeight(Math.max(0, Math.min(max, drawerExtraHeightValueRef.current - deltaY)));
          return;
        }
        lastTouchYRef.current = gesture.moveY;
        const fraction = Math.max(0, Math.min(1, 1 - gesture.dy / 500));
        drawerAnim.setValue(fraction);
      },
      onPanResponderRelease: (_, gesture) => {
        const mode = drawerModeRef.current;
        if (drawerExtraHeightValueRef.current > 0) {
          // Any net downward pull anchors back to the initial (peek) state,
          // regardless of how far up it had been dragged; a net upward drag
          // leaves it wherever it currently sits.
          if (gesture.dy >= 0) {
            setDrawerExtraHeight(0);
            Animated.spring(drawerExtraHeight, { toValue: 0, useNativeDriver: false }).start();
          }
          return;
        }
        if (gesture.dy > DRAWER_CLOSE_THRESHOLD) {
          if (mode === 'save') handleBackToToolbar();
          else clearVerseSelection();
        } else {
          Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true }).start();
        setDrawerExtraHeight(0);
        Animated.spring(drawerExtraHeight, { toValue: 0, useNativeDriver: false }).start();
      },
    })
  ).current;

  // Whole-sheet drag-to-dismiss for the N.T. and highlighted-verse sheets
  // (see createSheetPanResponder above) — separate instances since each
  // closes over its own Animated.Value/dismiss callback.
  const ntSheetPanResponder = useRef(createSheetPanResponder(sheetAnim, closeNtSheet)).current;
  const savedNoteSheetPanResponder = useRef(createSheetPanResponder(savedNoteSheetAnim, closeSavedNoteSheet)).current;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // NT popup / saved-note sheet checked first — closing either of these
      // was previously missing here entirely (only the drawer/selection was
      // handled), so hardware back fell through to the OS default (leaving
      // the reader) while one was open instead of just dismissing it.
      if (ntSheetRef.current) {
        closeNtSheet();
        return true;
      }
      if (savedNoteSheetRef.current) {
        closeSavedNoteSheet();
        return true;
      }
      if (drawerModeRef.current === 'save') {
        handleBackToToolbar();
        return true;
      }
      if (selectedVersesRef.current.size > 0) {
        clearVerseSelection();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [clearVerseSelection, handleBackToToolbar, closeNtSheet, closeSavedNoteSheet]);

  // verseFraction (0..1): how far into this block the target verse sits,
  // estimated as (sentence index / sentence count) since RN can't measure an
  // individual inline text run's own layout. Used to keep a saved bookmark's
  // actual verse within the top half of the screen — breathing room above it
  // (e.g. preceding, unsaved sentences of the same paragraph) is fine, but
  // the verse itself must never land below the 50% mark.
  const handleAnchorLayout = useCallback((e: LayoutChangeEvent, scrollToTop = false, verseFraction: number | null = null) => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    let y: number;
    if (scrollToTop) {
      y = 0;
    } else {
      const { y: blockY, height: blockHeight } = e.nativeEvent.layout;
      const defaultY = Math.max(0, blockY - 40);
      if (verseFraction != null) {
        const estimatedVerseY = blockY + verseFraction * blockHeight;
        const verseScreenPosition = estimatedVerseY - defaultY;
        y = verseScreenPosition > screenHeight * 0.5 ? Math.max(0, estimatedVerseY - screenHeight * 0.5) : defaultY;
      } else {
        y = defaultY;
      }
    }
    scrollRef.current?.scrollTo({ y, animated: false });
    // This programmatic jump-to-anchor isn't a user scroll gesture — sync
    // lastScrollY so the next onScroll's delta is ~0 instead of reading as a
    // big downward scroll and hiding the nav bar right on entry.
    lastScrollY.current = y;
  }, [screenHeight]);

  const recordChapterLayout = useCallback((block: ContentBlock, e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    const positions = chapterPositions.current.filter(p => p.block !== block);
    positions.push({ y, block });
    positions.sort((a, b) => a.y - b.y);
    chapterPositions.current = positions;
  }, []);

  const recordSectionLayout = useCallback((block: ContentBlock, e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    const positions = sectionPositions.current.filter(p => p.block !== block);
    positions.push({ y, block });
    positions.sort((a, b) => a.y - b.y);
    sectionPositions.current = positions;
  }, []);

  const [navBarHeight, setNavBarHeight] = useState(0);
  const navBarAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden
  const navBarHiddenRef = useRef(false);
  const lastScrollY = useRef(0);

  const setNavBarHidden = useCallback((hidden: boolean) => {
    if (navBarHiddenRef.current === hidden) return;
    navBarHiddenRef.current = hidden;
    Animated.timing(navBarAnim, { toValue: hidden ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [navBarAnim]);

  const handleNavBarLayout = useCallback((e: LayoutChangeEvent) => {
    setNavBarHeight(e.nativeEvent.layout.height);
  }, []);

  useFocusEffect(
    useCallback(() => {
      navBarHiddenRef.current = false;
      lastScrollY.current = 0;
      navBarAnim.setValue(0);
    }, [navBarAnim])
  );

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const scrollY = e.nativeEvent.contentOffset.y;
    const midpoint = scrollY + screenHeight / 2;

    const delta = scrollY - lastScrollY.current;
    if (scrollY <= 0) {
      setNavBarHidden(false);
    } else if (delta > 8) {
      setNavBarHidden(true);
    } else if (delta < -8) {
      setNavBarHidden(false);
    }
    lastScrollY.current = scrollY;

    let foundChapter: ContentBlock | null = null;
    for (const pos of chapterPositions.current) {
      if (pos.y <= midpoint) foundChapter = pos.block;
      else break;
    }
    if (foundChapter !== activeChapterRef.current) {
      activeChapterRef.current = foundChapter;
      setScrolledChapterBlock(foundChapter);
    }

    let foundSection: ContentBlock | null = null;
    for (const pos of sectionPositions.current) {
      if (pos.y <= midpoint) foundSection = pos.block;
      else break;
    }
    // Discard section if it belongs to a previous chapter (its Y is before the current chapter's Y)
    if (foundSection && foundChapter) {
      const chapterY = chapterPositions.current.find(p => p.block === foundChapter)?.y ?? 0;
      const sectionY = sectionPositions.current.find(p => p.block === foundSection)?.y ?? 0;
      if (sectionY < chapterY) foundSection = null;
    }
    if (foundSection !== activeSectionRef.current) {
      activeSectionRef.current = foundSection;
      setScrolledSectionBlock(foundSection);
    }

    if (selectedVersesRef.current.size > 0) {
      const viewportTop = scrollY;
      const viewportBottom = scrollY + screenHeight;
      let changed = false;
      const next = new Set(selectedVersesRef.current);
      for (const verseKey of selectedVersesRef.current) {
        const blockKey = Number(verseKey.split(':')[0]);
        const layout = verseBlockLayouts.current.get(blockKey);
        if (!layout) continue;
        const blockBottom = layout.y + layout.height;
        if (blockBottom < viewportTop || layout.y > viewportBottom) {
          next.delete(verseKey);
          changed = true;
        }
      }
      if (changed) {
        selectedVersesRef.current = next;
        setSelectedVerses(next);
        if (next.size === 0) closeDrawer();
      }
    }
  }, [screenHeight, closeDrawer]);

  const bookBlocks = useMemo(() => {
    const key = resolveContentKey(bookId, anchor);
    return (CONTENT[key] ?? []) as ContentBlock[];
  }, [bookId, anchor]);

  // When a search result links here with a paragraph number, scroll past the
  // section/lesson heading straight to that paragraph's own text block —
  // otherwise landing on the section start is only correct by coincidence.
  const scrollTargetBlock = useMemo(() => {
    if (!anchor) return null;
    const anchorIdx = bookBlocks.findIndex(b => b.anchor === anchor);
    if (anchorIdx < 0) return null;
    const paragraphNum = paragraphParam ? Number(paragraphParam) : NaN;
    if (!Number.isNaN(paragraphNum)) {
      for (let i = anchorIdx + 1; i < bookBlocks.length; i++) {
        const b = bookBlocks[i];
        if (b.anchor != null) break; // next section/chapter/lesson boundary
        if (b.type === 'text' && b.paragraph === paragraphNum) return b;
      }
    }
    return bookBlocks[anchorIdx];
  }, [bookBlocks, anchor, paragraphParam]);

  // Landing here from a saved bookmark (exact verses in the URL) — pre-select
  // those verses so they show the same underline a live selection gets, and
  // open the toolbar drawer so the user can act on them right away.
  useEffect(() => {
    if (!versesParam || !scrollTargetBlock) return;
    const blockIdx = bookBlocks.indexOf(scrollTargetBlock);
    if (blockIdx < 0) return;
    const verseSet = new Set(versesParam.split(',').map(Number));
    const keys = new Set<string>();
    scrollTargetBlock.sentences?.forEach((s, si) => {
      if (verseSet.has(s.verse)) keys.add(`${blockIdx}:${si}`);
    });
    if (keys.size > 0) {
      selectedVersesRef.current = keys;
      setSelectedVerses(keys);
      openDrawer();
    }
  }, [bookBlocks, scrollTargetBlock, versesParam, openDrawer]);

  // Every verse that belongs to a saved bookmark gets a yellow highlight —
  // independent of how the reader was entered (index, search, or a bookmark
  // link) and independent of the live selection (underline) above, so users
  // can spot previously saved passages without opening the bookmarks list.
  // Mirrors the anchor/paragraph lookup above: find the section/chapter
  // block matching the bookmark's anchor, then scan forward to the block
  // sharing its paragraph number, stopping at the next anchored heading.
  // Maps back to the owning bookmark (not just a boolean) so tapping a
  // highlighted verse can open that bookmark's saved note.
  const savedVerseMap = useMemo(() => {
    const map = new Map<string, SavedBookmark>();
    for (const bm of bookmarks) {
      if (bm.bookId !== bookId || bm.verses.length === 0) continue;
      const anchorIdx = bookBlocks.findIndex(b => b.anchor === bm.anchor);
      if (anchorIdx < 0) continue;
      const verseSet = new Set(bm.verses);
      for (let i = anchorIdx + 1; i < bookBlocks.length; i++) {
        const b = bookBlocks[i];
        if (b.anchor != null) break;
        if (b.paragraph === bm.paragraph) {
          b.sentences?.forEach((s, si) => {
            if (verseSet.has(s.verse)) map.set(`${i}:${si}`, bm);
          });
        }
      }
    }
    return map;
  }, [bookmarks, bookBlocks, bookId]);

  // A saved verse opens its note sheet on tap — UNLESS the user is already
  // mid-selection (selectedVersesRef non-empty), in which case a saved verse
  // behaves like any other verse and joins/leaves the active selection
  // instead. This lets a selection mix saved and unsaved verses for a
  // combined share, without interrupting an in-progress selection every time
  // it happens to touch an already-saved one.
  const handleVersePress = useCallback((verseKey: string) => {
    const bookmark = savedVerseMap.get(verseKey);
    if (bookmark && selectedVersesRef.current.size === 0) openSavedNoteSheet(bookmark);
    else toggleVerse(verseKey);
  }, [savedVerseMap, openSavedNoteSheet, toggleVerse]);

  // Long-pressing a saved verse starts a brand-new selection containing just
  // that verse (discarding whatever was previously selected) — the only way
  // to begin a selection when every verse you want is already individually
  // saved, since a plain tap on those opens their note sheet instead. Only
  // meaningful for already-saved verses; unsaved ones already select on a
  // plain tap.
  const handleVerseLongPress = useCallback((verseKey: string) => {
    if (!savedVerseMap.has(verseKey)) return;
    const next = new Set([verseKey]);
    selectedVersesRef.current = next;
    setSelectedVerses(next);
    setDrawerMode('toolbar');
    setNoteText('');
    openDrawer();
  }, [savedVerseMap, openDrawer]);

  useEffect(() => {
    setScrolledChapterBlock(null);
    setScrolledSectionBlock(null);
    activeChapterRef.current = null;
    activeSectionRef.current = null;
  }, [anchor]);

  const navChapterBlock = useMemo(() => {
    if (scrolledChapterBlock) return scrolledChapterBlock;
    let last: ContentBlock | null = null;
    for (const b of bookBlocks) {
      if (b.type === 'chapter-heading' || b.type === 'lesson-heading' || b.type === 'lesson-set-heading') last = b;
      if (anchor && b.anchor === anchor) break;
    }
    // Anchor may point to a skipped group heading (e.g. workbook-part1-lessons1-50).
    // Fall back to the first lesson/chapter heading in the file.
    if (!last) last = bookBlocks.find(b => b.type === 'chapter-heading' || b.type === 'lesson-heading') ?? null;
    return last;
  }, [bookBlocks, anchor, scrolledChapterBlock]);

  const navSectionBlock = useMemo(() => {
    if (scrolledSectionBlock) return scrolledSectionBlock;
    let last: ContentBlock | null = null;
    let anchorIdx = -1;
    for (let i = 0; i < bookBlocks.length; i++) {
      const b = bookBlocks[i];
      if (b.type === 'chapter-heading' || b.type === 'lesson-heading' || b.type === 'lesson-set-heading') last = null;
      if (b.type === 'section-heading') last = b;
      if (anchor && b.anchor === anchor) { anchorIdx = i; break; }
    }
    // No section precedes the anchor — peek forward to find the first section.
    // Stop if body text appears first (chapter has an intro, so no default section).
    if (!last && anchorIdx >= 0) {
      for (let i = anchorIdx + 1; i < bookBlocks.length; i++) {
        const b = bookBlocks[i];
        if (b.type === 'chapter-heading' || b.type === 'lesson-heading') break;
        if (b.type === 'section-heading') { last = b; break; }
        if (b.type === 'text' || b.type === 'stanza') break;
      }
    }
    return last;
  }, [bookBlocks, anchor, scrolledSectionBlock]);

  // Review trigger #2: the user reaches Theory Ch.1 §II ("La revelación, el
  // tiempo y los milagros", anchor theory-ch1-s2) — fires whether they land
  // here directly (a link/index tap) or scroll into it while reading, since
  // navSectionBlock already tracks "the section currently in view" either
  // way. See also: app/_layout.tsx's 15-minute trigger (#1) — whichever
  // fires first wins, since requestAppReview() no-ops after the first call.
  useEffect(() => {
    if (bookId === 'theory' && navSectionBlock?.anchor === 'theory-ch1-s2') {
      requestAppReview();
    }
  }, [bookId, navSectionBlock]);

  // Resolves the current verse selection into a citation ("T-26.IV.4:7") and
  // the section-level anchor/paragraph the bookmark should reopen at — reuses
  // the search feature's own formatRouteId so citations stay consistent with
  // the rest of the app. Selection can span multiple blocks; only the first
  // selected block's paragraph/verse range is cited (matches how ACIM
  // citations only ever reference a single paragraph's verse range).
  const buildSelectionNotation = useCallback((): { anchor: string; paragraph: number; notation: string; name: string; verses: number[] } | null => {
    let minBlockIdx = Infinity;
    let paragraph: number | null = null;
    let verseMin = Infinity;
    let verseMax = -Infinity;
    let verseSet = new Set<number>();
    for (const verseKey of selectedVersesRef.current) {
      const [blockIdxStr, sentIdxStr] = verseKey.split(':');
      const blockIdx = Number(blockIdxStr);
      const block = bookBlocks[blockIdx];
      if (!block || block.paragraph == null) continue;
      if (blockIdx < minBlockIdx) {
        minBlockIdx = blockIdx;
        paragraph = block.paragraph;
        verseMin = Infinity;
        verseMax = -Infinity;
        verseSet = new Set<number>();
      }
      if (blockIdx === minBlockIdx) {
        const verse = block.sentences?.[Number(sentIdxStr)]?.verse;
        if (verse != null) {
          verseMin = Math.min(verseMin, verse);
          verseMax = Math.max(verseMax, verse);
          verseSet.add(verse);
        }
      }
    }
    if (paragraph == null) return null;

    let searchBook = bookId;
    if (bookId === 'supplement') {
      searchBook = navChapterBlock?.anchor?.startsWith('supplement-song') ? 'song' : 'psychotherapy';
    }
    const lessonMatch = navChapterBlock?.type === 'lesson-heading' ? navChapterBlock.anchor?.match(/^workbook-l(\d+)$/) : null;

    const result: SearchResult = {
      book: searchBook,
      chapterAnchor: navChapterBlock?.anchor ?? null,
      chapterTitle: navChapterBlock?.title ?? null,
      sectionAnchor: navSectionBlock?.anchor ?? null,
      sectionTitle: navSectionBlock?.title ?? null,
      lessonAnchor: navChapterBlock?.type === 'lesson-heading' ? navChapterBlock.anchor ?? null : null,
      lessonTitle: null,
      lessonNumber: lessonMatch ? Number(lessonMatch[1]) : null,
      paragraph,
      verseStart: verseMin === Infinity ? null : verseMin,
      verseEnd: verseMax === -Infinity ? null : verseMax,
      anchor: anchor ?? null,
      text: '',
      snippet: '',
    };

    // A section's own title already carries its name (e.g. "IV. La invitación
    // al Espíritu Santo"). Lessons/sets have no sections — their heading's
    // title is just a number/range ("Lección 1", "(221-230)"), so the actual
    // name lives in its subtitle instead.
    const name = navSectionBlock?.title ?? navChapterBlock?.subtitle ?? navChapterBlock?.title ?? '';

    return {
      anchor: navSectionBlock?.anchor ?? navChapterBlock?.anchor ?? anchor ?? '',
      paragraph,
      notation: formatRouteId(result),
      name,
      verses: [...verseSet].sort((a, b) => a - b),
    };
  }, [bookBlocks, bookId, anchor, navChapterBlock, navSectionBlock]);

  const handleShareSelection = useCallback(() => {
    const resolved = buildSelectionNotation();
    if (!resolved) return;
    const verseText = getVersesText(bookId, resolved.anchor, resolved.paragraph, resolved.verses);
    const message = verseText ? `${verseText}\n\n${resolved.notation}` : resolved.notation;
    Share.share({ message });
  }, [buildSelectionNotation, bookId]);

  const handleSaveTapped = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerMode('save');
      setDrawerExtraHeight(0);
      requestAnimationFrame(() => {
        Animated.timing(drawerAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    });
  }, [drawerAnim, setDrawerExtraHeight]);

  const handleSubmitNote = useCallback(() => {
    if (!noteText.trim()) return;
    const resolved = buildSelectionNotation();
    if (resolved) {
      addBookmark({ bookId: bookId as SavedBookId, anchor: resolved.anchor, paragraph: resolved.paragraph, notation: resolved.notation, name: resolved.name, note: noteText.trim(), verses: resolved.verses });
    }
    Animated.timing(drawerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setDrawerVisible(false);
      setDrawerMode('toolbar');
      setNoteText('');
      setDrawerExtraHeight(0);
      selectedVersesRef.current = new Set();
      setSelectedVerses(new Set());
    });
    if (Platform.OS === 'android') ToastAndroid.show('Guardado', ToastAndroid.SHORT);
  }, [noteText, buildSelectionNotation, addBookmark, bookId, drawerAnim, setDrawerExtraHeight]);

  const recentBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => b.date.localeCompare(a.date)),
    [bookmarks]
  );

  const handleShareBookmark = useCallback((item: SavedBookmark) => {
    const verseText = getVersesText(item.bookId, item.anchor, item.paragraph, item.verses ?? []);
    const message = verseText ? `${verseText}\n\n${item.notation}` : `${item.notation} — ${item.note}`;
    Share.share({ message });
  }, []);

  const handleDeleteBookmark = useCallback((item: SavedBookmark) => {
    deleteBookmark(item.id);
    if (Platform.OS === 'android') ToastAndroid.show('Eliminado', ToastAndroid.SHORT);
  }, [deleteBookmark]);

  // "Eliminar" in a recent-saves row's UIMenu opens this confirm step
  // instead of deleting straight away — holds the pending item until the
  // user confirms or cancels in the ConfirmDialog rendered below.
  const [deleteBookmarkTarget, setDeleteBookmarkTarget] = useState<SavedBookmark | null>(null);

  // Shared between the toolbar and save drawers so both can list recent saves.
  const recentBookmarksSection = recentBookmarks.length > 0 ? (
    <View style={styles.saveDrawerFullBleed}>
      <IndexTitleL1 label="Guardados recientes" {...drawerPanResponder.panHandlers} />
      <ScrollView style={styles.saveDrawerList} keyboardShouldPersistTaps="handled">
        {recentBookmarks.map(item => (
          <SavedItem
            key={item.id}
            label={item.name ? `${item.notation} - ${item.name}` : item.notation}
            date={formatSavedDate(item.date)}
            note={item.note}
            onPress={() => {
              if (navigating) return;
              setNavigating(true);
              startLoadBar();
              // Drawer stays open (not animated closed) until the saved
              // item's screen actually opens, per its own transition.
              // Caps how deep a chain of drawer jumps can stack (see
              // MAX_READER_CHAIN_DEPTH) — under the cap, push as normal
              // (full back history through each jump); at the cap, replace
              // instead so the stack stops growing but this and the next
              // couple of jumps still behave identically to today.
              const atCap = chainDepth >= MAX_READER_CHAIN_DEPTH;
              // `as const` isn't decorative here — expo-router's typed
              // routes need the template-literal type preserved (matching
              // the `/reader?${string}` pattern `bookmarkHref` already
              // returns); without it this widens to plain `string`, which
              // TS rejects for router.push/replace.
              const nextHref = `${bookmarkHref(item)}&chain=${atCap ? MAX_READER_CHAIN_DEPTH : chainDepth + 1}` as const;
              setTimeout(() => (atCap ? router.replace(nextHref) : router.push(nextHref)), 200);
            }}
            actionsSlot={
              <UIMenu
                iconColor={savedRowIconColor}
                actions={[
                  { id: 'share', title: 'Compartir', onPress: () => handleShareBookmark(item) },
                  { id: 'delete', title: 'Eliminar', destructive: true, onPress: () => setDeleteBookmarkTarget(item) },
                ]}
              />
            }
          />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const navTitle = useMemo(() => {
    if (!scrolledChapterBlock) {
      // Repaso intro (anchor = workbook-part1-review1-intro etc.)
      if (/^workbook-part1-review\d+-intro$/.test(anchor ?? '')) {
        const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
        if (group?.title) return toTitleCase(group.title);
      }
      // Part II intro
      if (anchor === 'workbook-part2-intro') return 'Parte II';
      // Workbook (Part I) overall intro
      if (anchor === 'workbook-intro') return 'Parte I';
    }
    // Workbook (Part I) overall intro stays "Parte I" regardless of scroll position —
    // it isn't thematically part of the "Lecciones 1 al 50" group it happens to be bundled with.
    if (scrolledChapterBlock?.anchor === 'workbook-intro') return 'Parte I';
    // Part II intro stays "Parte II" regardless of scroll position — its file has no
    // lesson-group-heading for the generic rule below to fall back on, so it would
    // otherwise collapse to the raw chapter title ("Introducción").
    if (scrolledChapterBlock?.anchor === 'workbook-part2-intro') return 'Parte II';
    // When user scrolls into "Introducción" in a Repaso file, keep group heading as title
    if (scrolledChapterBlock?.type === 'chapter-heading') {
      const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
      if (group?.title) return toTitleCase(group.title);
    }
    // Part II set intro/heading (scroll-driven or static via navChapterBlock)
    if (navChapterBlock?.type === 'lesson-set-heading') {
      const setMatch = navChapterBlock.anchor?.match(/^workbook-part2-set(\d+)$/);
      if (setMatch && navChapterBlock.subtitle) return `${setMatch[1]}. ${toTitleCase(navChapterBlock.subtitle)}`;
      return toTitleCase(navChapterBlock.subtitle ?? navChapterBlock.title ?? '');
    }
    if (!navChapterBlock) return '';
    if (navChapterBlock.type === 'lesson-heading') {
      return navChapterBlock.title ?? '';
    }
    if (bookId === 'mft' && navChapterBlock.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a.startsWith('supplement-mft-clarification') || a === 'supplement-mft-epilogo') {
        return 'Clarificación de Términos';
      }
      if (navChapterBlock.subtitle) return navChapterBlock.title ?? '';
    }
    if (bookId === 'supplement' && navChapterBlock.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a === 'supplement-psycho-intro' || a === 'supplement-psycho-ch1' || a === 'supplement-anexo') {
        let parentTitle = '';
        for (const b of bookBlocks) {
          if (b.type === 'book-heading' || b.type === 'part-heading') parentTitle = b.title ?? '';
          if (b.anchor === a) break;
        }
        return toTitleCase(parentTitle || (navChapterBlock.title ?? ''));
      }
      return toTitleCase(navChapterBlock.title ?? '');
    }
    if (navChapterBlock.subtitle) {
      const num = navChapterBlock.title?.match(/\d+/)?.[0] ?? '';
      return num
        ? `${num}. ${toTitleCase(navChapterBlock.subtitle)}`
        : toTitleCase(navChapterBlock.subtitle);
    }
    return toTitleCase(navChapterBlock.title ?? '');
  }, [navChapterBlock, bookBlocks, anchor, scrolledChapterBlock]);

  const navSubtitle = useMemo(() => {
    if (!scrolledChapterBlock) {
      if (/^workbook-part1-review\d+-intro$/.test(anchor ?? '')) return 'Introducción';
      if (anchor === 'workbook-part2-intro') return 'Introducción';
      if (anchor === 'workbook-intro') return 'Introducción';
    }
    // Workbook (Part I) overall intro — subtitle stays "Introducción" regardless of scroll position
    if (scrolledChapterBlock?.anchor === 'workbook-intro') return 'Introducción';
    // Part II intro — subtitle stays "Introducción" regardless of scroll position
    if (scrolledChapterBlock?.anchor === 'workbook-part2-intro') return 'Introducción';
    // When scrolled into "Introducción" chapter in a Repaso file
    if (scrolledChapterBlock?.type === 'chapter-heading') {
      const group = bookBlocks.find(b => b.type === 'lesson-group-heading');
      if (group) return 'Introducción';
    }
    // Part II set intro/heading
    if (navChapterBlock?.type === 'lesson-set-heading') return 'Introducción';
    if (navChapterBlock?.type === 'lesson-heading') {
      return navChapterBlock.subtitle ?? '';
    }
    if (bookId === 'mft' && navChapterBlock?.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a.startsWith('supplement-mft-clarification') || a === 'supplement-mft-epilogo') {
        return navChapterBlock.title ?? '';
      }
      if (navChapterBlock.subtitle) return navChapterBlock.subtitle;
    }
    if (bookId === 'supplement' && navChapterBlock?.type === 'chapter-heading') {
      const a = navChapterBlock.anchor ?? '';
      if (a === 'supplement-psycho-intro' || a === 'supplement-psycho-ch1' || a === 'supplement-anexo') return navChapterBlock.title ?? '';
      const section = scrolledChapterBlock ? scrolledSectionBlock : navSectionBlock;
      return section?.title ?? '';
    }
    if (!navSectionBlock) return '';
    return toTitleCase(navSectionBlock.title ?? '');
  }, [navChapterBlock, navSectionBlock, anchor, scrolledChapterBlock, scrolledSectionBlock, bookBlocks]);

  const anchorToSave = useMemo(() =>
    scrolledSectionBlock?.anchor
    ?? scrolledChapterBlock?.anchor
    ?? navSectionBlock?.anchor
    ?? navChapterBlock?.anchor
    ?? anchor,
  [scrolledSectionBlock, scrolledChapterBlock, navSectionBlock, navChapterBlock, anchor]);

  const breadcrumbToSave = useMemo((): string => {
    const chAnchor = (scrolledChapterBlock ?? navChapterBlock)?.anchor ?? anchor;

    let book: string;
    if (bookId === 'theory') book = 'Texto';
    else if (bookId === 'workbook') book = 'Ejercicios';
    else if (bookId === 'mft') book = 'Manual';
    else if (chAnchor.includes('supplement-song') || anchor.includes('supplement-song')) book = 'Canto';
    else if (chAnchor.includes('supplement-psycho') || anchor.includes('supplement-psycho')) book = 'Psicoterapia';
    else book = 'Suplementos';

    let part2: string | null = null;
    let part3: string | null = null;

    if (bookId === 'theory') {
      const t = navChapterBlock?.title ?? '';
      const capNum = t.match(/^cap[íi]tulo\s+(\d+)/i)?.[1];
      part2 = capNum ? `Cap. ${capNum}` : (t ? toTitleCase(t) : null);
      const sl = navSectionBlock?.title ? extractSectionLabel(navSectionBlock.title) : '';
      if (sl) part3 = sl;

    } else if (bookId === 'workbook') {
      if (anchor === 'workbook-epilogue') {
        part2 = 'Epílogo';
      } else if (anchor === 'workbook-part2-intro') {
        part2 = 'Parte II';
      } else if (navChapterBlock?.type === 'lesson-heading') {
        const num = navChapterBlock.title?.match(/\d+/)?.[0];
        if (num) part2 = `Lección ${num}`;
      } else if (navChapterBlock?.type === 'lesson-set-heading') {
        part2 = navChapterBlock.anchor === 'workbook-part2-final'
          ? 'Lecciones 361 - 365'
          : (navTitle || null);
      } else if (navChapterBlock?.type === 'chapter-heading') {
        const t = navChapterBlock.title ?? '';
        // navTitle is overridden by the group heading when inside a Repaso file
        if (navTitle && navTitle !== toTitleCase(t)) {
          part2 = navTitle;
        } else {
          part2 = toTitleCase(t);
        }
      }

    } else if (bookId === 'mft') {
      const mftAnchor = navChapterBlock?.anchor ?? '';
      if (mftAnchor === 'supplement-mft-epilogo') {
        part2 = 'Epílogo';
      } else if (mftAnchor.startsWith('supplement-mft-clarification')) {
        part2 = 'Clarificación';
        const termNum = (navSubtitle || '').match(/^(\d+)\./)?.[1];
        if (termNum) part3 = `Cap. ${termNum}`;
      } else if (navChapterBlock?.type === 'chapter-heading') {
        const t = navChapterBlock.title ?? '';
        const capNum = t.match(/^cap[íi]tulo\s+(\d+)/i)?.[1];
        part2 = capNum ? `Cap. ${capNum}` : (t ? toTitleCase(t) : null);
        const sl = navSectionBlock?.title ? extractSectionLabel(navSectionBlock.title) : '';
        if (sl) part3 = sl;
      }

    } else {
      // supplement
      if (chAnchor === 'supplement-anexo' || anchor === 'supplement-anexo') {
        part2 = 'Anexo';
      } else if (navChapterBlock?.type === 'chapter-heading') {
        const t = navChapterBlock.title ?? '';
        const numMatch = t.match(/^(\d+)\./);
        part2 = numMatch ? `Cap. ${numMatch[1]}` : (t ? toTitleCase(t) : null);
        const sl = navSectionBlock?.title ? extractSectionLabel(navSectionBlock.title) : '';
        if (sl) part3 = sl;
      }
    }

    return [book, part2, part3].filter(Boolean).join(' · ');
  }, [bookId, navChapterBlock, navSectionBlock, navTitle, navSubtitle, anchor, scrolledChapterBlock]);

  const titleToSave = useMemo(() => navSubtitle || navTitle || '', [navSubtitle, navTitle]);

  useEffect(() => {
    if (!bookId) return;
    saveLastRead({ bookId, anchor: anchorToSave, breadcrumb: breadcrumbToSave, title: titleToSave });
  }, [bookId, anchorToSave, breadcrumbToSave, titleToSave]);

  const isChapterFile = useMemo(() => /^theory-ch\d+$/.test(resolveContentKey(bookId, anchor)), [bookId, anchor]);

  const rootChapterAnchor = useMemo(() =>
    bookBlocks.find(b => b.type === 'chapter-heading')?.anchor ?? null,
  [bookBlocks]);

  const currentContentKey = useMemo(() => resolveContentKey(bookId, anchor), [bookId, anchor]);
  const nextContentKey = useMemo(() => {
    const seq = BOOK_SEQUENCES[bookId] ?? [];
    const idx = seq.indexOf(currentContentKey);
    return idx >= 0 && idx < seq.length - 1 ? seq[idx + 1] : null;
  }, [bookId, currentContentKey]);

  const visibleBlocks = useMemo(() => {
    const result: { block: ContentBlock; mt: number; key: number; numbered: boolean }[] = [];
    let numbered = false;
    for (let i = 0; i < bookBlocks.length; i++) {
      const block = bookBlocks[i];
      if ((block as any)._comment) continue;
      if (block.type === 'lesson-group-heading' && !/workbook-part1-review/.test(block.anchor ?? '')) continue;
      if (block.type === 'book-heading' && isChapterFile) continue;
      if (block.type === 'chapter-heading' && block.anchor !== 'theory-prefacio') numbered = true;
      if (block.type === 'lesson-set-heading') numbered = true;
      if (block.type === 'lesson-heading') numbered = true;
      const prevType = result.length > 0 ? result[result.length - 1].block.type : null;
      const baseMt = getMarginTop(block.type, prevType, result.length === 0);
      const mt = block.compact ? 2 : block.spaceBefore ? baseMt + 20 : baseMt;
      result.push({ block, mt, key: i, numbered });
    }
    return result;
  }, [bookBlocks, isChapterFile]);

  return (
    <SafeAreaView style={styles.topArea} edges={['top']}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={t.darkerBackgroundColor} />
      <Animated.View
        style={[
          styles.navBar,
          navBarHeight > 0 && {
            transform: [{
              translateY: navBarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -navBarHeight] }),
            }],
          },
        ]}
        onLayout={handleNavBarLayout}
      >
        <NavBar
          eyebrow={navSubtitle ? navTitle : undefined}
          title={navSubtitle || navTitle}
          onBack={() => router.back()}
          onHome={() => setTimeout(() => router.navigate('/home'), 100)}
        />
      </Animated.View>

      {/* Wrapping the scroll content in a Pressable lets a tap that lands on
          non-interactive space (headings, margins, gaps between verses)
          close the toolbar drawer. RN's touch-responder negotiation resolves
          a tap on a verse Text (which has its own onPress) at that deeper
          node first, so verse selection/deselection keeps working exactly as
          before; only taps no descendant claims reach this handler. onPress
          is only wired up while the toolbar drawer is actually open — left
          undefined otherwise so this never touches normal scrolling/reading. */}
      <Pressable
        style={styles.scroll}
        onPress={drawerVisible && drawerMode === 'toolbar' ? clearVerseSelection : undefined}
      >
      <AppScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: navBarHeight }]}
        onScroll={handleScroll}
      >
        {visibleBlocks.map(({ block, mt, key, numbered }) => (
          <ReaderBlock
            key={key}
            block={block}
            blockKey={key}
            mt={mt}
            numbered={numbered}
            styles={styles}
            bookId={bookId}
            isScrollTarget={block === scrollTargetBlock}
            rootChapterAnchor={rootChapterAnchor}
            versesParam={versesParam}
            highlightTerms={highlightTerms}
            selectedMask={(block.sentences ?? []).map((_, i) => (selectedVerses.has(`${key}:${i}`) ? '1' : '0')).join('')}
            savedVerseMap={savedVerseMap}
            handleVersePress={handleVersePress}
            handleVerseLongPress={handleVerseLongPress}
            openNtSheet={openNtSheet}
            handleAnchorLayout={handleAnchorLayout}
            recordChapterLayout={recordChapterLayout}
            recordSectionLayout={recordSectionLayout}
            recordVerseBlockLayout={recordVerseBlockLayout}
          />
        ))}
        {nextContentKey && (
          <View style={styles.nextChapterContainer}>
            <Button
              variant="mainHome"
              className="shadow-none justify-center"
              onPress={() => {
                if (navigating) return;
                setNavigating(true);
                startLoadBar();
                setTimeout(() => router.replace({ pathname: '/reader', params: { book: bookId, anchor: nextContentKey } }), 200);
              }}
            >
              <ButtonText>
                {bookId === 'workbook' ? 'Siguiente lección'
                  : (currentContentKey === 'supplements' && nextContentKey === 'supplement-song') ? 'Siguiente libro'
                  : 'Siguiente capítulo'}
              </ButtonText>
            </Button>
          </View>
        )}
      </AppScrollView>
      </Pressable>
      </SafeAreaView>

      {/* Android's edge-to-edge status bar is always transparent (its
          backgroundColor is ignored under edge-to-edge), so app content
          underneath shows through it. This fixed strip — a sibling above
          everything else in topArea, including the animated nav bar — paints
          that inset area so a sliding-away nav bar never peeks through it. */}
      <View pointerEvents="none" style={[styles.statusBarBackdrop, { height: topInset, backgroundColor: t.darkerBackgroundColor }]} />

      {ntSheet && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeNtSheet}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetOverlayBg, { opacity: sheetAnim }]} pointerEvents="none" />
        </Pressable>
      )}
      {ntSheet && (
        <Animated.View style={[styles.sheetSlide, { transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          {/* Figma "Text" variant — its own container/handle/title/body
              styles (also reused as-is by savedNoteSheet below). Whole sheet
              is one drag-to-dismiss region — a tap (near-zero dy) never
              crosses ntSheetPanResponder's move threshold, so this sheet has
              no other interactive children to protect. */}
          <SafeAreaView edges={['bottom']} style={styles.ntSheetContainer}>
            <View {...ntSheetPanResponder.panHandlers}>
              <View style={styles.ntSheetHandleWrap}>
                <View style={styles.ntSheetHandle} />
              </View>
              <Text style={styles.ntSheetTitle}>Nota de traducción — {ntSheet.word}</Text>
              <Text style={styles.ntSheetBody}>{ntSheet.note}</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {savedNoteSheet && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSavedNoteSheet}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetOverlayBg, { opacity: savedNoteSheetAnim }]} pointerEvents="none" />
        </Pressable>
      )}
      {savedNoteSheet && (
        <Animated.View style={[styles.sheetSlide, { transform: [{ translateY: savedNoteSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          {/* Restyled to match the N.T. sheet above (ntSheetContainer/
              ntSheetHandleWrap/ntSheetHandle/ntSheetBody), plus its own
              title+actions row (ntSheetTitleRow/ntSheetTitleText) to fit the
              UIMenu the N.T. sheet doesn't have. Whole sheet is draggable —
              the UIMenu button stays a plain tap target because it already
              self-claims the touch responder before any ancestor gets a
              chance (see components/UIMenu.tsx), and ntSheetPanResponder
              additionally never claims on touch-down (only on real drag
              distance), so the two never contest a tap. */}
          <SafeAreaView edges={['bottom']} style={styles.ntSheetContainer}>
            <View {...savedNoteSheetPanResponder.panHandlers}>
              <View style={styles.ntSheetHandleWrap}>
                <View style={styles.ntSheetHandle} />
              </View>
              <View style={styles.ntSheetTitleRow}>
                <Text style={[styles.ntSheetTitle, styles.ntSheetTitleText]}>
                  {savedNoteSheet.name ? `${savedNoteSheet.notation} - ${savedNoteSheet.name}` : savedNoteSheet.notation}
                </Text>
                <UIMenu
                  iconColor={(pressed) => (pressed ? t.pressedIconColor : t.fontColorPrimary)}
                  actions={[
                    { id: 'share', title: 'Compartir', onPress: handleShareSavedNote },
                    { id: 'delete', title: 'Eliminar', destructive: true, onPress: () => setDeleteNoteConfirmOpen(true) },
                  ]}
                />
              </View>
              <Text style={styles.ntSheetBody}>{savedNoteSheet.note || 'Sin nota'}</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {drawerVisible && drawerMode === 'save' && (
        // Tapping the dimmed background fully closes the drawer (clears the
        // selection too) rather than just stepping back to toolbar mode —
        // clearVerseSelection keeps drawerVisible/selectedVerses in sync
        // (see its own definition above).
        <Pressable style={StyleSheet.absoluteFill} onPress={clearVerseSelection}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetOverlayBg, { opacity: drawerAnim }]} pointerEvents="none" />
        </Pressable>
      )}
      {drawerVisible && (
        <Animated.View style={[styles.sheetSlide, { transform: [{ translateY: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }) }] }]}>
          {drawerMode === 'toolbar' ? (
            <Animated.View style={{ height: Animated.add(toolbarBaseHeight, drawerExtraHeight) }}>
              <View style={styles.drawerOuter}>
                {/* Whole header (handle + Guardar/Compartir row) is one drag
                    region — safe now that drawerPanResponder's
                    onStartShouldSetPanResponder never claims on touch-down
                    (see its own definition above), so a tap on either button
                    still resolves to the button first. */}
                <View style={styles.drawerHeader} {...drawerPanResponder.panHandlers}>
                  <View style={styles.drawerHandleWrap}>
                    <View style={styles.drawerHandle} />
                  </View>
                  <View style={styles.toolsDrawerRow}>
                    <ReaderToolButton variant="save" style={styles.toolsDrawerButton} onPress={handleSaveTapped} />
                    <ReaderToolButton variant="share" style={styles.toolsDrawerButton} onPress={handleShareSelection} />
                  </View>
                </View>
                <View style={[styles.drawerBody, { paddingBottom: bottomInset }]}>
                  {recentBookmarksSection}
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={{ height: Animated.add(screenHeight * 0.75 + (recentBookmarks.length > 0 ? RECENT_SAVES_TITLE_HEIGHT : 0), drawerExtraHeight) }}>
              <View style={styles.drawerOuter}>
                {/* Whole header (handle + title + note input + submit
                    button) is one drag region, same reasoning as toolbar
                    mode above — the note input stays focusable/typeable and
                    the submit button stays tappable since a tap never
                    crosses drawerPanResponder's move threshold. */}
                <View style={styles.drawerHeader} {...drawerPanResponder.panHandlers}>
                  <View style={styles.saveDrawerDragZone}>
                    <View style={styles.drawerHandleWrap}>
                      <View style={styles.drawerHandle} />
                    </View>
                    <Text style={styles.saveDrawerTitle}>Guardar versos</Text>
                  </View>
                  <View style={styles.saveDrawerNoteInputWrap}>
                    <View style={styles.saveDrawerNoteInputField}>
                      <TextInputField value={noteText} onChangeText={setNoteText} onSubmit={handleSubmitNote} autoFocus />
                    </View>
                    <IconButton
                      // PlusIcon defaults to a smaller glyph centered in a larger
                      // tap-target box (see components/Icons.tsx) — here we want
                      // Figma's literal flat 16×16 glyph instead, so glyphSize is
                      // pinned to match the container size rather than the default
                      // 10/24 ratio.
                      icon={(props) => <PlusIcon glyphSize={props.size} {...props} />}
                      iconSize={16}
                      surface="solid"
                      onPress={handleSubmitNote}
                    />
                  </View>
                </View>
                <View style={[styles.drawerBody, { paddingBottom: bottomInset }]}>
                  {recentBookmarksSection}
                </View>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}

      <LoadingBar
        visible={loadBarVisible}
        progress={loadBarAnim}
        screenWidth={screenWidth}
        style={loadBarStyles.position}
      />

      <ConfirmDialog
        open={!!deleteBookmarkTarget}
        onOpenChange={(open) => { if (!open) setDeleteBookmarkTarget(null); }}
      >
        <ConfirmDialogContent
          title="¿Eliminar verso guardado?"
          description="Esta acción no se puede deshacer."
          onCancel={() => setDeleteBookmarkTarget(null)}
          onConfirm={() => {
            if (deleteBookmarkTarget) handleDeleteBookmark(deleteBookmarkTarget);
            setDeleteBookmarkTarget(null);
          }}
        />
      </ConfirmDialog>

      <ConfirmDialog open={deleteNoteConfirmOpen} onOpenChange={setDeleteNoteConfirmOpen}>
        <ConfirmDialogContent
          title="¿Eliminar verso guardado?"
          description="Esta acción no se puede deshacer."
          onCancel={() => setDeleteNoteConfirmOpen(false)}
          onConfirm={() => {
            handleDeleteSavedNote();
            setDeleteNoteConfirmOpen(false);
          }}
        />
      </ConfirmDialog>
    </SafeAreaView>
  );
}

const loadBarStyles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

function createStyles(t: ReturnType<typeof useThemeColors>, isDark: boolean) {
  return StyleSheet.create({
  topArea: {
    flex: 1,
    backgroundColor: t.darkerBackgroundColor,
  },
  container: {
    flex: 1,
    backgroundColor: t.backgroundColor,
  },

  // Nav bar
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  // Content
  scroll: {
    flex: 1,
    backgroundColor: t.backgroundColor,
  },
  content: {
    paddingHorizontal: Spacing[24],
    paddingBottom: Spacing[56],
  },

  // Block styles — all Lora (BookFonts), color textPrimary
  bookHeading: {
    ...BookFonts.titleXlBold,
    color: t.fontColorPrimary,
  },
  partHeading: {
    ...BookFonts.titleMdSemibold,
    color: t.fontColorPrimary,
  },
  chapterNumber: {
    ...BookFonts.titleMdSemibold,
    color: t.fontColorPrimary,
  },
  chapterHeading: {
    ...BookFonts.titleLgBold,
    color: t.fontColorPrimary,
  },
  sectionHeading: {
    ...BookFonts.titleMdSemibold,
    color: t.fontColorPrimary,
  },
  lessonSetSubtitle: {
    ...BookFonts.titleLgBold,
    color: t.fontColorPrimary,
  },
  lessonTitle: {
    ...BookFonts.titleMdSemibold,
    color: t.fontColorPrimary,
  },
  lessonSubtitle: {
    ...BookFonts.titleLgBold,
    color: t.fontColorPrimary,
  },
  stanzaBlock: {
    marginHorizontal: Spacing[20],
  },
  bodyLarge: {
    ...BookFonts.bodyMdRegular,
    color: t.fontColorPrimary,
  },
  italic: {
    fontFamily: 'Lora_400Regular_Italic',
  },
  ntWord: {
    color: t.ntWordColor,
    textDecorationLine: 'underline',
    fontFamily: isDark ? 'Lora_700Bold' : undefined,
  },
  verseSelected: {
    textDecorationLine: 'underline',
    textDecorationColor: t.darkOutline,
  },
  verseSaved: {
    backgroundColor: t.savedHighlight,
  },

  // N.T. bottom sheet — also reused by the highlighted-verse (savedNoteSheet)
  // sheet, which now shares the same visuals (see ntSheetContainer below).
  sheetSlide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetOverlayBg: {
    backgroundColor: t.overlay,
  },

  // N.T. ("Nota de traducción") sheet — Figma Drawers "Text" variant. Its own
  // container/handle/title/body. Single-tone header only — the Text variant
  // has no separate body section, unlike Tools/Save below. Also reused as-is
  // by savedNoteSheet (the highlighted-verse sheet), which layers its own
  // ntSheetTitleRow/ntSheetTitleText on top for its title+UIMenu row.
  ntSheetContainer: {
    backgroundColor: isDark ? Colors.dark100 : Colors.brand100,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingLeft: Spacing[16],
    paddingRight: Spacing[16],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[12],
  },
  ntSheetHandleWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing[20],
  },
  ntSheetHandle: {
    width: Spacing[64],
    height: Spacing[6],
    borderRadius: Radius.sm,
    backgroundColor: isDark ? Colors.gold100 : Colors.brand400,
  },
  ntSheetTitle: {
    ...BookFonts.bodyMdSemibold,
    color: isDark ? Colors.brand100 : Colors.ink100,
    marginBottom: Spacing[12],
  },
  ntSheetBody: {
    ...BookFonts.bodySmRegularItalic,
    color: isDark ? Colors.brand300 : Colors.ink100,
  },
  // savedNoteSheet-only: title + UIMenu actions button row, laid out like
  // the old sheetTitleRow/sheetTitleText but reusing ntSheetTitle's own
  // typography/color (via a style array at the call site) instead of
  // sheetLabel's.
  ntSheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[8],
    marginBottom: Spacing[12],
  },
  ntSheetTitleText: {
    flex: 1,
    marginBottom: Spacing.none,
  },

  // Reader tools drawer + save-verses drawer — Figma Drawers "Tools"/"Save"
  // variants. Both modes share one header/body two-tone treatment: header
  // (drawerHeader) top-toned, body (drawerBody, holds recentBookmarksSection)
  // bottom-toned. The corner radius lives on drawerHeader itself (Figma:
  // radius only on the header frame, not a wrapping clip container) since
  // the body sits flush below it with square corners.
  // Outer column shared by both modes: header (intrinsic height) + body
  // (flex, fills the remainder of the Animated.View's drag-resizable
  // height).
  drawerOuter: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: isDark ? Colors.dark200 : Colors.brand200,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingLeft: Spacing[16],
    paddingRight: Spacing[16],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[12],
    // Gap from the pill handle down to the next element (button row in
    // toolbar mode, the drag zone's own bottom edge in save mode) — 20px.
    gap: Spacing[20],
    // Tokens.Shadows.drawer. Uses the cross-platform `boxShadow` style
    // (RN 0.74+/New Arch, on here per app.json's newArchEnabled) rather than
    // shadow*/elevation — Android's `elevation` can't express a custom
    // (upward) shadow direction at all.
    boxShadow: Shadows.drawer,
  },
  drawerBody: {
    flex: 1,
    backgroundColor: isDark ? Colors.dark100 : Colors.brand100,
  },
  drawerHandleWrap: {
    width: '100%',
    alignItems: 'center',
  },
  drawerHandle: {
    width: Spacing[64],
    height: Spacing[6],
    borderRadius: Radius.sm,
    backgroundColor: isDark ? Colors.gold100 : Colors.brand400,
  },
  toolsDrawerRow: {
    flexDirection: 'row',
    gap: Spacing[12],
  },
  toolsDrawerButton: {
    flex: 1,
    // No Spacing token matches ~150px exactly (128 then 96 below it) — user
    // chose to snap to the nearest existing token (128) rather than add a
    // one-off raw value, keeping flex:1 so the two buttons still share the
    // row width evenly but neither shrinks below this floor.
    minWidth: Spacing[128],
  },
  // Handle+title grouping only (layout, no longer a separate pan-handled
  // surface — drawerHeader itself now carries drawerPanResponder.panHandlers
  // for the whole header, handle through submit button). Same 20px gap as
  // drawerHeader's own `gap` so handle→title reads identically to
  // title→input-row.
  saveDrawerDragZone: {
    gap: Spacing[20],
  },
  saveDrawerTitle: {
    ...UIFonts.bodySSemibold,
    textAlign: 'center',
    color: isDark ? Colors.brand100 : Colors.ink100,
  },
  saveDrawerNoteInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[6],
  },
  saveDrawerNoteInputField: {
    flex: 1,
  },
  saveDrawerFullBleed: {
    flex: 1,
  },
  saveDrawerList: {
    flex: 1,
  },

  // Next-chapter button
  nextChapterContainer: {
    marginTop: Spacing[40],
  },

  });
}
