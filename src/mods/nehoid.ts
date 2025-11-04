import { createMiddleware } from "../integrations/middleware";
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
} from "../types/index";
import { NehoIDV2 } from "../exports/v2.export";
import { CoreGenerators } from './generators';
import { SpecializedGenerators } from './specialized';
import { Validators } from './validation';
import { Monitor } from './monitoring';
import { Advanced } from './advanced';
import { Checksum } from './checksum';

/**
 * The main NehoID class providing comprehensive ID generation, validation, and management capabilities.
 *
 * This class offers both simple and advanced ID generation methods, collision-resistant options,
 * monitoring tools, and compatibility with various platforms and databases. The generate method
 * provides extensive customization including preset formats (UUID, NanoID, CUID, etc.), character
 * set control, case transformations, quality requirements, expiration timestamps, versioning,
 * sequential numbering, pattern-based generation, and metadata embedding.
 *
 * @example
 * ```typescript
 * // Basic ID generation
 * const id = NehoID.generate();
 *
 * // Preset formats
 * const uuid = NehoID.generate({ format: 'uuid' });
 * const nanoid = NehoID.generate({ format: 'nanoid' });
 *
 * // Advanced customization
 * const customId = NehoID.generate({
 *   size: 16,
 *   prefix: 'user-',
 *   case: 'lower',
 *   charset: { numbers: true, lowercase: true },
 *   includeTimestamp: true,
 *   expiresIn: 24 * 60 * 60 * 1000,
 *   version: 'v2'
 * });
 *
 * // Collision-safe generation
 * const safeId = await NehoID.safe({
 *   name: 'user-check',
 *   maxAttempts: 100,
 *   backoffType: 'exponential',
 *   checkFunction: async (id) => !await userExists(id)
 * });
 *
 * // Batch generation
 * const ids = NehoID.batch({ count: 10, format: 'uuid' });
 *
 * // Validation
 * const isValid = NehoID.validate(id);
 *
 * // Monitoring
 * NehoID.startMonitoring();
 * const stats = NehoID.getStats();
 * ```
 */
