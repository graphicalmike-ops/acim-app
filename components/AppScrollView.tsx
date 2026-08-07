import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  PanResponderInstance,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { BorderWidth } from '@/constants/Tokens';
import { useTheme } from '@/utils/theme';

// Thumb styling pulled from Figma node 674:2866 (file w4OSlFQqdU4zdzNKvoj8tD),
// component set "Scroll Bar" — Element=Fill variant (Light/Dark). Same fill
// colors, thickness, and (square, non-rounded) corners as the load bar's
// filled element (Figma node 674:2847, see components/ui/loading-bar.tsx).
// This scrollbar only ever renders the Fill variant, as a thumb — there's no
// persistent Track element rendered underneath it (thumb-only by design, see
// component doc comment below).
const THUMB_THICKNESS = BorderWidth.lg;
// Touch target is wider than the visible thumb so it's easy to grab.
const THUMB_HIT_WIDTH = 16;
const MIN_THUMB_LENGTH = 32;
const HIDE_DELAY_MS = 2000;
const FADE_OUT_MS = 300;

type Props = ScrollViewProps;

/**
 * Shared thumb-tracking logic behind AppScrollView's and AppSectionList's
 * custom scrollbar: same color/thickness/corners as the load bar's filled
 * element (see THUMB_THICKNESS comment above), always present (and always
 * draggable) when content overflows, but only visible while
 * scrolling/dragging — it fades out after 2s of inactivity.
 *
 * Host component supplies `scrollTo(y, animated)` — a thin wrapper around
 * whatever imperative scroll API its underlying list exposes (ScrollView's
 * own `scrollTo`, or SectionList's `getScrollResponder()?.scrollTo`) — plus
 * wires `onScroll`/`onLayout`/`onContentSizeChange` through the returned
 * handlers so this hook can track container/content size and drive the
 * thumb's position independent of which list primitive is underneath.
 */
export function useScrollbarThumb(scrollTo: (y: number, animated: boolean) => void) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollYRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartScrollY = useRef(0);

  const thumbOpacity = useRef(new Animated.Value(0)).current;
  const thumbTranslateY = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxScroll = Math.max(0, contentHeight - containerHeight);
  const canScroll = maxScroll > 1;
  const thumbLength = canScroll
    ? Math.max(MIN_THUMB_LENGTH, (containerHeight * containerHeight) / contentHeight)
    : 0;
  const maxThumbTravel = Math.max(0, containerHeight - thumbLength);

  const updateThumbPosition = useCallback((y: number) => {
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;
    thumbTranslateY.setValue(ratio * maxThumbTravel);
  }, [maxScroll, maxThumbTravel, thumbTranslateY]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (draggingRef.current) return;
      Animated.timing(thumbOpacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }).start();
    }, HIDE_DELAY_MS);
  }, [thumbOpacity]);

  const showThumb = useCallback(() => {
    thumbOpacity.stopAnimation();
    thumbOpacity.setValue(1);
    scheduleHide();
  }, [thumbOpacity, scheduleHide]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    scrollYRef.current = y;
    updateThumbPosition(y);
    showThumb();
  }, [updateThumbPosition, showThumb]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    setContentHeight(h);
  }, []);

  // Recreated whenever the values its callbacks close over change — a
  // PanResponder built once via useRef() would freeze onStartShouldSet /
  // onPanResponderMove on the very first render's canScroll/maxScroll/
  // maxThumbTravel (all 0/false before layout), so it would never activate.
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => canScroll,
    onMoveShouldSetPanResponder: (_, gesture) => canScroll && Math.abs(gesture.dy) > 2,
    onPanResponderGrant: () => {
      draggingRef.current = true;
      dragStartScrollY.current = scrollYRef.current;
      showThumb();
    },
    onPanResponderMove: (_, gesture) => {
      if (maxThumbTravel <= 0) return;
      const deltaContent = (gesture.dy / maxThumbTravel) * maxScroll;
      const nextY = Math.min(maxScroll, Math.max(0, dragStartScrollY.current + deltaContent));
      scrollTo(nextY, false);
      scrollYRef.current = nextY;
      updateThumbPosition(nextY);
      showThumb();
    },
    onPanResponderRelease: () => {
      draggingRef.current = false;
      scheduleHide();
    },
    onPanResponderTerminate: () => {
      draggingRef.current = false;
      scheduleHide();
    },
  }), [canScroll, maxScroll, maxThumbTravel, showThumb, scheduleHide, updateThumbPosition, scrollTo]);

  return {
    containerHeight,
    canScroll,
    thumbLength,
    thumbOpacity,
    thumbTranslateY,
    panHandlers: panResponder.panHandlers,
    handleScroll,
    handleLayout,
    handleContentSizeChange,
  };
}

type ScrollbarThumbVisualProps = {
  canScroll: boolean;
  containerHeight: number;
  thumbLength: number;
  thumbOpacity: Animated.Value;
  thumbTranslateY: Animated.Value;
  panHandlers: PanResponderInstance['panHandlers'];
};

/** Presentational thumb-hit-area + animated thumb, shared by AppScrollView and AppSectionList. */
export function ScrollbarThumb({ canScroll, containerHeight, thumbLength, thumbOpacity, thumbTranslateY, panHandlers }: ScrollbarThumbVisualProps) {
  const { isDark } = useTheme();
  if (!canScroll) return null;
  return (
    <View {...panHandlers} style={[styles.thumbHitArea, { height: containerHeight }]}>
      <Animated.View
        style={[
          styles.thumb,
          {
            height: thumbLength,
            backgroundColor: isDark ? Colors.gold100 : Colors.ink100,
            opacity: thumbOpacity,
            transform: [{ translateY: thumbTranslateY }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Drop-in ScrollView replacement with a custom, thumb-only vertical
 * scrollbar: same color/thickness/corners as the load bar's filled element
 * (see THUMB_THICKNESS comment above), always present (and always
 * draggable) when content overflows, but only visible while
 * scrolling/dragging — it fades out after 2s of inactivity.
 */
export const AppScrollView = forwardRef<ScrollView, Props>(function AppScrollView(
  { style, onScroll, onLayout, onContentSizeChange, children, ...rest },
  ref
) {
  const scrollRef = useRef<ScrollView>(null);
  const setRefs = useCallback((node: ScrollView | null) => {
    scrollRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<ScrollView | null>).current = node;
  }, [ref]);

  const scrollTo = useCallback((y: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ y, animated });
  }, []);

  const thumb = useScrollbarThumb(scrollTo);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    thumb.handleScroll(e);
    onScroll?.(e);
  }, [thumb.handleScroll, onScroll]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    thumb.handleLayout(e);
    onLayout?.(e);
  }, [thumb.handleLayout, onLayout]);

  const handleContentSizeChange = useCallback((w: number, h: number) => {
    thumb.handleContentSizeChange(w, h);
    onContentSizeChange?.(w, h);
  }, [thumb.handleContentSizeChange, onContentSizeChange]);

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        {...rest}
        ref={setRefs}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
      <ScrollbarThumb
        canScroll={thumb.canScroll}
        containerHeight={thumb.containerHeight}
        thumbLength={thumb.thumbLength}
        thumbOpacity={thumb.thumbOpacity}
        thumbTranslateY={thumb.thumbTranslateY}
        panHandlers={thumb.panHandlers}
      />
    </View>
  );
});

export const scrollbarStyles = {
  wrapper: { flex: 1 } as const,
  scroll: { flex: 1 } as const,
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  thumbHitArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: THUMB_HIT_WIDTH,
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_THICKNESS,
    borderRadius: 0,
  },
});
