import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getDailyLevel,
  getRankName,
  getXpForLevel,
  LEVELS,
} from "../constants";
import { HomeTab, Score, UserProfile } from "../types";

const ICON_SIZE = 24;

const HOME_TABS: {
  key: HomeTab;
  title: string;
  icon: (isActive: boolean) => React.ReactElement;
}[] = [
  {
    key: "missions",
    title: "Missions",
    icon: (isActive) => (
      <Ionicons
        name="compass"
        size={ICON_SIZE}
        color={isActive ? "#14b86c" : "#ccc"}
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
        color={isActive ? "#14b86c" : "#ccc"}
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
        color={isActive ? "#14b86c" : "#ccc"}
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
        color={isActive ? "#14b86c" : "#ccc"}
      />
    ),
  },
];

export function HomeTabs({
  profile,
  onStartMission,
  onShowProfileModal,
}: {
  profile: UserProfile;
  onStartMission: () => void;
  onShowProfileModal: () => void;
}) {
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handlePageSelected = useCallback((e: any) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const handleTabPress = useCallback((index: number) => {
    setCurrentPage(index);
    pagerRef.current?.setPage(index);
  }, []);

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
        <View key="profile" style={styles.page}>
          <ProfileTab profile={profile} onEditProfile={onShowProfileModal} />
        </View>
      </PagerView>

      <View
        style={[
          styles.tabBar,
          {
            height: 48 + insets.bottom,
          },
        ]}
      >
        {HOME_TABS.map((tab, index) => {
          const isActive = currentPage === index;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleTabPress(index)}
              activeOpacity={0.7}
            >
              {tab.icon(isActive)}
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MissionsTab({
  profile,
  onStartMission,
}: {
  profile: UserProfile;
  onStartMission: () => void;
}) {
  const currentLevelXp = (profile.xp || 0) - getXpForLevel(profile.level || 1);
  const nextLevelXp =
    getXpForLevel((profile.level || 1) + 1) - getXpForLevel(profile.level || 1);
  const progress = Math.max(
    0,
    Math.min(1, nextLevelXp === 0 ? 0 : currentLevelXp / nextLevelXp),
  );

  return (
    <ScrollView
      style={styles.screenPad}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Text style={styles.title}>CipherQuest Native</Text>
      <Text style={styles.subtitle}>
        Rank {profile.level} • {getRankName(profile.level)}
      </Text>
      <View style={styles.progressOuter}>
        <View style={[styles.progressInner, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.muted}>
        {currentLevelXp} / {nextLevelXp} XP
      </Text>

      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={onStartMission}
      >
        <Text style={styles.primaryButtonText}>Start Mission</Text>
      </Pressable>

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
  );
}

function ChallengesTab({ profile }: { profile: UserProfile }) {
  const diffs: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"];

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
        const daily = getDailyLevel(new Date(), diff);
        const completed = !!profile.missionProgress?.[daily.id];
        return (
          <Pressable key={diff} style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>
              {diff} Daily {completed ? "✓" : ""}
            </Text>
            <Text style={styles.muted}>
              {daily.cipherType} • +{daily.xpReward} XP
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LeaderboardTab({ profile }: { profile: UserProfile }) {
  const [scores, setScores] = useState<Score[]>([]);
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [tab, setTab] = useState<"missions" | "players">("players");
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0].id);

  useEffect(() => {
    const loadLocalLeaderboard = async () => {
      if (tab === "players") {
        setPlayers([profile]);
        setScores([]);
        return;
      }

      const rawScores = await AsyncStorage.getItem("localScores");
      const parsed = rawScores ? (JSON.parse(rawScores) as Score[]) : [];
      const missionScores = parsed
        .filter((s) => s.levelId === selectedLevelId)
        .sort((a, b) => a.timeInSeconds - b.timeInSeconds);
      setScores(missionScores);
      setPlayers([]);
    };

    loadLocalLeaderboard();
  }, [tab, selectedLevelId, profile]);

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
  );
}

function ProfileTab({
  profile,
  onEditProfile,
}: {
  profile: UserProfile;
  onEditProfile: () => void;
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1014" },
  pager: { flex: 1 },
  page: { flex: 1 },
  screenPad: { flex: 1, padding: 16 },
  title: { color: "#e6edf3", fontSize: 28, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#7fb39f", fontSize: 14, marginBottom: 12 },
  label: { color: "#8b98a5", fontSize: 12, marginBottom: 4 },
  muted: { color: "#8b98a5", fontSize: 12, marginBottom: 8 },
  body: { color: "#d0d7de", fontSize: 14, lineHeight: 20, marginBottom: 10 },
  progressOuter: {
    height: 8,
    backgroundColor: "#1b2630",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressInner: { height: 8, backgroundColor: "#14b86c" },
  button: {
    backgroundColor: "#1a242d",
    borderColor: "#2c3c4a",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  primaryButton: { backgroundColor: "#14b86c", borderColor: "#14b86c" },
  buttonText: { color: "#d0d7de", fontWeight: "600" },
  primaryButtonText: { color: "#03190f", fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
  smallButton: {
    backgroundColor: "#1a242d",
    borderColor: "#2c3c4a",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallButtonActive: { backgroundColor: "#14b86c", borderColor: "#14b86c" },
  smallButtonText: { color: "#d0d7de", fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: "#111820",
    borderColor: "#2a3542",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#e6edf3",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  levelChip: {
    backgroundColor: "#1a242d",
    borderColor: "#2c3c4a",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  levelChipActive: { backgroundColor: "#14b86c", borderColor: "#14b86c" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111820",
    borderTopWidth: 1,
    borderTopColor: "#2a3542",
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
    fontWeight: "600",
    color: "#8b98a5",
  },
  tabLabelActive: {
    color: "#14b86c",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111820",
    borderColor: "#2a3542",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: "#14b86c",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    color: "#8b98a5",
    fontSize: 11,
    fontWeight: "600",
  },
  profileSection: {
    backgroundColor: "#111820",
    borderColor: "#2a3542",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  profileValue: {
    color: "#e6edf3",
    fontSize: 14,
    fontWeight: "600",
  },
});
