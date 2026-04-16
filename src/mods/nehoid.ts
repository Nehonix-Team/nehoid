import {
  IdGeneratorOptions,
  CollisionStrategy,
  ContextOptions,
  SemanticOptions,
  BatchOptions,
  ValidationOptions,
  HealthScore,
  Stats,
  MigrationOptions,
  CompatibilityOptions,
} from "../types/index.js";
import { SpecializedGenerators } from "./specialized.js";
import { Validators } from "./validation.js";
import { Monitor } from "./monitoring.js";
import { Advanced } from "./advanced.js";
import { Checksum } from "./checksum.js";
import { Generator } from "../core/generator.js";

// ─────────────────────────────────────────────────────────────────────────────
// Internal constants
// ─────────────────────────────────────────────────────────────────────────────

/** Pattern placeholder → replacement rules. */
const PATTERN_REPLACERS: Record<string, () => string> = {
  X: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)), // A-Z
  A: () => String.fromCharCode(65 + Math.floor(Math.random() * 26)), // A-Z
  a: () => String.fromCharCode(97 + Math.floor(Math.random() * 26)), // a-z
  9: () => String.fromCharCode(48 + Math.floor(Math.random() * 10)), // 0-9
};

const PATTERN_REGEX = /[XAa9]/g;

// ─────────────────────────────────────────────────────────────────────────────
// NehoID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Central facade for all ID generation, validation, monitoring, and migration
 * operations provided by the NehoID library.
 *
 * Every public method is **static** — no instantiation required. Internally the
 * class delegates to specialised sub-modules ({@link Generator}, {@link Validators},
 * {@link Monitor}, {@link Advanced}, etc.) and adds orchestration, option
 * pre-processing, and monitoring instrumentation on top.
 *
 * ---
 *
 * ### Quick-start
 *
 * ```typescript
 * import { NehoID } from 'nehoid';
 *
 * // ── Simple generation ──────────────────────────────────────────────────────
 * const id   = NehoID.generate();                         // default settings
 * const uuid = NehoID.generate({ format: 'uuid' });       // RFC 4122 UUID
 * const nano = NehoID.nanoid(16);                         // NanoID, length 16
 * const hex  = NehoID.hex(32);                            // 32-char hex string
 *
 * // ── Collision-safe async generation ───────────────────────────────────────
 * const safeId = await NehoID.safe({
 *   name: 'user-id',
 *   maxAttempts: 10,
 *   backoffType: 'exponential',
 *   checkFunction: async (candidate) => !(await db.exists(candidate)),
 * });
 *
 * // ── Bulk generation ────────────────────────────────────────────────────────
 * const ids = NehoID.batch({ count: 500, format: 'uuid', ensureUnique: true });
 *
 * // ── Validation ─────────────────────────────────────────────────────────────
 * const ok     = NehoID.validate(id);
 * const health = NehoID.healthCheck(id);
 *
 * // ── Monitoring ─────────────────────────────────────────────────────────────
 * NehoID.startMonitoring();
 * const stats = NehoID.getStats();
 * NehoID.stopMonitoring();
 * ```
 */
export class NehoID {
  // Prevent accidental instantiation — this class is purely static.
  private constructor() {}

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Replaces pattern placeholders with random characters.
   *
   * Recognised placeholders:
   * - `X` / `A` → random uppercase letter (A–Z)
   * - `a`       → random lowercase letter (a–z)
   * - `9`       → random digit (0–9)
   *
   * All other characters are kept verbatim.
   *
   * @param pattern - Template string (e.g. `'XXX-999'`).
   * @returns Resolved pattern string (e.g. `'BKT-472'`).
   */
  private static generateFromPattern(pattern: string): string {
    return pattern.replace(
      PATTERN_REGEX,
      (match) => PATTERN_REPLACERS[match]?.() ?? match,
    );
  }

