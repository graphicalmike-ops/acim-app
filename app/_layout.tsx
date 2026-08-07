import '../global.css';
import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useFonts } from 'expo-font';
import { ThemeProvider, useTheme } from '@/utils/theme';
import { BookmarksProvider } from '@/utils/bookmarks';
import { requestAppReview } from '@/utils/storeReview';
import { PortalHost } from '@rn-primitives/portal';
import { enableFreeze } from 'react-native-screens';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_700Bold_Italic,
} from '@expo-google-fonts/lora';
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Off by default in react-native-screens — without this, every screen ever
// pushed onto the stack (Contents, each Reader visit, Search, Bookmarks...)
// stays fully mounted and active in the background instead of pausing, which
// compounds as the user navigates and shows up as lingering jank/dropped
// frames even back on Home.
enableFreeze(true);

function NavigationBarSync() {
  const { isDark } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    NavigationBar.setStyle(isDark ? 'dark' : 'light');
  }, [isDark, pathname]);

  return null;
}

export default function RootLayout() {
  // Splash screen only blocks on the fonts Home actually renders with —
  // the rest (mostly used deeper in the Reader) load in the background
  // below so a rarely-needed weight can't hold up first paint.
  const [fontsLoaded, fontError] = useFonts({
    Lora_500Medium,
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
  });

  useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_700Bold_Italic,
    NotoSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // TEMPORARY (testing): fires 10s after every app open, no gating.
  // Replace with a real trigger point (e.g. donation flow, post-lesson) later.
  useEffect(() => {
    const timer = setTimeout(() => {
      requestAppReview();
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <BookmarksProvider>
        <NavigationBarSync />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="home" options={{ animation: 'fade', animationTypeForReplace: 'push' }} />
          <Stack.Screen name="contents" options={{ animation: 'fade' }} />
          <Stack.Screen name="bookmarks" options={{ animation: 'fade' }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="reader" options={{ animation: 'fade' }} />
        </Stack>
        <StatusBar style="dark" backgroundColor={Colors.brand100} />
        {/*
          Required by @rn-primitives/portal (used by components/ui/alert-dialog.tsx,
          components/ui/dropdown-menu.tsx, and components/ConfirmDialog.tsx): without a
          mounted PortalHost, anything rendered through <Portal> silently never appears.
          None of those were wired to a screen yet, so this had no visible effect until
          now — added so ConfirmDialog (and any future consumer) actually renders.
        */}
        <PortalHost />
      </BookmarksProvider>
    </ThemeProvider>
  );
}
