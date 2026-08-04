// Stub for Storybook only — react-native-svg (and possibly other libs)
// statically reference this Fabric-only codegen helper from a handful of
// New Architecture-specific files that are never actually reached at
// runtime on web (they ship a separate plain-DOM-SVG rendering path for
// web). No such file exists in react-native-web, so this satisfies the
// static import without needing the real thing.
export default function codegenNativeComponent(_name: string, _options?: unknown): any {
  return 'div';
}
