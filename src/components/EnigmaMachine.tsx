import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { ENIGMA_REFLECTORS, ENIGMA_ROTORS } from "../ciphers"

export interface EnigmaState {
  rotors: string[]
  positions: number[]
  plugboard: Record<string, string>
}

interface EnigmaMachineProps {
  onEncrypt: (char: string, newState: EnigmaState) => void
  initialState?: EnigmaState
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function EnigmaMachine({
  onEncrypt,
  initialState = {
    rotors: ["I", "II", "III"],
    positions: [0, 0, 0],
    plugboard: {},
  },
}: EnigmaMachineProps) {
  const [state, setState] = useState<EnigmaState>(initialState)
  const [lastOutput, setLastOutput] = useState("")

  const rotorTypes = useMemo(() => Object.keys(ENIGMA_ROTORS), [])

  const stepRotors = (positions: number[], rotors: string[]) => {
    let [p1, p2, p3] = [...positions]
    const r2 = ENIGMA_ROTORS[rotors[1] as keyof typeof ENIGMA_ROTORS]
    const r3 = ENIGMA_ROTORS[rotors[2] as keyof typeof ENIGMA_ROTORS]

    p3 = (p3 + 1) % 26
    if (ALPHABET[p3 === 0 ? 25 : p3 - 1] === r3.notch) {
      p2 = (p2 + 1) % 26
      if (ALPHABET[p2 === 0 ? 25 : p2 - 1] === r2.notch) {
        p1 = (p1 + 1) % 26
      }
    }
    return [p1, p2, p3]
  }

  const encryptChar = (
    char: string,
    currentState: EnigmaState,
  ): { outChar: string; nextPositions: number[] } | null => {
    const { rotors, positions, plugboard } = currentState
    let c = char.toUpperCase()
    if (!ALPHABET.includes(c)) return null

    const nextPositions = stepRotors(positions, rotors)
    const [p1, p2, p3] = nextPositions

    if (plugboard[c]) c = plugboard[c]

    const getVal = (ch: string) => ch.charCodeAt(0) - 65
    const fromVal = (v: number) =>
      String.fromCharCode((((v % 26) + 26) % 26) + 65)

    let v = getVal(c)

    const r1 = ENIGMA_ROTORS[rotors[0] as keyof typeof ENIGMA_ROTORS]
    const r2 = ENIGMA_ROTORS[rotors[1] as keyof typeof ENIGMA_ROTORS]
    const r3 = ENIGMA_ROTORS[rotors[2] as keyof typeof ENIGMA_ROTORS]
    const reflector = ENIGMA_REFLECTORS.B

    const forward = (val: number, rotor: { wiring: string }, pos: number) => {
      const input = (val + pos) % 26
      const output = getVal(rotor.wiring[input])
      return (output - pos + 26) % 26
    }

    const reverse = (val: number, rotor: { wiring: string }, pos: number) => {
      const input = (val + pos) % 26
      const output = rotor.wiring.indexOf(fromVal(input))
      return (output - pos + 26) % 26
    }

    v = forward(v, r3, p3)
    v = forward(v, r2, p2)
    v = forward(v, r1, p1)

    v = getVal(reflector[v])

    v = reverse(v, r1, p1)
    v = reverse(v, r2, p2)
    v = reverse(v, r3, p3)

    let outChar = fromVal(v)
    if (plugboard[outChar]) outChar = plugboard[outChar]

    return { outChar, nextPositions }
  }

  const pressKey = (char: string) => {
    const result = encryptChar(char, state)
    if (!result) return
    const newState = { ...state, positions: result.nextPositions }
    setState(newState)
    setLastOutput(result.outChar)
    onEncrypt(char, newState)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rotor Positions</Text>
      <View style={styles.row}>
        {state.positions.map((position, index) => (
          <View key={`${index}-${position}`} style={styles.rotorCard}>
            <Text style={styles.rotorType}>{state.rotors[index]}</Text>
            <Text style={styles.rotorValue}>{ALPHABET[position]}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.tinyButton}
                onPress={() => {
                  const updated = [...state.positions]
                  updated[index] = (updated[index] + 25) % 26
                  setState({ ...state, positions: updated })
                }}
              >
                <Text style={styles.tinyButtonText}>-</Text>
              </Pressable>
              <Pressable
                style={styles.tinyButton}
                onPress={() => {
                  const updated = [...state.positions]
                  updated[index] = (updated[index] + 1) % 26
                  setState({ ...state, positions: updated })
                }}
              >
                <Text style={styles.tinyButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Rotor Type</Text>
      <View style={styles.rowWrap}>
        {rotorTypes.map((type) => (
          <Pressable
            key={type}
            style={styles.typeChip}
            onPress={() => {
              const rotors = [...state.rotors]
              rotors[2] = type
              setState({ ...state, rotors })
            }}
          >
            <Text style={styles.typeChipText}>{type}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Input Matrix</Text>
      <View style={styles.rowWrap}>
        {ALPHABET.map((char) => (
          <Pressable
            key={char}
            style={styles.key}
            onPress={() => pressKey(char)}
          >
            <Text style={styles.keyText}>{char}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.output}>Lampboard Output: {lastOutput || "..."}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#09131a",
    borderColor: "#2e5768",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    shadowColor: "#50f4b2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  label: {
    color: "#84aeb8",
    fontSize: 11,
    marginBottom: 8,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  row: { flexDirection: "row", gap: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  rotorCard: {
    flex: 1,
    backgroundColor: "#0a171f",
    borderColor: "#2b4f5e",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  rotorType: { color: "#89f2c2", fontWeight: "800", letterSpacing: 0.5 },
  rotorValue: {
    color: "#d8ffe9",
    fontSize: 20,
    fontWeight: "900",
    marginVertical: 6,
  },
  tinyButton: {
    backgroundColor: "#10202a",
    borderColor: "#355766",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tinyButtonText: { color: "#d8ffe9", fontWeight: "800" },
  typeChip: {
    backgroundColor: "#0f1d26",
    borderColor: "#2b4f5e",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeChipText: { color: "#d4e8ef", fontSize: 12, fontWeight: "700" },
  key: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderColor: "#2f5868",
    borderWidth: 1,
    backgroundColor: "#0b1820",
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { color: "#d8ffe9", fontWeight: "800", fontSize: 11 },
  output: {
    color: "#6affbc",
    marginTop: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontSize: 11,
  },
})
