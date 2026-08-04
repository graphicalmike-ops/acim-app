// Stub for Storybook only — @react-native-menu/menu is iOS/Android-only
// (wraps native context menus via requireNativeComponent, no web build),
// which crashes Vite's dependency pre-bundler the same way reanimated's
// Fabric internals did. SavedItemRow only needs MenuView to render its
// children; the native long-press/tap menu itself isn't relevant to
// previewing the row's visual design.
import React from 'react';
import { View } from 'react-native';

export function MenuView({ children }: { children?: React.ReactNode; [key: string]: any }) {
  return <View>{children}</View>;
}
