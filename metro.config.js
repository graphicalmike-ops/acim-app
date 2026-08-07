// Learn more https://docs.expo.dev/guides/monorepos/#metro-configuration
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ship the pre-built search index as a binary asset (see scripts/build-search-index.js).
config.resolver.assetExts.push('db');

// expo-sqlite's web build loads its SQLite engine as a .wasm asset — without
// registering the extension, Metro's web bundler can't resolve the import
// inside node_modules/expo-sqlite/web/worker.ts (native/Android is unaffected,
// this only matters for the web preview).
config.resolver.assetExts.push('wasm');

// `inlineRem` defaults to 14 inside withNativeWind itself (nativewind/dist/metro/index.js)
// — NOT the standard web/Tailwind 16px root font size — and that default takes hard
// precedence over any `:root { font-size }` in global.css (see the `inlineRem || rem`
// fallback in react-native-css-interop/dist/css-to-rn/index.js: a numeric inlineRem short-
// circuits the CSS-based value entirely, it isn't merely a fallback default). Left
// unset, every rem-based Tailwind utility in components/ (px-5, gap-3, rounded-xl,
// text-base, ...) silently renders at 14/16 = 87.5% of the pixel value its own code
// comments assume — e.g. components/ui/button.tsx's `mainHome` variant docs `px-5` as
// == 20px (Spacing[20]) and `text-base` as == 16px, both of which only hold at rem=16.
// Root-caused 2026-08-05 via pixel measurement: Home's "Libro de Texto" icon sat ~2.5dp
// left of where that padding math implied. Pinning inlineRem to 16 here fixes every
// current and future rem-based class app-wide instead of patching components one at a time.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
