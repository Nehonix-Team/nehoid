import { ENC_TYPE } from '../core/encoder.js';

/**
 * Configuration options for ID generation.
 *
 * Defines parameters that control how IDs are generated, including size,
 * encoding schemes, prefixes, and various generation features.
 */
export interface IdGeneratorOptions {
  /** The desired length of the generated ID */
  size?: number;
  /** Number of segments in the ID (for multi-part IDs) */
  segments?: number;
  /** Separator character between ID segments */
  separator?: string;
  /** Encoding type(s) to use for the ID */
  encoding?: ENC_TYPE | ENC_TYPE[];
  /** Prefix to prepend to the generated ID */
  prefix?: string;
  /** Whether to include a timestamp in the ID */
  includeTimestamp?: boolean;
  /** Custom alphabet for encoding (overrides default) */
  alphabet?: string;
  /** Compression algorithm to apply ('none' | 'lz77' | 'gzip') */
  compression?: 'none' | 'lz77' | 'gzip';
  /** Whether the encoding should be reversible */
  reversible?: boolean;

  // Enhanced options for more helpful generation
  /** Preset format shortcuts ('uuid' | 'nanoid' | 'cuid' | 'ksuid' | 'xid' | 'pushid') */
  format?: 'uuid' | 'nanoid' | 'cuid' | 'ksuid' | 'xid' | 'pushid';
  /** Case transformation ('lower' | 'upper' | 'mixed' | 'camel' | 'pascal' | 'snake') */
  case?: 'lower' | 'upper' | 'mixed' | 'camel' | 'pascal' | 'snake';
  /** Character restrictions */
  charset?: {
    /** Include numbers (0-9) */
    numbers?: boolean;
    /** Include lowercase letters (a-z) */
    lowercase?: boolean;
    /** Include uppercase letters (A-Z) */
    uppercase?: boolean;
    /** Include special characters */
    special?: boolean;
    /** Exclude specific characters */
    exclude?: string[];
  };
  /** Randomness level ('fast' | 'crypto' | 'secure') */
  randomness?: 'fast' | 'crypto' | 'secure';
  /** Include expiration timestamp (TTL in milliseconds) */
  expiresIn?: number;
  /** Include version number in the ID */
  version?: number | string;
  /** Domain or context identifier for namespacing */
  domain?: string;
  /** Include checksum for validation */
  includeChecksum?: boolean;
  /** Pattern template (e.g., 'XXX-XXX-XXXX', 'AA-9999') */
  pattern?: string;
  /** Sequential numbering within a context */
  sequential?: {
    /** Context identifier for sequential numbering */
    context: string;
    /** Starting number (default: 1) */
    start?: number;
    /** Padding length for numbers */
    padLength?: number;
  };
  /** Custom metadata to embed */
  metadata?: Record<string, any>;
  /** Quality requirements */
  quality?: {
    /** Minimum entropy level required ('low' | 'medium' | 'high') */
    minEntropy?: 'low' | 'medium' | 'high';
    /** Avoid common patterns or sequences */
    avoidPatterns?: boolean;
    /** Ensure URL-safe characters only */
    urlSafe?: boolean;
  };
}

/**
 * Configuration for collision-resistant ID generation strategies.
 *
 * Defines how to handle ID collisions during generation, including
 * retry limits, backoff strategies, and validation functions.
 */
export interface CollisionStrategy {
  /** Unique name for this collision strategy */
  name: string;
  /** Maximum number of generation attempts before failing */
  maxAttempts: number;
  /** Backoff strategy for retry delays ('linear' | 'exponential') */
  backoffType: 'linear' | 'exponential';
  /** Function to validate uniqueness of generated IDs */
  checkFunction: (id: string) => Promise<boolean>;
}

/**
 * Options for generating contextual IDs that incorporate environment data.
 *
 * Allows IDs to include contextual information such as device details,
 * timezone, browser information, and user behavior patterns.
 */
