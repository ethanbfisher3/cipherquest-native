import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { INTRO_STORY } from "../constants";
import { appStyles as styles } from "./appStyles";

export function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = INTRO_STORY[step];

  return (
    <View style={styles.bottomScreenPad}>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.body}>{current.text}</Text>
      <Text style={styles.muted}>
        {step + 1} / {INTRO_STORY.length}
      </Text>
      <Pressable
        style={[styles.button, styles.primaryButton]}
        onPress={() => {
          if (step < INTRO_STORY.length - 1) setStep((s) => s + 1);
          else onComplete();
        }}
      >
        <Text style={styles.primaryButtonText}>
          {step < INTRO_STORY.length - 1 ? "Next" : "Begin Mission"}
        </Text>
      </Pressable>
    </View>
  );
}
