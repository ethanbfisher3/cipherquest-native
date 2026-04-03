import React from "react"
import { Pressable, Text, View } from "react-native"
import { appStyles as styles } from "./appStyles"

export function Header({
  title,
  onBack,
}: {
  title: string
  onBack: () => void
}) {
  return (
    <View style={styles.rowBetween}>
      <Pressable style={styles.smallButton} onPress={onBack}>
        <Text style={styles.smallButtonText}>Back</Text>
      </Pressable>
      <View
        style={{
          minWidth: 170,
          maxWidth: 240,
          borderWidth: 1,
          borderColor: "#2c5a6a",
          borderRadius: 999,
          paddingVertical: 7,
          paddingHorizontal: 12,
          backgroundColor: "#09141c",
          alignItems: "center",
        }}
      >
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View
        style={{
          width: 64,
          alignItems: "flex-end",
        }}
      >
        <Text
          style={{
            color: "#7cf6c0",
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 0.8,
          }}
        >
          LIVE
        </Text>
      </View>
    </View>
  )
}