export class NehoID extends NehoIDV2 {
  /**
   * Generates a unique ID with optional configuration.
   *
   * This method provides extensive customization options for ID generation,
   * including preset formats, character sets, case transformations, quality requirements,
   * and advanced features like expiration, versioning, and sequential numbering.
   *
   * @param options - Configuration options for ID generation
   * @returns A newly generated unique ID string
   *
   * @example
   * ```typescript
   * // Basic generation
   * const id = NehoID.generate();
   *
   * // Preset formats
   * const uuid = NehoID.generate({ format: 'uuid' });
   * const nanoid = NehoID.generate({ format: 'nanoid' });
   * const cuid = NehoID.generate({ format: 'cuid' });
   *
   * // Custom configuration
   * const customId = NehoID.generate({
   *   size: 16,
   *   prefix: 'user-',
   *   case: 'lower',
   *   includeTimestamp: true
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Character set customization
   * const numericOnly = NehoID.generate({
   *   charset: { numbers: true, lowercase: false, uppercase: false },
   *   size: 10
   * });
   *
   * const urlSafe = NehoID.generate({
   *   quality: { urlSafe: true },
   *   charset: { exclude: ['+', '/', '='] }
   * });
   *
   * // Case transformations
   * const upperId = NehoID.generate({ case: 'upper' });
   * const camelId = NehoID.generate({ case: 'camel' });
   * const snakeId = NehoID.generate({ case: 'snake' });
   * ```
   *
   * @example
   * ```typescript
   * // Advanced features
   * const tempId = NehoID.generate({
   *   expiresIn: 24 * 60 * 60 * 1000, // 24 hours
   *   version: 'v2',
   *   domain: 'api',
   *   includeChecksum: true
   * });
   *
   * // Sequential IDs within contexts
   * const orderId = NehoID.generate({
   *   sequential: { context: 'orders', start: 1000, padLength: 6 }
   * });
   *
   * // Pattern-based generation
   * const phoneLike = NehoID.generate({
   *   pattern: 'XXX-XXX-XXXX' // e.g., ABC-123-4567
   * });
   *
   * const licensePlate = NehoID.generate({
   *   pattern: 'AA-9999' // e.g., CA-1234
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Quality and security options
   * const secureId = NehoID.generate({
   *   randomness: 'crypto',
   *   quality: {
   *     minEntropy: 'high',
   *     avoidPatterns: true
   *   },
   *   size: 32
   * });
   *
   * // Custom metadata embedding
   * const taggedId = NehoID.generate({
   *   metadata: { createdBy: 'api', environment: 'prod' },
   *   includeTimestamp: true
   * });
   * ```
   */
  static generate(options: Partial<IdGeneratorOptions> = {}): string {
    const startTime = performance.now();

    // Process options and create enhanced options for core generator
    const processedOptions = { ...options };

    // Handle preset formats
    if (options.format) {
      switch (options.format) {
        case "uuid":
          return this.uuid();
        case "nanoid":
          return this.nanoid(options.size);
        case "cuid":
          processedOptions.size = options.size || 25;
          processedOptions.prefix = options.prefix || "c";
          processedOptions.alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
          break;
        case "ksuid":
          processedOptions.size = options.size || 27;
          processedOptions.includeTimestamp = true;
          processedOptions.alphabet =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
          break;
        case "xid":
          processedOptions.size = options.size || 20;
          processedOptions.includeTimestamp = true;
          processedOptions.alphabet = "0123456789abcdefghijklmnopqrstuv";
          break;
        case "pushid":
          processedOptions.size = options.size || 20;
          processedOptions.includeTimestamp = true;
          processedOptions.alphabet =
            "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
          break;
      }
    }

    // Handle character set restrictions
    if (options.charset) {
      let charset = "";
      if (options.charset.numbers !== false) charset += "0123456789";
      if (options.charset.lowercase !== false)
        charset += "abcdefghijklmnopqrstuvwxyz";
      if (options.charset.uppercase !== false)
        charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (options.charset.special) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

      if (options.charset.exclude) {
        charset = charset
          .split("")
          .filter((char) => !options.charset!.exclude!.includes(char))
          .join("");
      }

      if (charset) {
        processedOptions.alphabet = charset;
      }
    }

    // Handle pattern templates
    let result: string;
    if (options.pattern) {
      result = this.generateFromPattern(options.pattern, processedOptions);
    } else {
      result = CoreGenerators.generate(processedOptions);
    }

    // Handle sequential numbering (this overrides normal generation)
    if (options.sequential) {
      const seq = options.sequential;
      const counter = seq.start || 1;
      const paddedCounter = counter
        .toString()
        .padStart(seq.padLength || 0, "0");
      result = `${seq.context}${paddedCounter}`;
    }

    // Apply case transformations
    if (options.case) {
      switch (options.case) {
        case "lower":
          result = result.toLowerCase();
          break;
        case "upper":
          result = result.toUpperCase();
          break;
        case "camel":
          result = result
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, "");
          break;
        case "pascal":
          result = result
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
            .replace(/\s+/g, "");
          break;
        case "snake":
          result = result.replace(/\W+/g, "_").toLowerCase();
          break;
        case "mixed":
          // Randomly mix case
          result = result
            .split("")
            .map((char) =>
              Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
            )
            .join("");
          break;
      }
    }

    // Add expiration timestamp
    if (options.expiresIn) {
      const expiresAt = Date.now() + options.expiresIn;
      result += `_exp${expiresAt}`;
    }

    // Add version
    if (options.version) {
      const versionStr =
        typeof options.version === "number"
          ? `v${options.version}`
          : options.version;
      result = `${versionStr}_${result}`;
    }

    // Add domain
    if (options.domain) {
      result = `${options.domain}_${result}`;
    }

    // Add checksum
    if (options.includeChecksum) {
      const checksum = Checksum.generate(result, "djb2", 4);
      result += `_${checksum}`;
    }

    // Embed metadata (simplified - just add as JSON)
    if (options.metadata) {
      try {
        const metaStr = Buffer.from(JSON.stringify(options.metadata)).toString(
          "base64"
        );
        result += `_meta${metaStr}`;
      } catch (e) {
        // Ignore metadata if serialization fails
      }
    }