  /**
   * Derives an alphabet string from a {@link IdGeneratorOptions.charset} descriptor.
   *
   * @param charset - Charset descriptor from caller options.
   * @returns Combined alphabet string, or `undefined` if the descriptor is empty.
   */
  private static buildAlphabetFromCharset(
    charset: NonNullable<IdGeneratorOptions["charset"]>,
  ): string | undefined {
    let pool = "";
    if (charset.numbers !== false) pool += "0123456789";
    if (charset.lowercase !== false) pool += "abcdefghijklmnopqrstuvwxyz";
    if (charset.uppercase !== false) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (charset.special === true) pool += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset.exclude?.length) {
      const excluded = new Set(charset.exclude);
      pool = pool
        .split("")
        .filter((c) => !excluded.has(c))
        .join("");
    }

    return pool.length > 0 ? pool : undefined;
  }

  /**
   * Applies format-specific defaults for preset format shortcuts.
   *
   * Mutates `processedOptions` in place and may return early with a fully
   * formed ID for formats that have their own dedicated generators.
   *
   * @param format          - The requested preset format.
   * @param originalOptions - The raw caller options (read-only).
   * @param processedOptions - Options object being built for the core generator.
   * @returns An early-exit ID string for `'uuid'` and `'nanoid'`, or `undefined`.
   */
  private static applyFormatPreset(
    format: NonNullable<IdGeneratorOptions["format"]>,
    originalOptions: Partial<IdGeneratorOptions>,
    processedOptions: Partial<IdGeneratorOptions>,
  ): string | undefined {
    switch (format) {
      case "uuid":
        return NehoID.uuid();

      case "nanoid":
        return NehoID.nanoid(originalOptions.size);

      case "cuid":
        processedOptions.size = originalOptions.size ?? 25;
        processedOptions.prefix = originalOptions.prefix ?? "c";
        processedOptions.alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
        break;

      case "ksuid":
        processedOptions.size = originalOptions.size ?? 27;
        processedOptions.includeTimestamp = true;
        processedOptions.alphabet =
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;

      case "xid":
        processedOptions.size = originalOptions.size ?? 20;
        processedOptions.includeTimestamp = true;
        processedOptions.alphabet = "0123456789abcdefghijklmnopqrstuv";
        break;

      case "pushid":
        processedOptions.size = originalOptions.size ?? 20;
        processedOptions.includeTimestamp = true;
        processedOptions.alphabet =
          "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        break;
    }

    return undefined;
  }

  /**
   * Applies a case transformation to an ID string.
   *
   * @param id        - The raw ID string.
   * @param caseMode  - Desired case transformation.
   * @returns Transformed string.
   */
  private static applyCase(
    id: string,
    caseMode: NonNullable<IdGeneratorOptions["case"]>,
  ): string {
    switch (caseMode) {
      case "lower":
        return id.toLowerCase();
      case "upper":
        return id.toUpperCase();
      case "mixed":
        return id
          .split("")
          .map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()))
          .join("");
      case "camel":
        return id
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) =>
            i === 0 ? w.toLowerCase() : w.toUpperCase(),
          )
          .replace(/\s+/g, "");
      case "pascal":
        return id
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (w) => w.toUpperCase())
          .replace(/\s+/g, "");
      case "snake":
        return id.replace(/\W+/g, "_").toLowerCase();
      default:
        return id;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Core generation
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generates a unique ID with optional configuration.
   *
   * This is the primary entry point for ID generation. It supports preset format
   * shortcuts, fine-grained character control, case transformations, expiration
   * timestamps, versioning, domains, sequential numbering, pattern templates,
   * metadata embedding, and checksum appending — all composable in a single call.
   *
   * > **Performance note**: For bulk generation prefer {@link NehoID.batch}, which
   * > avoids per-call monitoring overhead and can run in parallel.
   *
   * @param options - Generation options. All properties are optional.
   * @returns A newly generated unique ID string.
   *
   * @throws {RangeError} If `options.size` is defined and less than 1.
   * @throws {TypeError} If `options.sequential.padLength` is negative.
   *
   * @example Preset formats
   * ```typescript
   * NehoID.generate({ format: 'uuid' });   // "550e8400-e29b-41d4-a716-446655440000"
   * NehoID.generate({ format: 'nanoid' }); // "V1StGXR8_Z5jdHi6B-myT"
   * NehoID.generate({ format: 'ksuid' });  // "0ujzPyRiIAffKhBux4PvQdDqMHY"
   * ```
   *
   * @example Custom size, segments & separator
   * ```typescript
   * NehoID.generate({ size: 4, segments: 3, separator: '.' });
   * // "aB3x.K9mZ.tR8q"
   * ```
   *
   * @example Prefix, case & charset control
   * ```typescript
   * NehoID.generate({
   *   prefix: 'USR',
   *   case: 'lower',
   *   charset: { numbers: true, uppercase: false }
   * });
   * // "usr_3f2a9c1b"
   * ```
   *
   * @example Pattern template
   * ```typescript
   * NehoID.generate({ pattern: 'AA-9999' }); // "CA-1834"
   * NehoID.generate({ pattern: 'XXX-XXX' }); // "BKT-ZMP"
   * ```
   *
   * @example Compression & Encoding
   * ```typescript
   * NehoID.generate({
   *   encoding: 'base64',
   *   compression: 'lz77'
   * });
   * ```
   *
   * @example Expiring security token
   * ```typescript
   * NehoID.generate({
   *   size: 32,
   *   randomness: 'crypto',
   *   expiresIn: 15 * 60 * 1000,  // 15 minutes
   *   domain: 'auth',
   *   includeChecksum: true,
   * });
   * ```
   *
   * @example Sequential order IDs
   * ```typescript
   * NehoID.generate({
   *   sequential: { context: 'orders', start: 1000, padLength: 6 },
   * });
   * // "orders001000"
   * ```
   *
   * @example Embedded metadata
   * ```typescript
   * NehoID.generate({
   *   metadata: { env: 'prod', source: 'api-v3' },
   *   includeTimestamp: true,
   * });
   * ```
   */
  static generate(options: Partial<IdGeneratorOptions> = {}): string {
    const startTime = performance.now();

    if (options.size !== undefined && options.size < 1) {
      throw new RangeError(
        `options.size must be ≥ 1, received ${options.size}.`,
      );
    }

    const processedOptions: Partial<IdGeneratorOptions> = { ...options };

    // ── 1. Preset format ────────────────────────────────────────────────────
    if (options.format) {
      const earlyResult = NehoID.applyFormatPreset(
        options.format,
        options,
        processedOptions,
      );
      if (earlyResult !== undefined) {
        Monitor.updateStats(startTime);
        return earlyResult;
      }
    }

    // ── 2. Charset → alphabet ───────────────────────────────────────────────
    if (options.charset) {
      const alphabet = NehoID.buildAlphabetFromCharset(options.charset);
      if (alphabet) {
        processedOptions.alphabet = alphabet;
      }
    }

    // ── 3. Core generation ──────────────────────────────────────────────────
    let result: string = options.pattern
      ? NehoID.generateFromPattern(options.pattern)
      : Generator.generate(processedOptions);

    // ── 4. Sequential override ──────────────────────────────────────────────
    if (options.sequential) {
      const { context, start = 1, padLength = 0 } = options.sequential;

      if (padLength < 0) {
        throw new TypeError(
          `sequential.padLength must be ≥ 0, received ${padLength}.`,
        );
      }

      result = `${context}${start.toString().padStart(padLength, "0")}`;
    }

    // ── 5. Case transformation ──────────────────────────────────────────────
    if (options.case) {
      result = NehoID.applyCase(result, options.case);
    }

    // ── 6. Version prefix ───────────────────────────────────────────────────
    if (options.version !== undefined) {
      const tag =
        typeof options.version === "number"
          ? `v${options.version}`
          : options.version;
      result = `${tag}_${result}`;
    }

    // ── 7. Domain namespace ─────────────────────────────────────────────────
    if (options.domain) {
      result = `${options.domain}_${result}`;
    }

    // ── 8. Expiration timestamp ─────────────────────────────────────────────
    if (options.expiresIn !== undefined) {
      if (options.expiresIn <= 0) {
        throw new RangeError(
          `options.expiresIn must be > 0, received ${options.expiresIn}.`,
        );
      }
      result += `_exp${Date.now() + options.expiresIn}`;
    }

    // ── 9. Checksum ─────────────────────────────────────────────────────────
    if (options.includeChecksum) {
      const checksum = Checksum.generate(result, "djb2", 4);
      result += `_${checksum}`;
    }

    // ── 10. Metadata ────────────────────────────────────────────────────────
    if (options.metadata) {
      try {
        const metaStr = Buffer.from(JSON.stringify(options.metadata)).toString(
          "base64",
        );
        result += `_meta${metaStr}`;
      } catch {
        // Silently skip if serialisation fails (e.g. circular references).
      }
    }

    Monitor.updateStats(startTime);
    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Collision-safe generation
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generates a collision-safe ID by validating each candidate against an
   * external uniqueness predicate before returning it.
   *
   * The method retries up to {@link CollisionStrategy.maxAttempts} times with
   * the configured back-off strategy. If all attempts fail, it throws an error
   * and increments the collision counter in {@link Monitor}.
   *
   * @param options - Collision strategy including the async uniqueness check.
   * @returns A promise that resolves to a guaranteed-unique ID string.
   * @throws {Error} When `maxAttempts` is exhausted without finding a unique ID.
   *
   * @example Database uniqueness check
   * ```typescript
   * const id = await NehoID.safe({
   *   name: 'order-id-check',
   *   maxAttempts: 10,
   *   backoffType: 'exponential',
   *   checkFunction: async (candidate) => {
   *     return !(await db.orders.exists({ id: candidate }));
   *   },
   * });
   * ```
   *
   * @example Redis cache token
   * ```typescript
   * const token = await NehoID.safe({
   *   name: 'session-token',
   *   maxAttempts: 5,
   *   backoffType: 'linear',
   *   checkFunction: async (t) => !(await redis.exists(`sess:${t}`)),
   * });
   * ```
   */
  static async safe(options: CollisionStrategy): Promise<string> {
    const startTime = performance.now();
    try {
      const id = await Generator.safe(options);
      Monitor.updateStats(startTime);
      return id;
    } catch (error) {
      Monitor.incrementCollisions();
      throw error;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Shorthand generators
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generates a RFC 4122 v4 UUID.
   *
   * @returns A hyphen-separated UUID string (36 characters).
   *
   * @example
   * ```typescript
   * NehoID.uuid(); // "550e8400-e29b-41d4-a716-446655440000"
   * ```
   */
  static uuid(): string {
    return Generator.uuid();
  }

  /**
   * Generates a NanoID using URL-safe characters.
   *
   * NanoIDs are compact, URL-safe, and statistically collision-resistant.
   * The default length of 21 chars provides ~126 bits of entropy.
   *
   * @param length - Character length of the output. @default 21
   * @returns A NanoID string.
   *
   * @example
   * ```typescript
   * NehoID.nanoid();    // "V1StGXR8_Z5jdHi6B-myT"  (21 chars)
   * NehoID.nanoid(10);  // "IRFa-VaY2b"             (10 chars)
   * ```
   */
  static nanoid(length?: number): string {
    return Generator.nano(length);
  }

  /**
   * Generates a short, compact alphanumeric ID.
   *
   * Useful for human-readable references (order numbers, share codes, etc.)
   * where brevity matters more than maximum entropy.
   *
   * @param length - Character length of the output. @default 8
   * @returns A short alphanumeric string.
   *
   * @example
   * ```typescript
   * NehoID.short();     // "aB3xK9mZ"  (8 chars)
   * NehoID.short(12);   // "aB3xK9mZtR8q"
   * ```
   */
  static short(length?: number): string {
    return Generator.short(length);
  }

  /**
   * Generates a random hexadecimal string.
   *
   * @param length - Character length of the output. @default 16
   * @returns A lowercase hexadecimal string.
   *
   * @example
   * ```typescript
   * NehoID.hex();     // "3f2a9c1b4e7d8f0a"      (16 chars)
   * NehoID.hex(32);   // "3f2a9c1b4e7d8f0a1c3e5b7d9f2a4c6e"
   * ```
   */
  static hex(length?: number): string {
    return Generator.hex(length);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Specialised generators
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generates a hierarchical ID encoding a parent-child relationship.
   *
   * Hierarchical IDs preserve the ancestry chain in the identifier itself,
   * enabling efficient tree traversal without additional database joins.
   *
   * @param options - Hierarchical generation options.
   * @returns A hierarchical ID string with encoded relationship segments.
   *
   * @example
   * ```typescript
   * const child = NehoID.hierarchical({ parentId: 'root-abc123', depth: 2 });
   * // "root-abc123.L2.xK9m"
   * ```
   */
  static hierarchical(options: Record<string, unknown> = {}): string {
    return SpecializedGenerators.hierarchical(options);
  }

  /**
   * Generates a time-ordered ID suitable for chronological sorting.
   *
   * Temporal IDs embed a timestamp prefix so that lexicographic order matches
   * insertion order — ideal for event logs, message queues, and time-series data.
   *
   * @param options - Temporal generation options (precision, random suffix, etc.).
   * @returns A temporal ID string with an embedded timestamp prefix.
   *
   * @example
   * ```typescript
   * const id = NehoID.temporal({ precision: 'milliseconds', suffix: true });
   * // "01HX3KBPM4-aB3x"
   * ```
   */
  static temporal(
    ...options: Parameters<typeof SpecializedGenerators.temporal>
  ): string {
    return SpecializedGenerators.temporal(...options);
  }

  /**
   * Converts a Unix timestamp (milliseconds) into a temporal ID.
   *
   * Allows back-dated or future-dated IDs to be generated from arbitrary
   * epoch values without going through the standard clock.
   *
   * @param timestamp - Unix epoch in milliseconds.
   * @returns A temporal ID string derived from the given timestamp.
   * @throws {RangeError} If `timestamp` is negative.
   *
   * @example
   * ```typescript
   * NehoID.fromTemporal(Date.now());           // current-time temporal ID
   * NehoID.fromTemporal(new Date('2020-01-01').getTime()); // back-dated ID
   * ```
   */
  static fromTemporal(
    timestamp: number,
    options?: Parameters<typeof SpecializedGenerators.fromTemporal>[1],
  ): string {
    if (timestamp < 0) {
      throw new RangeError(`timestamp must be ≥ 0, received ${timestamp}.`);
    }
    return SpecializedGenerators.fromTemporal(timestamp, options);
  }

  /**
   * Extracts the original Unix timestamp (milliseconds) from a temporal ID.
   *
   * @param temporalId - A temporal ID previously generated by {@link NehoID.temporal}
   *   or {@link NehoID.fromTemporal}.
   * @returns The Unix epoch in milliseconds encoded in the ID.
   * @throws {TypeError} If the provided string is not a valid temporal ID.
   *
   * @example
   * ```typescript
   * const id = NehoID.temporal();
   * const ts = NehoID.fromTemporalToTimestamp(id); // e.g. 1710000000000
   * new Date(ts); // Date object
   * ```
   */
  static fromTemporalToTimestamp(
    temporalId: string,
    options?: Parameters<
      typeof SpecializedGenerators.fromTemporalToTimestamp
    >[1],
  ): number {
    return SpecializedGenerators.fromTemporalToTimestamp(temporalId, options);
  }

  /**
   * Generates a sequential ID suitable for replacing database auto-increment columns.
   *
   * Unlike pure auto-increment, sequential IDs can include a prefix and optional
   * padding, making them human-readable and namespace-safe across distributed systems.
   *
   * @param options - Sequential generation parameters.
   * @returns A formatted sequential ID string.
   * @throws {RangeError} If `options.counter` is negative.
   *
   * @example
   * ```typescript
   * NehoID.sequential({ prefix: 'ORD', counter: 1001, padLength: 6 });
   * // "ORD001001"
   *
   * NehoID.sequential({ prefix: 'INV', counter: 42, padLength: 4 });
   * // "INV0042"
   * ```
   */
  static sequential(options: {
    prefix?: string;
    counter: number;
    padLength?: number;
    suffix?: boolean;
  }): string {
    if (options.counter < 0) {
      throw new RangeError(`counter must be ≥ 0, received ${options.counter}.`);
    }
    return SpecializedGenerators.sequential(options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Batch generation
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generates multiple IDs in a single operation.
   *
   * More efficient than calling {@link NehoID.generate} in a loop because the
   * generator can amortise initialisation cost and optionally parallelise work.
   *
   * @param options - Batch configuration (count, format, uniqueness, parallelism).
   * @returns An array of generated ID strings of length `options.count`.
   * @throws {RangeError} If `options.count` is less than 1.
   *
   * @example Standard batch
   * ```typescript
   * const ids = NehoID.batch({ count: 100, format: 'uuid', ensureUnique: true });
   * ids.length; // 100
   * ```
   *
   * @example High-throughput parallel batch
   * ```typescript
   * const ids = NehoID.batch({ count: 10_000, format: 'nano', parallel: true });
   * ```
   */
  static batch(options: BatchOptions): string[] {
    if (options.count < 1) {
      throw new RangeError(
        `options.count must be ≥ 1, received ${options.count}.`,
      );
    }
    return Generator.batch(options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Validates a single ID against the configured rules and format constraints.
   *
   * @param id      - The ID string to validate.
   * @param options - Optional validation flags (format check, collision check, repair).
   * @returns `true` if the ID passes all enabled checks, `false` otherwise.
   *
   * @example
   * ```typescript
   * NehoID.validate('usr_aB3xK9mZ');                         // true
   * NehoID.validate('usr_aB3xK9mZ', { checkFormat: true });  // true
   * NehoID.validate('!!!invalid');                            // false
   * ```
   */
  static validate(id: string, options?: ValidationOptions): boolean {
    return Validators.validate(id, options);
  }

  /**
   * Validates multiple IDs in a single pass and provides a detailed report.
   *
   * Results include categorized lists of valid, invalid, and duplicate IDs.
   *
   * @param ids     - Array of ID strings to validate.
   * @param options - Optional validation flags applied uniformly to all IDs.
   * @returns An object containing arrays of `valid`, `invalid`, and `duplicates` IDs.
   *
   * @example
   * ```typescript
   * const report = NehoID.validateBatch(['id1', 'id2', '!!!', 'id1']);
   * // {
   * //   valid: ['id1', 'id2'],
   * //   invalid: ['!!!'],
   * //   duplicates: ['id1']
   * // }
   * ```
   */
  static validateBatch(
    ids: string[],
    options?: ValidationOptions,
  ): {
    valid: string[];
    invalid: string[];
    duplicates: string[];
  } {
    return Validators.validateBatch(ids, options);
  }

  /**
   * Performs a comprehensive quality analysis of an ID.
   *
   * Examines entropy, character distribution, predictability, and structural
   * patterns, then returns an actionable {@link HealthScore} report.
   *
   * @param id - The ID string to analyse.
   * @returns A {@link HealthScore} object with a normalised score and recommendations.
   *
   * @example
   * ```typescript
   * const health = NehoID.healthCheck('usr_aB3xK9mZ');
   * // {
   * //   score: 0.91,
   * //   entropy: 'high',
   * //   predictability: 'low',
   * //   recommendations: [],
   * // }
   *
   * if (health.score < 0.7) {
   *   console.warn('Low quality ID:', health.recommendations);
   * }
   * ```
   */
  static healthCheck(id: string): HealthScore {
    return Validators.healthCheck(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Monitoring
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Starts collecting generation performance metrics.
   *
   * Must be called before {@link NehoID.getStats}. Has no effect if monitoring
   * is already active.
   *
   * @example
   * ```typescript
   * NehoID.startMonitoring();
   * for (let i = 0; i < 10_000; i++) NehoID.generate();
   * const stats = NehoID.getStats();
   * console.log(stats.averageGenerationTime); // e.g. "0.041 ms"
   * ```
   */
  static startMonitoring(): void {
    Monitor.startMonitoring();
  }

  /**
   * Stops metric collection and freezes the current statistics snapshot.
   *
   * Subsequent calls to {@link NehoID.getStats} return the frozen values until
   * monitoring is restarted.
   *
   * @example
   * ```typescript
   * NehoID.stopMonitoring();
   * const finalStats = NehoID.getStats();
   * ```
   */
  static stopMonitoring(): void {
    Monitor.stopMonitoring();
  }

  /**
   * Returns the current (or last frozen) generation statistics.
   *
   * @returns A {@link Stats} snapshot.
   *
   * @example
   * ```typescript
   * const { generated, collisions, averageGenerationTime } = NehoID.getStats();
   * console.log(`${generated} IDs generated, ${collisions} collisions.`);
   * ```
   */
  static getStats(): Stats {
    return Monitor.getStats();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Advanced generation
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generates an ID that embeds a fingerprint of the current runtime environment.
   *
   * Useful for analytics, anomaly detection, and fraud prevention — each enabled
   * flag adds a hashed context segment to the ID.
   *
   * > ⚠️ **Privacy**: `includeDevice` and `includeLocation` may collect PII.
   * > Ensure user consent and legal compliance before enabling these flags.
   *
   * @param options - Context flags controlling which environment data is captured.
   * @returns A contextual ID string containing hashed environment segments.
   *
   * @example
   * ```typescript
   * const id = NehoID.contextual({
   *   includeDevice: true,
   *   includeTimezone: true,
   *   userBehavior: 'checkout',
   * });
   * ```
   */
  static contextual(options: ContextOptions): string {
    return Advanced.contextual(options);
  }

  /**
   * Generates a human-readable semantic ID with meaningful business segments.
   *
   * Semantic IDs self-document their origin (region, department, year) while
   * remaining unique via an appended random suffix.
   *
   * @param options - Semantic segments to embed in the ID.
   * @returns A structured semantic ID string.
   *
   * @example
   * ```typescript
   * NehoID.semantic({
   *   prefix: 'ORD',
   *   region: 'EU-WEST',
   *   department: 'SALES',
   *   year: 2025,
   *   customSegments: { channel: 'web' },
   * });
   * // "ORD-EU-WEST-SALES-2025-web-x7k2"
   * ```
   */
  static semantic(options: SemanticOptions): string {
    return Advanced.semantic(options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Migration & compatibility
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Bulk-migrates IDs from one format to another while preserving referential integrity.
   *
   * Processes IDs in configurable batches to limit memory pressure. The resulting
   * array maintains the same order as the input when `preserveOrder` is `true`.
   *
   * @param options - Migration configuration (source/target format, batch size, IDs).
   * @returns A promise that resolves to an array of migrated ID strings.
   * @throws {Error} If the source format is unrecognised or migration fails.
   *
   * @example Migrate explicit list of UUIDs
   * ```typescript
   * const newIds = await NehoID.migrate({
   *   from: 'uuid',
   *   to: 'nehoid',
   *   preserveOrder: true,
   *   batchSize: 500,
   *   ids: legacyUuids,
   * });
   * ```
   *
   * @example Migrate N records from a configured source store
   * ```typescript
   * const newIds = await NehoID.migrate({
   *   from: 'legacy-numeric',
   *   to: 'ksuid',
   *   count: 10_000,
   *   batchSize: 100,
   * });
   * ```
   */
  static migrate(options: MigrationOptions): Promise<string[]> {
    return Advanced.migrate(options);
  }

  /**
   * Generates an ID that satisfies the constraints of all specified target platforms.
   *
   * The generator applies the most restrictive character set and length limit
   * across all listed platforms, ensuring the output is usable without transformation
   * on every target.
   *
   * @param options - Target platforms, required format, and exact length.
   * @returns A cross-platform compatible ID string.
   * @throws {RangeError} If `options.length` is less than 1.
   *
   * @example
   * ```typescript
   * NehoID.compatible({
   *   platform: ['javascript', 'python', 'go'],
   *   format: 'alphanumeric',
   *   length: 16,
   * });
   * // "aB3xK9mZtR8qV2nP"
   * ```
   */
  static compatible(options: CompatibilityOptions): string {
    if (options.length < 1) {
      throw new RangeError(
        `options.length must be ≥ 1, received ${options.length}.`,
      );
    }
    return Advanced.compatible(options);
  }
}
