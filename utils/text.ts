const LOWERCASE_ES = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'e', 'u', 'a', 'en', 'es', 'con', 'por', 'para', 'ni', 'que', 'si', 'al',
]);

const HAS_ALPHA = /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/;

export function toTitleCase(str: string): string {
  let firstAlphaFound = false;
  return str.replace(/\S+/g, (word) => {
    const isAlpha = HAS_ALPHA.test(word);
    if (isAlpha && !firstAlphaFound) {
      firstAlphaFound = true;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    if (LOWERCASE_ES.has(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Formats a bookmark's ISO date for display, e.g. "28 jul 2026". Shared by
// app/bookmarks.tsx and app/reader.tsx's recent-saves list (both render rows
// via components/ui/saved-item.tsx, which expects a pre-formatted date).
export function formatSavedDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_ES[date.getMonth()];
  return `${day} ${month} ${date.getFullYear()}`;
}
