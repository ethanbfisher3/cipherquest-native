import React from "react";
import { Pressable, Text, View } from "react-native";
import { appStyles as styles } from "./appStyles";

export function Header({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.rowBetween}>
      <Pressable style={styles.smallButton} onPress={onBack}>
        <Text style={styles.smallButtonText}>Back</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 64 }} />
    </View>
  );
}
