// Injects @font-face rules pointing at the exact same font files the app
// loads natively via expo-font's useFonts() in app/_layout.tsx — done here
// as plain @font-face + Vite asset imports instead, since expo-font's native
// loading path isn't meant to run outside an Expo app.
import Lora_400Regular from '@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf';
import Lora_400Regular_Italic from '@expo-google-fonts/lora/400Regular_Italic/Lora_400Regular_Italic.ttf';
import Lora_500Medium from '@expo-google-fonts/lora/500Medium/Lora_500Medium.ttf';
import Lora_600SemiBold from '@expo-google-fonts/lora/600SemiBold/Lora_600SemiBold.ttf';
import Lora_700Bold from '@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf';
import Lora_700Bold_Italic from '@expo-google-fonts/lora/700Bold_Italic/Lora_700Bold_Italic.ttf';
import NotoSans_500Medium from '@expo-google-fonts/noto-sans/500Medium/NotoSans_500Medium.ttf';
import NotoSans_700Bold from '@expo-google-fonts/noto-sans/700Bold/NotoSans_700Bold.ttf';

const FONTS: Record<string, string> = {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_700Bold_Italic,
  NotoSans_500Medium,
  NotoSans_700Bold,
};

export function injectFontFaces() {
  const style = document.createElement('style');
  style.textContent = Object.entries(FONTS)
    .map(([name, url]) => `@font-face { font-family: '${name}'; src: url('${url}') format('truetype'); }`)
    .join('\n');
  document.head.appendChild(style);
}
