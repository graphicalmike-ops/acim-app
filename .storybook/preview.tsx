import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { ThemeProvider, useTheme } from '@/utils/theme';
import { BookmarksProvider } from '@/utils/bookmarks';
import { Colors } from '@/constants/Colors';
import { injectFontFaces } from './fonts.css';

injectFontFaces();

function ThemeFrame({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <View style={{ backgroundColor: isDark ? Colors.dark100 : Colors.brand100, minHeight: '100vh' as any }}>
      <Pressable
        onPress={toggleTheme}
        style={{
          alignSelf: 'flex-start',
          margin: 16,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: isDark ? Colors.brand400 : Colors.ink200,
        }}
      >
        <Text style={{ color: isDark ? Colors.neutral100 : Colors.ink100, fontSize: 12 }}>
          {isDark ? '☀️ Switch to light' : '🌙 Switch to dark'}
        </Text>
      </Pressable>
      <View style={{ padding: 24 }}>{children}</View>
    </View>
  );
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <BookmarksProvider>
          <ThemeFrame>
            <Story />
          </ThemeFrame>
        </BookmarksProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
