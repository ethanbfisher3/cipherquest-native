import { StatusBar } from "expo-status-bar"
import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { useEffect, useState } from "react"
import { Alert, Platform, Text, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import * as NavigationBar from "expo-navigation-bar"
import {
  COUNTRIES,
  LEVELS,
  getDailyLevel,
  getXpForLevel,
} from "./src/constants"
import { appStyles as styles } from "./src/components/appStyles"
import { HomeTabs } from "./src/components/HomeTabs"
import { IntroScreen } from "./src/components/IntroScreen"
import { WorldScreen } from "./src/components/WorldScreen"
import { CountryScreen } from "./src/components/CountryScreen"
import { DailyScreen } from "./src/components/DailyScreen"
import { GameScreen } from "./src/components/GameScreen"
import { ProfileModal } from "./src/components/ProfileModal"
import { LevelUpOverlay } from "./src/components/LevelUpOverlay"
import { DevToolsPanel } from "./src/components/DevToolsPanel"
import {
  AppScreen,
  CipherType,
  HomeTab,
  Level,
  Score,
  UserProfile,
} from "./src/types"

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
  const [screen, setScreen] = useState<AppScreen>("home-tabs")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null,
  )
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [unlockedLevels, setUnlockedLevels] =
    useState<string[]>(DEFAULT_UNLOCKED)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [requestedHomeTab, setRequestedHomeTab] = useState<HomeTab | null>(null)
  const [learnFocusCipherType, setLearnFocusCipherType] =
    useState<CipherType | null>(null)
  const [learnFocusSignal, setLearnFocusSignal] = useState(0)
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
    if (Platform.OS === "android") NavigationBar.setVisibilityAsync("hidden")
  })

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

  const openCipherGuide = (cipherType: CipherType) => {
    setRequestedHomeTab("learn")
    setLearnFocusCipherType(cipherType)
    setLearnFocusSignal((value) => value + 1)
    setScreen("home-tabs")
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
    setScreen("home-tabs")
    Alert.alert("Dev Tools", "Local profile, scores, and unlocks were reset.")
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
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
      <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
        <StatusBar style="light" />
        {screen === "home-tabs" && profile && (
          <HomeTabs
            profile={profile}
            onStartMission={handleStartMission}
            onShowProfileModal={() => setShowProfileModal(true)}
            requestedTab={requestedHomeTab}
            onRequestedTabHandled={() => setRequestedHomeTab(null)}
            learnFocusCipherType={learnFocusCipherType}
            learnFocusSignal={learnFocusSignal}
          />
        )}

        {screen === "intro" && <IntroScreen onComplete={handleIntroComplete} />}

        {screen === "world-map" && (
          <WorldScreen
            onBack={() => setScreen("home-tabs")}
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
            onBack={() => setScreen("home-tabs")}
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
            onOpenCipherGuide={openCipherGuide}
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
