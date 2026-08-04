import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Web-based Storybook for this Expo/React Native project — runs entirely in
// the browser via react-native-web + Vite, no native build/device required.
// See AGENTS.md for why (no Android SDK, Expo Go doesn't work here, EAS free
// tier builds take 4-5hrs — on-device Storybook would be far too slow to
// iterate on).
const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    config.resolve = config.resolve ?? {};
    // Array form (not object form) so exact-match and prefix-match rules can
    // coexist with explicit priority — object-form aliases in this Vite
    // version do plain prefix-substitution, which breaks when the exact bare
    // specifier ('react-native') needs a different target than its deep
    // subpaths ('react-native/Libraries/...' still needs to become
    // 'react-native-web/Libraries/...', not get a directory tacked onto a
    // concrete .ts file). More specific rules must come first.
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
      // Fabric-only internals a few libraries (react-native-svg,
      // react-native-safe-area-context, reanimated) statically reference
      // from New-Architecture-only files that are never actually reached at
      // runtime on web — no such files exist in react-native-web, so these
      // satisfy the static import without needing the real thing. See
      // .storybook/stubs/codegen-native-component.ts.
      { find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/, replacement: path.resolve(__dirname, './stubs/codegen-native-component.ts') },
      { find: /^react-native\/Libraries\/Renderer\/shims\/ReactFabric$/, replacement: path.resolve(__dirname, './stubs/codegen-native-component.ts') },
      // Exact bare import only — see .storybook/stubs/react-native-web-patched.ts
      { find: /^react-native$/, replacement: path.resolve(__dirname, './stubs/react-native-web-patched.ts') },
      // Everything else under react-native/* still becomes react-native-web/*
      { find: /^react-native\//, replacement: 'react-native-web/' },
      // See .storybook/stubs/reanimated.tsx — the real package (and its own
      // official mock.js) both pull in Fabric-only internals too.
      { find: /^react-native-reanimated$/, replacement: path.resolve(__dirname, './stubs/reanimated.tsx') },
      // See .storybook/stubs/nativewind.ts
      { find: /^nativewind$/, replacement: path.resolve(__dirname, './stubs/nativewind.ts') },
      // See .storybook/stubs/react-native-menu.tsx
      { find: /^@react-native-menu\/menu$/, replacement: path.resolve(__dirname, './stubs/react-native-menu.tsx') },
      { find: '@', replacement: path.resolve(__dirname, '..') },
    ];
    config.resolve.extensions = [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
      ...(config.resolve.extensions ?? ['.tsx', '.ts', '.jsx', '.js', '.json']),
    ];
    config.define = {
      ...(config.define ?? {}),
      global: 'globalThis',
      __DEV__: JSON.stringify(true),
    };
    config.assetsInclude = ['**/*.ttf'];
    return config;
  },
};

export default config;
