import { Stats } from "../types";

/**
 * Monitoring and performance statistics management for NehoID.
 *
 * This module provides real-time tracking of ID generation performance, collision rates,
 * memory usage, and distribution quality. Statistics help optimize generation strategies
 * and monitor system health.
 *
 * @example
 * ```typescript
 * // Start monitoring
 * Monitor.startMonitoring();
 *
 * // Perform operations
 * for (let i = 0; i < 1000; i++) {
 *   NehoID.generate();
 * }
 *
 * // Get statistics
 * const stats = Monitor.getStats();
 * console.log(`Generated: ${stats.generated}`);
 * console.log(`Avg time: ${stats.averageGenerationTime}`);
 * console.log(`Memory: ${stats.memoryUsage}`);
 * ```
 */
export class Monitor {
  /** @private Whether monitoring is currently active */
  private static monitoringEnabled = false;

  /** @private Internal statistics storage */
  private static stats: Stats = {
    generated: 0,
    collisions: 0,
    averageGenerationTime: "0ms",
    memoryUsage: "0MB",
    distributionScore: 1.0,
  };

  /**
   * Starts collecting performance and usage statistics.
   *
   * Enables real-time monitoring of ID generation operations, including
   * timing, collision tracking, and memory usage analysis.
   *
   * @example
   * ```typescript
   * Monitor.startMonitoring();
   *
   * // All subsequent ID operations will be tracked
   * const ids = NehoID.batch({ count: 100 });
   *
   * const stats = Monitor.getStats();
   * console.log(`Generation time: ${stats.averageGenerationTime}`);
   * ```
   */
  static startMonitoring(): void {
    Monitor.monitoringEnabled = true;
  }

  /**
   * Stops collecting performance statistics.
   *
   * Disables monitoring to reduce overhead when statistics are not needed.
   * Existing statistics are preserved and can still be retrieved.
   *
   * @example
   * ```typescript
   * // Stop monitoring after analysis
   * Monitor.stopMonitoring();
   *
   * // Statistics from previous operations remain available
   * const finalStats = Monitor.getStats();
   * ```
   */
  static stopMonitoring(): void {
    Monitor.monitoringEnabled = false;
  }

  /**
   * Retrieves current monitoring statistics.
   *
   * Returns a snapshot of all collected performance metrics including
   * generation counts, collision rates, timing averages, and memory usage.
   *
   * @returns A complete statistics object with current metrics
   *
   * @example
   * ```typescript
   * const stats = Monitor.getStats();
   *
   * console.log(`Total IDs generated: ${stats.generated}`);
   * console.log(`Collision count: ${stats.collisions}`);
   * console.log(`Average generation time: ${stats.averageGenerationTime}`);
   * console.log(`Current memory usage: ${stats.memoryUsage}`);
   * console.log(`Distribution quality: ${stats.distributionScore}`);
   * ```
   */
  static getStats(): Stats {
    return { ...Monitor.stats };
  }

  /**
   * Updates performance statistics after an ID generation operation.
   *
   * Tracks timing information and updates rolling averages. Only active
   * when monitoring is enabled. This method is called automatically
   * by generation methods and typically doesn't need manual invocation.
   *
   * @param startTime - The performance.now() timestamp when generation started
   *
   * @example
   * ```typescript
   * // Manual timing (normally done automatically)
   * const start = performance.now();
   * const id = someGenerationFunction();
   * Monitor.updateStats(start);
   * ```
   */
  static updateStats(startTime: number): void {
    if (!Monitor.monitoringEnabled) return;

    Monitor.stats.generated++;
    const generationTime = performance.now() - startTime;

    // Update average generation time
    const prevTotal =
      parseFloat(Monitor.stats.averageGenerationTime) *
      (Monitor.stats.generated - 1);
    Monitor.stats.averageGenerationTime = `${(
      (prevTotal + generationTime) /
      Monitor.stats.generated
    ).toFixed(2)}ms`;

    // Update memory usage
    const used = process?.memoryUsage();
    Monitor.stats.memoryUsage = `${
      Math.round((used.heapUsed / 1024 / 1024) * 100) / 100
    }MB`;
  }

  /**
   * Increments the collision counter.
   *
   * Tracks instances where ID generation encountered collisions that required
   * regeneration. This helps monitor the effectiveness of collision strategies.
   *
   * @example
   * ```typescript
   * // Called automatically during collision resolution
   * try {
   *   await NehoID.safe(strategy);
   * } catch (error) {
   *   Monitor.incrementCollisions();
   *   throw error;
   * }
   * ```
   */
  static incrementCollisions(): void {
    Monitor.stats.collisions++;
  }
}
