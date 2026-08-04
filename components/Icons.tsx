// App icon set — SVG paths extracted from Figma (component set: icons, node 97:249)
// All icons are vectorized originals from the Font Awesome library.

import { View } from 'react-native';
import Svg, { Path, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend, Circle, Line } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

// 8-pointed star with drop shadow — matches Figma filter exactly
// Shadow: black 60% opacity, y-offset 1, blur radius 2
export function StarIcon({ size = 65, color = Colors.brand100 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 69 69" fill="none">
      <Defs>
        {/* colorInterpolationFilters is a valid SVG filter prop that react-native-svg
            passes through at runtime, but this version's Filter types don't declare it. */}
        <Filter id="starShadow" x="0" y="0" width="69" height="69" filterUnits="userSpaceOnUse" {...({ colorInterpolationFilters: 'sRGB' } as any)}>
          <FeFlood floodOpacity={0} result="BackgroundImageFix" />
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <FeOffset dy={1} />
          <FeGaussianBlur stdDeviation={1} />
          <FeComposite in2="hardAlpha" operator="out" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0" />
          <FeBlend mode="normal" in2="BackgroundImageFix" result="shadow" />
          <FeBlend mode="normal" in="SourceGraphic" in2="shadow" result="shape" />
        </Filter>
      </Defs>
      <G filter="url(#starShadow)">
        <Path
          d="M34.5 1L39.2506 22.0311L57.481 10.519L45.9689 28.7494L67 33.5L45.9689 38.2506L57.481 56.481L39.2506 44.9689L34.5 66L29.7494 44.9689L11.519 56.481L23.0311 38.2506L2 33.5L23.0311 28.7494L11.519 10.519L29.7494 22.0311L34.5 1Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}

type IconProps = {
  size?: number;
  color?: string;
};

// Property 1=Theory — 16×16
export function TheoryIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M14 12V0.5C14 0.25 13.75 0 13.5 0H2.5C1.09375 0 0 1.125 0 2.5V13.5C0 14.9062 1.09375 16 2.5 16H13.5C13.75 16 14 15.7812 14 15.5V15C14 14.7812 13.8125 14.5625 13.5938 14.5312C13.4375 14.125 13.4375 12.9062 13.5938 12.5C13.8125 12.4688 14 12.25 14 12ZM12.3125 14.5H2.5C1.9375 14.5 1.5 14.0625 1.5 13.5C1.5 12.9688 1.9375 12.5 2.5 12.5H12.3125C12.2188 13.0625 12.2188 13.9688 12.3125 14.5ZM12.5 11H2.5C2.125 11 1.78125 11.0938 1.5 11.2188V2.5C1.5 1.96875 1.9375 1.5 2.5 1.5H12.5V11ZM6.71875 8.90625C6.875 9.0625 7.09375 9.0625 7.25 8.90625L9.53125 6.6875C10.1875 6.03125 10.125 4.96875 9.40625 4.34375C8.65625 3.75 7.71875 4.03125 7.21875 4.5L7 4.75L6.75 4.5C6.28125 4.03125 5.3125 3.75 4.5625 4.34375C3.84375 4.96875 3.78125 6.03125 4.4375 6.6875L6.71875 8.90625Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Exercizes — 16×16
export function ExercizesIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M10.0078 4C8.88281 4 8.00781 3.125 8.00781 2C8.00781 0.90625 8.88281 0 10.0078 0C11.1016 0 12.0078 0.90625 12.0078 2C12.0078 3.125 11.1016 4 10.0078 4ZM9.28906 9L8.32031 7.71875L6.94531 10.7812L10.6641 14.2812C10.8828 14.4688 11.0078 14.75 11.0078 15C11.0078 15.875 10.1641 16 10.0078 16H2.88281C2.38281 16 2.00781 15.625 2.00781 15.125C2.00781 14.6562 2.38281 14.25 2.88281 14.25H7.16406L4.97656 12.75C3.78906 11.9375 3.35156 10.3438 4.00781 9.03125L5.47656 5.625C5.75781 4.96875 6.35156 4.59375 7.00781 4.53125C7.66406 4.46875 8.28906 4.75 8.66406 5.28125L10.1328 7.1875L12.5391 5.21875C12.9141 4.90625 13.4766 4.96875 13.7891 5.3125C14.1016 5.6875 14.0391 6.25 13.6953 6.5625L10.5703 9.125C10.3828 9.28125 10.1328 9.375 9.91406 9.34375C9.66406 9.3125 9.44531 9.1875 9.28906 9Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Supplemental — 16×16
export function SupplementalIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M15.9877 14.2065C16.0433 14.4875 15.9043 14.7373 15.6819 14.831L15.237 14.9559C15.0424 15.0183 14.8199 14.8934 14.7365 14.6749C14.3473 14.6749 12.8736 15.112 12.5678 15.3305C12.5678 15.5803 12.4565 15.7989 12.2341 15.8613L11.817 15.9862C11.5668 16.0487 11.3165 15.8926 11.2609 15.6428L8.45265 3.62188V14.9871C8.45265 15.5491 8.03558 15.9862 7.34046 15.9862H0.667314C0.389267 15.9862 0 15.5491 0 14.9871V0.999139C0 0.468347 0.389267 0 0.667314 0H7.34046C8.03558 0 8.45265 0.468347 8.45265 0.999139V1.15525L8.7585 1.06159C8.95313 0.999139 9.17557 1.12403 9.25899 1.34259C9.64825 1.34259 11.1219 0.90547 11.4278 0.686908C11.4278 0.437123 11.539 0.218562 11.7614 0.156116L12.1785 0.0312231C12.4287 -0.0312231 12.679 0.124892 12.7346 0.374677L15.9877 14.2065ZM3.55901 14.4875V12.9888H1.33463V14.4875H3.55901ZM3.55901 11.4901V4.49613H1.33463V11.4901H3.55901ZM3.55901 2.99742V1.49871H1.33463V2.99742H3.55901ZM7.11802 14.4875V12.9888H4.89364V14.4875H7.11802ZM7.11802 11.4901V4.49613H4.89364V11.4901H7.11802ZM7.11802 2.99742V1.49871H4.89364V2.99742H7.11802ZM12.2619 14.1128C12.7346 13.8631 13.958 13.5196 14.4307 13.4572L11.7336 1.90461C11.2609 2.15439 10.0375 2.49785 9.56484 2.56029L12.2619 14.1128Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Tip (Light) — 16×16 — the app's single "tip"/support icon (no
// "Solid" variant exists in Figma anymore; this replaced it everywhere).
export function TipLightIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M15.3302 9.53125C15.7753 9.91406 16.0257 10.4609 15.9979 11.0078C15.9979 11.582 15.7197 12.1016 15.2467 12.4297L12.4645 14.5078C12.0193 14.8359 11.4628 15 10.9064 15H0.445159C0.194757 15 0 14.8086 0 14.5625V14.125C0 13.9062 0.194757 13.6875 0.445159 13.6875H10.9064C11.1846 13.6875 11.435 13.6055 11.6576 13.4414L14.4677 11.3906C14.7459 11.1719 14.7737 10.7891 14.4677 10.543C14.2729 10.3789 13.9112 10.3789 13.6886 10.543L11.9915 11.8008C11.7689 11.9648 11.5185 12.0469 11.2403 12.0469H7.48424C7.28948 12.0469 7.12254 11.8828 7.12254 11.6914V11.6641C7.12254 11.4727 7.28948 11.3086 7.48424 11.3086H9.15358C9.98826 11.3086 9.96043 10.1875 9.18141 10.1875H5.17497C4.67417 10.1875 4.20119 10.3516 3.81167 10.6523L2.67095 11.5H0.445159C0.194757 11.5 0 11.3086 0 11.0625V10.625C0 10.4062 0.194757 10.1875 0.445159 10.1875H2.19797L3.00482 9.61328C3.61692 9.14844 4.39595 8.875 5.17497 8.875H9.18141C10.2665 8.875 11.1012 9.69531 11.1012 10.7344H11.2124L12.8818 9.50391C13.4104 9.09375 14.4677 8.82031 15.3302 9.53125ZM7.15037 4.96484C6.53827 4.77344 6.03747 4.28125 5.954 3.65234C5.84271 2.77734 6.48263 2.03906 7.34512 1.92969V1.4375C7.34512 1.21875 7.53988 1 7.79028 1H8.23544C8.45802 1 8.6806 1.21875 8.6806 1.4375V1.92969C8.98665 1.98437 9.2927 2.06641 9.5431 2.25781C9.73785 2.36719 9.73785 2.61328 9.59874 2.75L9.09794 3.24219C9.01447 3.32422 8.84754 3.35156 8.70842 3.29688C8.62496 3.24219 8.54149 3.21484 8.4302 3.21484H7.51206C7.40077 3.21484 7.28948 3.32422 7.28948 3.46094C7.28948 3.54297 7.34512 3.65234 7.45641 3.67969L8.84754 4.0625C9.45963 4.25391 9.96043 4.74609 10.0439 5.375C10.1552 6.25 9.51527 6.98828 8.6806 7.09766V7.5625C8.6806 7.80859 8.45802 8 8.23544 8H7.79028C7.53988 8 7.34512 7.80859 7.34512 7.5625V7.09766C7.01125 7.04297 6.70521 6.96094 6.45481 6.76953C6.28787 6.66016 6.26005 6.41406 6.39916 6.27734L6.89996 5.78516C6.98343 5.70312 7.15037 5.67578 7.28948 5.73047C7.37295 5.78516 7.48424 5.8125 7.5677 5.8125H8.48584C8.62496 5.8125 8.70842 5.70312 8.70842 5.56641C8.70842 5.45703 8.65278 5.375 8.54149 5.34766L7.15037 4.96484Z"
        fill={color}
      />
    </Svg>
  );
}

