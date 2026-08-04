// Stub for Storybook only — utils/theme.tsx imports `colorScheme` from
// nativewind purely to sync NativeWind's `dark:` variants with the app's own
// isDark state. Stories don't use NativeWind classNames, and nativewind's
// real entry point (react-native-css-interop) doesn't parse cleanly under
// Vite's dependency pre-bundler, so it's swapped for this no-op here.
export const colorScheme = {
  set: (_scheme: 'light' | 'dark' | 'system') => {},
  get: () => 'light' as const,
};
