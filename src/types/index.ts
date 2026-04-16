import { ENC_TYPE } from "../core/encoder.js";

// ─────────────────────────────────────────────────────────────────────────────
// Core Generation Options
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration options for ID generation.
 *
 * Controls every aspect of how an ID is generated — from its size and encoding
 * to advanced features like expiration, checksums, sequential numbering, and
 * metadata embedding. All properties are optional; omitting them applies sensible defaults.
 *
 * @example Basic usage
 * ```typescript
 * const opts: IdGeneratorOptions = {
 *   size: 16,
 *   prefix: 'usr_',
 *   encoding: 'base62',
 *   includeTimestamp: true,
 * };
 * ```
 *
 * @example Preset format shortcut
 * ```typescript
 * const opts: IdGeneratorOptions = { format: 'uuid' };
 * ```
 *
 * @example URL-safe ID with high entropy
 * ```typescript
 * const opts: IdGeneratorOptions = {
 *   size: 32,
 *   randomness: 'crypto',
 *   quality: { urlSafe: true, minEntropy: 'high', avoidPatterns: true },
 * };
 * ```
 *
 * @example Pattern-based ID (e.g. licence plate)
 * ```typescript
 * const opts: IdGeneratorOptions = { pattern: 'AA-9999' };
 * // Possible output: "CA-4821"
 * ```
 *
 * @example Expiring token with checksum
 * ```typescript
 * const opts: IdGeneratorOptions = {
 *   expiresIn: 60 * 60 * 1000,  // 1 hour in ms
 *   includeChecksum: true,
 *   domain: 'auth',
 *   version: 2,
 * };
 * ```
 */
export interface IdGeneratorOptions {
  // ── Sizing & structure ──────────────────────────────────────────────────────

  /** Desired total length of the generated ID (excluding affixes). */
  size?: number;

  /**
   * Number of segments when generating a multi-part ID.
   * Each segment is separated by {@link separator}.
   *
   * @default 1
   * @example
   * ```typescript
   * // With segments: 2 and separator: '-' → "aB3x-K9mZ"
   * { segments: 2, separator: '-', size: 4 }
   * ```
   */
  segments?: number;

  /**
   * Separator character inserted between each segment.
   *
   * @default '-'
   * @example { segments: 3, separator: '_' } // "abc_def_ghi"
   */
  separator?: string;

  // ── Encoding ────────────────────────────────────────────────────────────────

  /**
   * Encoding scheme(s) to apply during generation.
   * Pass a single value or an array to chain multiple encodings.
   *
   * @example Single encoding
   * ```typescript
   * { encoding: 'base62' }
   * ```
   * @example Chained encodings
   * ```typescript
   * { encoding: ['base62', 'hex'] }
   * ```
   */
  encoding?: ENC_TYPE | ENC_TYPE[];

  /**
   * Custom character alphabet used as the source pool for generation.
   * Overrides any alphabet implied by {@link encoding} or {@link charset}.
   *
   * @example
   * ```typescript
   * { alphabet: '0123456789abcdef' } // hexadecimal only
   * ```
   */
  alphabet?: string;

  /**
   * Compression algorithm applied to the raw bytes before encoding.
   *
   * - `'none'`  — no compression (default)
   * - `'lz77'`  — fast, lightweight compression
   * - `'gzip'`  — standard gzip compression
   *
   * @default 'none'
   */
  compression?: "none" | "lz77" | "gzip";

  /**
   * When `true`, the ID can be decoded back to its original form.
   * Requires a reversible encoding scheme (e.g. Base64, Base62).
   *
   * @default false
   */
  reversible?: boolean;

  // ── Affixes ─────────────────────────────────────────────────────────────────

  /**
   * Static string prepended to the generated ID.
   *
   * @example
   * ```typescript
   * { prefix: 'usr_' } // "usr_aB3xK9mZ"
   * ```
   */
  prefix?: string;

