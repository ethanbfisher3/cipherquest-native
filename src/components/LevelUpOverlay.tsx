import React, { useEffect, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { getRankName } from "../constants";
import { appStyles as styles } from "./appStyles";

export function LevelUpOverlay({
  levelUp,
  onClose,
}: {
  levelUp: { oldLevel: number; newLevel: number } | null;
  onClose: () => void;
}) {
  const opacity = useState(new Animated.Value(0))[0];
  const scale = useState(new Animated.Value(0.85))[0];
  const translateY = useState(new Animated.Value(16))[0];

  useEffect(() => {
    if (!levelUp) {
      opacity.setValue(0);
      scale.setValue(0.85);
      translateY.setValue(16);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [levelUp, opacity, scale, translateY]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 8,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!levelUp) return null;

  return (
    <Pressable style={styles.levelUpBackdrop} onPress={closeWithAnimation}>
      <Animated.View
        style={[
          styles.levelUpCard,
          {
            opacity,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <Text style={styles.levelUpTitle}>Level Up</Text>
        <Text style={styles.levelUpSubtitle}>New Rank Unlocked</Text>

        <View style={styles.levelUpRow}>
          <View style={styles.levelUpStatBlock}>
            <Text style={styles.levelUpLabel}>Previous</Text>
            <Text style={styles.levelUpOldLevel}>{levelUp.oldLevel}</Text>
          </View>
          <Text style={styles.levelUpArrow}>→</Text>
          <View style={styles.levelUpStatBlock}>
            <Text style={styles.levelUpLabel}>Current</Text>
            <Text style={styles.levelUpNewLevel}>{levelUp.newLevel}</Text>
          </View>
        </View>

        <Text style={styles.levelUpRankText}>
          {getRankName(levelUp.newLevel)}
        </Text>
        <Text style={styles.levelUpHint}>Tap anywhere to continue</Text>
      </Animated.View>
    </Pressable>
  );
}
