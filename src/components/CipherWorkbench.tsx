import React, { useMemo, useState } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import {
  affineCipher,
  atbashCipher,
  beaufortCipher,
  caesarCipher,
  columnarTransposition,
  hillCipher,
  monoalphabeticCipher,
  playfairCipher,
  polybiusSquare,
  railFenceCipher,
  vigenereCipher,
} from "../ciphers"
import { Level } from "../types"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25]

function sanitizeAlpha(text: string) {
  return text.toUpperCase().replace(/[^A-Z]/g, "")
}

function getPlayfairSquare(key: string) {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
  const keyString = (key.toUpperCase().replace(/J/g, "I") + alphabet)
    .split("")
    .filter((item, pos, self) => self.indexOf(item) === pos)
    .join("")

  const rows: string[][] = []
  for (let i = 0; i < 5; i++) {
    rows.push(keyString.slice(i * 5, i * 5 + 5).split(""))
  }
  return rows
}

function getColumnOrder(key: string) {
  return key
    .toUpperCase()
    .split("")
    .map((char, i) => ({ char, i }))
    .sort((a, b) => a.char.localeCompare(b.char) || a.i - b.i)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
}

export function CipherWorkbench({
  level,
  onApplyText,
}: {
  level: Level
  onApplyText: (text: string) => void
}) {
  const params = level.params || {}

  const [caesarShift, setCaesarShift] = useState(
    Number.isFinite(params.shift) ? params.shift : 3,
  )
  const [vigKey, setVigKey] = useState(params.key || "KEY")
  const [beaufortKey, setBeaufortKey] = useState(params.key || "KEY")
  const [rails, setRails] = useState(
    Number.isFinite(params.rails) ? params.rails : 3,
  )
  const [monoKey, setMonoKey] = useState(
    sanitizeAlpha(params.alphabet || "QWERTYUIOPASDFGHJKLZXCVBNM")
      .padEnd(26, "A")
      .slice(0, 26),
  )
  const [playfairKey, setPlayfairKey] = useState(params.key || "KEYWORD")
  const [a, setA] = useState(VALID_A.includes(params.a) ? params.a : 5)
  const [b, setB] = useState(Number.isFinite(params.b) ? params.b : 8)
  const [columnarKey, setColumnarKey] = useState(params.key || "KEY")
  const [hillMatrixText, setHillMatrixText] = useState(
    Array.isArray(params.matrix) && params.matrix.length === 2
      ? `${params.matrix[0][0]},${params.matrix[0][1]};${params.matrix[1][0]},${params.matrix[1][1]}`
      : "3,3;2,5",
  )
  const [sandboxText, setSandboxText] = useState("")

  const vigenereGrid = useMemo(() => {
    return Array.from({ length: 26 }, (_, row) => {
      return Array.from({ length: 26 }, (_, col) => {
        return ALPHABET[(row + col) % 26]
      })
    })
  }, [])

  const polybiusGrid = [
    ["A", "B", "C", "D", "E"],
    ["F", "G", "H", "I/J", "K"],
    ["L", "M", "N", "O", "P"],
    ["Q", "R", "S", "T", "U"],
    ["V", "W", "X", "Y", "Z"],
  ]

  const decryptedByType = useMemo(() => {
    const text = level.ciphertext
    switch (level.cipherType) {
      case "caesar":
        return caesarCipher(text, ((caesarShift % 26) + 26) % 26, true)
      case "atbash":
        return atbashCipher(text)
      case "vigenere":
        return vigenereCipher(text, sanitizeAlpha(vigKey) || "A", true)
      case "railfence":
        return railFenceCipher(text, Math.max(2, rails), true)
      case "polybius":
        return polybiusSquare(text, true)
      case "monoalphabetic": {
        const key = sanitizeAlpha(monoKey).padEnd(26, "A").slice(0, 26)
        return monoalphabeticCipher(text, key, true)
      }
      case "playfair":
        return playfairCipher(text, sanitizeAlpha(playfairKey) || "KEY", true)
      case "affine":
        return affineCipher(text, a, ((b % 26) + 26) % 26, true)
      case "beaufort":
        return beaufortCipher(text, sanitizeAlpha(beaufortKey) || "A")
      default:
        return ""
    }
  }, [
    a,
    b,
    beaufortKey,
    caesarShift,
    level.cipherType,
    level.ciphertext,
    monoKey,
    playfairKey,
    rails,
    vigKey,
  ])

  const parsedHillMatrix = useMemo(() => {
    const parts = hillMatrixText.split(";")
    if (parts.length !== 2) return null
    const row1 = parts[0].split(",").map((n) => Number(n.trim()))
    const row2 = parts[1].split(",").map((n) => Number(n.trim()))
    if (row1.length !== 2 || row2.length !== 2) return null
    if ([...row1, ...row2].some((n) => Number.isNaN(n))) return null
    return [row1, row2] as number[][]
  }, [hillMatrixText])

  const sandboxCiphertext = useMemo(() => {
    const clean = sandboxText.toUpperCase()
    switch (level.cipherType) {
      case "columnar":
        return columnarTransposition(clean, sanitizeAlpha(columnarKey) || "KEY")
      case "hill":
        return parsedHillMatrix
          ? hillCipher(clean, parsedHillMatrix)
          : "INVALID MATRIX"
      default:
        return ""
    }
  }, [columnarKey, level.cipherType, parsedHillMatrix, sandboxText])

  const targetCipher = sanitizeAlpha(level.ciphertext)
  const sandboxMatches =
    sanitizeAlpha(sandboxCiphertext) === targetCipher && targetCipher.length > 0

  const showAutoDecode = [
    "caesar",
    "atbash",
    "vigenere",
    "railfence",
    "polybius",
    "monoalphabetic",
    "playfair",
    "affine",
    "beaufort",
  ].includes(level.cipherType)

  return (
    <View style={local.panel}>
      <Text style={local.panelTitle}>Cipher Workbench</Text>
      <Text style={local.panelMeta}>
        Mechanism for {level.cipherType.toUpperCase()}
      </Text>

      {level.cipherType === "caesar" && (
        <>
          <Text style={local.label}>Shift Control</Text>
          <View style={local.row}>
            <Pressable
              style={local.smallBtn}
              onPress={() => setCaesarShift((s: number) => (s + 25) % 26)}
            >
              <Text style={local.smallBtnText}>-</Text>
            </Pressable>
            <Text style={local.value}>Shift {caesarShift}</Text>
            <Pressable
              style={local.smallBtn}
              onPress={() => setCaesarShift((s: number) => (s + 1) % 26)}
            >
              <Text style={local.smallBtnText}>+</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
          >
            <View>
              <View style={local.mapRow}>
                {ALPHABET.split("").map((char) => (
                  <Text key={`c-${char}`} style={local.mapCell}>
                    {char}
                  </Text>
                ))}
              </View>
              <View style={local.mapRow}>
                {ALPHABET.split("").map((char, idx) => (
                  <Text
                    key={`s-${char}`}
                    style={[local.mapCell, local.mapCellAccent]}
                  >
                    {ALPHABET[(idx + caesarShift) % 26]}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {level.cipherType === "atbash" && (
        <>
          <Text style={local.label}>Reversed Alphabet Map</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={local.mapRow}>
                {ALPHABET.split("").map((c) => (
                  <Text key={`a-${c}`} style={local.mapCell}>
                    {c}
                  </Text>
                ))}
              </View>
              <View style={local.mapRow}>
                {ALPHABET.split("").map((_, i) => (
                  <Text
                    key={`b-${i}`}
                    style={[local.mapCell, local.mapCellAccent]}
                  >
                    {ALPHABET[25 - i]}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {level.cipherType === "vigenere" && (
        <>
          <Text style={local.label}>Keyword</Text>
          <TextInput
            value={vigKey}
            onChangeText={setVigKey}
            autoCapitalize="characters"
            style={local.input}
            placeholder="KEY"
            placeholderTextColor="#6f8b95"
          />
          <Text style={local.label}>Tabula Recta</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {vigenereGrid.map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={local.mapRow}>
                  {row.map((char, colIdx) => (
                    <Text
                      key={`cell-${rowIdx}-${colIdx}`}
                      style={[
                        local.gridCell,
                        rowIdx === 0 || colIdx === 0
                          ? local.mapCellAccent
                          : undefined,
                      ]}
                    >
                      {char}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {level.cipherType === "polybius" && (
        <>
          <Text style={local.label}>Polybius Grid (I/J merged)</Text>
          <View style={local.polyGridWrap}>
            {polybiusGrid.map((row, r) => (
              <View key={`poly-${r}`} style={local.row}>
                {row.map((item, c) => (
                  <View key={`poly-${r}-${c}`} style={local.polyCell}>
                    <Text style={local.polyCoord}>{`${r + 1}${c + 1}`}</Text>
                    <Text style={local.polyChar}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </>
      )}

      {level.cipherType === "monoalphabetic" && (
        <>
          <Text style={local.label}>Substitution Alphabet (26 letters)</Text>
          <TextInput
            value={monoKey}
            onChangeText={(next) =>
              setMonoKey(sanitizeAlpha(next).slice(0, 26))
            }
            autoCapitalize="characters"
            style={local.input}
            placeholder="QWERTYUIOPASDFGHJKLZXCVBNM"
            placeholderTextColor="#6f8b95"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={local.mapRow}>
                {ALPHABET.split("").map((c) => (
                  <Text key={`std-${c}`} style={local.mapCell}>
                    {c}
                  </Text>
                ))}
              </View>
              <View style={local.mapRow}>
                {ALPHABET.split("").map((_, i) => (
                  <Text
                    key={`sub-${i}`}
                    style={[local.mapCell, local.mapCellAccent]}
                  >
                    {monoKey[i] || "?"}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {level.cipherType === "playfair" && (
        <>
          <Text style={local.label}>Keyword</Text>
          <TextInput
            value={playfairKey}
            onChangeText={setPlayfairKey}
            autoCapitalize="characters"
            style={local.input}
            placeholder="KEYWORD"
            placeholderTextColor="#6f8b95"
          />
          <Text style={local.label}>5x5 Playfair Square</Text>
          <View style={local.playfairWrap}>
            {getPlayfairSquare(playfairKey).map((row, r) => (
              <View key={`pf-${r}`} style={local.row}>
                {row.map((char, c) => (
                  <View key={`pf-${r}-${c}`} style={local.playfairCell}>
                    <Text style={local.polyChar}>{char}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </>
      )}

      {level.cipherType === "railfence" && (
        <>
          <Text style={local.label}>Rails</Text>
          <View style={local.row}>
            <Pressable
              style={local.smallBtn}
              onPress={() => setRails((r: number) => Math.max(2, r - 1))}
            >
              <Text style={local.smallBtnText}>-</Text>
            </Pressable>
            <Text style={local.value}>{rails}</Text>
            <Pressable
              style={local.smallBtn}
              onPress={() => setRails((r: number) => Math.min(8, r + 1))}
            >
              <Text style={local.smallBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={local.note}>
            Try different rail counts and apply the output below.
          </Text>
        </>
      )}

      {level.cipherType === "affine" && (
        <>
          <Text style={local.label}>Affine Parameters</Text>
          <View style={local.row}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={local.row}>
                {VALID_A.map((val) => (
                  <Pressable
                    key={`a-${val}`}
                    style={[local.chip, a === val && local.chipActive]}
                    onPress={() => setA(val)}
                  >
                    <Text style={local.chipText}>a={val}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={local.row}>
            <Pressable
              style={local.smallBtn}
              onPress={() => setB((x: number) => (x + 25) % 26)}
            >
              <Text style={local.smallBtnText}>b-</Text>
            </Pressable>
            <Text style={local.value}>b={b}</Text>
            <Pressable
              style={local.smallBtn}
              onPress={() => setB((x: number) => (x + 1) % 26)}
            >
              <Text style={local.smallBtnText}>b+</Text>
            </Pressable>
          </View>
          <Text style={local.note}>Formula: D(x)=a^-1(x-b) mod 26</Text>
        </>
      )}

      {level.cipherType === "beaufort" && (
        <>
          <Text style={local.label}>Keyword</Text>
          <TextInput
            value={beaufortKey}
            onChangeText={setBeaufortKey}
            autoCapitalize="characters"
            style={local.input}
            placeholder="KEY"
            placeholderTextColor="#6f8b95"
          />
          <Text style={local.note}>
            Beaufort uses C = (K - P) mod 26 and is reciprocal.
          </Text>
        </>
      )}

      {level.cipherType === "enigma" && (
        <>
          <Text style={local.label}>Rotor Machine Active</Text>
          <Text style={local.note}>
            Use the Enigma keyboard above to generate output letter-by-letter.
            Adjust rotor positions and rotor type to align with the intercepted
            signal pattern.
          </Text>
          <Text style={local.note}>
            Mechanism path: plugboard, then rotors, then reflector, then rotors,
            then plugboard.
          </Text>
        </>
      )}

      {level.cipherType === "columnar" && (
        <>
          <Text style={local.label}>Columnar Key</Text>
          <TextInput
            value={columnarKey}
            onChangeText={setColumnarKey}
            autoCapitalize="characters"
            style={local.input}
            placeholder="KEY"
            placeholderTextColor="#6f8b95"
          />
          <Text style={local.label}>Column Read Order</Text>
          <View style={local.rowWrap}>
            {getColumnOrder(sanitizeAlpha(columnarKey) || "KEY").map(
              (entry) => (
                <View
                  key={`co-${entry.i}-${entry.char}`}
                  style={local.orderCell}
                >
                  <Text style={local.polyChar}>{entry.char}</Text>
                  <Text style={local.polyCoord}>#{entry.rank}</Text>
                </View>
              ),
            )}
          </View>
          <Text style={local.note}>
            Use the simulator below: write candidate plaintext and compare
            generated ciphertext to target.
          </Text>
        </>
      )}

      {level.cipherType === "hill" && (
        <>
          <Text style={local.label}>2x2 Key Matrix</Text>
          <TextInput
            value={hillMatrixText}
            onChangeText={setHillMatrixText}
            style={local.input}
            placeholder="3,3;2,5"
            placeholderTextColor="#6f8b95"
          />
          <Text style={local.note}>
            Format: a,b;c,d. Encrypts text in 2-letter blocks.
          </Text>
        </>
      )}

      {showAutoDecode && (
        <View style={local.outputPanel}>
          <Text style={local.label}>Workbench Output</Text>
          <Text style={local.outputText}>{decryptedByType || "..."}</Text>
          <Pressable
            style={local.applyBtn}
            onPress={() => onApplyText(decryptedByType)}
          >
            <Text style={local.applyBtnText}>Use as Answer</Text>
          </Pressable>
        </View>
      )}

      {["columnar", "hill"].includes(level.cipherType) && (
        <View style={local.outputPanel}>
          <Text style={local.label}>Cipher Simulator</Text>
          <TextInput
            value={sandboxText}
            onChangeText={setSandboxText}
            style={local.input}
            autoCapitalize="characters"
            placeholder="TRY A PLAINTEXT GUESS"
            placeholderTextColor="#6f8b95"
          />
          <Text style={local.note}>
            Generated: {sandboxCiphertext || "..."}
          </Text>
          <Text
            style={[
              local.note,
              sandboxMatches ? local.matchYes : local.matchNo,
            ]}
          >
            {sandboxText.length === 0
              ? ""
              : sandboxMatches
                ? "MATCHES TARGET CIPHERTEXT"
                : "DOES NOT MATCH TARGET"}
          </Text>
          {sandboxText.length > 0 && (
            <Pressable
              style={local.applyBtn}
              onPress={() => onApplyText(sandboxText)}
            >
              <Text style={local.applyBtnText}>Use Candidate as Answer</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}

const local = StyleSheet.create({
  panel: {
    marginTop: 12,
    backgroundColor: "#08131a",
    borderColor: "#2a4b5b",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  panelTitle: {
    color: "#cffff0",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  panelMeta: {
    color: "#7ea8b5",
    fontSize: 11,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  label: {
    color: "#94b9c4",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  value: {
    color: "#d9ffee",
    fontWeight: "800",
    fontSize: 13,
  },
  smallBtn: {
    backgroundColor: "#12222d",
    borderColor: "#2e5666",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  smallBtnText: {
    color: "#d2ecf5",
    fontWeight: "800",
  },
  mapRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  mapCell: {
    width: 22,
    textAlign: "center",
    color: "#b7d0d8",
    fontSize: 11,
    fontWeight: "700",
  },
  mapCellAccent: {
    color: "#68ffc0",
  },
  gridCell: {
    width: 18,
    textAlign: "center",
    color: "#aac7d0",
    fontSize: 10,
    marginBottom: 2,
  },
  input: {
    backgroundColor: "#0b171f",
    borderColor: "#2a4c5b",
    borderWidth: 1,
    borderRadius: 10,
    color: "#d8ffee",
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  note: {
    color: "#7fa2ae",
    fontSize: 11,
    marginTop: 6,
  },
  polyGridWrap: {
    gap: 6,
  },
  polyCell: {
    width: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#315664",
    backgroundColor: "#0f1d26",
    paddingVertical: 6,
    alignItems: "center",
  },
  polyCoord: {
    color: "#7fa4b0",
    fontSize: 10,
  },
  polyChar: {
    color: "#d8ffee",
    fontWeight: "800",
  },
  playfairWrap: {
    gap: 6,
  },
  playfairCell: {
    width: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#315664",
    backgroundColor: "#0f1d26",
    paddingVertical: 8,
    alignItems: "center",
  },
  chip: {
    borderColor: "#355868",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0f1d26",
  },
  chipActive: {
    backgroundColor: "#1f7355",
    borderColor: "#63ffc0",
  },
  chipText: {
    color: "#d8ffee",
    fontSize: 11,
    fontWeight: "700",
  },
  orderCell: {
    alignItems: "center",
    borderColor: "#315664",
    borderWidth: 1,
    backgroundColor: "#0f1d26",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 46,
  },
  outputPanel: {
    marginTop: 12,
    borderTopColor: "#1f3641",
    borderTopWidth: 1,
    paddingTop: 10,
  },
  outputText: {
    color: "#7dffc3",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  applyBtn: {
    alignSelf: "flex-start",
    borderColor: "#63ffc0",
    borderWidth: 1,
    backgroundColor: "#1f7355",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  applyBtnText: {
    color: "#031f14",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  matchYes: {
    color: "#6cffbf",
    fontWeight: "700",
  },
  matchNo: {
    color: "#f7b57a",
    fontWeight: "700",
  },
})