  // ── Preset formats ──────────────────────────────────────────────────────────

  /**
   * Shortcut to apply a well-known ID format.
   * When set, format-specific defaults (size, alphabet, timestamp) are applied automatically.
   *
   * | Value      | Length | Notes                                   |
   * |------------|--------|-----------------------------------------|
   * | `'uuid'`   | 36     | RFC 4122, hyphen-separated              |
   * | `'nanoid'` | 21     | URL-safe, uses `size` override if set   |
   * | `'cuid'`   | 25     | Collision-resistant, prefixed with `c`  |
   * | `'ksuid'`  | 27     | K-Sortable, timestamp-prefixed          |
   * | `'xid'`    | 20     | Mongo-compatible, base32-encoded        |
   * | `'pushid'` | 20     | Firebase-style, time-ordered            |
   *
   * @example
   * ```typescript
   * NehoID.generate({ format: 'ksuid' });
   * // Output: "0ujzPyRiIAffKhBux4PvQdDqMHY"
   * ```
   */
  format?: "uuid" | "nanoid" | "cuid" | "ksuid" | "xid" | "pushid";

  // ── Timestamp ───────────────────────────────────────────────────────────────

  /**
   * When `true`, a Unix millisecond timestamp is embedded in the ID,
   * enabling chronological sorting.
   *
   * @default false
   */
  includeTimestamp?: boolean;

  /**
   * Embeds an expiration deadline in the ID as `_exp{epoch_ms}`.
   * The value is a TTL expressed in **milliseconds** from the moment of generation.
   *
   * @example
   * ```typescript
   * { expiresIn: 24 * 60 * 60 * 1000 } // expires in 24 h
   * // Output: "aB3xK9mZ_exp1710000000000"
   * ```
   */
  expiresIn?: number;

  // ── Versioning & namespacing ─────────────────────────────────────────────────

  /**
   * Version tag prepended to the ID as `v{n}_`.
   * Accepts a number (auto-prefixed with `v`) or a custom string.
   *
   * @example
   * ```typescript
   * { version: 2 }      // "v2_aB3xK9mZ"
   * { version: 'beta' } // "beta_aB3xK9mZ"
   * ```
   */
  version?: number | string;

  /**
   * Domain or service identifier prepended as a namespace: `{domain}_{id}`.
   * Useful for distinguishing IDs across microservices.
   *
   * @example
   * ```typescript
   * { domain: 'payments' } // "payments_aB3xK9mZ"
   * ```
   */
  domain?: string;

  // ── Character control ────────────────────────────────────────────────────────

  /**
   * Fine-grained control over which character categories are included.
   * Each boolean flag defaults to `true` unless explicitly set to `false`.
   *
   * @example Numbers only
   * ```typescript
   * { charset: { numbers: true, lowercase: false, uppercase: false } }
   * ```
   * @example Exclude ambiguous characters
   * ```typescript
   * { charset: { exclude: ['0', 'O', 'l', 'I'] } }
   * ```
   */
  charset?: {
    /** Include digits `0–9`. @default true */
    numbers?: boolean;
    /** Include lowercase letters `a–z`. @default true */
    lowercase?: boolean;
    /** Include uppercase letters `A–Z`. @default true */
    uppercase?: boolean;
    /** Include printable special characters (`!@#$%^&*…`). @default false */
    special?: boolean;
    /** Characters to remove from the final pool, applied after all inclusions. */
    exclude?: string[];
  };

  /**
   * Case transformation applied to the final ID string.
   *
   * | Value      | Description                              | Example          |
   * |------------|------------------------------------------|------------------|
   * | `'lower'`  | All lowercase                            | `"abc123def"`    |
   * | `'upper'`  | All uppercase                            | `"ABC123DEF"`    |
   * | `'mixed'`  | Random per-character casing              | `"AbC1d2EF"`     |
   * | `'camel'`  | camelCase (first word lowercase)         | `"myOrderId"`    |
   * | `'pascal'` | PascalCase (every word capitalised)      | `"MyOrderId"`    |
   * | `'snake'`  | snake_case (words joined with `_`)       | `"my_order_id"`  |
   */
  case?: "lower" | "upper" | "mixed" | "camel" | "pascal" | "snake";

