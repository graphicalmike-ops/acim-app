// Storybook only — passthrough to react-native-web with the handful of
// Android/iOS-only named exports it doesn't provide, added as no-ops. App
// code guards their real usage behind Platform.OS checks that are always
// false on web, so these are never actually invoked here — this file exists
// purely to satisfy Rolldown's static named-export validation at build time.
export * from 'react-native-web';

export const ToastAndroid = {
  show: (_message: string, _duration: number) => {},
  showWithGravity: (_message: string, _duration: number, _gravity: number) => {},
  SHORT: 0,
  LONG: 1,
  TOP: 0,
  BOTTOM: 1,
  CENTER: 2,
};

// react-native-svg ships both a Paper (old arch) and Fabric (new arch)
// implementation per element; its barrel exports statically reach the
// Fabric variants even though only the Paper/web-DOM-SVG path is actually
// used on web. Every Fabric-only file fetches its native module through
// this registry — stubbing it here (rather than each individual file)
// covers the whole class of "native module not found" build errors at once.
export const TurboModuleRegistry = {
  get: (_name: string) => null,
  getEnforcing: (_name: string) => ({}),
};