// Home — 20×16
export function HomeIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  const width = size * (20 / 16);
  return (
    <Svg width={width} height={size} viewBox="0 0 20 16" fill="none">
      <Path
        d="M19.7917 7.69575L11.2153 0.42953C10.9028 0.143177 10.4514 0 10 0C9.51389 0 9.0625 0.143177 8.75 0.42953L0.173611 7.69575C0.0694444 7.80313 0 7.94631 0 8.12528C0 8.26846 0.0347222 8.41163 0.104167 8.48322L0.486111 8.94855C0.555556 9.05593 0.729167 9.12752 0.902778 9.12752C1.04167 9.12752 1.14583 9.09172 1.25 9.02013L2.22222 8.19687V14.8546C2.22222 15.4989 2.70833 16 3.33333 16H7.77778C8.36806 16 8.85417 15.4989 8.88889 14.8546V11.132H11.1111V14.8546C11.1111 15.4989 11.5972 16 12.2222 16H16.6667C17.2569 16 17.7431 15.4989 17.7778 14.8904V8.19687L18.7153 9.02013C18.8194 9.09172 18.9236 9.16331 19.0625 9.16331C19.2361 9.16331 19.4097 9.05593 19.5139 8.94855L19.8611 8.48322C19.9306 8.41163 20 8.26846 20 8.12528C20 7.94631 19.8958 7.80313 19.7917 7.69575ZM16.0764 14.2819H12.7778V10.5593C12.7431 9.95078 12.2569 9.44966 11.6667 9.41387H8.33333C7.70833 9.44966 7.22222 9.95078 7.22222 10.5593V14.2819H3.88889V6.80089L10 1.61074L16.1111 6.80089L16.0764 14.2819Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Collapse — 12×12 (chevron down). New in Figma, not yet wired
// into any screen.
export function CollapseIcon({ size = 12, color = Colors.ink200 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M6.31825 2.6378C6.13104 2.45407 5.86895 2.45407 5.68175 2.6378L0.140406 8.00262C-0.0468019 8.18635 -0.0468019 8.48031 0.140406 8.6273L0.889235 9.3622C1.039 9.54593 1.33853 9.54593 1.52574 9.3622L5.98128 5.02625L10.4743 9.3622C10.6615 9.54593 10.9236 9.54593 11.1108 9.3622L11.8596 8.6273C12.0468 8.48032 12.0468 8.18635 11.8596 8.00262L6.31825 2.6378Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Expand — 12×12 (chevron up). New in Figma, not yet wired into
// any screen.
export function ExpandIcon({ size = 12, color = Colors.ink200 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M5.68175 9.3622C5.86896 9.54593 6.13105 9.54593 6.31825 9.3622L11.8596 3.99738C12.0468 3.81365 12.0468 3.51969 11.8596 3.3727L11.1108 2.6378C10.961 2.45407 10.6615 2.45407 10.4743 2.6378L6.01872 6.97375L1.52574 2.6378C1.33853 2.45407 1.07644 2.45407 0.889237 2.6378L0.140407 3.3727C-0.0468011 3.51969 -0.0468011 3.81365 0.140407 3.99738L5.68175 9.3622Z"
        fill={color}
      />
    </Svg>
  );
}

// Plus — Figma's own "Plus" component is a flat 16×16 glyph with no
// tap-target concept, but this button's tap target is baked in as a
// separate `size` (container) from `glyphSize` (drawn glyph) — kept as-is
// per product decision. viewBox is the new 16-unit Figma coordinate space;
// glyphSize still defaults to 10 (unchanged) so the rendered footprint
// matches what shipped before — SVG's viewBox scaling handles the rest.
export function PlusIcon({ size = 24, glyphSize, color = Colors.ink200 }: { size?: number; glyphSize?: number; color?: string }) {
  const resolvedGlyphSize = glyphSize ?? size * (10 / 24);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={resolvedGlyphSize} height={resolvedGlyphSize} viewBox="0 0 16 16" fill="none">
        <Path
          d="M15.3333 6.66667H9.33333V0.666667C9.33333 0.333333 9 0 8.66667 0H7.33333C6.95833 0 6.66667 0.333333 6.66667 0.666667V6.66667H0.666667C0.291667 6.66667 0 7 0 7.33333V8.66667C0 9.04167 0.291667 9.33333 0.666667 9.33333H6.66667V15.3333C6.66667 15.7083 6.95833 16 7.33333 16H8.66667C9 16 9.33333 15.7083 9.33333 15.3333V9.33333H15.3333C15.6667 9.33333 16 9.04167 16 8.66667V7.33333C16 7 15.6667 6.66667 15.3333 6.66667Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

// Minus — pairs with Plus in the contents.tsx accordion toggle, so it
// mirrors Plus's size/glyphSize API and default footprint (10px glyph in a
// 24px tap target) even though Figma's own "Minus" component is natively
// 12×12 — a plain bar rendered inside a square viewBox, not the old bare
// 10×2 rect, so it needs a real (square) viewBox to display correctly.
export function MinusIcon({ size = 24, glyphSize, color = Colors.ink200 }: { size?: number; glyphSize?: number; color?: string }) {
  const resolvedGlyphSize = glyphSize ?? size * (10 / 24);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={resolvedGlyphSize} height={resolvedGlyphSize} viewBox="0 0 12 12" fill="none">
        <Path
          d="M11.5 5H0.5C0.21875 5 0 5.25 0 5.5V6.5C0 6.78125 0.21875 7 0.5 7H11.5C11.75 7 12 6.78125 12 6.5V5.5C12 5.25 11.75 5 11.5 5Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

// Teacher — 16×16 (book-reader)
export function TeacherIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M14.34375 6.03125C14.34375 6.03125 14.3125 6.03125 14.28125 6.03125C12.75 6.09375 9.90625 6.4375 8 7.5C6.0625 6.4375 3.21875 6.09375 1.6875 6.03125C1.65625 6.03125 1.625 6.03125 1.625 6.03125C0.96875 6.03125 0 6.46875 0 7.59375V13.15625C0 13.96875 0.65625 14.65625 1.5 14.71875C2.5625 14.78125 5.25 15 7.03125 15.875C7.1875 15.96875 7.375 16 7.5625 16H8.40625C8.59375 16 8.78125 15.96875 8.9375 15.875C10.71875 15 13.40625 14.78125 14.46875 14.71875C15.3125 14.65625 16 13.96875 16 13.15625V7.59375C16 6.46875 15 6.03125 14.34375 6.03125ZM7.25 14.34375C5.34375 13.53125 2.90625 13.28125 1.5625 13.21875C1.53125 13.21875 1.5 13.1875 1.5 13.15625L1.46875 7.5625C1.5 7.5625 1.5625 7.53125 1.59375 7.5C2.71875 7.59375 5.5 7.84375 7.25 8.8125V14.34375ZM14.5 13.15625C14.5 13.1875 14.4375 13.21875 14.40625 13.21875C13.0625 13.28125 10.625 13.53125 8.75 14.34375V8.8125C10.46875 7.84375 13.25 7.59375 14.34375 7.53125C14.40625 7.53125 14.46875 7.5625 14.5 7.59375V13.15625ZM8 6C9.65625 6 11 4.6875 11 3C11 1.34375 9.65625 0 8 0C6.3125 0 5 1.34375 5 3C5 4.65625 6.3125 6 8 6ZM8 1.5C8.8125 1.5 9.5 2.1875 9.5 3C9.5 3.84375 8.8125 4.5 8 4.5C7.15625 4.5 6.5 3.84375 6.5 3C6.5 2.1875 7.15625 1.5 8 1.5Z"
        fill={color}
      />
    </Svg>
  );
}

// Light mode (sun) — 16×16, stroke-based
export function LightModeIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="2.25" stroke={color} strokeWidth="1.5" />
      <Line x1="8" y1="4" x2="8" y2="0" stroke={color} strokeWidth="1.5" />
      <Line x1="8" y1="16" x2="8" y2="12" stroke={color} strokeWidth="1.5" />
      <Line x1="4" y1="8" x2="0" y2="8" stroke={color} strokeWidth="1.5" />
      <Line x1="16" y1="8" x2="12" y2="8" stroke={color} strokeWidth="1.5" />
      <Line x1="5.172" y1="5.172" x2="2.343" y2="2.344" stroke={color} strokeWidth="1.5" />
      <Line x1="13.657" y1="13.657" x2="10.829" y2="10.829" stroke={color} strokeWidth="1.5" />
      <Line x1="5.172" y1="10.828" x2="2.344" y2="13.657" stroke={color} strokeWidth="1.5" />
      <Line x1="13.657" y1="2.343" x2="10.829" y2="5.171" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

// Dark mode (moon) — 16×16 (now a native square asset — was a 24×24 crop
// with a manual translate offset before this sync)
export function DarkModeIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.47949 16C10.917 16 13.1982 14.9062 14.667 13.0625C15.5732 11.9688 14.6045 10.375 13.2295 10.625C10.667 11.125 8.29199 9.15625 8.29199 6.5625C8.29199 5.03125 9.10449 3.65625 10.3857 2.9375C11.6045 2.25 11.292 0.40625 9.91699 0.15625C9.44824 0.0625 8.97949 0.03125 8.47949 0C4.04199 0 0.479492 3.59375 0.479492 8C0.479492 12.4375 4.04199 16 8.47949 16ZM8.47949 1.5C8.88574 1.5 9.26074 1.5625 9.66699 1.625C7.94824 2.59375 6.79199 4.4375 6.79199 6.5625C6.79199 10.0938 10.042 12.7812 13.5107 12.0938C12.3232 13.5625 10.5107 14.5 8.47949 14.5C4.88574 14.5 1.97949 11.5938 1.97949 8C1.97949 4.4375 4.88574 1.5 8.47949 1.5Z"
        fill={color}
      />
    </Svg>
  );
}

// Search — 16×16 (native asset — was a 24-unit crop before this sync)
export function SearchIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M15.8828 14.6348L12.0997 10.8591C12.0059 10.7967 11.9121 10.7343 11.8183 10.7343H11.4118C12.381 9.61092 13.0064 8.11312 13.0064 6.49049C13.0064 2.9332 10.0674 0 6.50318 0C2.90767 0 0 2.9332 0 6.49049C0 10.079 2.90767 12.981 6.50318 12.981C8.12897 12.981 9.59844 12.3881 10.7553 11.4208V11.8264C10.7553 11.92 10.7865 12.0137 10.849 12.1073L14.6321 15.883C14.7885 16.039 15.0386 16.039 15.1637 15.883L15.8828 15.1653C16.0391 15.0405 16.0391 14.7908 15.8828 14.6348ZM6.50318 11.4832C3.72057 11.4832 1.50073 9.26767 1.50073 6.49049C1.50073 3.74451 3.72057 1.49781 6.50318 1.49781C9.25452 1.49781 11.5056 3.74451 11.5056 6.49049C11.5056 9.26767 9.25452 11.4832 6.50318 11.4832Z"
        fill={color}
      />
    </Svg>
  );
}