  // ── Randomness & quality ─────────────────────────────────────────────────────

  /**
   * Source of randomness used during generation.
   *
   * - `'fast'`    — `Math.random()`, fastest but not cryptographically secure.
   * - `'crypto'`  — `crypto.getRandomValues()`, cryptographically secure.
   * - `'secure'`  — Additional entropy hardening on top of crypto.
   *
   * @default 'fast'
   */
  randomness?: "fast" | "crypto" | "secure";

  /**
   * Quality constraints applied after generation.
   *
   * @example
   * ```typescript
   * {
   *   quality: {
   *     minEntropy: 'high',
   *     avoidPatterns: true,
   *     urlSafe: true,
   *   }
   * }
   * ```
   */
  quality?: {
    /**
     * Minimum Shannon entropy level required.
     * IDs that do not meet this threshold are regenerated.
     *
     * - `'low'`    — ≥ 2 bits/char
     * - `'medium'` — ≥ 3.5 bits/char
     * - `'high'`   — ≥ 5 bits/char
     */
    minEntropy?: "low" | "medium" | "high";
    /** Reject IDs that contain common sequences (`123`, `aaa`, etc.). @default false */
    avoidPatterns?: boolean;
    /** Restrict output to characters safe for use in URLs without encoding. @default false */
    urlSafe?: boolean;
  };

  // ── Pattern & sequential ─────────────────────────────────────────────────────

  /**
   * Template string where each placeholder is replaced by a random character.
   *
   * | Placeholder | Replaced with        |
   * |-------------|----------------------|
   * | `X`         | Uppercase letter A–Z |
   * | `A`         | Uppercase letter A–Z |
   * | `a`         | Lowercase letter a–z |
   * | `9`         | Digit 0–9            |
   * | Other chars | Kept as-is           |
   *
   * @example
   * ```typescript
   * { pattern: 'XXX-999' } // e.g. "BKT-472"
   * { pattern: 'AA-9999' } // e.g. "CA-1834" (licence-plate style)
   * ```
   */
  pattern?: string;

  /**
   * Emit deterministic sequential IDs scoped to a named context.
   * Useful as a distributed-safe replacement for database auto-increment.
   *
   * @example
   * ```typescript
   * { sequential: { context: 'invoices', start: 1000, padLength: 6 } }
   * // Output: "invoices001000"
   * ```
   */
  sequential?: {
    /** Named scope that isolates the counter from other sequences. */
    context: string;
    /** Initial counter value. @default 1 */
    start?: number;
    /** Zero-pad the counter to this many digits. @default 0 (no padding) */
    padLength?: number;
  };

  // ── Integrity ────────────────────────────────────────────────────────────────

  /**
   * When `true`, a short DJB2 checksum is appended as `_{checksum}`.
   * Use {@link NehoID.validate} to verify integrity later.
   *
   * @default false
   * @example
   * ```typescript
   * { includeChecksum: true }
   * // Output: "aB3xK9mZ_3f2a"
   * ```
   */
  includeChecksum?: boolean;

  // ── Metadata ─────────────────────────────────────────────────────────────────

