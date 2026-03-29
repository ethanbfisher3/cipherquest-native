import { StatusBar } from "expo-status-bar"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { ENIGMA_ROTORS } from "./src/ciphers"
import {
  COUNTRIES,
  INTRO_STORY,
  LEVELS,
  getDailyLevel,
  getRankName,
  getXpForLevel,
} from "./src/constants"
import { EnigmaMachine, EnigmaState } from "./src/components/EnigmaMachine"
import { AppScreen, Level, Score, UserProfile } from "./src/types"

const DEFAULT_UNLOCKED = [
  "c1",
  "a1",
  "v1",
  "r1",
  "p1",
  "m1",
  "f1",
  "af1",
  "bf1",
  "ct1",
  "h1",
  "e1",
]
const PROFILE_KEY = "localProfile"
const SCORES_KEY = "localScores"

const createDefaultProfile = (): UserProfile => ({
  displayName: "Agent_Local",
  createdAt: new Date().toISOString(),
  totalScore: 0,
  xp: 0,
  level: 1,
  unlockedCount: DEFAULT_UNLOCKED.length,
  dailyWins: 0,
  hasSeenIntro: false,
})

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("menu")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null,
  )
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [unlockedLevels, setUnlockedLevels] =
    useState<string[]>(DEFAULT_UNLOCKED)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [levelUp, setLevelUp] = useState<{
    oldLevel: number
    newLevel: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem("unlockedLevels")
      .then((raw) => {
        if (!raw) return
        const parsed = JSON.parse(raw) as string[]
        setUnlockedLevels(Array.from(new Set([...DEFAULT_UNLOCKED, ...parsed])))
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const rawProfile = await AsyncStorage.getItem(PROFILE_KEY)
        if (rawProfile) {
          setProfile(JSON.parse(rawProfile) as UserProfile)
        } else {
          const newProfile = createDefaultProfile()
          await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile))
          setProfile(newProfile)
        }
      } catch {
        Alert.alert(
          "Profile Error",
          "Unable to load profile from device storage.",
        )
      } finally {
        setLoading(false)
      }
    }

    initializeProfile()
  }, [])

  const persistProfile = async (nextProfile: UserProfile) => {
    setProfile(nextProfile)
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
  }

  const appendLocalScore = async (score: Score) => {
    const rawScores = await AsyncStorage.getItem(SCORES_KEY)
    const parsed = rawScores ? (JSON.parse(rawScores) as Score[]) : []
    parsed.push(score)
    await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(parsed))
  }

  const persistUnlocked = async (levels: string[]) => {
    setUnlockedLevels(levels)
    await AsyncStorage.setItem("unlockedLevels", JSON.stringify(levels))
  }

  const unlockNextLevel = async (currentId: string) => {
    const currentIndex = LEVELS.findIndex((l) => l.id === currentId)
    if (currentIndex < 0 || currentIndex >= LEVELS.length - 1) return
    const current = LEVELS[currentIndex]
    const next = LEVELS[currentIndex + 1]
    if (
      next.cipherType !== current.cipherType ||
      unlockedLevels.includes(next.id)
    )
      return
    await persistUnlocked([...unlockedLevels, next.id])
  }

  const handleStartMission = () => {
    if (profile?.hasSeenIntro) setScreen("world-map")
    else setScreen("intro")
  }

  const handleIntroComplete = async () => {
    if (!profile) {
      setScreen("world-map")
      return
    }
    const updated = { ...profile, hasSeenIntro: true }
    await persistProfile(updated)
    setScreen("world-map")
  }

  const handleLevelComplete = async (level: Level, elapsedSeconds: number) => {
    if (!profile) return

    const xpGained = level.xpReward
    const newXp = (profile.xp || 0) + xpGained
    let newLevel = profile.level || 1
    while (newXp >= getXpForLevel(newLevel + 1)) newLevel += 1

    if (newLevel > (profile.level || 1)) {
      setLevelUp({ oldLevel: profile.level || 1, newLevel })
    }

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
      totalScore: (profile.totalScore || 0) + xpGained,
      missionProgress: {
        ...(profile.missionProgress || {}),
        [level.id]: {
          accumulatedTime: elapsedSeconds,
          lastAttemptDate: new Date().toISOString().split("T")[0],
        },
      },
      unlockedCount: unlockedLevels.length,
    }

    await persistProfile(updatedProfile)
    await appendLocalScore({
      displayName: updatedProfile.displayName,
      levelId: level.id,
      cipherType: level.cipherType,
      timeInSeconds: elapsedSeconds,
      createdAt: new Date().toISOString(),
    })
    if (!level.isDaily) await unlockNextLevel(level.id)
    Alert.alert("Mission Accomplished", `+${xpGained} XP`)
  }

  const addXpDev = async (amount = 500) => {
    if (!profile) return
    const newXp = (profile.xp || 0) + amount
    let newLevel = profile.level || 1
    while (newXp >= getXpForLevel(newLevel + 1)) newLevel += 1

    if (newLevel > (profile.level || 1)) {
      setLevelUp({ oldLevel: profile.level || 1, newLevel })
    }

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
      totalScore: (profile.totalScore || 0) + amount,
    }
    await persistProfile(updatedProfile)
  }

  const unlockAllLevelsDev = async () => {
    const allUnlocked = Array.from(
      new Set([...DEFAULT_UNLOCKED, ...LEVELS.map((level) => level.id)]),
    )
    await persistUnlocked(allUnlocked)
    if (profile) {
      await persistProfile({ ...profile, unlockedCount: allUnlocked.length })
    }
    Alert.alert("Dev Tools", "All levels unlocked.")
  }

  const autoCompleteSelectedLevelDev = async () => {
    if (!selectedLevel) {
      Alert.alert("Dev Tools", "Select a level first.")
      return
    }
    await handleLevelComplete(selectedLevel, 5)
    if (screen === "game") {
      setScreen(selectedLevel.isDaily ? "daily-selector" : "country-view")
    }
  }

  const resetLocalProgressDev = async () => {
    const defaultProfile = createDefaultProfile()
    await AsyncStorage.multiSet([
      [PROFILE_KEY, JSON.stringify(defaultProfile)],
      [SCORES_KEY, JSON.stringify([])],
      ["unlockedLevels", JSON.stringify(DEFAULT_UNLOCKED)],
    ])
    setProfile(defaultProfile)
    setUnlockedLevels(DEFAULT_UNLOCKED)
    setSelectedCountryId(null)
    setSelectedLevel(null)
    setScreen("menu")
    Alert.alert("Dev Tools", "Local profile, scores, and unlocks were reset.")
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root}>
          <View style={styles.centered}>
            <Text style={styles.muted}>Initializing CipherQuest Native...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    )
  }

  const currentCountry =
    COUNTRIES.find((c) => c.id === selectedCountryId) || null

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        {screen === "menu" && profile && (
          <MenuScreen
            profile={profile}
            onStart={handleStartMission}
            onDaily={() => setScreen("daily-selector")}
            onLeaderboard={() => setScreen("leaderboard")}
            onProfile={() => setShowProfileModal(true)}
          />
        )}

        {screen === "intro" && <IntroScreen onComplete={handleIntroComplete} />}

        {screen === "world-map" && (
          <WorldScreen
            onBack={() => setScreen("menu")}
            onSelectCountry={(id) => {
              setSelectedCountryId(id)
              setScreen("country-view")
            }}
          />
        )}

        {screen === "country-view" && currentCountry && profile && (
          <CountryScreen
            countryId={currentCountry.id}
            unlockedLevels={unlockedLevels}
            profile={profile}
            onBack={() => setScreen("world-map")}
            onSelectLevel={(level) => {
              setSelectedLevel(level)
              setScreen("game")
            }}
          />
        )}

        {screen === "daily-selector" && profile && (
          <DailyScreen
            profile={profile}
            onBack={() => setScreen("menu")}
            onSelect={(difficulty) => {
              const level = getDailyLevel(new Date(), difficulty)
              setSelectedLevel(level)
              setScreen("game")
            }}
          />
        )}

        {screen === "game" && selectedLevel && profile && (
          <GameScreen
            level={selectedLevel}
            profile={profile}
            onBack={() =>
              setScreen(
                selectedLevel.isDaily ? "daily-selector" : "country-view",
              )
            }
            onComplete={(seconds) =>
              handleLevelComplete(selectedLevel, seconds)
            }
            onUpdateProfile={setProfile}
          />
        )}

        {screen === "leaderboard" && profile && (
          <LeaderboardScreen
            profile={profile}
            onBack={() => setScreen("menu")}
          />
        )}

        <ProfileModal
          visible={showProfileModal}
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onSave={async (displayName) => {
            if (!profile) return
            const updated = { ...profile, displayName }
            await persistProfile(updated)
            setShowProfileModal(false)
          }}
          onUpgrade={async () => {
            if (!profile) return
            const updated = { ...profile, isPro: true }
            await persistProfile(updated)
            Alert.alert("CipherQuest Pro", "Pro enabled for this account.")
          }}
        />

        {__DEV__ && (
          <DevToolsPanel
            currentLevelId={selectedLevel?.id ?? null}
            onAutoComplete={autoCompleteSelectedLevelDev}
            onAddXp={() => addXpDev(500)}
            onUnlockAll={unlockAllLevelsDev}
            onReset={resetLocalProgressDev}
          />
        )}

        <LevelUpOverlay levelUp={levelUp} onClose={() => setLevelUp(null)} />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