// Bookmark — 16×16 native square asset (was a non-square 18×24 crop before
// this sync; the ribbon glyph inside keeps the same proportions, so this
// isn't a visible size change at any existing call site).
export function BookmarkIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12.5 0H3.5C2.65625 0 2 0.6875 2 1.5V16L8 12.5L14 16V1.5C14 0.6875 13.3125 0 12.5 0ZM12.5 13.4062L8 10.7812L3.5 13.4062V1.6875C3.5 1.59375 3.5625 1.5 3.6875 1.5H12.3125C12.4062 1.5 12.5 1.59375 12.5 1.6875V13.4062Z"
        fill={color}
      />
    </Svg>
  );
}

// Share — 16×16 (native asset — was a 24-unit crop before this sync)
export function ShareIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M11.667 10C10.8545 10 10.1357 10.3125 9.57324 10.8438L6.51074 8.90625C6.69824 8.34375 6.69824 7.6875 6.51074 7.125L9.57324 5.1875C10.1357 5.6875 10.8545 6 11.667 6C13.3232 6 14.667 4.65625 14.667 3C14.667 1.34375 13.3232 0 11.667 0C10.0107 0 8.66699 1.34375 8.66699 3C8.66699 3.3125 8.69824 3.625 8.79199 3.90625L5.72949 5.84375C5.16699 5.3125 4.44824 5 3.66699 5C2.01074 5 0.666992 6.34375 0.666992 8C0.666992 9.65625 2.01074 11 3.66699 11C4.44824 11 5.16699 10.6875 5.72949 10.1875L8.79199 12.125C8.69824 12.4062 8.66699 12.7188 8.66699 13C8.66699 14.6562 10.0107 16 11.667 16C13.3232 16 14.667 14.6562 14.667 13C14.667 11.3438 13.3232 10 11.667 10ZM11.667 1.5C12.4795 1.5 13.167 2.1875 13.167 3C13.167 3.84375 12.4795 4.5 11.667 4.5C10.8232 4.5 10.167 3.84375 10.167 3C10.167 2.1875 10.8232 1.5 11.667 1.5ZM3.66699 9.5C2.82324 9.5 2.16699 8.84375 2.16699 8C2.16699 7.1875 2.82324 6.5 3.66699 6.5C4.47949 6.5 5.16699 7.1875 5.16699 8C5.16699 8.84375 4.47949 9.5 3.66699 9.5ZM11.667 14.5C10.8232 14.5 10.167 13.8438 10.167 13C10.167 12.1875 10.8232 11.5 11.667 11.5C12.4795 11.5 13.167 12.1875 13.167 13C13.167 13.8438 12.4795 14.5 11.667 14.5Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Actions (vertical ellipsis) — 16×16
export function ActionsIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.26473 6.08C7.18473 6.08 6.34473 6.96 6.34473 8C6.34473 9.08 7.18473 9.92 8.26473 9.92C9.30473 9.92 10.1847 9.08 10.1847 8C10.1847 6.96 9.30473 6.08 8.26473 6.08ZM6.34473 1.92C6.34473 3 7.18473 3.84 8.26473 3.84C9.30473 3.84 10.1847 3 10.1847 1.92C10.1847 0.88 9.30473 0 8.26473 0C7.18473 0 6.34473 0.88 6.34473 1.92ZM6.34473 14.08C6.34473 15.16 7.18473 16 8.26473 16C9.30473 16 10.1847 15.16 10.1847 14.08C10.1847 13.04 9.30473 12.16 8.26473 12.16C7.18473 12.16 6.34473 13.04 6.34473 14.08Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Close (times) — 12×12 (native asset — was an 18-unit crop
// before this sync; the one live call site already passes size={12}).
export function CloseIcon({ size = 12, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M7.78125 5.98125L11.8313 1.96875C12.0563 1.74375 12.0563 1.33125 11.8313 1.10625L10.8938 0.16875C10.6688 -0.05625 10.2563 -0.05625 10.0312 0.16875L6.01875 4.21875L1.96875 0.16875C1.74375 -0.05625 1.33125 -0.05625 1.10625 0.16875L0.16875 1.10625C-0.05625 1.33125 -0.05625 1.74375 0.16875 1.96875L4.21875 5.98125L0.16875 10.0312C-0.05625 10.2563 -0.05625 10.6688 0.16875 10.8938L1.10625 11.8313C1.33125 12.0563 1.74375 12.0563 1.96875 11.8313L6.01875 7.78125L10.0312 11.8313C10.2563 12.0563 10.6688 12.0563 10.8938 11.8313L11.8313 10.8938C12.0563 10.6688 12.0563 10.2563 11.8313 10.0312L7.78125 5.98125Z"
        fill={color}
      />
    </Svg>
  );
}

// Property 1=Back — 16×16
export function BackIcon({ size = 16, color = Colors.ink100 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.19164 15.8644C8.04903 16.0452 7.76379 16.0452 7.58552 15.8644L0.133705 8.30734C-0.0445682 8.12655 -0.0445682 7.87345 0.133705 7.69266L7.58552 0.135593C7.76379 -0.0451977 8.04903 -0.0451977 8.19164 0.135593L8.90474 0.822599C9.08301 1.00339 9.08301 1.29266 8.90474 1.43729L3.37827 7.04181H15.5721C15.7861 7.04181 16 7.25876 16 7.47571V8.48814C16 8.74124 15.7861 8.92203 15.5721 8.92203H3.37827L8.90474 14.5627C9.08301 14.7073 9.08301 14.9966 8.90474 15.1774L8.19164 15.8644Z"
        fill={color}
      />
    </Svg>
  );
}