  /**
   * Arbitrary key-value pairs serialised as Base64 JSON and appended as `_meta{data}`.
   * Keep payloads small — large objects significantly inflate ID length.
   *
   * @example
   * ```typescript
   * { metadata: { env: 'prod', source: 'api' } }
   * // Output: "aB3xK9mZ_meta eyJlbnYiOiJwcm9kIn0="
   * ```
   */
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Collision Strategy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strategy configuration for collision-resistant ID generation.
 *
 * When generating IDs that must be unique within an external store (e.g. a database),
 * use this interface with {@link NehoID.safe} to automatically retry on collision.
 *
 * @example Exponential back-off with database check
 * ```typescript
 * const id = await NehoID.safe({
 *   name: 'user-id-check',
 *   maxAttempts: 10,
 *   backoffType: 'exponential',
 *   checkFunction: async (candidate) => {
 *     const exists = await db.users.exists({ id: candidate });
 *     return !exists; // return true → candidate is unique and accepted
 *   },
 * });
 * ```
 */
export interface CollisionStrategy {
  /** Human-readable name for logging and debugging purposes. */
  name: string;

  /**
   * Maximum number of generation attempts before throwing an error.
   * Raise this value when collision probability is high.
   *
   * @minimum 1
   * @example 50
   */
  maxAttempts: number;

  /**
   * Retry delay strategy applied between consecutive attempts.
   *
   * - `'linear'`      — constant delay between retries.
   * - `'exponential'` — delay doubles with each attempt (recommended).
   */
  backoffType: "linear" | "exponential";

  /**
   * Async predicate that returns `true` when the candidate ID is unique
   * and safe to use, or `false` to trigger another attempt.
   *
   * @param id - The candidate ID to validate.
   * @returns `Promise<boolean>` — `true` if unique, `false` if collision.
   *
   * @example
   * ```typescript
   * checkFunction: async (id) => !(await redis.exists(`session:${id}`))
   * ```
   */
  checkFunction: (id: string) => Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contextual Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for generating IDs that embed environmental context.
 *
 * Useful for tracing, analytics, and fraud detection — each flag adds a
 * fingerprint segment derived from the current runtime environment.
 *
 * > ⚠️ **Privacy notice**: Enabling `includeLocation` or `includeDevice` may
 * > collect personally identifiable information. Ensure compliance with
 * > applicable privacy regulations (GDPR, CCPA, etc.) before enabling these flags.
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
export interface ContextOptions {
  /** Embed a device fingerprint (OS, CPU, memory) in the ID. @default false */
  includeDevice?: boolean;

  /** Embed the IANA timezone string (e.g. `"Europe/Paris"`). @default false */
  includeTimezone?: boolean;

  /** Embed a hash of the browser user-agent string. @default false */
  includeBrowser?: boolean;

  /** Embed screen resolution and colour depth. @default false */
  includeScreen?: boolean;

  /**
   * Embed a coarse geolocation hash.
   * Requires user permission and `navigator.geolocation` availability.
   *
   * @default false
   */
  includeLocation?: boolean;

  /**
   * Custom string describing the current user interaction (e.g. `'login'`, `'purchase'`).
   * Hashed and embedded as a short segment.
   *
   * @example 'add-to-cart'
   */
  userBehavior?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for generating human-readable, structured semantic IDs.
 *
 * Semantic IDs encode business context directly in the identifier, making
 * them self-documenting while remaining unique.
 *
 * @example
 * ```typescript
 * const id = NehoID.semantic({
 *   prefix: 'ORD',
 *   region: 'EU-WEST',
 *   department: 'SALES',
 *   year: 2025,
 *   customSegments: { channel: 'web' },
 * });
 * // Possible output: "ORD-EU-WEST-SALES-2025-web-x7k2"
 * ```
 */
export interface SemanticOptions {
  /** Static business prefix (e.g. `'ORD'`, `'INV'`, `'TKT'`). */
  prefix?: string;

  /**
   * Geographic region code embedded in the ID.
   *
   * @example 'US-WEST' | 'EU-CENTRAL' | 'APAC'
   */
  region?: string;

  /**
   * Organisational unit or department code.
   *
   * @example 'SALES' | 'OPS' | 'ENG'
   */
  department?: string;

  /**
   * Four-digit year component for temporal organisation.
   *
   * @example 2025
   */
  year?: number;

