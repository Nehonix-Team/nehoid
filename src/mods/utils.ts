/**
 * Utility methods for NehoID operations.
 *
 * This module provides helper functions for common ID-related tasks,
 * including coordinate hashing for location-based privacy and other
 * utility operations that support the core NehoID functionality.
 */
export class Utils {
  /**
   * Hashes geographic coordinates for privacy preservation.
   *
   * This method reduces the precision of latitude and longitude coordinates
   * to protect user privacy while maintaining useful location-based grouping.
   * The coordinates are rounded to one decimal place before hashing.
   *
   * @param latitude - The latitude coordinate (-90 to 90)
   * @param longitude - The longitude coordinate (-180 to 180)
   * @returns A compact base36 hash string representing the rounded coordinates
   *
   * @example
   * ```typescript
   * // Hash coordinates for location-based grouping
   * const locationHash = Utils.hashCoordinates(37.7749, -122.4194);
   * // Output: '2a3b1c' (example hash)
   *
   * // Use in ID generation for location-aware IDs
   * const id = NehoID.generate({
   *   prefix: `loc-${locationHash}-`
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Privacy-preserving location clustering
   * const users = [
   *   { id: 1, lat: 37.7749, lng: -122.4194 },
   *   { id: 2, lat: 37.7750, lng: -122.4195 } // Very close location
   * ];
   *
   * const clusters = users.map(user =>
   *   Utils.hashCoordinates(user.lat, user.lng)
   * );
   * // Both users will have the same hash due to rounding
   * ```
   */
  static hashCoordinates(latitude: number, longitude: number): string {
    // Round coordinates to reduce precision for privacy
    const roundedLat = Math.round(latitude * 10) / 10;
    const roundedLng = Math.round(longitude * 10) / 10;

    // Combine coordinates into a string
    const coordString = `${roundedLat},${roundedLng}`;

    // Create a hash of the coordinates
    let hash = 0;
    for (let i = 0; i < coordString.length; i++) {
      hash = (hash << 5) - hash + coordString.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }

    // Convert to a base36 string for compactness
    return Math.abs(hash).toString(36);
  }
}
