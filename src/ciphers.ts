/**
 * Modular cipher algorithms for CipherQuest
 */

export const caesarCipher = (text: string, shift: number, decrypt = false): string => {
  const s = decrypt ? (26 - (shift % 26)) % 26 : shift % 26;
  return text
    .split('')
    .map((char) => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const base = code >= 65 && code <= 90 ? 65 : 97;
        return String.fromCharCode(((code - base + s) % 26) + base);
      }
      return char;
    })
    .join('');
};

export const atbashCipher = (text: string): string => {
  return text
    .split('')
    .map((char) => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const isUpper = code >= 65 && code <= 90;
        const base = isUpper ? 65 : 97;
        const offset = code - base;
        return String.fromCharCode(base + (25 - offset));
      }
      return char;
    })
    .join('');
};

export const vigenereCipher = (text: string, key: string, decrypt = false): string => {
  let result = '';
  let keyIndex = 0;
  const k = key.toLowerCase();

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char.match(/[a-z]/i)) {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const base = isUpper ? 65 : 97;
      
      const shift = k[keyIndex % k.length].charCodeAt(0) - 97;
      const s = decrypt ? (26 - shift) % 26 : shift;
      
      result += String.fromCharCode(((code - base + s) % 26) + base);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
};

export const railFenceCipher = (text: string, rails: number, decrypt = false): string => {
  if (rails <= 1) return text;
  const cleanText = text.replace(/[^a-z]/gi, '').toUpperCase();
  const result: string[] = new Array(cleanText.length);
  
  if (!decrypt) {
    let rail = 0;
    let direction = 1;
    const fence: string[][] = Array.from({ length: rails }, () => []);
    
    for (const char of cleanText) {
      fence[rail].push(char);
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    return fence.flat().join('');
  } else {
    // Basic decryption for Rail Fence is complex, but for the game we usually just need encryption
    // However, let's implement it for completeness
    const pattern: number[][] = Array.from({ length: rails }, () => new Array(cleanText.length).fill(null));
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < cleanText.length; i++) {
      pattern[rail][i] = 0;
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    
    let index = 0;
    for (let r = 0; r < rails; r++) {
      for (let c = 0; c < cleanText.length; c++) {
        if (pattern[r][c] === 0) pattern[r][c] = cleanText.charCodeAt(index++);
      }
    }
    
    let decrypted = '';
    rail = 0;
    direction = 1;
    for (let i = 0; i < cleanText.length; i++) {
      decrypted += String.fromCharCode(pattern[rail][i]);
      rail += direction;
      if (rail === 0 || rail === rails - 1) direction *= -1;
    }
    return decrypted;
  }
};

export const polybiusSquare = (text: string, decrypt = false): string => {
  const square = [
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'I', 'K'], // I and J are usually combined
    ['L', 'M', 'N', 'O', 'P'],
    ['Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z']
  ];
  
  const cleanText = text.replace(/[^a-z]/gi, '').toUpperCase().replace(/J/g, 'I');
  
  if (!decrypt) {
    let result = '';
    for (const char of cleanText) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (square[r][c] === char) {
            result += `${r + 1}${c + 1}`;
          }
        }
      }
    }
    return result;
  } else {
    let result = '';
    for (let i = 0; i < text.length; i += 2) {
      const r = parseInt(text[i]) - 1;
      const c = parseInt(text[i + 1]) - 1;
      if (square[r] && square[r][c]) {
        result += square[r][c];
      }
    }
    return result;
  }
};

export const monoalphabeticCipher = (text: string, alphabet: string, decrypt = false): string => {
  const standard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const map: Record<string, string> = {};
  
  if (!decrypt) {
    for (let i = 0; i < 26; i++) map[standard[i]] = alphabet[i];
  } else {
    for (let i = 0; i < 26; i++) map[alphabet[i]] = standard[i];
  }

  return text.toUpperCase().split('').map(char => map[char] || char).join('');
};