  /**
   * Additional domain-specific segments as key-value pairs.
   * Each entry is appended in insertion order.
   *
   * @example { channel: 'mobile', tier: 'premium' }
   */
  customSegments?: Record<string, string | number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for generating multiple IDs in a single operation.
 *
 * @example Standard batch
 * ```typescript
 * const ids = NehoID.batch({ count: 50, format: 'uuid', ensureUnique: true });
 * ```
 *
 * @example High-throughput parallel batch
 * ```typescript
 * const ids = NehoID.batch({ count: 10_000, format: 'nano', parallel: true });
 * ```
 */
export interface BatchOptions {
  /**
   * Number of IDs to produce.
   *
   * @minimum 1
   */
  count: number;

  /**
   * ID format applied uniformly across the batch.
   *
   * | Value        | Description                        |
   * |--------------|------------------------------------|
   * | `'standard'` | Default NehoID format              |
   * | `'nano'`     | NanoID-compatible, 21 chars        |
   * | `'short'`    | Short alphanumeric, 8 chars        |
   * | `'uuid'`     | RFC 4122 UUID, 36 chars            |
   *
   * @default 'standard'
   */
  format?: "standard" | "nano" | "short" | "uuid";

  /**
   * Generate IDs in parallel using worker threads when available.
   * Significantly improves throughput for large batches (> 1 000 IDs).
   *
   * @default false
   */
  parallel?: boolean;

  /**
   * Deduplicate the output so every ID in the batch is distinct.
   * Slightly reduces throughput for very large batches.
   *
   * @default true
   */
  ensureUnique?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options controlling what aspects of an ID are validated.
 *
 * @example Full validation
 * ```typescript
 * const valid = NehoID.validate(id, {
 *   checkFormat: true,
 *   checkCollisions: true,
 *   repairCorrupted: false,
 * });
 * ```
 */
export interface ValidationOptions {
  /**
   * Verify that the ID conforms to its declared format (length, alphabet, prefix, checksum).
   *
   * @default true
   */
  checkFormat?: boolean;

  /**
   * Check whether the ID already exists in the configured store.
   * Requires a collision back-end to be registered via `NehoID.configure()`.
   *
   * @default false
   */
  checkCollisions?: boolean;

