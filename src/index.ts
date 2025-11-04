/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @fileoverview Main entry point for the NehoID library.
 *
 * NehoID is a comprehensive TypeScript library for generating, validating, and managing unique identifiers.
 * It provides multiple ID generation strategies, collision-resistant options, monitoring capabilities,
 * and seamless integration with popular databases and web frameworks.
 *
 * @example
 * ```typescript
 * import { NehoID, NehoIDMiddleware, database } from 'nehoid';
 *
 * // Generate a unique ID
 * const id = NehoID.generate();
 *
 * // Validate an ID
 * const isValid = NehoID.validate(id);
 *
 * // Use middleware for Express.js
 * app.use(NehoIDMiddleware('express'));
 *
 * // Integrate with Mongoose
 * const userSchema = new mongoose.Schema({
 *   _id: database.mongoose('User')
 * });
 * ```
 */

import { EncodingPipeline } from "./core/pipeline.js";
import { createMiddleware } from "./integrations/middleware.js";
import {
  mongooseField,
  sequelizeField,
  typeormDecorator,
} from "./integrations/database.js";
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
} from "./types";
import { NehoID } from "./mods/nehoid.js";
import { Checksum } from "./mods/checksum.js";

// Re-export types
/**
 * Configuration options for ID generation.
 * Defines parameters like size, encoding, prefixes, and other generation settings.
 */
export type { IdGeneratorOptions };

/**
 * Strategy configuration for collision-resistant ID generation.
 * Includes maximum attempts, backoff type, and validation function.
 */
export type { CollisionStrategy };

/**
 * Options for generating contextual IDs that incorporate environment data.
 * Can include device info, timezone, browser details, and user behavior.
 */
export type { ContextOptions };

/**
 * Configuration for semantic ID generation with meaningful segments.
 * Supports prefixes, regions, departments, years, and custom segments.
 */
export type { SemanticOptions };

/**
 * Options for batch ID generation operations.
 * Configures count, format, parallel processing, and uniqueness requirements.
 */
export type { BatchOptions };

/**
 * Validation configuration options.
 * Controls format checking, collision detection, and corruption repair.
 */
export type { ValidationOptions };

/**
 * Health score object for ID analysis.
 * Contains entropy level, predictability assessment, and improvement recommendations.
 */
export type { HealthScore };

/**
 * Statistics object for monitoring ID generation performance.
 * Tracks generated count, collisions, timing, and memory usage.
 */
export type { Stats };

/**
 * Configuration for migrating IDs between different formats.
 * Supports batch processing, order preservation, and selective migration.
 */
export type { MigrationOptions };

/**
 * Compatibility options for cross-platform ID generation.
 * Defines target platforms, formats, and length requirements.
 */
export type { CompatibilityOptions };

// Re-export NehoID class
/**
 * The main NehoID class providing all ID generation and management functionality.
 * Offers static methods for generation, validation, monitoring, and advanced operations.
 */
export { NehoID };

// alias for NehoID
export { NehoID as ID };

// Export Checksum utilities
/**
 * Checksum utilities for ID validation and integrity checking.
 * Provides multiple algorithms including CRC32, Adler32, FNV-1a, and MurmurHash3.
 */
export { Checksum };

// Framework integrations
/**
 * Creates middleware for integrating NehoID with web frameworks.
 * Supports Express.js, Fastify, Koa, and other popular Node.js frameworks.
 *
 * @example
 * ```typescript
 * // Express.js integration
 * const express = require('express');
 * const app = express();
 * app.use(NehoIDMiddleware('express', { autoGenerate: true }));
 * ```
 */
export const NehoIDMiddleware = createMiddleware;

/**
 * Database integration helpers for popular ORMs.
 * Provides field definitions and decorators for seamless database integration.
 *
 * @example
 * ```typescript
 * // Mongoose integration
 * const userSchema = new mongoose.Schema({
 *   _id: database.mongoose('User'),
 *   name: String
 * });
 *
 * // Sequelize integration
 * class User extends Model {
 *   @database.sequelize('User')
 *   id: string;
 * }
 *
 * // TypeORM integration
 * @Entity()
 * class User {
 *   @database.typeorm('User')
 *   id: string;
 * }
 * ```
 */
export const database = {
  mongoose: mongooseField,
  sequelize: sequelizeField,
  typeorm: typeormDecorator,
};

// Export EncodingPipeline class
/**
 * Advanced encoding pipeline for processing and transforming IDs.
 * Supports compression, reversible encoding, and custom transformation chains.
 */
export { EncodingPipeline };

/**
 * Encoder class for various encoding schemes and transformations.
 * Provides methods for base64, hex, custom alphabets, and cryptographic encoding.
 */
export { Encoder } from "./core/encoder.js";

// For CommonJS compatibility, also export as module.exports if available
if (typeof module !== "undefined" && module.exports) {
  module.exports = NehoID;
  module.exports.default = NehoID;
  module.exports.NehoID = NehoID;
  module.exports.middleware = NehoID.middleware;
  module.exports.database = database;
  module.exports.EncodingPipeline = EncodingPipeline;
}
