# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Design tokens — no raw values in app/

Every value in `app/` — colors, border width, border radius, gaps, padding, margins, spacing — must reference a token from `constants/Colors.ts` or `constants/Tokens.ts`. Never a raw literal (hex, rgba, or a bare number) for these properties.

**Exception: `components/`.** These are slated for redesign, so leave raw values there as-is until that work happens — do not link them to tokens yet.

When implementing a design pulled from Figma (or fixing/adding a value in `app/` for any other reason):
1. Check whether the raw value matches an existing token in `constants/Colors.ts` or `constants/Tokens.ts` exactly.
2. If it matches, use that token — don't leave it raw.
3. If it does **not** match any existing token, stop and ask the user before proceeding. Don't silently leave it raw, and don't silently invent a new token — the user decides whether to snap it to the nearest token, add a new token, or leave it as a deliberate one-off.

# NativeWind rem scale — pinned to 16, not the 14 default

`metro.config.js`'s `withNativeWind(config, {...})` call sets `inlineRem: 16`. Don't remove it. NativeWind's Metro plugin defaults `inlineRem` to `14`, not the web-standard `16` Tailwind's own scale assumes — left unset, every rem-based utility class (`px-5`, `gap-3`, `rounded-xl`, `text-base`, ...) silently renders at 14/16 = 87.5% of the pixel value a Figma spec or the class name itself implies, with no error or warning. This was root-caused 2026-08-05 via pixel-measurement archaeology (a ~4-5px Home screen icon/button misalignment) after being initially mistaken for a border-width quirk. If a future NativeWind-based screen looks subtly "off" versus its Figma spec despite matching class names, check this isn't the cause before adding one-off padding nudges.
