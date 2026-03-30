import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { UserProfile } from "../types";
import { appStyles as styles } from "./appStyles";

export function ProfileModal({
  visible,
  profile,
  onClose,
  onSave,
  onUpgrade,
}: {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (displayName: string) => Promise<void>;
  onUpgrade: () => Promise<void>;
}) {
  const [name, setName] = useState(profile?.displayName || "");

  useEffect(() => {
    setName(profile?.displayName || "");
  }, [profile?.displayName]);

  if (!profile) return null;

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
  );
}
