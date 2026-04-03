import React, { useEffect, useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native"
import { EnigmaMachine, EnigmaState } from "./EnigmaMachine"
import { CipherWorkbench } from "./CipherWorkbench"
import { showRewardedHintAd } from "./RewardedHintAd"
import { Level, UserProfile } from "../types"
import { appStyles as styles } from "./appStyles"
import { Header } from "./Header"

export function GameScreen({
  level,
  profile,
  onBack,
  onComplete,
  onUpdateProfile,
  onOpenCipherGuide,
}: {
  level: Level
  profile: UserProfile
  onBack: () => void
  onComplete: (elapsed: number) => void
  onUpdateProfile: (profile: UserProfile) => void
  onOpenCipherGuide: (cipherType: Level["cipherType"]) => void
}) {
  const [guess, setGuess] = useState("")
  const [showHint, setShowHint] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [loadingRewardedAd, setLoadingRewardedAd] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

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

  const requestHint = async () => {
    if (profile.isPro) {
      setShowHint(true)
      return
    }

    if (loadingRewardedAd) return

    setLoadingRewardedAd(true)
    try {
      const rewarded = await showRewardedHintAd()
      if (rewarded) {
        setShowHint(true)
        return
      }
      Alert.alert("Hint Locked", "Finish the rewarded ad to unlock the hint.")
    } catch {
      Alert.alert(
        "Ad Error",
        "Unable to load rewarded ad right now. Try again.",
      )
    } finally {
      setLoadingRewardedAd(false)
    }
  }

  return (
    <ScrollView
      style={styles.topScreenPad}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <Header title={level.name} onBack={onBack} />
      <View
        style={{
          borderWidth: 1,
          borderColor: "#264958",
          backgroundColor: "#0a131a",
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 10,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: "#6affbc",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.9,
            marginBottom: 3,
          }}
        >
          Decryption Timer
        </Text>
        <Text style={styles.muted}>{formatTime(elapsed)}</Text>
      </View>
      <Text style={styles.label}>Encrypted Payload</Text>
      <View style={styles.cipherBox}>
        <Text style={styles.cipherText}>{level.ciphertext}</Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#2d5a6a",
          backgroundColor: "#08131a",
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 10,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: "#8ab6c2",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 2,
          }}
        >
          Active Mechanism
        </Text>
        <Text
          style={{
            color: "#6affbc",
            fontSize: 13,
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {level.cipherType}
        </Text>

        <Pressable
          onPress={() => onOpenCipherGuide(level.cipherType)}
          style={{
            marginTop: 8,
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: "#4ecfa1",
            backgroundColor: "#143327",
            borderRadius: 999,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{
              color: "#cffff0",
              fontSize: 11,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            Learn this cipher
          </Text>
        </Pressable>
      </View>

      {level.cipherType === "enigma" ? (
        <EnigmaMachine
          initialState={level.params as EnigmaState | undefined}
          onEncrypt={(char) => setGuess((prev) => `${prev}${char}`)}
        />
      ) : null}

      <CipherWorkbench level={level} onApplyText={setGuess} />

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
          style={[
            styles.button,
            loadingRewardedAd ? { opacity: 0.7 } : undefined,
          ]}
          onPress={requestHint}
          disabled={loadingRewardedAd}
        >
          <Text style={styles.buttonText}>
            {profile.isPro
              ? "Show Hint"
              : loadingRewardedAd
                ? "Loading Ad..."
                : "Watch Ad for Hint"}
          </Text>
        </Pressable>
      )}

      <Pressable style={[styles.button, styles.primaryButton]} onPress={submit}>
        <Text style={styles.primaryButtonText}>Decipher Signal</Text>
      </Pressable>
    </ScrollView>
  )
}
