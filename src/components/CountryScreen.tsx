import React from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import { COUNTRIES, LEVELS } from "../constants"
import { Level, UserProfile } from "../types"
import { appStyles as styles } from "./appStyles"
import { Header } from "./Header"

export function CountryScreen({
  countryId,
  unlockedLevels,
  profile,
  onBack,
  onSelectLevel,
}: {
  countryId: string
  unlockedLevels: string[]
  profile: UserProfile
  onBack: () => void
  onSelectLevel: (level: Level) => void
}) {
  const country = COUNTRIES.find((c) => c.id === countryId)!
  const levels = LEVELS.filter((l) => l.countryId === countryId)

  return (
    <View style={styles.topScreenPad}>
      <Header title={country.name} onBack={onBack} />
      <Text style={styles.body}>{country.description}</Text>
      <FlatList
        data={levels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const explicitlyUnlocked = unlockedLevels.includes(item.id)
          const tutorialLevel = LEVELS.find(
            (l) => l.cipherType === item.cipherType && l.isTutorial,
          )
          const tutorialDone = tutorialLevel
            ? unlockedLevels.includes(tutorialLevel.id) &&
              !!profile.missionProgress?.[tutorialLevel.id]
            : true
          const lockedByTutorial =
            !item.isTutorial && !tutorialDone && !explicitlyUnlocked
          const isUnlocked =
            (!item.isProLevel || !!profile.isPro || explicitlyUnlocked) &&
            !lockedByTutorial
          const isDone = !!profile.missionProgress?.[item.id]
          return (
            <Pressable
              style={[styles.card, !isUnlocked && styles.cardLocked]}
              onPress={() => onSelectLevel(item)}
              disabled={!isUnlocked}
            >
              <Text style={styles.cardTitle}>
                {item.name} {isDone ? "✓" : ""}
              </Text>
              <Text style={styles.muted}>
                {item.cipherType} • {item.difficulty} • +{item.xpReward} XP
              </Text>
              {!isUnlocked && <Text style={styles.warning}>Locked</Text>}
            </Pressable>
          )
        }}
      />
    </View>
  )
}
