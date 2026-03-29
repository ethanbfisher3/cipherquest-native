export type CipherType =
  | "caesar"
  | "atbash"
  | "vigenere"
  | "railfence"
  | "polybius"
  | "monoalphabetic"
  | "playfair"
  | "affine"
  | "beaufort"
  | "columnar"
  | "hill"
  | "enigma"

export interface Level {
  id: string
  countryId: string
  name: string
  cipherType: CipherType
  plaintext: string
  ciphertext: string
  hint: string
  difficulty: "Easy" | "Medium" | "Hard"
  params?: any
  isDaily?: boolean
  isProLevel?: boolean
  isTutorial?: boolean
  xpReward: number
}

export interface UserProfile {
  displayName: string
  photoURL?: string
  createdAt: string
  totalScore: number
  xp: number
  level: number
  unlockedCount: number
  dailyWins: number
  isPro?: boolean
  hasSeenIntro?: boolean
  missionProgress?: Record<
    string,
    {
      accumulatedTime: number
      lastAttemptDate: string
    }
  >
}

export interface Score {
  displayName: string
  levelId: string
  cipherType: CipherType
  timeInSeconds: number
  createdAt: string
}

export interface Country {
  id: string
  name: string
  description: string
  x: number // Percentage for map positioning
  y: number // Percentage for map positioning
  color: string
  path: string // SVG path for the country shape
  population?: string
  capital?: string
  threatLevel?: "Low" | "Medium" | "High" | "Critical"
  encryptionStandard?: string
}

export type AppScreen =
  | "menu"
  | "intro"
  | "world-map"
  | "country-view"
  | "cipher-info"
  | "game"
  | "leaderboard"
  | "daily-selector"
