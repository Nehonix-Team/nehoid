import {
  ContextOptions,
  SemanticOptions,
  MigrationOptions,
  CompatibilityOptions,
} from "../types";
import { Utils } from "./utils";

/**
 * Advanced generation methods for NehoID
 */
export class Advanced {
  /**
   * Generates a context-aware ID that incorporates environmental information
   * @param options Context options for ID generation
   * @returns A context-aware unique ID
   */
  static contextual(options: ContextOptions): string {
    // Default options
    const opts: Required<ContextOptions> = {
      includeDevice: options.includeDevice ?? true,
      includeTimezone: options.includeTimezone ?? true,
      includeBrowser: options.includeBrowser ?? false,
      includeScreen: options.includeScreen ?? false,
      includeLocation: options.includeLocation ?? false,
      userBehavior: options.userBehavior ?? "",
    };

    // Gather context information
    const contextParts: string[] = [];

    // Add timestamp (always included)
    const timestamp = Date.now().toString(36);
    contextParts.push(`t${timestamp}`);

    // Add timezone if requested
    if (opts.includeTimezone) {
      const timezoneOffset = new Date().getTimezoneOffset();
      const timezone = Math.abs(timezoneOffset).toString(36);
      contextParts.push(`z${timezoneOffset >= 0 ? "p" : "n"}${timezone}`);
    }

    // Add device information if requested
    if (opts.includeDevice) {
      // Get platform info - works in both Node.js and browser environments
      let platform = "";

      if (typeof navigator !== "undefined") {
        platform = navigator.platform || "unknown";
      } else if (typeof process !== "undefined") {
        platform = process.platform || "unknown";
      }

      // Create a hash of the platform
      let hash = 0;
      for (let i = 0; i < platform.length; i++) {
        hash = (hash << 5) - hash + platform.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      contextParts.push(`d${Math.abs(hash).toString(36)}`);
    }

    // Add browser information if requested (browser environment only)
    if (opts.includeBrowser && typeof navigator !== "undefined") {
      const userAgent = navigator.userAgent || "unknown";
      let hash = 0;
      for (let i = 0; i < userAgent.length; i++) {
        hash = (hash << 5) - hash + userAgent.charCodeAt(i);
        hash |= 0;
      }

      contextParts.push(`b${Math.abs(hash).toString(36)}`);
    }

    // Add screen information if requested (browser environment only)
    if (opts.includeScreen && typeof window !== "undefined" && window.screen) {
      const screenInfo = `${window.screen.width}x${window.screen.height}`;
      contextParts.push(`s${screenInfo}`);
    }

    // Add location information if requested and available
    if (opts.includeLocation) {
      // In browser environments, use the Geolocation API if available
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          // Create a promise-based wrapper for the geolocation API
          const getPosition = (): Promise<GeolocationPosition> => {
            return new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              });
            });
          };

          // Get the current position
          getPosition()
            .then((position) => {
              const { latitude, longitude } = position.coords;
              // Hash the coordinates for privacy
              const locationHash = Utils.hashCoordinates(latitude, longitude);
              contextParts.push(`l${locationHash}`);
            })
            .catch(() => {
              // If geolocation fails, add a fallback indicator
              contextParts.push("lna");
            });
        } catch (e) {
          // If geolocation API is not available or fails, add a fallback indicator
          contextParts.push("lna");
        }
      } else if (typeof process !== "undefined") {
        // In Node.js environments, try to get location from IP
        try {
          // Use environment variables or configuration for location info
          const envLocation = process.env.LOCATION || process.env.REGION || "";
          if (envLocation) {
            // Hash the location string for consistency
            let hash = 0;
            for (let i = 0; i < envLocation.length; i++) {
              hash = (hash << 5) - hash + envLocation.charCodeAt(i);
              hash |= 0;
            }
            contextParts.push(`l${Math.abs(hash).toString(36)}`);
          } else {
            // If no location info is available, add a fallback indicator
            contextParts.push("lna");
          }
        } catch (e) {
          // If location detection fails, add a fallback indicator
          contextParts.push("lna");
        }
      } else {
        // If neither browser nor Node.js environment is detected, add a fallback indicator
        contextParts.push("lna");
      }
    }

    // Add user behavior hash if provided
    if (opts.userBehavior) {
      let hash = 0;
      for (let i = 0; i < opts.userBehavior.length; i++) {
        hash = (hash << 5) - hash + opts.userBehavior.charCodeAt(i);
        hash |= 0;
      }

      contextParts.push(`u${Math.abs(hash).toString(36)}`);
    }

    // Generate a random component to ensure uniqueness
    const randomPart = Math.random().toString(36).substring(2, 10);
    contextParts.push(`r${randomPart}`);

    // Join all parts with a separator
    return contextParts.join("-");
  }

  /**
   * Generates a semantic ID that incorporates meaningful information
   * @param options Semantic options for ID generation
   * @returns A semantic unique ID
   */
  static semantic(options: SemanticOptions): string {
    // Create semantic parts array
    const parts: string[] = [];

    // Add prefix if provided
    if (options.prefix) {
      parts.push(options.prefix.toUpperCase());
    }

    // Add region code if provided
    if (options.region) {
      parts.push(options.region.toUpperCase());
    }

    // Add department code if provided
    if (options.department) {
      parts.push(options.department.toUpperCase());
    }

    // Add year if provided
    if (options.year) {
      parts.push(options.year.toString());
    } else if (options.year === undefined) {
      // Add current year if not explicitly provided
      parts.push(new Date().getFullYear().toString());
    }

    // Add custom segments if provided
    if (options.customSegments) {
      for (const [key, value] of Object.entries(options.customSegments)) {
        parts.push(`${key.toUpperCase()}-${value}`);
      }
    }

    // Add a unique identifier at the end
    const uniquePart = Math.random().toString(36).substring(2, 8);
    parts.push(uniquePart);

    // Join all parts with a separator
    return parts.join("-");
  }

  /**
   * Migrates IDs from one format to another
   * @param options Migration options
   * @returns Promise resolving to an array of migrated IDs
   */
  static migrate(options: MigrationOptions): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        const { from, to, preserveOrder = true, batchSize = 100 } = options;

        // Parse the 'from' format to understand its structure
        const fromParts = from.split(/[\-_]/);

        // Parse the 'to' format to understand its structure
        const toParts = to.split(/[\-_]/);

        // Validate that the formats have compatible parts
        if (fromParts.length === 0 || toParts.length === 0) {
          throw new Error("Invalid format specifications");
        }

        // Function to convert a single ID
        const convertId = (id: string): string => {
          // Split the ID into parts based on the 'from' format
          const idParts = id.split(/[\-_]/);

          // Validate that the ID has the expected number of parts
          if (idParts.length !== fromParts.length) {
            throw new Error(
              `ID ${id} does not match the 'from' format ${from}`
            );
          }

          // Create a mapping of format parts to actual values
          const partMap: Record<string, string> = {};
          for (let i = 0; i < fromParts.length; i++) {
            partMap[fromParts[i]] = idParts[i];
          }

          // Construct the new ID using the 'to' format
          const newIdParts = toParts.map((part) => {
            // If the part exists in the mapping, use it
            if (partMap[part]) {
              return partMap[part];
            }

            // If the part doesn't exist, generate a new value
            if (part === "uuid") {
              return Math.random().toString(36).substring(2, 15);
            } else if (part === "nano") {
              return Math.random().toString(36).substring(2, 10);
            } else if (part === "timestamp") {
              return Date.now().toString();
            } else {
              // For unknown parts, preserve the format specifier
              return part;
            }
          });

          // Join the parts using the separator from the 'to' format
          const separator = to.includes("-") ? "-" : "_";
          return newIdParts.join(separator);
        };

        // Process the IDs in batches if needed
        const processIds = async (ids: string[]): Promise<string[]> => {
          const result: string[] = [];

          for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const convertedBatch = batch.map(convertId);
            result.push(...convertedBatch);

            // Allow other operations to proceed between batches
            if (i + batchSize < ids.length) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }

          return result;
        };

        // Process actual IDs
        // If no IDs are provided, we'll generate some sample IDs to migrate
        const sampleIds = [];

        // Generate sample IDs based on the 'from' format if none are provided
        if (!options.ids || options.ids.length === 0) {
          // Generate 10 sample IDs or the specified number
          const count = options.count || 10;

          for (let i = 0; i < count; i++) {
            // Generate a sample ID based on the 'from' format
            const sampleIdParts = fromParts.map((part) => {
              if (part === "uuid") {
                return Math.random().toString(36).substring(2, 15);
              } else if (part === "nano") {
                return Math.random().toString(36).substring(2, 10);
              } else if (part === "timestamp") {
                return Date.now().toString();
              } else if (part === "counter") {
                return i.toString().padStart(5, "0");
              } else {
                // For unknown parts, use the part name as a placeholder
                return part;
              }
            });

            // Join the parts using the separator from the 'from' format
            const separator = from.includes("-") ? "-" : "_";
            sampleIds.push(sampleIdParts.join(separator));
          }
        } else {
          // Use the provided IDs
          sampleIds.push(...options.ids);
        }

        // Process the IDs
        processIds(sampleIds)
          .then((migratedIds) => {
            resolve(migratedIds);
          })
          .catch((error) => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generates an ID that is compatible with specified platforms
   * @param options Compatibility options
   * @returns A compatible ID
   */
  static compatible(options: CompatibilityOptions): string {
    const { platform, format, length } = options;

    // Determine the most restrictive character set based on platforms
    let allowedChars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    // Adjust character set based on platform requirements
    if (platform.includes("python") || platform.includes("go")) {
      // Python and Go are more restrictive with certain characters
      allowedChars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    }

    // Further restrict if needed for specific formats
    if (format === "alphanumeric") {
      // Keep as is
    } else if (format === "lowercase") {
      allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789_";
    } else if (format === "uppercase") {
      allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    } else if (format === "numeric") {
      allowedChars = "0123456789";
    } else if (format === "hex") {
      allowedChars = "0123456789abcdef";
    }

    // Generate the ID with the specified length and allowed characters
    let id = "";
    const charsLength = allowedChars.length;

    for (let i = 0; i < length; i++) {
      id += allowedChars.charAt(Math.floor(Math.random() * charsLength));
    }

    // Ensure the ID doesn't start with a number (important for some languages)
    if (
      /^[0-9]/.test(id) &&
      platform.some((p) => ["javascript", "python"].includes(p))
    ) {
      // Replace the first character with a letter
      const letters = allowedChars.replace(/[0-9]/g, "");
      id =
        letters.charAt(Math.floor(Math.random() * letters.length)) +
        id.substring(1);
    }

    return id;
  }
}