    Monitor.updateStats(startTime);
    return result;
  }

  /**
   * Generates an ID from a pattern template.
   * @private
   */
  private static generateFromPattern(
    pattern: string,
    baseOptions: any
  ): string {
    // Replace pattern placeholders
    // X = any letter, 9 = any number, A = uppercase letter, a = lowercase letter
    const result = pattern.replace(/X|9|A|a/g, (match) => {
      switch (match) {
        case "X":
          return String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
        case "9":
          return String.fromCharCode(48 + Math.floor(Math.random() * 10)); // 0-9
        case "A":
          return String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
        case "a":
          return String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
        default:
          return match;
      }
    });

    return result;
  }

  /**
   * Generates a collision-safe ID by checking against a provided validation function.
   *
   * @param options - Collision strategy configuration including validation function
   * @returns A promise that resolves to a collision-free ID string
   * @throws Will throw an error if maximum attempts are exceeded without finding a unique ID
   *
   * @example
   * ```typescript
   * const safeId = await NehoID.safe({
   *   name: 'database-check',
   *   maxAttempts: 50,
   *   backoffType: 'exponential',
   *   checkFunction: async (id) => {
   *     const exists = await db.users.findOne({ id });
   *     return !exists;
   *   }
   * });
   * ```
   */
  static async safe(options: CollisionStrategy): Promise<string> {
    const startTime = performance.now();
    try {
      const id = await CoreGenerators.safe(options);
      Monitor.updateStats(startTime);
      return id;
    } catch (error) {
      Monitor.incrementCollisions();
      throw error;
    }
  }

  /**
   * Generates a standard UUID (Universally Unique Identifier).
   *
   * @returns A RFC 4122 compliant UUID string
   *
   * @example
   * ```typescript
   * const uuid = NehoID.uuid();
   * // Output: '550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  static uuid(): string {
    return CoreGenerators.uuid();
  }

  /**
   * Generates a NanoID with configurable length.
   *
   * @param length - Desired length of the generated ID (default: 21)
   * @returns A NanoID string using URL-safe characters
   *
   * @example
   * ```typescript
   * const nanoId = NehoID.nanoid(); // Default length 21
   * const shortNanoId = NehoID.nanoid(10);
   * ```
   */
  static nanoid(length?: number): string {
    return CoreGenerators.nanoid(length);
  }

  /**
   * Generates a short, compact ID.
   *
   * @param length - Desired length of the generated ID (default: 8)
   * @returns A short alphanumeric ID string
   *
   * @example
   * ```typescript
   * const shortId = NehoID.short(); // Default length 8
   * const customShortId = NehoID.short(12);
   * ```
   */
  static short(length?: number): string {
    return CoreGenerators.short(length);
  }

  /**
   * Generates a hexadecimal ID.
   *
   * @param length - Desired length of the generated ID (default: 16)
   * @returns A hexadecimal ID string
   *
   * @example
   * ```typescript
   * const hexId = NehoID.hex(); // Default length 16
   * const longHexId = NehoID.hex(32);
   * ```
   */
  static hex(length?: number): string {
    return CoreGenerators.hex(length);
  }

  /**
   * Generates a hierarchical ID with parent-child relationships.
   *
   * @param options - Configuration options for hierarchical generation
   * @returns A hierarchical ID string with encoded relationships
   *
   * @example
   * ```typescript
   * const hierarchicalId = NehoID.hierarchical({
   *   parentId: 'parent-123',
   *   depth: 2
   * });
   * ```
   */
  static hierarchical(options = {}): string {
    return SpecializedGenerators.hierarchical(options);
  }

  /**
   * Generates a time-ordered ID for chronological sorting.
   *
   * @param options - Configuration options for temporal generation
   * @returns A temporal ID string with embedded timestamp
   *
   * @example
   * ```typescript
   * const temporalId = NehoID.temporal({
   *   precision: 'milliseconds',
   *   includeRandom: true
   * });
   * ```
   */
  static temporal(options = {}): string {
    return SpecializedGenerators.temporal(options);
  }

  /**
   * Generates a temporal ID from a timestamp.
   *
   * @param timestamp - Timestamp to convert to temporal ID
   * @returns A temporal ID string
   *
   * @example
   * ```typescript
   * const temporalId = NehoID.fromTemporal(Date.now());
   * ```
   */
  static fromTemporal(timestamp: number): string {
    return SpecializedGenerators.fromTemporal(timestamp);
  }
  /**
   * Generates a timestamp from a temporal ID.
   *
   * @param temporalId - Temporal ID to convert to timestamp
   * @returns A timestamp number
   *
   * @example
   * ```typescript
   * const timestamp = NehoID.fromTemporalToTimestamp('temporal-123');
   * ```
   */
  static fromTemporalToTimestamp(temporalId: string): number {
    return SpecializedGenerators.fromTemporalToTimestamp(temporalId);
  }

  /**
   * Generates a sequential ID suitable for database auto-increment replacement.
   *
   * @param options - Configuration options for sequential generation
   * @returns A sequential ID string
   *
   * @example
   * ```typescript
   * const sequentialId = NehoID.sequential({
   *   prefix: 'ORD',
   *   counter: 1001,
   *   padLength: 6,
   *   suffix: true
   * });
   * // Output: 'ORD001001'
   * ```
   */
  static sequential(options: {
    prefix?: string;
    counter: number;
    padLength?: number;
    suffix?: boolean;
  }): string {
    return SpecializedGenerators.sequential(options);
  }

  /**
   * Generates multiple IDs in a batch operation.
   *
   * @param options - Batch generation configuration
   * @returns An array of generated ID strings
   *
   * @example
   * ```typescript
   * const ids = NehoID.batch({
   *   count: 100,
   *   format: 'uuid',
   *   parallel: true,
   *   ensureUnique: true
   * });
   * ```
   */
  static batch(options: BatchOptions): string[] {
    return CoreGenerators.batch(options);
  }

  /**
   * Validates an ID against configured rules and formats.
   *
   * @param id - The ID string to validate
   * @param options - Validation configuration options
   * @returns True if the ID is valid, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = NehoID.validate('user-abc123');
   *
   * // With options
   * const isValidWithCheck = NehoID.validate('user-abc123', {
   *   checkFormat: true,
   *   checkCollisions: true
   * });
   * ```
   */
  static validate(id: string, options?: ValidationOptions): boolean {
    return Validators.validate(id, options);
  }

  /**
   * Validates multiple IDs in a batch operation.
   *
   * @param ids - Array of ID strings to validate
   * @param options - Validation configuration options
   * @returns Array of validation results corresponding to input IDs
   *
   * @example
   * ```typescript
   * const results = NehoID.validateBatch(['id1', 'id2', 'id3']);
   * // Output: [true, false, true]
   * ```
   */
  static validateBatch(ids: string[], options?: ValidationOptions) {
    return Validators.validateBatch(ids, options);
  }

  /**
   * Performs a comprehensive health check on an ID.
   *
   * @param id - The ID string to analyze
   * @returns A health score object with entropy, predictability, and recommendations
   *
   * @example
   * ```typescript
   * const health = NehoID.healthCheck('user-abc123');
   * console.log(health.score); // 0.85
   * console.log(health.entropy); // 'high'
   * ```
   */
  static healthCheck(id: string): HealthScore {
    return Validators.healthCheck(id);
  }

  /**
   * Starts monitoring ID generation statistics and performance.
   *
   * @example
   * ```typescript
   * NehoID.startMonitoring();
   * // ... perform operations ...
   * const stats = NehoID.getStats();
   * ```
   */
  static startMonitoring(): void {
    Monitor.startMonitoring();
  }

  /**
   * Stops monitoring ID generation statistics.
   *
   * @example
   * ```typescript
   * NehoID.stopMonitoring();
   * ```
   */
  static stopMonitoring(): void {
    Monitor.stopMonitoring();
  }

  /**
   * Retrieves current monitoring statistics.
   *
   * @returns A stats object containing generation metrics
   *
   * @example
   * ```typescript
   * const stats = NehoID.getStats();
   * console.log(`Generated: ${stats.generated}, Collisions: ${stats.collisions}`);
   * ```
   */
  static getStats(): Stats {
    return Monitor.getStats();
  }

  /**
   * Generates a contextual ID incorporating environment and user data.
   *
   * @param options - Contextual generation options
   * @returns A contextual ID string
   *
   * @example
   * ```typescript
   * const contextualId = NehoID.contextual({
   *   includeDevice: true,
   *   includeLocation: true,
   *   userBehavior: 'login'
   * });
   * ```
   */
  static contextual(options: ContextOptions): string {
    return Advanced.contextual(options);
  }

  /**
   * Generates a semantic ID with meaningful segments.
   *
   * @param options - Semantic generation options
   * @returns A semantic ID string
   *
   * @example
   * ```typescript
   * const semanticId = NehoID.semantic({
   *   prefix: 'ORD',
   *   region: 'US-WEST',
   *   department: 'SALES',
   *   year: 2024
   * });
   * ```
   */
  static semantic(options: SemanticOptions): string {
    return Advanced.semantic(options);
  }

  /**
   * Migrates IDs from one format to another.
   *
   * @param options - Migration configuration
   * @returns A promise that resolves to an array of migrated ID strings
   *
   * @example
   * ```typescript
   * const migratedIds = await NehoID.migrate({
   *   from: 'uuid',
   *   to: 'nehoid',
   *   preserveOrder: true,
   *   batchSize: 100,
   *   ids: ['uuid1', 'uuid2']
   * });
   * ```
   */
  static migrate(options: MigrationOptions): Promise<string[]> {
    return Advanced.migrate(options);
  }

  /**
   * Generates an ID compatible with specified platforms.
   *
   * @param options - Compatibility configuration
   * @returns A cross-platform compatible ID string
   *
   * @example
   * ```typescript
   * const compatibleId = NehoID.compatible({
   *   platform: ['javascript', 'python'],
   *   format: 'alphanumeric',
   *   length: 16
   * });
   * ```
   */
  static compatible(options: CompatibilityOptions): string {
    return Advanced.compatible(options);
  }
}
