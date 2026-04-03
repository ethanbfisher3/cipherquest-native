import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import PagerView from "react-native-pager-view"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LearnTab } from "./Learn"
import { getDailyLevel, getRankName, getXpForLevel, LEVELS } from "../constants"
import { CipherType, HomeTab, Score, UserProfile } from "../types"
import Entypo from "@expo/vector-icons/Entypo"

const ICON_SIZE = 28

const HOME_TABS: {
  key: HomeTab
  title: string
  icon: (isActive: boolean) => React.ReactElement
}[] = [
  {
    key: "missions",
    title: "Missions",
    icon: (isActive) => (
      <Ionicons
        name="compass"
        size={ICON_SIZE}
        color={isActive ? "#6affbc" : "#6f848e"}
      />
    ),
  },
  {
    key: "challenges",
    title: "Challenges",
    icon: (isActive) => (
      <MaterialCommunityIcons
        name="target"
        size={ICON_SIZE}
        color={isActive ? "#6affbc" : "#6f848e"}
      />
    ),
  },
  {
    key: "leaderboard",
    title: "Leaderboard",
    icon: (isActive) => (
      <Ionicons
        name="trophy"
        size={ICON_SIZE}
        color={isActive ? "#6affbc" : "#6f848e"}
      />
    ),
  },
  {
    key: "learn",
    title: "Learn",
    icon: (isActive) => (
      <Entypo
        name="open-book"
        size={ICON_SIZE}
        color={isActive ? "#6affbc" : "#6f848e"}
      />
    ),
  },
  {
    key: "profile",
    title: "Profile",
    icon: (isActive) => (
      <Ionicons
        name="person"
        size={ICON_SIZE}
        color={isActive ? "#6affbc" : "#6f848e"}
      />
    ),
  },
]

export function HomeTabs({
  profile,
  onStartMission,
  onShowProfileModal,
  requestedTab,
  onRequestedTabHandled,
  learnFocusCipherType,
  learnFocusSignal,
}: {
  profile: UserProfile
  onStartMission: () => void
  onShowProfileModal: () => void
  requestedTab?: HomeTab | null
  onRequestedTabHandled?: () => void
  learnFocusCipherType?: CipherType | null
  learnFocusSignal?: number
}) {
  const insets = useSafeAreaInsets()
  const pagerRef = useRef<PagerView | null>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position)
  }, [])

  const handleTabPress = useCallback((index: number) => {
    setCurrentPage(index)
    pagerRef.current?.setPage(index)
  }, [])

  useEffect(() => {
    if (!requestedTab) return
    const index = HOME_TABS.findIndex((tab) => tab.key === requestedTab)
    if (index < 0) return
    setCurrentPage(index)
    pagerRef.current?.setPage(index)
    onRequestedTabHandled?.()
  }, [requestedTab, onRequestedTabHandled])

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
        overdrag={true}
      >
        <View key="missions" style={styles.page}>
          <MissionsTab profile={profile} onStartMission={onStartMission} />
        </View>
        <View key="challenges" style={styles.page}>
          <ChallengesTab profile={profile} />
        </View>
        <View key="leaderboard" style={styles.page}>
          <LeaderboardTab profile={profile} />
        </View>
        <View key="learn" style={styles.page}>
          <LearnTab
            profile={profile}
            onEditProfile={onShowProfileModal}
            focusCipherType={learnFocusCipherType}
            focusSignal={learnFocusSignal}
          />
        </View>
        <View key="profile" style={styles.page}>
          <ProfileTab profile={profile} onEditProfile={onShowProfileModal} />
        </View>
      </PagerView>

      <View
        style={[
          styles.tabBar,
          {
            height: 46 + insets.bottom,
          },
        ]}
      >
        {HOME_TABS.map((tab, index) => {
          const isActive = currentPage === index

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              {tab.icon(isActive)}
              {isActive && (
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                    tab.title === "Leaderboard" && { fontSize: 11 },
                  ]}
                >
                  {tab.title}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function MissionsTab({
  profile,
  onStartMission,
}: {
  profile: UserProfile
  onStartMission: () => void
}) {
  const currentLevelXp = (profile.xp || 0) - getXpForLevel(profile.level || 1)
  const nextLevelXp =
    getXpForLevel((profile.level || 1) + 1) - getXpForLevel(profile.level || 1)
  const progress = Math.max(
    0,
    Math.min(1, nextLevelXp === 0 ? 0 : currentLevelXp / nextLevelXp),
  )

  return (
    <ScrollView
      style={styles.screenPad}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroGlowOrb} />
        <Text style={styles.heroKicker}>CipherQuest Command</Text>
        <Text style={styles.title}>CipherQuest</Text>
        <Text style={styles.systemLine}>Mission Net // Operational</Text>

        <View style={styles.heroStatRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillLabel}>Rank</Text>
            <Text style={styles.heroPillValue}>L{profile.level}</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillLabel}>Class</Text>
            <Text style={styles.heroPillValue}>
              {getRankName(profile.level)}
            </Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillLabel}>Uplink</Text>
            <Text style={styles.heroPillValue}>Stable</Text>
          </View>
        </View>

        <Text style={styles.progressLabel}>Level Progress</Text>
        <View style={styles.progressOuter}>
          <View
            style={[styles.progressInner, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.muted}>
          {currentLevelXp} / {nextLevelXp} XP
        </Text>

        <Pressable
          style={[styles.button, styles.primaryButton, styles.launchButton]}
          onPress={onStartMission}
        >
          <Text style={styles.primaryButtonText}>Launch Mission</Text>
        </Pressable>
      </View>

      <View style={styles.commandGrid}>
        <View style={styles.commandCard}>
          <Text style={styles.commandLabel}>Signal Archive</Text>
          <Text style={styles.commandValue}>
            {profile.missionProgress
              ? Object.keys(profile.missionProgress).length
              : 0}
          </Text>
          <Text style={styles.commandMeta}>Missions Completed</Text>
        </View>
        <View style={styles.commandCard}>
          <Text style={styles.commandLabel}>Unlocked Zones</Text>
          <Text style={styles.commandValue}>{profile.unlockedCount}</Text>
          <Text style={styles.commandMeta}>Territories Available</Text>
        </View>
      </View>

      <View style={styles.intelCard}>
        <Text style={styles.intelTitle}>Current Operation Directive</Text>
        <Text style={styles.body}>
          Enemy traffic patterns suggest a shift-cipher relay window is opening.
          Deploy now to secure intel and prevent escalation.
        </Text>
      </View>

      <Text style={[styles.subtitle, { marginTop: 20 }]}>Quick Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.unlockedCount}</Text>
          <Text style={styles.statLabel}>Levels Unlocked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.totalScore}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
      </View>
    </ScrollView>
  )
}

