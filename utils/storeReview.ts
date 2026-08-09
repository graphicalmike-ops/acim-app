import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REQUESTED_KEY = 'acim_review_requested';

// In-memory fast path so two triggers firing in the same session (e.g. the
// 15-minute timer and the chapter-reached watcher landing within the same
// tick) short-circuit before either touches AsyncStorage — the async
// read/write below still closes the (much less likely) cross-session race,
// this just avoids a redundant requestReview() call within one session.
let requestedThisSession = false;

// Callers don't need to know whether the review prompt has already fired —
// every trigger site just calls this, and it's a no-op after the first
// successful request, ever (persisted, not just per-session).
export async function requestAppReview() {
  if (requestedThisSession) return;
  const alreadyRequested = await AsyncStorage.getItem(REQUESTED_KEY);
  if (alreadyRequested) return;
  requestedThisSession = true;

  const available = await StoreReview.isAvailableAsync();
  if (!available) return;

  await AsyncStorage.setItem(REQUESTED_KEY, 'true');
  await StoreReview.requestReview();
}