export interface ContextOptions {
  /** Include device fingerprint in the ID */
  includeDevice?: boolean;
  /** Include timezone information */
  includeTimezone?: boolean;
  /** Include browser/user agent details */
  includeBrowser?: boolean;
  /** Include screen resolution and display info */
  includeScreen?: boolean;
  /** Include geolocation data (privacy-considerate) */
  includeLocation?: boolean;
  /** Custom user behavior context string */
  userBehavior?: string;
}

/**
 * Configuration for semantic ID generation with meaningful segments.
 *
 * Enables creation of IDs with structured, readable components that
 * convey business meaning while maintaining uniqueness.
 */
export interface SemanticOptions {
  /** Base prefix for the semantic ID */
  prefix?: string;
  /** Geographic region identifier */
  region?: string;
  /** Department or organizational unit */
  department?: string;
  /** Year component for temporal organization */
  year?: number;
  /** Additional custom segments as key-value pairs */
  customSegments?: Record<string, string | number>;
}

/**
 * Options for batch ID generation operations.
 *
 * Controls parameters for generating multiple IDs simultaneously,
 * including count, format preferences, and performance optimizations.
 */
export interface BatchOptions {
  /** Number of IDs to generate */
  count: number;
  /** Preferred ID format ('standard' | 'nano' | 'short' | 'uuid') */
  format?: 'standard' | 'nano' | 'short' | 'uuid';
  /** Enable parallel generation for better performance */
  parallel?: boolean;
  /** Ensure all generated IDs are unique within the batch */
  ensureUnique?: boolean;
}

/**
 * Configuration options for ID validation operations.
 *
 * Controls what aspects of an ID to validate, including format checking,
 * collision detection, and automatic repair capabilities.
 */
export interface ValidationOptions {
  /** Validate ID format and structure */
  checkFormat?: boolean;
  /** Check for collisions with existing IDs */
  checkCollisions?: boolean;
  /** Attempt to repair corrupted IDs */
  repairCorrupted?: boolean;
}

/**
 * Health score object for comprehensive ID analysis.
 *
 * Provides detailed assessment of ID quality including entropy levels,
 * predictability analysis, and actionable improvement recommendations.
 */
export interface HealthScore {
  /** Overall health score (0.0 to 1.0, higher is better) */
  score: number;
  /** Entropy level assessment ('low' | 'medium' | 'high') */
  entropy: 'low' | 'medium' | 'high';
  /** Predictability assessment ('low' | 'medium' | 'high') */
  predictability: 'low' | 'medium' | 'high';
  /** Array of recommendations for improving ID quality */
  recommendations: string[];
}

/**
 * Statistics object for monitoring ID generation performance.
 *
 * Tracks various metrics related to ID generation operations,
 * including counts, timing, memory usage, and distribution quality.
 */
export interface Stats {
  /** Total number of IDs generated */
  generated: number;
  /** Number of collision incidents encountered */
  collisions: number;
  /** Average time taken for ID generation (formatted string) */
  averageGenerationTime: string;
  /** Current memory usage of the ID generation system */
  memoryUsage: string;
  /** Quality score of ID distribution (0.0 to 1.0) */
  distributionScore: number;
}

/**
 * Configuration for migrating IDs between different formats.
 *
 * Defines parameters for converting existing IDs from one format to another,
 * including batch processing options and migration scope.
 */
export interface MigrationOptions {
  /** Source format to migrate from */
  from: string;
  /** Target format to migrate to */
  to: string;
  /** Preserve chronological ordering during migration */
  preserveOrder?: boolean;
  /** Number of IDs to process in each batch */
  batchSize?: number;
  /** Specific IDs to migrate (overrides count) */
  ids?: string[];
  /** Number of IDs to migrate if ids not specified */
  count?: number;
}

/**
 * Compatibility options for cross-platform ID generation.
 *
 * Ensures generated IDs work consistently across different programming
 * languages and platforms with specific requirements.
 */
export interface CompatibilityOptions {
  /** Target platforms to ensure compatibility with */
  platform: ('javascript' | 'python' | 'go')[];
  /** Required format for the generated IDs */
  format: string;
  /** Required length of the generated IDs */
  length: number;
}