function MenuScreen({
  profile,
  onStart,
  onDaily,
  onLeaderboard,
  onProfile,
}: {
  profile: UserProfile
  onStart: () => void
  onDaily: () => void
  onLeaderboard: () => void
  onProfile: () => void
}) {
  const currentLevelXp = (profile.xp || 0) - getXpForLevel(profile.level || 1)
  const nextLevelXp =
    getXpForLevel((profile.level || 1) + 1) - getXpForLevel(profile.level || 1)
  const progress = Math.max(
    0,
    Math.min(1, nextLevelXp === 0 ? 0 : currentLevelXp / nextLevelXp),
  )

  return (
    <View style={styles.screenPad}>
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
        onPress={onStart}
      >
        <Text style={styles.primaryButtonText}>Start Mission</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onDaily}>
        <Text style={styles.buttonText}>Daily Challenges</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onLeaderboard}>
        <Text style={styles.buttonText}>Leaderboards</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onProfile}>
        <Text style={styles.buttonText}>Profile</Text>
      </Pressable>
    </View>
  )
}

function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const current = INTRO_STORY[step]
  return (
    <View style={styles.screenPad}>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.body}>{current.text}</Text>
      <Text style={styles.muted}>
        {step + 1} / {INTRO_STORY.length}
      </Text>
      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={() => {
          if (step < INTRO_STORY.length - 1) setStep((s) => s + 1)
          else onComplete()
        }}
      >
        <Text style={styles.primaryButtonText}>
          {step < INTRO_STORY.length - 1 ? "Next" : "Begin Mission"}
        </Text>
      </Pressable>
    </View>
  )
}

