import * as StoreReview from 'expo-store-review';

export async function requestAppReview() {
  const available = await StoreReview.isAvailableAsync();
  if (!available) return;
  await StoreReview.requestReview();
}
