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

export const CIPHER_MIN_LENGTH: Record<CipherType, number> = {
  caesar: 25,
  atbash: 15,
  vigenere: 150,
  railfence: 75,
  polybius: 60,
  monoalphabetic: 120,
  playfair: 225,
  affine: 40,
  beaufort: 180,
  columnar: 150,
  hill: 300,
  enigma: 300,
}

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
  | "home-tabs"
  | "intro"
  | "world-map"
  | "country-view"
  | "cipher-info"
  | "game"
  | "leaderboard"
  | "daily-selector"

export type HomeTab =
  | "missions"
  | "challenges"
  | "leaderboard"
  | "profile"
  | "learn"
