import React, { forwardRef, useCallback, useRef } from 'react';
import {
  DefaultSectionT,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  SectionListProps,
  View,
} from 'react-native';
import { ScrollbarThumb, scrollbarStyles, useScrollbarThumb } from '@/components/AppScrollView';

/**
 * Drop-in SectionList with the same custom thumb-only vertical scrollbar as
 * AppScrollView (see components/AppScrollView.tsx's useScrollbarThumb /
 * ScrollbarThumb for the shared implementation and Figma source). Built for
 * app/search.tsx's results list, which needs SectionList's virtualization +
 * built-in section headers (unlike the other AppScrollView-based screens,
 * which don't have long enough lists to need windowing) — see
 * [[project_search_feature]] / the search-performance fix this shipped with.
 *
 * SectionList doesn't expose a plain `scrollTo(y)` the way ScrollView does,
 * but its ref's `getScrollResponder()` returns the underlying scroll
 * responder, which does — that's what powers the thumb's drag-to-scroll.
 */
function AppSectionListInner<ItemT, SectionT = DefaultSectionT>(
  { style, onScroll, onLayout, onContentSizeChange, ...rest }: SectionListProps<ItemT, SectionT>,
  ref: React.Ref<SectionList<ItemT, SectionT>>
) {
  const listRef = useRef<SectionList<ItemT, SectionT>>(null);
  const setRefs = useCallback((node: SectionList<ItemT, SectionT> | null) => {
    listRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<SectionList<ItemT, SectionT> | null>).current = node;
  }, [ref]);

  const scrollTo = useCallback((y: number, animated: boolean) => {
    listRef.current?.getScrollResponder()?.scrollTo({ y, animated });
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
    <View style={[scrollbarStyles.wrapper, style]}>
      <SectionList
        {...rest}
        ref={setRefs}
        style={scrollbarStyles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
      />
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
}

export const AppSectionList = forwardRef(AppSectionListInner) as <ItemT, SectionT = DefaultSectionT>(
  props: SectionListProps<ItemT, SectionT> & { ref?: React.Ref<SectionList<ItemT, SectionT>> }
) => React.ReactElement;