  /**
   * Attempt to recover a structurally damaged ID (e.g. truncated, bad checksum).
   * Returns the repaired string if possible; `false` otherwise.
   *
   * @default false
   */
  repairCorrupted?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health & Monitoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detailed quality assessment of a generated ID.
 *
 * Returned by {@link NehoID.healthCheck}. A score of `1.0` represents a
 * cryptographically ideal ID; `0.0` represents a trivially guessable one.
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
 * ```
 */
export interface HealthScore {
  /**
   * Overall quality score in the range `[0.0, 1.0]`.
   * Higher values indicate better randomness and uniqueness guarantees.
   */
  score: number;

  /**
   * Shannon entropy classification of the ID's character distribution.
   *
   * - `'low'`    — < 2 bits/char, easily guessable.
   * - `'medium'` — 2–4 bits/char, moderate security.
   * - `'high'`   — > 4 bits/char, suitable for security tokens.
   */
  entropy: "low" | "medium" | "high";

  /**
   * Likelihood that the ID could be predicted or enumerated by an attacker.
   *
   * - `'high'`   — sequential or pattern-based, avoid for sensitive use-cases.
   * - `'medium'` — some structure present.
   * - `'low'`    — effectively random.
   */
  predictability: "low" | "medium" | "high";

  /**
   * Actionable suggestions for improving ID quality.
   * Empty array when no improvements are needed.
   *
   * @example ["Increase size to at least 16", "Use 'crypto' randomness source"]
   */
  recommendations: string[];
}

/**
 * Runtime performance and health statistics for the ID generation system.
 *
 * Populated by the internal {@link Monitor} after {@link NehoID.startMonitoring} is called.
 *
 * @example
 * ```typescript
 * NehoID.startMonitoring();
 * // ... run workload ...
 * const stats = NehoID.getStats();
 * console.log(`Generated: ${stats.generated} | Avg: ${stats.averageGenerationTime}`);
 * ```
 */
export interface Stats {
  /** Total number of IDs successfully generated during the monitoring session. */
  generated: number;

  /**
   * Number of collision events detected.
   * A non-zero value indicates ID space exhaustion or a low-quality generator config.
   */
  collisions: number;

  /**
   * Human-readable average generation latency (e.g. `"0.043 ms"`).
   * Computed as a rolling mean over all generation calls.
   */
  averageGenerationTime: string;

  /**
   * Current heap memory consumed by internal caches and counters (e.g. `"4.2 MB"`).
   */
  memoryUsage: string;

  /**
   * Chi-squared distribution quality score in `[0.0, 1.0]`.
   * Values close to `1.0` indicate a uniform ID distribution (ideal).
   * Values below `0.7` may indicate a biased generator.
   */
  distributionScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Migration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for bulk-migrating IDs between formats.
 *
 * Use this with {@link NehoID.migrate} to convert legacy IDs (e.g. plain UUIDs)
 * to a richer NehoID format without losing referential integrity.
 *
 * @example Migrate a list of UUIDs to NehoID format
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
 * @example Migrate the first 1 000 records from a store
 * ```typescript
 * const newIds = await NehoID.migrate({
 *   from: 'legacy-numeric',
 *   to: 'ksuid',
 *   count: 1000,
 *   batchSize: 100,
 * });
 * ```
 */
export interface MigrationOptions {
  /** Format identifier of the source IDs (e.g. `'uuid'`, `'legacy-numeric'`). */
  from: string;

  /** Format identifier for the output IDs (e.g. `'nehoid'`, `'ksuid'`). */
  to: string;

  /**
   * Preserve the original chronological ordering of IDs in the output array.
   * When `false`, output order is not guaranteed (may be faster).
   *
   * @default true
   */
  preserveOrder?: boolean;

  /**
   * Number of IDs processed per internal batch to limit memory pressure.
   * Tune this based on available heap and source record size.
   *
   * @default 100
   * @minimum 1
   */
  batchSize?: number;

  /**
   * Explicit list of source IDs to migrate.
   * When provided, takes precedence over {@link count}.
   */
  ids?: string[];

  /**
   * Maximum number of IDs to migrate from the configured source store.
   * Ignored when {@link ids} is provided.
   */
  count?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-Platform Compatibility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Options for generating IDs that are valid across multiple platforms and languages.
 *
 * Different runtimes impose constraints on string length, character sets, and
 * integer overflow. This interface ensures the output ID satisfies all target platforms.
 *
 * @example
 * ```typescript
 * const id = NehoID.compatible({
 *   platform: ['javascript', 'python', 'go'],
 *   format: 'alphanumeric',
 *   length: 16,
 * });
 * ```
 */
export interface CompatibilityOptions {
  /**
   * Target platforms the ID must be usable on without transformation.
   * The generator applies the most restrictive constraint set across all listed platforms.
   *
   * | Platform       | Key constraints                                |
   * |----------------|------------------------------------------------|
   * | `'javascript'` | UTF-16, `Number.MAX_SAFE_INTEGER` limit        |
   * | `'python'`     | UTF-8, arbitrary precision integers            |
   * | `'go'`         | UTF-8, fixed-size integer types                |
   */
  platform: Array<"javascript" | "python" | "go">;

  /**
   * Named character set or format the ID must conform to.
   *
   * @example 'alphanumeric' | 'hex' | 'base62' | 'uuid'
   */
  format: string;

  /**
   * Exact character length of the generated ID.
   *
   * @minimum 1
   * @example 16
   */
  length: number;
}