export const playfairCipher = (text: string, key: string, decrypt = false): string => {
  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // No J
  let keyString = (key.toUpperCase().replace(/J/g, 'I') + alphabet)
    .split('')
    .filter((item, pos, self) => self.indexOf(item) === pos)
    .join('');
    
  const square: string[][] = [];
  for (let i = 0; i < 5; i++) {
    square.push(keyString.slice(i * 5, i * 5 + 5).split(''));
  }

  const findPos = (char: string) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (square[r][c] === char) return [r, c];
      }
    }
    return [0, 0];
  };

  let cleanText = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  let pairs: string[] = [];
  for (let i = 0; i < cleanText.length; i += 2) {
    let a = cleanText[i];
    let b = cleanText[i + 1] || 'X';
    if (a === b) {
      pairs.push(a + 'X');
      i--;
    } else {
      pairs.push(a + b);
    }
  }

  return pairs.map(pair => {
    const [r1, c1] = findPos(pair[0]);
    const [r2, c2] = findPos(pair[1]);
    let nr1, nc1, nr2, nc2;

    if (r1 === r2) {
      nc1 = (c1 + (decrypt ? 4 : 1)) % 5;
      nc2 = (c2 + (decrypt ? 4 : 1)) % 5;
      nr1 = r1; nr2 = r2;
    } else if (c1 === c2) {
      nr1 = (r1 + (decrypt ? 4 : 1)) % 5;
      nr2 = (r2 + (decrypt ? 4 : 1)) % 5;
      nc1 = c1; nc2 = c2;
    } else {
      nr1 = r1; nc1 = c2;
      nr2 = r2; nc2 = c1;
    }
    return square[nr1][nc1] + square[nr2][nc2];
  }).join('');
};

export const affineCipher = (text: string, a: number, b: number, decrypt = false): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  // Find modular multiplicative inverse of a mod 26
  const findInverse = (a: number) => {
    for (let x = 1; x < 26; x++) {
      if ((a * x) % 26 === 1) return x;
    }
    return 1;
  };

  const aInv = findInverse(a);

  return text.toUpperCase().split('').map(char => {
    const index = alphabet.indexOf(char);
    if (index === -1) return char;
    
    if (!decrypt) {
      return alphabet[(a * index + b) % 26];
    } else {
      let val = (aInv * (index - b)) % 26;
      if (val < 0) val += 26;
      return alphabet[val];
    }
  }).join('');
};

export const beaufortCipher = (text: string, key: string): string => {
  let result = '';
  let keyIndex = 0;
  const k = key.toUpperCase();
  const t = text.toUpperCase();

  for (let i = 0; i < t.length; i++) {
    const char = t[i];
    if (char.match(/[A-Z]/)) {
      const p = char.charCodeAt(0) - 65;
      const kVal = k[keyIndex % k.length].charCodeAt(0) - 65;
      
      // Beaufort: C = (K - P) mod 26
      let c = (kVal - p) % 26;
      if (c < 0) c += 26;
      
      result += String.fromCharCode(c + 65);
      keyIndex++;
    } else {
      result += char;
    }
  }
  return result;
};

export const columnarTransposition = (text: string, key: string): string => {
  const cleanText = text.replace(/[^A-Z]/gi, '').toUpperCase();
  const k = key.toUpperCase();
  const numCols = k.length;
  const numRows = Math.ceil(cleanText.length / numCols);
  
  // Create grid
  const grid: string[][] = Array.from({ length: numRows }, () => new Array(numCols).fill('X'));
  for (let i = 0; i < cleanText.length; i++) {
    grid[Math.floor(i / numCols)][i % numCols] = cleanText[i];
  }
  
  // Get column order based on key
  const keyOrder = k.split('').map((char, i) => ({ char, i }))
    .sort((a, b) => a.char.localeCompare(b.char) || a.i - b.i)
    .map(item => item.i);
    
  let result = '';
  for (const col of keyOrder) {
    for (let row = 0; row < numRows; row++) {
      result += grid[row][col];
    }
  }
  return result;
};

export const hillCipher = (text: string, matrix: number[][]): string => {
  const cleanText = text.replace(/[^A-Z]/gi, '').toUpperCase();
  if (cleanText.length % 2 !== 0) return hillCipher(cleanText + 'X', matrix);
  
  let result = '';
  for (let i = 0; i < cleanText.length; i += 2) {
    const p1 = cleanText.charCodeAt(i) - 65;
    const p2 = cleanText.charCodeAt(i + 1) - 65;
    
    const c1 = (matrix[0][0] * p1 + matrix[0][1] * p2) % 26;
    const c2 = (matrix[1][0] * p1 + matrix[1][1] * p2) % 26;
    
    result += String.fromCharCode(c1 + 65) + String.fromCharCode(c2 + 65);
  }
  return result;
};

