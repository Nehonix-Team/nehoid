import { Specialized } from "../core/specialized";

/**
 * Specialized ID generation methods for advanced use cases.
 *
 * This module provides generators for hierarchical relationships, time-ordered IDs,
 * and sequential identifiers. These specialized generators are designed for specific
 * architectural patterns and data modeling requirements.
 */
export class SpecializedGenerators {
  /**
   * Generates a hierarchical ID with parent-child relationships.
   *
   * Creates IDs that encode hierarchical structures, making it easy to query
   * and navigate tree-like data relationships. The ID format supports efficient
   * ancestor and descendant queries in databases.
   *
   * @param options - Configuration options for hierarchical generation
   * @returns A hierarchical ID string with encoded relationship information
   *
   * @example
   * ```typescript
   * // Basic hierarchical ID
   * const rootId = SpecializedGenerators.hierarchical();
   *
   * // Child ID with parent reference
   * const childId = SpecializedGenerators.hierarchical({
   *   parentId: rootId,
   *   level: 1
   * });
   *
   * // Deep hierarchy
   * const grandchildId = SpecializedGenerators.hierarchical({
   *   parentId: childId,
   *   level: 2,
   *   maxDepth: 5
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Database queries with hierarchical IDs
   * // Find all descendants of a node
   * const descendants = await db.collection.find({
   *   hierarchicalId: { $regex: `^${parentId}` }
   * });
   *
   * // Find direct children
   * const children = await db.collection.find({
   *   parentId: parentId
   * });
   * ```
   */
  static hierarchical(options = {}): string {
    return Specialized.hierarchical(options);
  }

  /**
   * Generates a time-ordered ID for chronological sorting and pagination.
   *
   * Creates IDs that sort chronologically by embedding timestamp information.
   * This enables efficient time-based queries and pagination without requiring
   * separate timestamp columns.
   *
   * @param options - Configuration options for temporal generation
   * @returns A temporal ID string with embedded timestamp for natural sorting
   *
   * @example
   * ```typescript
   * // Basic temporal ID (current timestamp)
   * const eventId = SpecializedGenerators.temporal();
   *
   * // Custom timestamp
   * const pastEventId = SpecializedGenerators.temporal({
   *   timestamp: new Date('2023-01-01').getTime()
   * });
   *
   * // High precision temporal ID
   * const preciseId = SpecializedGenerators.temporal({
   *   precision: 'nanoseconds',
   *   includeRandom: true
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Time-based pagination
   * const recentEvents = await db.collection.find({
   *   temporalId: { $gt: lastEventId }
   * }).sort({ temporalId: 1 }).limit(50);
   *
   * // Events from specific time range
   * const startTime = SpecializedGenerators.temporal({
   *   timestamp: Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
   * });
   * const todaysEvents = await db.collection.find({
   *   temporalId: { $gte: startTime }
   * });
   * ```
   */
  static temporal(options = {}): string {
    return Specialized.temporal(options);
  }


  /**
   * Generates a sequential ID suitable for database primary keys.
   *
   * Creates human-readable sequential identifiers that can replace auto-incrementing
   * integers in databases. Supports prefixes, padding, and custom formatting
   * for business logic requirements.
   *
   * @param options - Configuration options for sequential generation
   * @returns A formatted sequential ID string
   *
   * @example
   * ```typescript
   * // Simple sequential ID
   * const id = SpecializedGenerators.sequential({
   *   counter: 1001
   * });
   * // Output: '1001'
   *
   * // With prefix and padding
   * const orderId = SpecializedGenerators.sequential({
   *   prefix: 'ORD',
   *   counter: 42,
   *   padLength: 6
   * });
   * // Output: 'ORD000042'
   *
   * // With suffix
   * const invoiceId = SpecializedGenerators.sequential({
   *   prefix: 'INV',
   *   counter: 123,
   *   suffix: true
   * });
   * // Output: 'INV123'
   * ```
   *
   * @example
   * ```typescript
   * // Database schema with sequential IDs
   * const userSchema = new mongoose.Schema({
   *   _id: {
   *     type: String,
   *     default: () => SpecializedGenerators.sequential({
   *       prefix: 'USR',
   *       counter: await getNextUserCounter()
   *     })
   *   },
   *   name: String
   * });
   * ```
   */
  /**
   * Generates a temporal ID from a timestamp.
   *
   * Converts a Unix timestamp into a temporal ID that can be used for
   * chronological sorting and time-based queries. The temporal ID format
   * includes encoded timestamp information for efficient database indexing.
   *
   * @param timestamp - Unix timestamp in milliseconds
   * @returns A temporal ID string containing the encoded timestamp
   *
   * @example
   * ```typescript
   * // Generate temporal ID from current time
   * const temporalId = SpecializedGenerators.fromTemporal(Date.now());
   *
   * // Generate temporal ID from specific date
   * const pastTemporalId = SpecializedGenerators.fromTemporal(
   *   new Date('2023-01-01').getTime()
   * );
   *
   * // Use in database queries
   * const recentEvents = await db.collection.find({
   *   temporalId: { $gte: SpecializedGenerators.fromTemporal(Date.now() - 86400000) }
   * });
   * ```
   */
  static fromTemporal(timestamp: number): string {
    return Specialized.fromTemporal(timestamp, {});
  }

  /**
   * Extracts timestamp from a temporal ID.
   *
   * Reverses the temporal ID generation process to recover the original
   * Unix timestamp. This is useful for converting temporal IDs back to
   * human-readable dates or for time-based calculations.
   *
   * @param temporalId - Temporal ID string to extract timestamp from
   * @returns Unix timestamp in milliseconds
   * @throws {Error} If the temporal ID format is invalid
   *
   * @example
   * ```typescript
   * // Extract timestamp from temporal ID
   * const temporalId = SpecializedGenerators.fromTemporal(Date.now());
   * const timestamp = SpecializedGenerators.fromTemporalToTimestamp(temporalId);
   *
   * // Convert back to Date object
   * const date = new Date(timestamp);
   * console.log(date.toISOString());
   *
   * // Calculate time differences
   * const age = Date.now() - timestamp;
   * const hoursOld = age / (1000 * 60 * 60);
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   const timestamp = SpecializedGenerators.fromTemporalToTimestamp('invalid-id');
   * } catch (error) {
   *   console.error('Invalid temporal ID format');
   * }
   * ```
   */
  static fromTemporalToTimestamp(temporalId: string): number {
    return Specialized.fromTemporalToTimestamp(temporalId, {});
  }

  static sequential(options: {
    prefix?: string;
    counter: number;
    padLength?: number;
    suffix?: boolean;
  }): string {
    return Specialized.sequential(options);
  }
}