function ChallengesTab({ profile }: { profile: UserProfile }) {
  const diffs: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"]

  return (
    <ScrollView
      style={styles.screenPad}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Text style={styles.title}>Daily Challenges</Text>
      <Text style={styles.body}>
        Complete daily cipher challenges to earn bonus XP!
      </Text>

      {diffs.map((diff) => {
        const daily = getDailyLevel(new Date(), diff)
        const completed = !!profile.missionProgress?.[daily.id]
        return (
          <Pressable key={diff} style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>
              {diff} Daily {completed ? "✓" : ""}
            </Text>
            <Text style={styles.muted}>
              {daily.cipherType} • +{daily.xpReward} XP
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

function LeaderboardTab({ profile }: { profile: UserProfile }) {
  const [scores, setScores] = useState<Score[]>([])
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [tab, setTab] = useState<"missions" | "players">("players")
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0].id)

  useEffect(() => {
    const loadLocalLeaderboard = async () => {
      if (tab === "players") {
        setPlayers([profile])
        setScores([])
        return
      }

      const rawScores = await AsyncStorage.getItem("localScores")
      const parsed = rawScores ? (JSON.parse(rawScores) as Score[]) : []
      const missionScores = parsed
        .filter((s) => s.levelId === selectedLevelId)
        .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
      setScores(missionScores)
      setPlayers([])
    }

    loadLocalLeaderboard()
  }, [tab, selectedLevelId, profile])

  return (
    <View style={styles.screenPad}>
      <Text style={styles.title}>Leaderboards</Text>
      <View style={styles.row}>
        <Pressable
          style={[
            styles.smallButton,
            tab === "missions" && styles.smallButtonActive,
          ]}
          onPress={() => setTab("missions")}
        >
          <Text style={styles.smallButtonText}>Top Times</Text>
        </Pressable>
        <Pressable
          style={[
            styles.smallButton,
            tab === "players" && styles.smallButtonActive,
          ]}
          onPress={() => setTab("players")}
        >
          <Text style={styles.smallButtonText}>Agents</Text>
        </Pressable>
      </View>

      {tab === "missions" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10 }}
        >
          {LEVELS.map((lvl) => (
            <Pressable
              key={lvl.id}
              style={[
                styles.levelChip,
                selectedLevelId === lvl.id && styles.levelChipActive,
              ]}
              onPress={() => setSelectedLevelId(lvl.id)}
            >
              <Text style={styles.smallButtonText}>{lvl.id.toUpperCase()}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {tab === "players" ? (
        <FlatList
          scrollEnabled={false}
          data={players}
          keyExtractor={(item, index) => `${item.displayName}-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                #{index + 1} {item.displayName}
              </Text>
              <Text style={styles.muted}>
                {`LVL ${item.level || 1} • ${getRankName(item.level || 1)}`}
                {item.displayName === profile.displayName ? " • YOU" : ""}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          scrollEnabled={false}
          data={scores}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                #{index + 1} {item.displayName}
              </Text>
              <Text style={styles.muted}>
                {`${item.timeInSeconds}s`}
                {item.displayName === profile.displayName ? " • YOU" : ""}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

function ProfileTab({
  profile,
  onEditProfile,
}: {
  profile: UserProfile
  onEditProfile: () => void
}) {
  return (
    <ScrollView
      style={styles.screenPad}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Text style={styles.title}>Agent Profile</Text>

      <View style={styles.profileSection}>
        <Text style={styles.label}>Codename</Text>
        <Text style={styles.profileValue}>{profile.displayName}</Text>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.label}>Rank</Text>
        <Text style={styles.profileValue}>
          {profile.level} • {getRankName(profile.level)}
        </Text>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.label}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.unlockedCount}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={onEditProfile}
      >
        <Text style={styles.primaryButtonText}>Edit Profile</Text>
      </Pressable>

      {!profile.isPro && (
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Upgrade to Pro</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#05090d" },
  pager: { flex: 1 },
  page: { flex: 1 },
  screenPad: { flex: 1, padding: 16 },
  title: {
    color: "#d8ffe9",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  systemLine: {
    color: "#78a5b3",
    fontSize: 11,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#08121a",
    borderColor: "#2e5767",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#63f8bb",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  heroGlowOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(70,242,173,0.14)",
    right: -40,
    top: -65,
  },
  heroKicker: {
    color: "#89aeba",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 6,
    fontWeight: "700",
  },
  heroStatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  heroPill: {
    flex: 1,
    backgroundColor: "#0f1d27",
    borderColor: "#315364",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  heroPillLabel: {
    color: "#7f9da8",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  heroPillValue: {
    color: "#d9ffee",
    fontSize: 13,
    fontWeight: "800",
  },
  progressLabel: {
    color: "#89aeba",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  launchButton: {
    marginTop: 6,
  },
  commandGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  commandCard: {
    flex: 1,
    backgroundColor: "#0b161e",
    borderColor: "#2a4958",
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
  },
  commandLabel: {
    color: "#83a8b5",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  commandValue: {
    color: "#6affbc",
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 2,
  },
  commandMeta: {
    color: "#7395a1",
    fontSize: 11,
  },
  intelCard: {
    backgroundColor: "#09141c",
    borderColor: "#2a4d5d",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 2,
  },
  intelTitle: {
    color: "#a8efce",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  subtitle: { color: "#72d8ad", fontSize: 14, marginBottom: 12 },
  label: {
    color: "#84a8b1",
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  muted: { color: "#84a8b1", fontSize: 12, marginBottom: 8 },
  body: { color: "#bfd5de", fontSize: 14, lineHeight: 20, marginBottom: 10 },
  progressOuter: {
    height: 8,
    backgroundColor: "#111a22",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressInner: { height: 8, backgroundColor: "#4df4aa" },
  button: {
    backgroundColor: "#0f171f",
    borderColor: "#284756",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  primaryButton: { backgroundColor: "#42d995", borderColor: "#8bfec8" },
  buttonText: { color: "#d3e8ee", fontWeight: "700" },
  primaryButtonText: {
    color: "#042012",
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
  smallButton: {
    backgroundColor: "#0f171f",
    borderColor: "#274758",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallButtonActive: { backgroundColor: "#42d995", borderColor: "#8bfec8" },
  smallButtonText: {
    color: "#d3e8ee",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: "#0c151d",
    borderColor: "#223a46",
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#d8ffe9",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  levelChip: {
    backgroundColor: "#0f171f",
    borderColor: "#274758",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  levelChipActive: { backgroundColor: "#42d995", borderColor: "#8bfec8" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#070f14",
    borderTopWidth: 1,
    borderTopColor: "#1e3744",
    paddingBottom: 12,
    paddingTop: 8,
    height: 72,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6d8b95",
  },
  tabLabelActive: {
    color: "#6affbc",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0c151d",
    borderColor: "#223a46",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#6affbc",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    color: "#6d8b95",
    fontSize: 11,
    fontWeight: "600",
  },
  profileSection: {
    backgroundColor: "#0c151d",
    borderColor: "#223a46",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  profileValue: {
    color: "#d8ffe9",
    fontSize: 14,
    fontWeight: "600",
  },
})
