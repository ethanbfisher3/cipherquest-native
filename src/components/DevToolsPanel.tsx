import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { appStyles as styles } from "./appStyles";

export function DevToolsPanel({
  currentLevelId,
  onAutoComplete,
  onAddXp,
  onUnlockAll,
  onReset,
}: {
  currentLevelId: string | null;
  onAutoComplete: () => Promise<void>;
  onAddXp: () => Promise<void>;
  onUnlockAll: () => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.devPanelWrap}>
      <Pressable
        style={[styles.devButton, styles.devHeaderButton]}
        onPress={() => setOpen((prev) => !prev)}
      >
        <Text style={styles.devButtonText}>{open ? "Hide DEV" : "DEV"}</Text>
      </Pressable>

      {open && (
        <View style={styles.devPanelBody}>
          <Text style={styles.devMetaText}>
            Level: {currentLevelId ?? "none selected"}
          </Text>
          <Pressable style={styles.devButton} onPress={onAutoComplete}>
            <Text style={styles.devButtonText}>Auto Complete Level</Text>
          </Pressable>
          <Pressable style={styles.devButton} onPress={onAddXp}>
            <Text style={styles.devButtonText}>Add 500 XP</Text>
          </Pressable>
          <Pressable style={styles.devButton} onPress={onUnlockAll}>
            <Text style={styles.devButtonText}>Unlock All Levels</Text>
          </Pressable>
          <Pressable
            style={[styles.devButton, styles.devDangerButton]}
            onPress={onReset}
          >
            <Text style={styles.devButtonText}>Reset Local Save</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