function WorldScreen({
  onSelectCountry,
  onBack,
}: {
  onSelectCountry: (id: string) => void
  onBack: () => void
}) {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null,
  )
  const MAP_WIDTH = 1080
  const MAP_HEIGHT = 1300
  const selectedCountry =
    COUNTRIES.find((country) => country.id === selectedCountryId) || null

  return (
    <View style={styles.screenPad}>
      <Header title="World Map" onBack={onBack} />

      <View style={styles.mapShell}>
        <ScrollView
          horizontal
          style={styles.mapPannerX}
          contentContainerStyle={styles.mapPannerXContent}
          showsHorizontalScrollIndicator={false}
        >
          <ScrollView
            style={styles.mapPannerY}
            contentContainerStyle={styles.mapPannerYContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.mapCanvas,
                { width: MAP_WIDTH, height: MAP_HEIGHT },
              ]}
            >
              <View style={styles.mapBackdropBlobA} />
              <View style={styles.mapBackdropBlobB} />

              {COUNTRIES.map((country) => {
                const isSelected = country.id === selectedCountryId
                return (
                  <Pressable
                    key={country.id}
                    style={[
                      styles.mapMarker,
                      {
                        left: country.x,
                        top: country.y,
                        backgroundColor: country.color,
                      },
                      isSelected && styles.mapMarkerSelected,
                    ]}
                    onPress={() => setSelectedCountryId(country.id)}
                  >
                    <Text style={styles.mapMarkerLabel}>{country.name}</Text>
                  </Pressable>
                )
              })}

              {selectedCountry ? (
                <View style={styles.mapSelectedBanner}>
                  <Text style={styles.mapSelectedText}>
                    {selectedCountry.name}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </ScrollView>
      </View>

      {selectedCountry ? (
        <Pressable
          style={styles.mapCountryCard}
          onPress={() => onSelectCountry(selectedCountry.id)}
        >
          <Text style={styles.cardTitle}>{selectedCountry.name}</Text>
          <Text style={styles.muted}>
            {selectedCountry.capital} • Threat: {selectedCountry.threatLevel}
          </Text>
          <Text style={styles.body}>{selectedCountry.description}</Text>
          <Text style={styles.mapEnterText}>Tap to enter country missions</Text>
        </Pressable>
      ) : (
        <Text style={styles.mapHelpText}>
          Drag to pan the map. Tap a country marker to inspect it.
        </Text>
      )}
    </View>
  )
}

