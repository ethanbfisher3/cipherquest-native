export async function showRewardedHintAd(): Promise<boolean> {
  // Expo Go fallback: rewarded ads require a custom dev client/native build.
  // Returning true keeps hint flow unblocked while ads are temporarily disabled.
  return true
}
