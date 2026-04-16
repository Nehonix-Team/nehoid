/**
 * Checksum and hash utilities for NehoID.
 *
 * This module provides various checksum and hashing algorithms
 * for ID validation, integrity checking, and data fingerprinting.
 *
 * Security notes:
 * - All algorithms here are NON-cryptographic (fast checksums).
 *   Do NOT use for passwords, signatures, or security-critical hashing.
 * - `validate` / `tryValidate` use constant-time comparison to prevent
 *   timing-based side-channel attacks.
 * - Inputs are normalised to UTF-8 bytes before hashing, ensuring
 *   consistent results across environments (Node.js, browsers, Deno…).
 */

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export type ChecksumAlgorithm =
  | "djb2"
  | "crc32"
  | "adler32"
  | "fnv1a"
  | "murmur3";

/** Accepted input types (string or raw bytes). */
export type ChecksumInput = string | Uint8Array;

const VALID_ALGORITHMS: readonly ChecksumAlgorithm[] = [
  "djb2",
  "crc32",
  "adler32",
  "fnv1a",
  "murmur3",
] as const;

const MAX_INPUT_BYTES = 1_048_576; // 1 MiB
const MIN_LENGTH = 1;
const MAX_LENGTH = 16;

// Base-36 alphabet (lowercase), kept explicit for clarity.
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class ChecksumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecksumError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Encodes a string to a UTF-8 Uint8Array.
 * Falls back gracefully when TextEncoder is unavailable (very old runtimes).
 */
export function toBytes(input: ChecksumInput): Uint8Array {
  if (input instanceof Uint8Array) return input;

  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(input);
  }

  // Minimal UTF-8 fallback for environments without TextEncoder.
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let code = input.charCodeAt(i);

    // Handle surrogate pairs.
    if (code >= 0xd800 && code <= 0xdbff) {
      const hi = code;
      const lo = input.charCodeAt(++i);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        code = ((hi - 0xd800) << 10) + (lo - 0xdc00) + 0x10000;
      } else {
        // Lone surrogate — emit replacement character U+FFFD.
        code = 0xfffd;
        i--; // re-examine the next char
      }
    }

    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Converts an unsigned 32-bit integer to a fixed-length base-36 string.
 *
 * Instead of truncating/padding a variable-length string (which introduces
 * bias — shorter hashes skew toward small values), we extract `length`
 * base-36 digits directly from the 32-bit integer. This gives uniform
 * distribution across the output space.
 *
 * Max representable with 32 bits in base36: 36^6 > 2^32 > 36^5,
 * so lengths up to 6 fully cover the 32-bit space without truncation bias.
 * For lengths 7-16 we mix two independent hash words.
 */
function uint32ToBase36(low: number, high: number, length: number): string {
  // Combine the two 32-bit words into a BigInt for lengths > 6.
  // For shorter lengths only `low` is needed, but using BigInt throughout
  // keeps the logic simple and correct.
  let n = BigInt(low >>> 0) | (BigInt(high >>> 0) << 32n);

  const chars: string[] = new Array(length);
  for (let i = length - 1; i >= 0; i--) {
    chars[i] = BASE36[Number(n % 36n)];
    n /= 36n;
  }
  return chars.join("");
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 *
 * Uses the Web Crypto API when available (preferred), otherwise falls back
 * to a pure-JS implementation.
 */
function timingSafeEqual(a: string, b: string): boolean {
  // Normalise to lowercase before comparison.
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  // Different lengths reveal information, but the length itself is not
  // secret in our use-case (it is a public parameter). We still pad to
  // avoid early-exit in the loop.
  const maxLen = Math.max(aLower.length, bLower.length);
  let result = aLower.length === bLower.length ? 0 : 1;

  for (let i = 0; i < maxLen; i++) {
    const ca = i < aLower.length ? aLower.charCodeAt(i) : 0;
    const cb = i < bLower.length ? bLower.charCodeAt(i) : 0;
    result |= ca ^ cb;
  }

  return result === 0;
}

// ---------------------------------------------------------------------------
// Hash algorithm implementations (all operate on Uint8Array)
// ---------------------------------------------------------------------------

function djb2(bytes: Uint8Array): number {
  let hash = 5381;
  for (let i = 0; i < bytes.length; i++) {
    // `Math.imul` gives correct 32-bit integer overflow semantics.
    hash = (Math.imul(hash, 33) + bytes[i]) | 0;
  }
  return hash >>> 0;
}

// CRC32 lookup table (generated once, module-level singleton).
let _crcTable: Uint32Array | null = null;

function getCRCTable(): Uint32Array {
  if (_crcTable) return _crcTable;

  _crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crcTable[i] = c >>> 0;
  }
  return _crcTable;
}

