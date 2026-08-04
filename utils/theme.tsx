import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { Colors } from '@/constants/Colors';

const THEME_KEY = 'acim_theme';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Theme is fully manual and independent of the OS setting — defaults to
  // light until the user toggles it, then persists that choice for future
  // sessions (no re-deriving from the system scheme).
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value === 'dark') setIsDark(true);
    });
  }, []);

  // Drives NativeWind's `dark:` variants off the same manual, persisted
  // isDark source of truth — never NativeWind's own OS-linked default.
  useEffect(() => {
    colorScheme.set(isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

const LIGHT_COLORS = {
  backgroundColor: Colors.brand100,
  darkerBackgroundColor: Colors.brand100,
  fontColorPrimary: Colors.ink100,
  fontColorGray: Colors.ink200,
  darkOutline: Colors.brand400,
  primaryButtonBg: Colors.neutral100,
  overlay: Colors.overlay,
  ntWordColor: Colors.textHighlight,
  pressedIconColor: Colors.ink100,
  savedHighlight: Colors.savedHighlight,
};

const DARK_COLORS = {
  backgroundColor: Colors.dark100,
  darkerBackgroundColor: Colors.dark100,
  fontColorPrimary: Colors.neutral100,
  fontColorGray: Colors.brand100,
  darkOutline: Colors.brand400,
  primaryButtonBg: Colors.neutral100,
  overlay: Colors.overlay,
  ntWordColor: Colors.neutral100,
  pressedIconColor: Colors.gold100,
  savedHighlight: Colors.savedHighlightDark,
};

export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
