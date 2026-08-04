# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Design tokens — no raw values in app/

Every value in `app/` — colors, border width, border radius, gaps, padding, margins, spacing — must reference a token from `constants/Colors.ts` or `constants/Tokens.ts`. Never a raw literal (hex, rgba, or a bare number) for these properties.

**Exception: `components/`.** These are slated for redesign, so leave raw values there as-is until that work happens — do not link them to tokens yet.

When implementing a design pulled from Figma (or fixing/adding a value in `app/` for any other reason):
1. Check whether the raw value matches an existing token in `constants/Colors.ts` or `constants/Tokens.ts` exactly.
2. If it matches, use that token — don't leave it raw.
3. If it does **not** match any existing token, stop and ask the user before proceeding. Don't silently leave it raw, and don't silently invent a new token — the user decides whether to snap it to the nearest token, add a new token, or leave it as a deliberate one-off.
