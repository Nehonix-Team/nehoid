/**
 * Checksum and hash utilities for NehoID.
 *
 * This module provides various checksum and hashing algorithms
 * for ID validation, integrity checking, and data fingerprinting.
 */

export type ChecksumAlgorithm =
  | "djb2"
  | "crc32"
  | "adler32"
  | "fnv1a"
  | "murmur3";

export class ChecksumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecksumError";
  }
}

/**
 * Generates checksums using various algorithms.
 *
 * Provides multiple checksum algorithms for different use cases:
 * - djb2: Fast, simple hash (default)
 * - crc32: Cyclic redundancy check (good for error detection)
 * - adler32: Adler-32 checksum (fast, good for small data)
 * - fnv1a: FNV-1a hash (good distribution)
 * - murmur3: MurmurHash3 (high quality, good for large data)
 */
export class Checksum {
  private static readonly MAX_INPUT_LENGTH = 1_000_000; // 1MB character limit
  private static readonly MIN_CHECKSUM_LENGTH = 1;
  private static readonly MAX_CHECKSUM_LENGTH = 16;
  private static readonly VALID_ALGORITHMS: readonly ChecksumAlgorithm[] = [
    "djb2",
    "crc32",
    "adler32",
    "fnv1a",
    "murmur3",
  ] as const;

  // Cache for CRC table to avoid regeneration
  private static crcTableCache: number[] | null = null;