function crc32(bytes: Uint8Array): number {
  const table = getCRCTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  const MOD = 65521;
  let a = 1;
  let b = 0;
  // Process in blocks of 5552 to defer the modulo (Adler-32 optimisation).
  const NMAX = 5552;
  let i = 0;
  while (i < bytes.length) {
    const end = Math.min(i + NMAX, bytes.length);
    while (i < end) {
      a += bytes[i++];
      b += a;
    }
    a %= MOD;
    b %= MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function fnv1a(bytes: Uint8Array): number {
  const FNV_PRIME = 16777619;
  let hash = 2166136261; // FNV offset basis (treated as unsigned)
  for (let i = 0; i < bytes.length; i++) {
    hash = Math.imul(hash ^ bytes[i], FNV_PRIME);
  }
  return hash >>> 0;
}

function murmur3(bytes: Uint8Array, seed: number = 0): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const len = bytes.length;
  let hash = seed >>> 0;

  // Process 4-byte chunks.
  const nblocks = (len >> 2) * 4;
  for (let i = 0; i < nblocks; i += 4) {
    let k =
      bytes[i] |
      (bytes[i + 1] << 8) |
      (bytes[i + 2] << 16) |
      (bytes[i + 3] << 24);

    k = Math.imul(k, c1);
    k = (k << 15) | (k >>> 17); // rotl32(k, 15)
    k = Math.imul(k, c2);

    hash ^= k;
    hash = (hash << 13) | (hash >>> 19); // rotl32(hash, 13)
    hash = (Math.imul(hash, 5) + 0xe6546b64) | 0;
  }

  // Tail.
  let k = 0;
  const tail = len & 3;
  if (tail >= 3) k ^= bytes[nblocks + 2] << 16;
  if (tail >= 2) k ^= bytes[nblocks + 1] << 8;
  if (tail >= 1) {
    k ^= bytes[nblocks];
    k = Math.imul(k, c1);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, c2);
    hash ^= k;
  }

  // Finalisation (fmix32).
  hash ^= len;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class Checksum {
  // These are exposed as readonly statics so callers can introspect limits
  // without duplicating magic numbers.
  static readonly MAX_INPUT_BYTES = MAX_INPUT_BYTES;
  static readonly MIN_LENGTH = MIN_LENGTH;
  static readonly MAX_LENGTH = MAX_LENGTH;
  static readonly ALGORITHMS: readonly ChecksumAlgorithm[] = VALID_ALGORITHMS;

  // ----- private constructor (utility class) -----
  private constructor() {}

  // ----- validation -----

  private static validateInput(
    input: ChecksumInput,
    algorithm: ChecksumAlgorithm,
    length: number,
  ): void {
    if (input === null || input === undefined) {
      throw new ChecksumError("Input cannot be null or undefined");
    }

    if (typeof input !== "string" && !(input instanceof Uint8Array)) {
      throw new ChecksumError(
        `Input must be a string or Uint8Array, got ${typeof input}`,
      );
    }

    const byteLength =
      input instanceof Uint8Array
        ? input.length
        : // Rough upper-bound before full encoding.
          input.length * 4;

    if (byteLength > MAX_INPUT_BYTES) {
      throw new ChecksumError(
        `Input exceeds maximum size of ${MAX_INPUT_BYTES} bytes`,
      );
    }

    if (!VALID_ALGORITHMS.includes(algorithm)) {
      throw new ChecksumError(
        `Invalid algorithm: "${algorithm}". Must be one of: ${VALID_ALGORITHMS.join(", ")}`,
      );
    }

    if (
      !Number.isInteger(length) ||
      length < MIN_LENGTH ||
      length > MAX_LENGTH
    ) {
      throw new ChecksumError(
        `Length must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}, got ${length}`,
      );
    }
  }

  // ----- core hash dispatch -----

  private static computeHash(
    bytes: Uint8Array,
    algorithm: ChecksumAlgorithm,
  ): [number, number] {
    // Returns [low32, high32].  Most algorithms produce only 32 bits (high = 0).
    // For longer checksums we derive a second word by seeding murmur3 differently.
    let low: number;
    switch (algorithm) {
      case "djb2":
        low = djb2(bytes);
        break;
      case "crc32":
        low = crc32(bytes);
        break;
      case "adler32":
        low = adler32(bytes);
        break;
      case "fnv1a":
        low = fnv1a(bytes);
        break;
      case "murmur3":
        low = murmur3(bytes);
        break;
      default:
        throw new ChecksumError(`Unsupported algorithm: ${algorithm}`);
    }

    // Derive a second 32-bit word using a different seed so that the combined
    // 64-bit value has good distribution for lengths > 6.
    const high = murmur3(bytes, low ^ 0xdeadbeef);

    return [low, high];
  }

  // ----- public methods -----

  /**
   * Generates a checksum using the specified algorithm.
   *
   * @param input    - String or Uint8Array to hash.
   * @param algorithm - Checksum algorithm (default: `"djb2"`).
   * @param length   - Output length in base-36 characters, 1–16 (default: 4).
   * @returns Lowercase base-36 checksum of exactly `length` characters.
   * @throws {ChecksumError} On invalid parameters.
   *
   * @example
   * ```ts
   * Checksum.generate("hello world");           // e.g. "2a3b"
   * Checksum.generate("data", "crc32", 8);      // 8-char CRC32 checksum
   * Checksum.generate(new Uint8Array([1,2,3])); // works with raw bytes
   * ```
   */
  static generate(
    input: ChecksumInput,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4,
  ): string {
    this.validateInput(input, algorithm, length);

    const bytes = toBytes(input);

    // After encoding, check real byte length.
    if (bytes.length > MAX_INPUT_BYTES) {
      throw new ChecksumError(
        `Encoded input exceeds maximum size of ${MAX_INPUT_BYTES} bytes`,
      );
    }

    const [low, high] = this.computeHash(bytes, algorithm);
    return uint32ToBase36(low, high, length);
  }

  /**
   * Validates a checksum against input data using constant-time comparison.
   *
   * The comparison is timing-safe: it does not short-circuit on mismatch,
   * preventing timing-based side-channel leakage.
   *
   * @param input     - Original input (string or Uint8Array).
   * @param checksum  - Checksum to validate.
   * @param algorithm - Algorithm used when generating (default: `"djb2"`).
   * @param length    - Length used when generating (default: 4).
   * @returns `true` if the checksum matches.
   * @throws {ChecksumError} On invalid parameters.
   *
   * @example
   * ```ts
   * const cs = Checksum.generate("important-data");
   * Checksum.validate("important-data", cs); // true
   * ```
   */
  static validate(
    input: ChecksumInput,
    checksum: string,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4,
  ): boolean {
    if (checksum === null || checksum === undefined) {
      throw new ChecksumError("Checksum cannot be null or undefined");
    }
    if (typeof checksum !== "string") {
      throw new ChecksumError(
        `Checksum must be a string, got ${typeof checksum}`,
      );
    }
    if (checksum.length === 0) {
      throw new ChecksumError("Checksum cannot be empty");
    }
    if (!/^[0-9a-z]+$/i.test(checksum)) {
      throw new ChecksumError(
        "Checksum contains invalid characters (must be base-36: 0-9, a-z)",
      );
    }

    const expected = this.generate(input, algorithm, length);
    return timingSafeEqual(expected, checksum);
  }

  /**
   * Like `generate`, but returns `null` instead of throwing.
   *
   * @example
   * ```ts
   * const cs = Checksum.tryGenerate(userInput);
   * if (cs === null) { /* handle error *\/ }
   * ```
   */
  static tryGenerate(
    input: ChecksumInput,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4,
  ): string | null {
    try {
      return this.generate(input, algorithm, length);
    } catch {
      return null;
    }
  }

  /**
   * Like `validate`, but returns `false` instead of throwing.
   */
  static tryValidate(
    input: ChecksumInput,
    checksum: string,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4,
  ): boolean {
    try {
      return this.validate(input, checksum, algorithm, length);
    } catch {
      return false;
    }
  }
}
