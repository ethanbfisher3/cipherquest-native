import React from "react";
import { Pressable, Text, View } from "react-native";
import { getDailyLevel } from "../constants";
import { UserProfile } from "../types";
import { appStyles as styles } from "./appStyles";
import { Header } from "./Header";

export function DailyScreen({
  onSelect,
  onBack,
  profile,
}: {
  onSelect: (difficulty: "Easy" | "Medium" | "Hard") => void;
  onBack: () => void;
  profile: UserProfile;
}) {
  const diffs: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"];

  return (
    <View style={styles.topScreenPad}>
      <Header title="Daily Protocols" onBack={onBack} />
      {diffs.map((diff) => {
        const daily = getDailyLevel(new Date(), diff);
        const completed = !!profile.missionProgress?.[daily.id];
        return (
          <Pressable
            key={diff}
            style={styles.card}
            onPress={() => onSelect(diff)}
          >
            <Text style={styles.cardTitle}>
              {diff} Daily {completed ? "✓" : ""}
            </Text>
            <Text style={styles.muted}>
              {daily.cipherType} • +{daily.xpReward} XP
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
