import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CIPHER_INFOS } from "../constants";
import { UserProfile } from "../types";
import { appStyles as styles } from "./appStyles";

export function LearnTab({
  profile,
  onEditProfile,
}: {
  profile: UserProfile;
  onEditProfile: () => void;
}) {
  const [expandedCiphers, setExpandedCiphers] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = (cipherType: string) => {
    const updated = new Set(expandedCiphers);
    if (updated.has(cipherType)) {
      updated.delete(cipherType);
    } else {
      updated.add(cipherType);
    }
    setExpandedCiphers(updated);
  };

  return (
    <ScrollView
      style={styles.topScreenPad}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={localStyles.heroCard}>
        <Text style={styles.title}>Cipher Vault</Text>
        <Text style={styles.body}>
          A field guide to every cipher used in CipherQuest Native.
        </Text>

        <View style={localStyles.heroMetaRow}>
          <View style={localStyles.heroPill}>
            <Text style={localStyles.heroPillText}>
              {CIPHER_INFOS.length} Cipher Families
            </Text>
          </View>
          <View style={localStyles.heroPill}>
            <Text style={localStyles.heroPillText}>Level {profile.level}</Text>
          </View>
          <View style={localStyles.heroPill}>
            <Text style={localStyles.heroPillText}>
              {profile.unlockedCount} Unlocked
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.button,
            styles.primaryButton,
            localStyles.actionButton,
          ]}
          onPress={onEditProfile}
        >
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </Pressable>
      </View>

      <Text style={[styles.subtitle, localStyles.sectionIntro]}>
        Reference Library
      </Text>

      {CIPHER_INFOS.map((cipher) => {
        const isExpanded = expandedCiphers.has(cipher.type);
        return (
          <View key={cipher.type} style={localStyles.cipherCard}>
            <Pressable
              style={localStyles.headerButton}
              onPress={() => toggleExpand(cipher.type)}
              hitSlop={8}
            >
              <View style={localStyles.cardTitleBlock}>
                <Text style={styles.cardTitle}>{cipher.name}</Text>
                {/* <Text style={styles.muted}>{cipher.type.toUpperCase()}</Text> */}
              </View>
              <View style={localStyles.headerRight}>
                <View
                  style={[
                    localStyles.difficultyPill,
                    cipher.difficulty === "Easy" && localStyles.difficultyEasy,
                    cipher.difficulty === "Medium" &&
                      localStyles.difficultyMedium,
                    cipher.difficulty === "Hard" && localStyles.difficultyHard,
                  ]}
                >
                  <Text style={localStyles.difficultyText}>
                    {cipher.difficulty}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#8b98a5"
                  style={localStyles.expandIcon}
                />
              </View>
            </Pressable>

            {isExpanded && (
              <View style={localStyles.expandedContent}>
                <Text style={styles.body}>{cipher.description}</Text>

                <Text style={localStyles.sectionLabel}>How it works</Text>
                <Text style={localStyles.howToText}>{cipher.howTo.trim()}</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#0f1a17",
    borderColor: "#1c5d45",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  heroPill: {
    backgroundColor: "#13211c",
    borderColor: "#1f6c4f",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  heroPillText: {
    color: "#a8eecb",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    marginTop: 14,
  },
  sectionIntro: {
    marginBottom: 10,
  },
  cipherCard: {
    backgroundColor: "#111820",
    borderColor: "#2a3542",
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  headerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandIcon: {
    marginLeft: 4,
  },
  cardTitleBlock: {
    flex: 1,
  },
  expandedContent: {
    padding: 14,
    borderTopColor: "#2a3542",
    borderTopWidth: 1,
  },
  difficultyPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  difficultyEasy: {
    backgroundColor: "rgba(20, 184, 108, 0.14)",
    borderColor: "rgba(20, 184, 108, 0.45)",
  },
  difficultyMedium: {
    backgroundColor: "rgba(255, 157, 108, 0.14)",
    borderColor: "rgba(255, 157, 108, 0.5)",
  },
  difficultyHard: {
    backgroundColor: "rgba(124, 92, 255, 0.14)",
    borderColor: "rgba(124, 92, 255, 0.5)",
  },
  difficultyText: {
    color: "#e6edf3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  sectionLabel: {
    color: "#8b98a5",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  howToText: {
    color: "#d0d7de",
    fontSize: 13,
    lineHeight: 19,
  },
});
