import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { EnigmaMachine, EnigmaState } from "./EnigmaMachine";
import { Level, UserProfile } from "../types";
import { appStyles as styles } from "./appStyles";
import { Header } from "./Header";

export function GameScreen({
  level,
  profile,
  onBack,
  onComplete,
  onUpdateProfile,
}: {
  level: Level;
  profile: UserProfile;
  onBack: () => void;
  onComplete: (elapsed: number) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}) {
  const [guess, setGuess] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (adTimer <= 0) return;
    const id = setInterval(() => {
      setAdTimer((value) => {
        if (value <= 1) {
          setShowHint(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [adTimer]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const submit = async () => {
    if (guess.trim().toUpperCase() !== level.plaintext.toUpperCase()) {
      Alert.alert("Incorrect", "Try again.");
      return;
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
    };
    onUpdateProfile(updated);
    await onComplete(elapsed);
    onBack();
  };

  return (
    <ScrollView
      style={styles.topScreenPad}
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
  );
}
