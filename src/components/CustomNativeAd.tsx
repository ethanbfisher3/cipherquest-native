import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView, TestIds } from "react-native-google-mobile-ads";

// 1. Define your real IDs
const ANDROID_AD_UNIT_ID = "ca-app-pub-9592701510571371/7208407410";
const IOS_AD_UNIT_ID = "ca-app-pub-9592701510571371/YOUR_IOS_ID_HERE";

// 2. Conditionally select the correct real ID based on the OS
const PRODUCTION_ID = Platform.select({
  android: ANDROID_AD_UNIT_ID,
  ios: IOS_AD_UNIT_ID,
});

// 3. Fallback to Test Ads during development
const AD_UNIT_ID = __DEV__ ? TestIds.NATIVE : PRODUCTION_ID;

type CustomNativeAdProps = {
  onLoaded?: () => void;
  onError?: () => void;
};

export default function CustomNativeAd({ onLoaded, onError }: CustomNativeAdProps) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!AD_UNIT_ID) {
      console.error("[CustomNativeAd] Missing ad unit id. Check your AdMob config and platform-specific IDs.");
      onError?.();
      return () => {
        isMounted = false;
      };
    }

    NativeAd.createForAdRequest(AD_UNIT_ID)
      .then((ad) => {
        if (isMounted) {
          setNativeAd(ad);
          onLoaded?.();
        } else {
          ad.destroy();
        }
      })
      .catch((error) => {
        onError?.();
      });

    return () => {
      isMounted = false;
      setNativeAd((current) => {
        current?.destroy();
        return null;
      });
    };
  }, []);

  if (!nativeAd) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ad...</Text>
      </View>
    );
  }

  return (
    // NativeAdView acts as the root boundary for interaction tracking
    <NativeAdView nativeAd={nativeAd} style={styles.adContainer}>
      <View style={styles.headerRow}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <NativeAsset assetType={NativeAssetType.HEADLINE}>
          <Text style={styles.headline} numberOfLines={1}>
            {nativeAd.headline}
          </Text>
        </NativeAsset>
      </View>

      <NativeAsset assetType={NativeAssetType.BODY}>
        <Text style={styles.bodyText} numberOfLines={2}>
          {nativeAd.body}
        </Text>
      </NativeAsset>

      {/* NativeMediaView automatically handles rendering images OR video assets */}
      <NativeMediaView style={styles.mediaContainer} />

      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
        </View>
      </NativeAsset>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce6ef",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    color: "#4b5b6b",
    fontSize: 14,
    fontWeight: "600",
  },
  adContainer: {
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  adBadge: { backgroundColor: "#FFD700", paddingHorizontal: 4, borderRadius: 3, marginRight: 8 },
  adBadgeText: { fontSize: 12, fontWeight: "bold", color: "#000" },
  headline: { fontSize: 16, fontWeight: "bold", flex: 1 },
  bodyText: { fontSize: 14, color: "#555", marginBottom: 10 },
  mediaContainer: { width: "100%", height: 200, backgroundColor: "#f0f0f0", borderRadius: 8 },
  ctaButton: { marginTop: 12, backgroundColor: "#0055FF", padding: 12, borderRadius: 6, alignItems: "center" },
  ctaText: { color: "#ffffff", fontWeight: "bold", fontSize: 16 },
});