  /**
   * Generates a checksum using the specified algorithm.
   *
   * @param input - String to generate checksum for
   * @param algorithm - Checksum algorithm to use (default: 'djb2')
   * @param length - Desired length of checksum output (default: 4 for short checksums)
   * @returns Checksum string
   * @throws {ChecksumError} If input validation fails
   *
   * @example
   * ```typescript
   * const checksum = Checksum.generate('hello world');
   * // Output: '2a3b' (djb2 hash, 4 chars)
   *
   * const crc32 = Checksum.generate('data', 'crc32', 8);
   * // Output: '8 chars CRC32'
   * ```
   */
  static generate(
    input: string,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4
  ): string {
    // Input validation
    this.validateInput(input, algorithm, length);

    try {
      let hash: number;

      switch (algorithm) {
        case "djb2":
          hash = this.djb2(input);
          break;
        case "crc32":
          hash = this.crc32(input);
          break;
        case "adler32":
          hash = this.adler32(input);
          break;
        case "fnv1a":
          hash = this.fnv1a(input);
          break;
        case "murmur3":
          hash = this.murmur3(input);
          break;
        default:
          // This should never happen due to validation, but provides type safety
          throw new ChecksumError(`Unsupported algorithm: ${algorithm}`);
      }

      // Ensure we have a valid hash number
      if (!Number.isFinite(hash)) {
        throw new ChecksumError("Hash computation resulted in invalid number");
      }

      // Convert to base36 and pad if necessary
      const hashStr = Math.abs(hash).toString(36);

      // If hash is shorter than requested length, pad with zeros
      if (hashStr.length < length) {
        return hashStr.padStart(length, "0");
      }

      return hashStr.substring(0, length);
    } catch (error) {
      if (error instanceof ChecksumError) {
        throw error;
      }
      throw new ChecksumError(
        `Failed to generate checksum: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validates input parameters for checksum generation.
   * @private
   */
  private static validateInput(
    input: string,
    algorithm: ChecksumAlgorithm,
    length: number
  ): void {
    // Check input is defined and is a string
    if (input === null || input === undefined) {
      throw new ChecksumError("Input cannot be null or undefined");
    }

    if (typeof input !== "string") {
      throw new ChecksumError(`Input must be a string, got ${typeof input}`);
    }

    // Check input length
    if (input.length > this.MAX_INPUT_LENGTH) {
      throw new ChecksumError(
        `Input exceeds maximum length of ${this.MAX_INPUT_LENGTH} characters`
      );
    }

    // Validate algorithm
    if (!this.VALID_ALGORITHMS.includes(algorithm)) {
      throw new ChecksumError(
        `Invalid algorithm: ${algorithm}. Must be one of: ${this.VALID_ALGORITHMS.join(
          ", "
        )}`
      );
    }

    // Validate length
    if (!Number.isInteger(length)) {
      throw new ChecksumError("Length must be an integer");
    }

    if (
      length < this.MIN_CHECKSUM_LENGTH ||
      length > this.MAX_CHECKSUM_LENGTH
    ) {
      throw new ChecksumError(
        `Length must be between ${this.MIN_CHECKSUM_LENGTH} and ${this.MAX_CHECKSUM_LENGTH}, got ${length}`
      );
    }
  }

  /**
   * DJB2 hash algorithm - fast and simple.
   * Good for basic integrity checks and short checksums.
   *
   * @param str - Input string
   * @returns 32-bit hash number
   */
  private static djb2(str: string): number {
    let hash = 5381;

    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      // Use bitwise OR 0 to ensure 32-bit integer operations
      hash = ((hash << 5) + hash + charCode) | 0;
    }

    // Convert to unsigned 32-bit integer
    return hash >>> 0;
  }

  /**
   * CRC32 (Cyclic Redundancy Check) - good for error detection.
   * Better at detecting errors than simple hashes.
   *
   * @param str - Input string
   * @returns 32-bit CRC32 checksum
   */
  private static crc32(str: string): number {
    const crcTable = this.getCRCTable();
    let crc = 0xffffffff;

    for (let i = 0; i < str.length; i++) {
      const byte = str.charCodeAt(i) & 0xff;
      crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Adler-32 checksum - fast and good for small data.
   * Used in zlib compression.
   *
   * @param str - Input string
   * @returns 32-bit Adler-32 checksum
   */
  private static adler32(str: string): number {
    let a = 1;
    let b = 0;
    const MOD_ADLER = 65521;

    for (let i = 0; i < str.length; i++) {
      a = (a + str.charCodeAt(i)) % MOD_ADLER;
      b = (b + a) % MOD_ADLER;
    }

    return ((b << 16) | a) >>> 0;
  }

  /**
   * FNV-1a hash - good distribution properties.
   * Fast and provides good hash distribution.
   *
   * @param str - Input string
   * @returns 32-bit FNV-1a hash
   */
  private static fnv1a(str: string): number {
    const FNV_PRIME = 16777619;
    const FNV_OFFSET_BASIS = 2166136261;
    let hash = FNV_OFFSET_BASIS;

    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      // Use Math.imul for proper 32-bit multiplication
      hash = Math.imul(hash, FNV_PRIME);
    }

    return hash >>> 0;
  }

  /**
   * MurmurHash3 (simplified version) - high quality hash.
   * Good for larger data and cryptographic purposes.
   *
   * @param str - Input string
   * @param seed - Optional seed value for hash initialization
   * @returns 32-bit MurmurHash3
   */
  private static murmur3(str: string, seed: number = 0): number {
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    const r1 = 15;
    const r2 = 13;
    const m = 5;
    const n = 0xe6546b64;

    let hash = seed;

    // Use TextEncoder for proper UTF-8 encoding
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;

    // Process 4-byte chunks
    for (let i = 0; i < len - 3; i += 4) {
      let k =
        bytes[i] |
        (bytes[i + 1] << 8) |
        (bytes[i + 2] << 16) |
        (bytes[i + 3] << 24);

      k = Math.imul(k, c1);
      k = (k << r1) | (k >>> (32 - r1));
      k = Math.imul(k, c2);

      hash ^= k;
      hash = (hash << r2) | (hash >>> (32 - r2));
      hash = Math.imul(hash, m) + n;
    }

    // Process remaining bytes
    let k = 0;
    const remainder = len & 3;
    if (remainder >= 3) k ^= bytes[len - 3] << 16;
    if (remainder >= 2) k ^= bytes[len - 2] << 8;
    if (remainder >= 1) {
      k ^= bytes[len - 1];
      k = Math.imul(k, c1);
      k = (k << r1) | (k >>> (32 - r1));
      k = Math.imul(k, c2);
      hash ^= k;
    }

    // Finalization
    hash ^= len;
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x85ebca6b);
    hash ^= hash >>> 13;
    hash = Math.imul(hash, 0xc2b2ae35);
    hash ^= hash >>> 16;

    return hash >>> 0;
  }

  /**
   * Gets or generates CRC32 lookup table (cached for performance).
   * @private
   */
  private static getCRCTable(): number[] {
    if (this.crcTableCache) {
      return this.crcTableCache;
    }

    const table: number[] = new Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }

    this.crcTableCache = table;
    return table;
  }

  /**
   * Validates a checksum against input data.
   *
   * @param input - Original input string
   * @param checksum - Checksum to validate
   * @param algorithm - Algorithm used for checksum (default: 'djb2')
   * @param length - Length of checksum used (default: 4)
   * @returns True if checksum matches, false otherwise
   * @throws {ChecksumError} If validation parameters are invalid
   *
   * @example
   * ```typescript
   * const data = 'important-data';
   * const checksum = Checksum.generate(data);
   *
   * // Later validation
   * const isValid = Checksum.validate(data, checksum);
   * console.log(isValid); // true
   * ```
   */
  static validate(
    input: string,
    checksum: string,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4
  ): boolean {
    // Validate checksum parameter
    if (checksum === null || checksum === undefined) {
      throw new ChecksumError("Checksum cannot be null or undefined");
    }

    if (typeof checksum !== "string") {
      throw new ChecksumError(
        `Checksum must be a string, got ${typeof checksum}`
      );
    }

    if (checksum.length === 0) {
      throw new ChecksumError("Checksum cannot be empty");
    }

    // Validate checksum format (base36)
    if (!/^[0-9a-z]+$/i.test(checksum)) {
      throw new ChecksumError(
        "Checksum contains invalid characters (must be base36: 0-9, a-z)"
      );
    }

    try {
      const expected = this.generate(input, algorithm, length);
      return expected.toLowerCase() === checksum.toLowerCase();
    } catch (error) {
      if (error instanceof ChecksumError) {
        throw error;
      }
      throw new ChecksumError(
        `Validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Safely generates a checksum, returning null on error instead of throwing.
   *
   * @param input - String to generate checksum for
   * @param algorithm - Checksum algorithm to use (default: 'djb2')
   * @param length - Desired length of checksum output (default: 4)
   * @returns Checksum string or null on error
   *
   * @example
   * ```typescript
   * const checksum = Checksum.tryGenerate('data');
   * if (checksum) {
   *   console.log('Checksum:', checksum);
   * } else {
   *   console.log('Failed to generate checksum');
   * }
   * ```
   */
  static tryGenerate(
    input: string,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4
  ): string | null {
    try {
      return this.generate(input, algorithm, length);
    } catch {
      return null;
    }
  }

  /**
   * Safely validates a checksum, returning false on error instead of throwing.
   *
   * @param input - Original input string
   * @param checksum - Checksum to validate
   * @param algorithm - Algorithm used for checksum (default: 'djb2')
   * @param length - Length of checksum used (default: 4)
   * @returns True if valid, false if invalid or on error
   */
  static tryValidate(
    input: string,
    checksum: string,
    algorithm: ChecksumAlgorithm = "djb2",
    length: number = 4
  ): boolean {
    try {
      return this.validate(input, checksum, algorithm, length);
    } catch {
      return false;
    }
  }
}