export const ENIGMA_ROTORS = {
  I: { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q" },
  II: { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E" },
  III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V" },
  IV: { wiring: "ESOVPZJAYQUIRHXLNFTGKDCMWB", notch: "J" },
  V: { wiring: "VZBRGITYUPSDNHLXAWMJQOFECK", notch: "Z" }
};

export const ENIGMA_REFLECTORS = {
  B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
  C: "FVPJIAOYEDRZRKGXUHTSBMQNCL" // Note: This is a simplified C
};

export const enigmaCipher = (text: string, params: { 
  rotors: string[], 
  positions: number[], 
  plugboard: Record<string, string> 
}): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  let [p1, p2, p3] = params.positions;
  const r1 = ENIGMA_ROTORS[params.rotors[0] as keyof typeof ENIGMA_ROTORS];
  const r2 = ENIGMA_ROTORS[params.rotors[1] as keyof typeof ENIGMA_ROTORS];
  const r3 = ENIGMA_ROTORS[params.rotors[2] as keyof typeof ENIGMA_ROTORS];
  const reflector = ENIGMA_REFLECTORS.B;

  const getCharValue = (char: string) => char.charCodeAt(0) - 65;
  const fromCharValue = (val: number) => String.fromCharCode(((val % 26) + 26) % 26 + 65);

  const processChar = (char: string) => {
    if (!char.match(/[A-Z]/i)) return char;
    let c = char.toUpperCase();

    // 1. Step rotors
    p3 = (p3 + 1) % 26;
    if (fromCharValue(p3 - 1) === r3.notch) {
      p2 = (p2 + 1) % 26;
      if (fromCharValue(p2 - 1) === r2.notch) {
        p1 = (p1 + 1) % 26;
      }
    }

    // 2. Plugboard
    if (params.plugboard[c]) c = params.plugboard[c];

    let v = getCharValue(c);

    // 3. Rotors Forward (3 -> 2 -> 1)
    const forward = (val: number, rotor: any, pos: number) => {
      let input = (val + pos) % 26;
      let output = getCharValue(rotor.wiring[input]);
      return (output - pos + 26) % 26;
    };

    v = forward(v, r3, p3);
    v = forward(v, r2, p2);
    v = forward(v, r1, p1);

    // 4. Reflector
    v = getCharValue(reflector[v]);

    // 5. Rotors Reverse (1 -> 2 -> 3)
    const reverse = (val: number, rotor: any, pos: number) => {
      let input = (val + pos) % 26;
      let output = rotor.wiring.indexOf(fromCharValue(input));
      return (output - pos + 26) % 26;
    };

    v = reverse(v, r1, p1);
    v = reverse(v, r2, p2);
    v = reverse(v, r3, p3);

    // 6. Plugboard
    let outChar = fromCharValue(v);
    if (params.plugboard[outChar]) outChar = params.plugboard[outChar];

    return outChar;
  };

  for (const char of text) {
    result += processChar(char);
  }

  return result;
};

export type CipherMethod = 'caesar' | 'atbash' | 'vigenere' | 'railfence' | 'polybius' | 'monoalphabetic' | 'playfair' | 'affine' | 'beaufort' | 'columnar' | 'hill' | 'enigma';

export const encrypt = (text: string, method: CipherMethod, params?: any): string => {
  switch (method) {
    case 'caesar':
      return caesarCipher(text, params?.shift || 3);
    case 'atbash':
      return atbashCipher(text);
    case 'vigenere':
      return vigenereCipher(text, params?.key || 'key');
    case 'railfence':
      return railFenceCipher(text, params?.rails || 2);
    case 'polybius':
      return polybiusSquare(text);
    case 'monoalphabetic':
      return monoalphabeticCipher(text, params?.alphabet || "QWERTYUIOPASDFGHJKLZXCVBNM");
    case 'playfair':
      return playfairCipher(text, params?.key || "KEYWORD");
    case 'affine':
      return affineCipher(text, params?.a || 5, params?.b || 8);
    case 'beaufort':
      return beaufortCipher(text, params?.key || "KEY");
    case 'columnar':
      return columnarTransposition(text, params?.key || "KEY");
    case 'hill':
      return hillCipher(text, params?.matrix || [[3, 3], [2, 5]]);
    case 'enigma':
      return enigmaCipher(text, params || { rotors: ['I', 'II', 'III'], positions: [0, 0, 0], plugboard: {} });
    default:
      return text;
  }
};

export const decrypt = (text: string, method: CipherMethod, params?: any): string => {
  switch (method) {
    case 'caesar':
      return caesarCipher(text, params?.shift || 3, true);
    case 'atbash':
      return atbashCipher(text);
    case 'vigenere':
      return vigenereCipher(text, params?.key || 'key', true);
    case 'railfence':
      return railFenceCipher(text, params?.rails || 2, true);
    case 'polybius':
      return polybiusSquare(text, true);
    case 'enigma':
      return enigmaCipher(text, params || { rotors: ['I', 'II', 'III'], positions: [0, 0, 0], plugboard: {} });
    default:
      return text;
  }
};