function CountryScreen({
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
    <View style={styles.screenPad}>
      <Header title={country.name} onBack={onBack} />
      <Text style={styles.body}>{country.description}</Text>
      <FlatList
        data={levels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const tutorialLevel = LEVELS.find(
            (l) => l.cipherType === item.cipherType && l.isTutorial,
          )
          const tutorialDone = tutorialLevel
            ? unlockedLevels.includes(tutorialLevel.id) &&
              !!profile.missionProgress?.[tutorialLevel.id]
            : true
          const lockedByTutorial = !item.isTutorial && !tutorialDone
          const isUnlocked =
            (!item.isProLevel ||
              !!profile.isPro ||
              unlockedLevels.includes(item.id)) &&
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

function DailyScreen({
  onSelect,
  onBack,
  profile,
}: {
  onSelect: (difficulty: "Easy" | "Medium" | "Hard") => void
  onBack: () => void
  profile: UserProfile
}) {
  const diffs: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"]
  return (
    <View style={styles.screenPad}>
      <Header title="Daily Protocols" onBack={onBack} />
      {diffs.map((diff) => {
        const daily = getDailyLevel(new Date(), diff)
        const completed = !!profile.missionProgress?.[daily.id]
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
        )
      })}
    </View>
  )
}

function GameScreen({
  level,
  profile,
  onBack,
  onComplete,
  onUpdateProfile,
}: {
  level: Level
  profile: UserProfile
  onBack: () => void
  onComplete: (elapsed: number) => void
  onUpdateProfile: (profile: UserProfile) => void
}) {
  const [guess, setGuess] = useState("")
  const [showHint, setShowHint] = useState(false)
  const [adTimer, setAdTimer] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (adTimer <= 0) return
    const id = setInterval(() => {
      setAdTimer((value) => {
        if (value <= 1) {
          setShowHint(true)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [adTimer])

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`

  const submit = async () => {
    if (guess.trim().toUpperCase() !== level.plaintext.toUpperCase()) {
      Alert.alert("Incorrect", "Try again.")
      return
    }

    const updated = {
      ...profile,
      missionProgress: {
        ...(profile.missionProgress || {}),
        [level.id]: {
          accumulatedTime: elapsed,
          lastAttemptDate: new Date().toISOString().split("T")[0],
        },
      },
    }
    onUpdateProfile(updated)
    await onComplete(elapsed)
    onBack()
  }

  return (
    <ScrollView
      style={styles.screenPad}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <Header title={level.name} onBack={onBack} />
      <Text style={styles.muted}>Timer: {formatTime(elapsed)}</Text>
      <View style={styles.cipherBox}>
        <Text style={styles.cipherText}>{level.ciphertext}</Text>
      </View>

      {level.cipherType === "enigma" ? (
        <EnigmaMachine
          initialState={level.params as EnigmaState | undefined}
          onEncrypt={(char) => setGuess((prev) => `${prev}${char}`)}
        />
      ) : null}

      <TextInput
        value={guess}
        onChangeText={setGuess}
        style={styles.input}
        autoCapitalize="characters"
        placeholder="ENTER DECODED MESSAGE"
        placeholderTextColor="#7f8a91"
      />

      {showHint ? <Text style={styles.hint}>Hint: {level.hint}</Text> : null}
      {!showHint && (
        <Pressable
          style={styles.button}
          onPress={() => setAdTimer(profile.isPro ? 1 : 5)}
        >
          <Text style={styles.buttonText}>
            {profile.isPro
              ? "Show Hint"
              : `Watch Ad for Hint (${adTimer || 5}s)`}
          </Text>
        </Pressable>
      )}

      <Pressable style={[styles.button, styles.primaryButton]} onPress={submit}>
        <Text style={styles.primaryButtonText}>Decipher Signal</Text>
      </Pressable>
    </ScrollView>
  )
}

function LeaderboardScreen({
  profile,
  onBack,
}: {
  profile: UserProfile
  onBack: () => void
}) {
  const [scores, setScores] = useState<Score[]>([])
  const [players, setPlayers] = useState<UserProfile[]>([])
  const [tab, setTab] = useState<"missions" | "players">("missions")
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0].id)

  useEffect(() => {
    const loadLocalLeaderboard = async () => {
      if (tab === "players") {
        setPlayers([profile])
        setScores([])
        return
      }

      const rawScores = await AsyncStorage.getItem(SCORES_KEY)
      const parsed = rawScores ? (JSON.parse(rawScores) as Score[]) : []
      const missionScores = parsed
        .filter((s) => s.levelId === selectedLevelId)
        .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
      setScores(missionScores)
      setPlayers([])
    }

    loadLocalLeaderboard()
  }, [tab, selectedLevelId])

  return (
    <View style={styles.screenPad}>
      <Header title="Leaderboard" onBack={onBack} />
      <View style={styles.row}>
        <Pressable
          style={[
            styles.smallButton,
            tab === "missions" && styles.smallButtonActive,
          ]}
          onPress={() => setTab("missions")}
        >
          <Text style={styles.smallButtonText}>Missions</Text>
        </Pressable>
        <Pressable
          style={[
            styles.smallButton,
            tab === "players" && styles.smallButtonActive,
          ]}
          onPress={() => setTab("players")}
        >
          <Text style={styles.smallButtonText}>Top Agents</Text>
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

function ProfileModal({
  visible,
  profile,
  onClose,
  onSave,
  onUpgrade,
}: {
  visible: boolean
  profile: UserProfile | null
  onClose: () => void
  onSave: (displayName: string) => Promise<void>
  onUpgrade: () => Promise<void>
}) {
  const [name, setName] = useState(profile?.displayName || "")

  useEffect(() => {
    setName(profile?.displayName || "")
  }, [profile?.displayName])

  if (!profile) return null

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <Text style={styles.title}>Agent Profile</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            placeholder="Codename"
            placeholderTextColor="#7f8a91"
          />
          {!profile.isPro && (
            <Pressable style={styles.button} onPress={onUpgrade}>
              <Text style={styles.buttonText}>Upgrade to Pro</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => onSave(name)}
          >
            <Text style={styles.primaryButtonText}>Save</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.rowBetween}>
      <Pressable style={styles.smallButton} onPress={onBack}>
        <Text style={styles.smallButtonText}>Back</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 64 }} />
    </View>
  )
}

function LevelUpOverlay({
  levelUp,
  onClose,
}: {
  levelUp: { oldLevel: number; newLevel: number } | null
  onClose: () => void
}) {
  const opacity = useState(new Animated.Value(0))[0]
  const scale = useState(new Animated.Value(0.85))[0]
  const translateY = useState(new Animated.Value(16))[0]

  useEffect(() => {
    if (!levelUp) {
      opacity.setValue(0)
      scale.setValue(0.85)
      translateY.setValue(16)
      return
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
    ]).start()
  }, [levelUp, opacity, scale, translateY])

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
    ]).start(() => onClose())
  }

  if (!levelUp) return null

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
  )
}

function DevToolsPanel({
  currentLevelId,
  onAutoComplete,
  onAddXp,
  onUnlockAll,
  onReset,
}: {
  currentLevelId: string | null
  onAutoComplete: () => Promise<void>
  onAddXp: () => Promise<void>
  onUnlockAll: () => Promise<void>
  onReset: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

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
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b1014" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  screenPad: { flex: 1, padding: 16 },
  title: { color: "#e6edf3", fontSize: 28, fontWeight: "800", marginBottom: 8 },
  headerTitle: { color: "#e6edf3", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#7fb39f", fontSize: 14, marginBottom: 12 },
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
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
  cardLocked: { opacity: 0.55 },
  cardTitle: {
    color: "#e6edf3",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  warning: { color: "#ff9d6c", fontSize: 12, marginTop: 4 },
  cipherBox: {
    backgroundColor: "#0f1a17",
    borderColor: "#1c5d45",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cipherText: { color: "#6ff2b7", fontSize: 16, fontWeight: "700" },
  input: {
    backgroundColor: "#141c24",
    borderColor: "#2a3542",
    borderWidth: 1,
    borderRadius: 10,
    color: "#e6edf3",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  hint: { color: "#95d3b6", fontSize: 13, marginTop: 10 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: "#0b1014",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderColor: "#2a3542",
    borderWidth: 1,
    padding: 16,
  },
  mapShell: {
    position: "relative",
    marginTop: 4,
    height: 390,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a3542",
    overflow: "hidden",
    backgroundColor: "#0d3d58",
  },
  mapPannerX: {
    flex: 1,
  },
  mapPannerXContent: {
    minWidth: "100%",
  },
  mapPannerY: {
    flex: 1,
  },
  mapPannerYContent: {
    minHeight: "100%",
  },
  mapCanvas: {
    position: "relative",
    backgroundColor: "#0d3d58",
  },
  mapBackdropBlobA: {
    position: "absolute",
    width: 420,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(17,92,129,0.5)",
    left: 120,
    top: 200,
  },
  mapBackdropBlobB: {
    position: "absolute",
    width: 500,
    height: 360,
    borderRadius: 999,
    backgroundColor: "rgba(7,62,91,0.55)",
    right: 80,
    bottom: 160,
  },
  mapMarker: {
    position: "absolute",
    transform: [{ translateX: -36 }, { translateY: -14 }],
    minWidth: 72,
    maxWidth: 132,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(220,230,240,0.85)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  mapMarkerSelected: {
    borderColor: "#14b86c",
    borderWidth: 2,
    shadowColor: "#14b86c",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  mapMarkerLabel: {
    color: "#0b1014",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  mapSelectedBanner: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a3542",
    backgroundColor: "rgba(8,18,26,0.84)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  mapSelectedText: {
    color: "#e6edf3",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  mapCountryCard: {
    backgroundColor: "#111820",
    borderColor: "#2a3542",
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
  mapHelpText: {
    color: "#8b98a5",
    fontSize: 12,
    marginTop: 12,
  },
  mapEnterText: {
    color: "#14b86c",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  devPanelWrap: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 188,
  },
  devPanelBody: {
    marginTop: 8,
    backgroundColor: "rgba(11,16,20,0.96)",
    borderColor: "#2a3542",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  devButton: {
    backgroundColor: "#1f2b35",
    borderColor: "#355062",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 6,
    alignItems: "center",
  },
  devHeaderButton: {
    marginTop: 0,
    backgroundColor: "#184f39",
    borderColor: "#2f7d5b",
  },
  devDangerButton: {
    backgroundColor: "#5c2a2a",
    borderColor: "#8a3f3f",
  },
  devButtonText: {
    color: "#e6edf3",
    fontSize: 12,
    fontWeight: "700",
  },
  devMetaText: {
    color: "#8b98a5",
    fontSize: 11,
    marginBottom: 4,
  },
  levelUpBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 120,
  },
  levelUpCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0b1014",
    borderColor: "#1f7a58",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  levelUpTitle: {
    color: "#14b86c",
    fontSize: 30,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  levelUpSubtitle: {
    color: "#9fcfb8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 18,
  },
  levelUpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 14,
  },
  levelUpStatBlock: {
    alignItems: "center",
    minWidth: 90,
  },
  levelUpLabel: {
    color: "#8b98a5",
    fontSize: 10,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  levelUpOldLevel: {
    color: "#c7d0d9",
    fontSize: 30,
    fontWeight: "800",
  },
  levelUpArrow: {
    color: "#14b86c",
    fontSize: 22,
    fontWeight: "800",
  },
  levelUpNewLevel: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "900",
  },
  levelUpRankText: {
    color: "#14b86c",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  levelUpHint: {
    color: "#7f8a91",
    fontSize: 11,
  },
})
